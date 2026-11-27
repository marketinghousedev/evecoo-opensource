<?php
declare(strict_types=1);

namespace Evecoo\Tests\Loyalty;

use Evecoo\Db;
use Evecoo\Tests\Support\TestCase;

final class LoyaltyTest extends TestCase
{
    public function testCardGetAnyRolePutOwnerOnly(): void
    {
        $b = $this->seedBusiness();
        $s = $this->seedStaff($b['businessId']);
        $this->assertSame(401, $this->req('GET', '/api/card')->status);
        $g = $this->req('GET', '/api/card', null, $s['token']);
        $this->assertSame(200, $g->status);
        $this->assertSame(['name', 'reward', 'stampsRequired', 'color'], array_keys(self::body($g)));
        $card = ['name' => 'Club', 'reward' => 'Free tea', 'stampsRequired' => 6, 'color' => '#AABBCC'];
        $this->assertSame(403, $this->req('PUT', '/api/card', $card, $s['token'])->status);
        $this->assertSame(401, $this->req('PUT', '/api/card', ['bad' => 1])->status);
        $this->assertSame(403, $this->req('PUT', '/api/card', ['bad' => 1], $s['token'])->status);
        $p = $this->req('PUT', '/api/card', $card, $b['token']);
        $this->assertSame(200, $p->status);
        $this->assertSame($card, self::body($p));
        $this->assertSame(6, self::body($this->req('GET', '/api/card', null, $s['token']))['stampsRequired']);
        // same values again still succeeds
        $this->assertSame(200, $this->req('PUT', '/api/card', $card, $b['token'])->status);
    }

    public function testCardValidation(): void
    {
        $b = $this->seedBusiness();
        $ok = ['name' => 'Club', 'reward' => 'Free tea', 'stampsRequired' => 6, 'color' => '#AABBCC'];
        foreach ([['stampsRequired' => 1], ['stampsRequired' => 21], ['stampsRequired' => '5'], ['color' => 'red'], ['color' => '#12345'], ['name' => ''], ['reward' => str_repeat('x', 101)]] as $o) {
            $this->assertSame(400, $this->req('PUT', '/api/card', $o + $ok, $b['token'])->status, json_encode($o));
        }
        $this->assertSame(200, $this->rawReq('PUT', '/api/card', '{"name":"Club","reward":"r","stampsRequired":6.0,"color":"#AABBCC"}', $b['token'])->status);
    }

    public function testPublicCard(): void
    {
        $b = $this->seedBusiness(['name' => 'Cafe X']);
        $r = $this->req('GET', '/api/public/card/' . $b['businessId']);
        $this->assertSame(200, $r->status);
        $body = self::body($r);
        $this->assertSame(['businessId', 'businessName', 'name', 'reward', 'stampsRequired', 'color'], array_keys($body));
        $this->assertSame('Cafe X', $body['businessName']);
        $this->assertSame(10, $body['stampsRequired']);
        $this->assertSame(404, $this->req('GET', '/api/public/card/nope')->status);
    }

    public function testCreateCustomer(): void
    {
        $b = $this->seedBusiness();
        $r = $this->req('POST', '/api/customers', ['businessId' => $b['businessId'], 'name' => 'Anna', 'birthday' => '2000-05-17']);
        $this->assertSame(201, $r->status);
        $body = self::body($r);
        $this->assertSame('/card/' . $body['customerId'], $body['passUrl']);
        $row = Db::one('SELECT stamps, birthday FROM customers WHERE id = ?', [$body['customerId']]);
        $this->assertSame(0, (int) $row['stamps']);
        $this->assertSame('2000-05-17', $row['birthday']);
        $this->assertSame(400, $this->req('POST', '/api/customers', ['businessId' => $b['businessId'], 'name' => 'A', 'birthday' => '2024-02-30'])->status);
        $this->assertSame(400, $this->req('POST', '/api/customers', ['businessId' => $b['businessId']])->status);
        $this->assertSame(404, $this->req('POST', '/api/customers', ['businessId' => 'nope', 'name' => 'A'])->status);
    }

    public function testCustomerRateLimits(): void
    {
        $b = $this->seedBusiness();
        $this->setLimits(['customer_ip' => [2, 3600], 'customer_business' => [100, 3600]]);
        $mk = fn (string $ip) => $this->req('POST', '/api/customers', ['businessId' => $b['businessId'], 'name' => 'A'], null, ['x-test-ip' => $ip]);
        $this->assertSame(201, $mk('10.0.0.1')->status);
        $this->assertSame(201, $mk('10.0.0.1')->status);
        $r = $mk('10.0.0.1');
        $this->assertSame(429, $r->status);
        $this->assertSame('rate_limited', self::body($r)['error'] ?? 'rate_limited');
        $this->assertSame(201, $mk('10.0.0.2')->status);

        $this->setLimits(['customer_ip' => [100, 3600], 'customer_business' => [2, 3600]]);
        Db::run('DELETE FROM rate_limits');
        $this->assertSame(201, $mk('10.0.0.3')->status);
        $this->assertSame(201, $mk('10.0.0.4')->status);
        $this->assertSame(429, $mk('10.0.0.5')->status);
    }

    public function testStampsCapAndRedeem(): void
    {
        $b = $this->seedBusiness(['stampsRequired' => 3]);
        $c = $this->seedCustomer($b['businessId']);
        $st = fn () => self::body($this->req('POST', '/api/stamps', ['customerId' => $c], $b['token']));
        $this->assertSame(['stamps' => 1, 'redeemable' => false], $st());
        $this->assertSame(['stamps' => 2, 'redeemable' => false], $st());
        $this->assertSame(['stamps' => 3, 'redeemable' => true], $st());
        $this->assertSame(['stamps' => 3, 'redeemable' => true], $st());
        $n = Db::one("SELECT COUNT(*) AS n FROM stamp_events WHERE customer_id = ? AND kind = 'stamp'", [$c]);
        $this->assertSame(3, (int) $n['n']);

        $r = $this->req('POST', '/api/redeem', ['customerId' => $c], $b['token']);
        $this->assertSame(200, $r->status);
        $this->assertSame('{"stamps":0}', json_encode(self::body($r)));
        $this->assertSame(409, $this->req('POST', '/api/redeem', ['customerId' => $c], $b['token'])->status);
    }

    public function testStampIntegersAreNumbers(): void
    {
        $b = $this->seedBusiness();
        $c = $this->seedCustomer($b['businessId']);
        $r = $this->req('POST', '/api/stamps', ['customerId' => $c], $b['token']);
        $this->assertSame('{"stamps":1,"redeemable":false}', json_encode($r->data));
    }

    public function testRedeemNotEnoughStamps(): void
    {
        $b = $this->seedBusiness(['stampsRequired' => 2]);
        $c = $this->seedCustomer($b['businessId'], ['stamps' => 1]);
        $this->assertSame(409, $this->req('POST', '/api/redeem', ['customerId' => $c], $b['token'])->status);
    }

    public function testAuthBeforeValidationAndTenantIsolation(): void
    {
        $a = $this->seedBusiness(['stampsRequired' => 2]);
        $b = $this->seedBusiness();
        $staffA = $this->seedStaff($a['businessId']);
        $c = $this->seedCustomer($a['businessId'], ['stamps' => 2]);
        $this->assertSame(401, $this->req('POST', '/api/stamps', [])->status);
        $this->assertSame(401, $this->req('POST', '/api/redeem', [])->status);
        $this->assertSame(400, $this->req('POST', '/api/stamps', [], $a['token'])->status);
        // other tenant: owner of B
        $this->assertSame(404, $this->req('POST', '/api/stamps', ['customerId' => $c], $b['token'])->status);
        $this->assertSame(404, $this->req('POST', '/api/redeem', ['customerId' => $c], $b['token'])->status);
        // staff of B
        $staffB = $this->seedStaff($b['businessId']);
        $this->assertSame(404, $this->req('POST', '/api/stamps', ['customerId' => $c], $staffB['token'])->status);
        $this->assertSame(404, $this->req('POST', '/api/redeem', ['customerId' => $c], $staffB['token'])->status);
        $this->assertSame(2, (int) Db::one('SELECT stamps FROM customers WHERE id = ?', [$c])['stamps']);
        // own staff may stamp and redeem
        $this->assertSame(200, $this->req('POST', '/api/stamps', ['customerId' => $c], $staffA['token'])->status);
        $this->assertSame(200, $this->req('POST', '/api/redeem', ['customerId' => $c], $staffA['token'])->status);
    }

    public function testPassHasExactFieldsAndNoBirthday(): void
    {
        $b = $this->seedBusiness(['name' => 'Cafe X', 'stampsRequired' => 5]);
        $c = $this->seedCustomer($b['businessId'], ['name' => 'Max', 'stamps' => 2, 'birthday' => '1990-01-02']);
        foreach (['apple', 'google'] as $platform) {
            $r = $this->req('GET', "/api/pass/$c/$platform");
            $this->assertSame(200, $r->status);
            $p = self::body($r);
            $this->assertSame(
                ['platform', 'serialNumber', 'stamps', 'stampsRequired', 'reward', 'businessName', 'customerName', 'cardName', 'color', 'redeemable', 'barcode'],
                array_keys($p),
            );
            $this->assertSame($platform, $p['platform']);
            $this->assertSame($c, $p['serialNumber']);
            $this->assertSame(2, $p['stamps']);
            $this->assertSame(5, $p['stampsRequired']);
            $this->assertSame('Cafe X', $p['businessName']);
            $this->assertSame('Max', $p['customerName']);
            $this->assertFalse($p['redeemable']);
            $this->assertSame(['format' => 'QR', 'message' => $c], $p['barcode']);
            $json = json_encode($r->data);
            $this->assertStringNotContainsString('1990', $json);
            $this->assertStringNotContainsString($b['businessId'], $json);
            $this->assertStringNotContainsString('@', $json);
        }
        $this->assertSame(404, $this->req('GET', '/api/pass/missing/apple')->status);
        $this->assertSame(404, $this->req('GET', '/api/pass/missing/google')->status);
    }
}
