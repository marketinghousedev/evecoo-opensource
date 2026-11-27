<?php
declare(strict_types=1);

namespace Evecoo\Tests\Engage;

use Evecoo\Db;
use Evecoo\I18n;
use Evecoo\Tests\Support\TestCase;

final class EngageTest extends TestCase
{
    private function run_(string $token, string $now): array
    {
        $res = $this->req('POST', '/api/automations/run', ['now' => $now], $token);
        self::assertSame(200, $res->status);
        return self::body($res);
    }

    public function testBroadcastReachesOnlyOwnCustomers(): void
    {
        $a = $this->seedBusiness();
        $b = $this->seedBusiness(['name' => 'Other']);
        $c1 = $this->seedCustomer($a['businessId']);
        $this->seedCustomer($a['businessId']);
        $c3 = $this->seedCustomer($b['businessId']);
        $res = $this->req('POST', '/api/messages', ['title' => 'Hi', 'body' => 'There'], $a['token']);
        self::assertSame(200, $res->status);
        self::assertSame(['recipients' => 2], self::body($res));
        $list = self::body($this->req('GET', '/api/messages', null, $a['token']));
        self::assertCount(1, $list);
        self::assertSame(2, $list[0]['recipients']);
        self::assertSame([], self::body($this->req('GET', '/api/messages', null, $b['token'])));
        $m1 = self::body($this->req('GET', "/api/customers/$c1/messages"));
        self::assertSame(['Hi'], array_column($m1, 'title'));
        self::assertSame([], self::body($this->req('GET', "/api/customers/$c3/messages")));
        $empty = $this->seedBusiness();
        self::assertSame(['recipients' => 0], self::body($this->req('POST', '/api/messages', ['title' => 'x', 'body' => 'y'], $empty['token'])));
    }

    public function testAuthAndValidation(): void
    {
        $a = $this->seedBusiness();
        $staff = $this->seedStaff($a['businessId']);
        self::assertSame(401, $this->req('POST', '/api/messages', ['title' => 'a', 'body' => 'b'])->status);
        self::assertSame(401, $this->req('GET', '/api/messages')->status);
        self::assertSame(403, $this->req('POST', '/api/messages', ['title' => 'a', 'body' => 'b'], $staff['token'])->status);
        self::assertSame(403, $this->req('GET', '/api/messages', null, $staff['token'])->status);
        self::assertSame(403, $this->req('GET', '/api/stats', null, $staff['token'])->status);
        self::assertSame(401, $this->req('GET', '/api/stats')->status);
        self::assertSame(403, $this->req('POST', '/api/automations/run', ['now' => 'bad'], $staff['token'])->status);
        self::assertSame(401, $this->req('POST', '/api/automations/run', ['now' => 'bad'])->status);
        self::assertSame(400, $this->req('POST', '/api/messages', ['title' => '', 'body' => 'b'], $a['token'])->status);
        self::assertSame(400, $this->req('POST', '/api/messages', ['title' => str_repeat('x', 81), 'body' => 'b'], $a['token'])->status);
        self::assertSame(400, $this->req('POST', '/api/messages', ['title' => 'a', 'body' => str_repeat('x', 501)], $a['token'])->status);
        foreach (['nope', null, 5, '1969-12-31T23:59:59Z', '2027-02-30'] as $bad) {
            self::assertSame(400, $this->req('POST', '/api/automations/run', ['now' => $bad], $a['token'])->status, json_encode($bad));
        }
        self::assertSame(200, $this->req('POST', '/api/automations/run', null, $a['token'])->status);
    }

    public function testListNewestFirstStableOrder(): void
    {
        $a = $this->seedBusiness();
        $c = $this->seedCustomer($a['businessId']);
        $ids = [];
        foreach (['one', 'two', 'three'] as $t) {
            $ids[] = \Evecoo\Messages::deliver($a['businessId'], 'broadcast', $t, 'b', [$c], '2027-01-01T00:00:00.000Z');
        }
        \Evecoo\Messages::deliver($a['businessId'], 'broadcast', 'newest', 'b', [$c], '2027-01-02T00:00:00.000Z');
        $titles = array_column(self::body($this->req('GET', '/api/messages', null, $a['token'])), 'title');
        self::assertSame(['newest', 'three', 'two', 'one'], $titles);
        $titles = array_column(self::body($this->req('GET', "/api/customers/$c/messages")), 'title');
        self::assertSame(['newest', 'three', 'two', 'one'], $titles);
    }

    public function testUnknownCustomerMessages404(): void
    {
        self::assertSame(404, $this->req('GET', '/api/customers/nope/messages')->status);
    }

    public function testAcceptSequence(): void
    {
        $b = $this->seedBusiness();
        $c = $this->seedCustomer($b['businessId'], ['name' => 'Anna', 'birthday' => '1990-06-15']);
        $this->seedStamp($b['businessId'], $c, '2027-01-01T10:00:00.000Z');
        self::assertSame(['sent' => 2], $this->run_($b['token'], '2027-02-10T10:00:00.123456Z'));
        self::assertSame(['sent' => 0], $this->run_($b['token'], '2027-02-10T10:00:00.123456Z'));
        self::assertSame(['sent' => 1], $this->run_($b['token'], '2027-06-15T09:00:00Z'));
        self::assertSame(['sent' => 0], $this->run_($b['token'], '2027-06-15T18:00:00Z'));
        $kinds = array_column(self::body($this->req('GET', "/api/customers/$c/messages")), 'kind');
        sort($kinds);
        self::assertSame(['birthday', 'welcome', 'winback'], $kinds);
    }

    public function testWinbackThresholdAndRearm(): void
    {
        $b = $this->seedBusiness();
        $c = $this->seedCustomer($b['businessId']);
        $this->seedStamp($b['businessId'], $c, '2027-01-01T10:00:00.000Z');
        self::assertSame(['sent' => 1], $this->run_($b['token'], '2027-01-30T10:00:00Z'));
        self::assertSame(['sent' => 1], $this->run_($b['token'], '2027-02-05T10:00:00Z'));
        self::assertSame(['sent' => 0], $this->run_($b['token'], '2027-02-06T10:00:00Z'));
        $this->seedStamp($b['businessId'], $c, '2027-02-10T10:00:00.000Z');
        self::assertSame(['sent' => 0], $this->run_($b['token'], '2027-02-20T10:00:00Z'));
        self::assertSame(['sent' => 1], $this->run_($b['token'], '2027-03-20T10:00:00Z'));
    }

    public function testBirthdayLeapDayRule(): void
    {
        $b = $this->seedBusiness();
        $this->seedCustomer($b['businessId'], ['birthday' => '1992-02-29']);
        self::assertSame(['sent' => 0], $this->run_($b['token'], '2027-02-27T10:00:00Z'));
        self::assertSame(['sent' => 1], $this->run_($b['token'], '2027-02-28T10:00:00Z'));

        $b2 = $this->seedBusiness();
        $this->seedCustomer($b2['businessId'], ['birthday' => '1992-02-29']);
        self::assertSame(['sent' => 0], $this->run_($b2['token'], '2028-02-28T10:00:00Z'));
        self::assertSame(['sent' => 1], $this->run_($b2['token'], '2028-02-29T10:00:00Z'));
    }

    public function testTextsFromCatalogInBusinessLocale(): void
    {
        $b = $this->seedBusiness(['name' => 'Bean']);
        $c = $this->seedCustomer($b['businessId'], ['name' => 'Max']);
        $this->seedStamp($b['businessId'], $c, '2027-01-01T10:00:00.000Z');
        $this->run_($b['token'], '2027-01-02T10:00:00Z');
        $reward = (string) Db::one('SELECT card_reward AS r FROM businesses WHERE id = ?', [$b['businessId']])['r'];
        $vars = ['name' => 'Max', 'reward' => $reward, 'business' => 'Bean'];
        $m = self::body($this->req('GET', "/api/customers/$c/messages"))[0];
        self::assertSame(I18n::t('en', 'automations.welcome.title', $vars), $m['title']);
        self::assertSame(I18n::t('en', 'automations.welcome.body', $vars), $m['body']);
        self::assertStringContainsString('Bean', $m['body']);
    }

    public function testDoesNotTouchOtherBusinesses(): void
    {
        $a = $this->seedBusiness();
        $b = $this->seedBusiness();
        $cb = $this->seedCustomer($b['businessId']);
        $this->seedStamp($b['businessId'], $cb, '2027-01-01T10:00:00.000Z');
        self::assertSame(['sent' => 0], $this->run_($a['token'], '2027-03-01T00:00:00Z'));
    }

    public function testStatsBerlinBucketsWinterAndSummer(): void
    {
        $b = $this->seedBusiness();
        $bid = $b['businessId'];
        $c1 = $this->seedCustomer($bid);
        $this->seedCustomer($bid);
        $this->seedCustomer($bid);
        $this->seedStamp($bid, $c1, '2027-01-04T08:30:00.000Z');  // Mon 09:30 CET
        $this->seedStamp($bid, $c1, '2027-01-10T22:30:00.000Z');  // Sun 22:30Z = Sun 23:30 CET
        $this->seedStamp($bid, $c1, '2027-07-05T08:30:00.000Z');  // Mon 10:30 CEST
        $this->seedStamp($bid, $c1, '2027-07-04T22:30:00.000Z');  // Sun 22:30Z = Mon 00:30 CEST (crosses midnight)
        Db::run("INSERT INTO stamp_events (customer_id, business_id, kind, created_at) VALUES (?, ?, 'redeem', ?)", [$c1, $bid, '2027-01-11T10:00:00.000Z']);
        $s = self::body($this->req('GET', '/api/stats', null, $b['token']));
        self::assertSame(3, $s['customers']);
        self::assertSame(1, $s['returning']);
        self::assertSame(33, $s['returningPercent']);
        self::assertCount(24, $s['visitsByHour']);
        self::assertCount(7, $s['visitsByWeekday']);
        self::assertSame(1, $s['visitsByHour'][9]);
        self::assertSame(1, $s['visitsByHour'][23]);
        self::assertSame(1, $s['visitsByHour'][10]);
        self::assertSame(1, $s['visitsByHour'][0]);
        self::assertSame(3, $s['visitsByWeekday'][0]);
        self::assertSame(1, $s['visitsByWeekday'][6]);
        self::assertSame(4, array_sum($s['visitsByHour']));
    }

    public function testStatsEmptyAndRounding(): void
    {
        $b = $this->seedBusiness();
        $s = self::body($this->req('GET', '/api/stats', null, $b['token']));
        self::assertSame(0, $s['returningPercent']);
        self::assertSame(0, $s['customers']);
        $c = $this->seedCustomer($b['businessId']);
        $this->seedCustomer($b['businessId']);
        $this->seedCustomer($b['businessId']);
        $this->seedCustomer($b['businessId']);
        $this->seedCustomer($b['businessId']);
        $this->seedCustomer($b['businessId']);
        foreach ([$c, $this->seedCustomer($b['businessId'])] as $cid) {
            $this->seedStamp($b['businessId'], $cid, '2027-01-04T08:30:00.000Z');
            $this->seedStamp($b['businessId'], $cid, '2027-01-05T08:30:00.000Z');
        }
        // 2 returning / 7 customers = 28.57 -> 29
        self::assertSame(29, self::body($this->req('GET', '/api/stats', null, $b['token']))['returningPercent']);
        $this->seedCustomer($b['businessId']);
        $this->seedCustomer($b['businessId']);
        // 2/9 = 22.2 -> 22
        self::assertSame(22, self::body($this->req('GET', '/api/stats', null, $b['token']))['returningPercent']);
    }
}
