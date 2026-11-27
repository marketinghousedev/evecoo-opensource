<?php
declare(strict_types=1);

namespace Evecoo\Tests\Accounts;

use Evecoo\Accounts;
use Evecoo\ApiError;
use Evecoo\Db;
use Evecoo\I18n;
use Evecoo\Response;
use Evecoo\Tests\Support\TestCase;

/** Port of main:tests/accounts.test.ts (accounts + auth/staff/health routes) plus rate limits. */
final class AccountsTest extends TestCase
{
    private const OWNER = ['email' => 'a@b.com', 'password' => 'password1', 'businessName' => 'Cafe'];

    private function signup(array $over = [], array $headers = []): Response
    {
        return $this->req('POST', '/api/auth/signup', array_merge(self::OWNER, $over), null, $headers);
    }

    private function login(string $email, string $password, string $ip = '127.0.0.1'): Response
    {
        return $this->req('POST', '/api/auth/login', ['email' => $email, 'password' => $password], null, ['X-Test-Ip' => $ip]);
    }

    private static function assertApiError(\Closure $fn, int $status, string $code): void
    {
        try {
            $fn();
            self::fail('expected ApiError');
        } catch (ApiError $e) {
            self::assertSame($status, $e->status);
            self::assertSame($code, $e->errorCode);
        }
    }

    // --- lib-level (ports) ---

    public function testSignupCreatesBusinessWithDefaultsAndWorkingToken(): void
    {
        $r = Accounts::signup(['email' => 'A@B.com', 'password' => 'password1', 'businessName' => 'Cafe'], 'en');
        $me = $this->req('GET', '/api/auth/me', null, $r['token']);
        self::assertSame(200, $me->status);
        self::assertSame(['email' => 'a@b.com', 'role' => 'owner', 'businessId' => $r['businessId'], 'businessName' => 'Cafe'], self::body($me));
        $b = Db::one('SELECT locale, card_name, card_reward, stamps_required FROM businesses WHERE id = ?', [$r['businessId']]);
        self::assertSame('en', $b['locale']);
        self::assertSame('Stamp card', $b['card_name']);
        self::assertSame('1 free item', $b['card_reward']);
        self::assertSame(10, (int) $b['stamps_required']);
    }

    public function testDuplicateEmailCaseInsensitive(): void
    {
        Accounts::signup(self::OWNER, 'en');
        self::assertApiError(fn () => Accounts::signup(['email' => 'A@B.COM', 'password' => 'password1', 'businessName' => 'Other'], 'en'), 409, 'email_taken');
        self::assertSame(1, (int) Db::one('SELECT COUNT(*) AS n FROM businesses')['n']);
    }

    public function testStoresHashedPassword(): void
    {
        Accounts::signup(self::OWNER, 'en');
        $h = (string) Db::one('SELECT password_hash AS h FROM users')['h'];
        self::assertNotSame('password1', $h);
        self::assertMatchesRegularExpression('/^\$(argon2id|2y)\$/', $h);
    }

    public function testLoginOwnerAndStaffAnd401Otherwise(): void
    {
        $s = Accounts::signup(self::OWNER, 'en');
        self::assertSame('owner', Accounts::login(['email' => 'a@b.com', 'password' => 'password1'])['role']);
        $owner = $this->ownerOf($s['token']);
        Accounts::createStaff($owner, ['email' => 'st@b.com', 'password' => 'staffpass1']);
        self::assertSame('staff', Accounts::login(['email' => 'ST@b.com', 'password' => 'staffpass1'])['role']);
        foreach ([['a@b.com', 'no'], ['nobody@b.com', 'password1']] as [$e, $p]) {
            self::assertApiError(fn () => Accounts::login(['email' => $e, 'password' => $p]), 401, 'invalid_credentials');
        }
    }

    public function testStaffBelongsToOwnerBusinessEmailSpaceIsGlobal(): void
    {
        $s = Accounts::signup(self::OWNER, 'en');
        $owner = $this->ownerOf($s['token']);
        $id = Accounts::createStaff($owner, ['email' => 'st@b.com', 'password' => 'staffpass1'])['id'];
        self::assertSame([['id' => $id, 'email' => 'st@b.com']], Accounts::listStaff($s['businessId']));
        self::assertApiError(fn () => Accounts::createStaff($owner, ['email' => 'a@b.com', 'password' => 'staffpass1']), 409, 'email_taken');
        self::assertSame([], Accounts::listStaff('other'));
    }

    public function testCreateStaffRechecksRole(): void
    {
        $biz = $this->seedBusiness();
        $staff = $this->seedStaff($biz['businessId']);
        self::assertApiError(fn () => Accounts::createStaff($staff['user'], ['email' => 'x@b.com', 'password' => 'staffpass1']), 403, 'forbidden');
    }

    // --- routes ---

    public function testSignupRoute201AndValidation(): void
    {
        self::assertSame(400, $this->signup(['email' => 'bad'])->status);
        self::assertSame(400, $this->signup(['password' => 'short'])->status);
        self::assertSame(400, $this->signup(['businessName' => '   '])->status);
        self::assertSame(400, $this->req('POST', '/api/auth/signup', ['email' => 'a@b.com', 'password' => 'password1'])->status);
        $r = $this->signup();
        self::assertSame(201, $r->status);
        $b = self::body($r);
        self::assertSame(['token', 'businessId'], array_keys($b));
        self::assertIsString($b['token']);
        self::assertIsString($b['businessId']);
        self::assertSame(200, $this->req('GET', '/api/auth/me', null, $b['token'])->status);
    }

    public function testSignupDuplicate409AlsoDifferentCase(): void
    {
        self::assertSame(201, $this->signup()->status);
        foreach (['a@b.com', 'A@B.COM', '  A@b.Com '] as $email) {
            $r = $this->signup(['email' => $email, 'businessName' => 'Other']);
            self::assertSame(409, $r->status);
            self::assertSame('email_taken', self::body($r)['error']);
        }
    }

    public function testSignupUniqueViolationMapsTo409(): void
    {
        // Simulate the race: the pre-check passes but the insert hits the UNIQUE index.
        // The UNIQUE index itself is case-insensitive (SQLite NOCASE / MySQL _ci), so a raced insert is caught.
        $this->signup();
        $id = $this->seedBusiness()['businessId'];
        try {
            Db::run("INSERT INTO users (id, business_id, email, password_hash, role, created_at) VALUES ('zz', ?, 'A@B.COM', 'x', 'staff', '2026-01-01T00:00:00.000Z')", [$id]);
            self::fail('expected unique violation');
        } catch (\PDOException $ex) {
            self::assertTrue(Db::isUniqueViolation($ex));
        }
    }

    public function testDefaultCardTextsComeFromRequestLocale(): void
    {
        foreach (I18n::locales() as $n => $locale) {
            $r = $this->signup(['email' => "loc$n@b.com"], ['Cookie' => "locale=$locale"]);
            self::assertSame(201, $r->status);
            $b = Db::one('SELECT locale, card_name, card_reward FROM businesses WHERE id = ?', [self::body($r)['businessId']]);
            self::assertSame($locale, $b['locale']);
            self::assertSame(I18n::t($locale, 'defaults.cardName'), $b['card_name']);
            self::assertSame(I18n::t($locale, 'defaults.reward'), $b['card_reward']);
        }
        // Accept-Language is used too; an unknown language falls back to en.
        $r = $this->signup(['email' => 'xx@b.com'], ['Accept-Language' => 'xx-YY,xx;q=0.9']);
        $b = Db::one('SELECT locale, card_name FROM businesses WHERE id = ?', [self::body($r)['businessId']]);
        self::assertSame('en', $b['locale']);
        self::assertSame('Stamp card', $b['card_name']);
    }

    public function testLoginRoute(): void
    {
        $this->signup();
        $ok = $this->login('A@B.com ', 'password1');
        self::assertSame(200, $ok->status);
        self::assertSame(['token', 'role'], array_keys(self::body($ok)));
        self::assertSame('owner', self::body($ok)['role']);
        $staff = $this->seedStaff($this->bizId());
        $s = $this->login($staff['user']['email'], 'password123');
        self::assertSame(200, $s->status);
        self::assertSame('staff', self::body($s)['role']);
    }

    public function testWrongPasswordAndUnknownEmailIdentical401(): void
    {
        $this->signup();
        $wrong = $this->login('a@b.com', 'wrongpassword');
        $unknown = $this->login('nobody@b.com', 'wrongpassword');
        self::assertSame(401, $wrong->status);
        self::assertSame(401, $unknown->status);
        self::assertSame(self::body($wrong), self::body($unknown));
        self::assertSame($wrong->headers, $unknown->headers);
        self::assertSame('invalid_credentials', self::body($wrong)['error']);
    }

    public function testShortWrongPasswordIs401MissingFields400(): void
    {
        $this->signup();
        self::assertSame(401, $this->login('a@b.com', 'no')->status);
        self::assertSame(401, $this->login('a@b.com', '')->status);
        self::assertSame(400, $this->req('POST', '/api/auth/login', ['email' => 'a@b.com'])->status);
        self::assertSame(400, $this->req('POST', '/api/auth/login', ['password' => 'password1'])->status);
        self::assertSame(400, $this->req('POST', '/api/auth/login', ['email' => 'a@b.com', 'password' => 123])->status);
        self::assertSame(400, $this->rawReq('POST', '/api/auth/login', '[1]')->status);
        self::assertSame(200, $this->login('a@b.com', 'password1')->status);
    }

    public function testMe401And200(): void
    {
        self::assertSame(401, $this->req('GET', '/api/auth/me')->status);
        self::assertSame(401, $this->req('GET', '/api/auth/me', null, 'nope')->status);
        $biz = $this->seedBusiness(['name' => 'Bäckerei']);
        $r = $this->req('GET', '/api/auth/me', null, $biz['token']);
        self::assertSame(200, $r->status);
        self::assertSame([
            'email' => $biz['owner']['email'], 'role' => 'owner', 'businessId' => $biz['businessId'], 'businessName' => 'Bäckerei',
        ], self::body($r));
        $st = $this->seedStaff($biz['businessId']);
        self::assertSame('staff', self::body($this->req('GET', '/api/auth/me', null, $st['token']))['role']);
    }

    public function testStaffCreateListAndPermissions(): void
    {
        $biz = $this->seedBusiness();
        $other = $this->seedBusiness();
        self::assertSame(401, $this->req('POST', '/api/staff', ['email' => 's@b.com', 'password' => 'staffpass1'])->status);
        self::assertSame(401, $this->req('GET', '/api/staff')->status);

        $r = $this->req('POST', '/api/staff', ['email' => 'S@B.com', 'password' => 'staffpass1'], $biz['token']);
        self::assertSame(201, $r->status);
        $id = self::body($r)['id'];
        self::assertSame(['id'], array_keys(self::body($r)));

        self::assertSame(400, $this->req('POST', '/api/staff', ['email' => 'bad', 'password' => 'staffpass1'], $biz['token'])->status);
        self::assertSame(400, $this->req('POST', '/api/staff', ['email' => 't@b.com', 'password' => 'short'], $biz['token'])->status);
        $dup = $this->req('POST', '/api/staff', ['email' => 's@b.COM', 'password' => 'staffpass1'], $other['token']);
        self::assertSame(409, $dup->status);
        self::assertSame('email_taken', self::body($dup)['error']);
        self::assertSame(409, $this->req('POST', '/api/staff', ['email' => $biz['owner']['email'], 'password' => 'staffpass1'], $biz['token'])->status);

        // staff caller: 403 before validation
        $staffLogin = $this->login('s@b.com', 'staffpass1');
        self::assertSame(200, $staffLogin->status);
        $staffToken = self::body($staffLogin)['token'];
        self::assertSame(403, $this->req('POST', '/api/staff', ['email' => 'bad'], $staffToken)->status);
        self::assertSame(403, $this->req('GET', '/api/staff', null, $staffToken)->status);

        $list = $this->req('GET', '/api/staff', null, $biz['token']);
        self::assertSame(200, $list->status);
        self::assertSame([['id' => $id, 'email' => 's@b.com']], self::body($list));
        self::assertSame([], self::body($this->req('GET', '/api/staff', null, $other['token'])));
    }

    public function testHealthAndMethods(): void
    {
        $r = $this->req('GET', '/api/health');
        self::assertSame(200, $r->status);
        self::assertSame(['ok' => true], self::body($r));
        $m = $this->req('GET', '/api/auth/login');
        self::assertSame(405, $m->status);
        self::assertSame('POST', $m->headers['Allow']);
        $allow = array_map('trim', explode(',', $this->req('DELETE', '/api/staff')->headers['Allow']));
        sort($allow);
        self::assertSame(['GET', 'POST'], $allow);
    }

    // --- rate limits ---

    public function testLoginIpLimit(): void
    {
        $this->signup();
        $this->setLimits(['login_ip' => [2, 900]]);
        self::assertSame(401, $this->login('a@b.com', 'wrong1', '10.0.0.1')->status);
        self::assertSame(200, $this->login('a@b.com', 'password1', '10.0.0.1')->status);
        $r = $this->login('a@b.com', 'password1', '10.0.0.1');
        self::assertSame(429, $r->status);
        self::assertSame('rate_limited', self::body($r)['error']);
        self::assertGreaterThan(0, (int) $r->headers['Retry-After']);
        // counted before the body is read: even invalid JSON is limited
        self::assertSame(429, $this->rawReq('POST', '/api/auth/login', '{', null, ['X-Test-Ip' => '10.0.0.1'])->status);
        self::assertSame(200, $this->login('a@b.com', 'password1', '10.0.0.2')->status);
    }

    public function testLoginEmailLimitOnFailuresAndClearedOnSuccess(): void
    {
        $this->signup();
        $this->setLimits(['login_email' => [2, 900]]);
        self::assertSame(401, $this->login('a@b.com', 'wrong1', '10.0.0.1')->status);
        // success clears the counter
        self::assertSame(200, $this->login('a@b.com', 'password1', '10.0.0.2')->status);
        self::assertSame(401, $this->login('a@b.com', 'wrong2', '10.0.0.3')->status);
        self::assertSame(401, $this->login('A@B.COM', 'wrong3', '10.0.0.4')->status);
        // two failures since the last success: blocked from any IP, even with the right password, any case
        $r = $this->login('a@B.com', 'password1', '10.0.0.5');
        self::assertSame(429, $r->status);
        self::assertArrayHasKey('Retry-After', $r->headers);
        // other emails unaffected; unknown emails are counted too
        self::assertSame(401, $this->login('nobody@b.com', 'x', '10.0.0.6')->status);
        self::assertSame(401, $this->login('nobody@b.com', 'x', '10.0.0.6')->status);
        self::assertSame(429, $this->login('nobody@b.com', 'x', '10.0.0.6')->status);
    }

    public function testLoginEmailSuccessesAreNotCounted(): void
    {
        $this->signup();
        $this->setLimits(['login_email' => [1, 900]]);
        for ($k = 0; $k < 3; $k++) self::assertSame(200, $this->login('a@b.com', 'password1')->status);
    }

    public function testSignupIpLimit(): void
    {
        $this->setLimits(['signup_ip' => [2, 3600]]);
        $ip = ['X-Test-Ip' => '10.1.0.1'];
        self::assertSame(201, $this->signup(['email' => 's1@b.com'], $ip)->status);
        self::assertSame(400, $this->signup(['email' => 'bad'], $ip)->status);
        $r = $this->signup(['email' => 's3@b.com'], $ip);
        self::assertSame(429, $r->status);
        self::assertSame('rate_limited', self::body($r)['error']);
        self::assertSame(201, $this->signup(['email' => 's4@b.com'], ['X-Test-Ip' => '10.1.0.2'])->status);
    }

    // --- helpers ---

    private function ownerOf(string $token): array
    {
        $me = self::body($this->req('GET', '/api/auth/me', null, $token));
        $row = Db::one("SELECT id FROM users WHERE email = ?", [$me['email']]);
        return ['id' => $row['id'], 'email' => $me['email'], 'role' => $me['role'], 'businessId' => $me['businessId'], 'businessName' => $me['businessName']];
    }

    private function bizId(): string
    {
        return (string) Db::one("SELECT business_id FROM users WHERE email = 'a@b.com'")['business_id'];
    }
}
