<?php
declare(strict_types=1);

namespace Evecoo\Tests\Core;

use Evecoo\ApiError;
use Evecoo\App;
use Evecoo\Db;
use Evecoo\Http;
use Evecoo\RateLimit;
use Evecoo\Request;
use Evecoo\Response;
use Evecoo\Tests\Support\TestCase;

final class RateLimitTest extends TestCase
{
    private static function blocked(callable $fn): ?ApiError
    {
        try {
            $fn();
            return null;
        } catch (ApiError $e) {
            return $e;
        }
    }

    public function testLimitNAllowsNThen429WithRetryAfter(): void
    {
        $this->setLimits(['login_ip' => [3, 900]]);
        for ($i = 0; $i < 3; $i++) self::assertNull(self::blocked(fn () => RateLimit::hit('login_ip', '1.2.3.4')));
        $e = self::blocked(fn () => RateLimit::hit('login_ip', '1.2.3.4'));
        self::assertNotNull($e);
        self::assertSame(429, $e->status);
        self::assertSame('rate_limited', $e->errorCode);
        self::assertSame('errors.rateLimited', $e->messageKey);
        $retry = (int) $e->headers['Retry-After'];
        self::assertGreaterThanOrEqual(1, $retry);
        self::assertLessThanOrEqual(900, $retry);
        // other subjects and other names are independent
        self::assertNull(self::blocked(fn () => RateLimit::hit('login_ip', '5.6.7.8')));
        self::assertNull(self::blocked(fn () => RateLimit::hit('signup_ip', '1.2.3.4')));
    }

    public function testThroughAppGives429JsonAndHeader(): void
    {
        $this->setLimits(['signup_ip' => [1, 3600]]);
        App::setRoutes([App::route('POST', '/api/x', static function (Request $r): Response {
            RateLimit::hit('signup_ip', $r->ip);
            return Http::json(['ok' => true]);
        })]);
        try {
            self::assertSame(200, $this->req('POST', '/api/x')->status);
            $r = $this->req('POST', '/api/x');
            self::assertSame(429, $r->status);
            self::assertSame('rate_limited', self::body($r)['error']);
            self::assertSame('Too many attempts. Please wait a moment and try again.', self::body($r)['message']);
            self::assertMatchesRegularExpression('/^\d+$/', $r->headers['Retry-After']);
            self::assertSame(200, $this->req('POST', '/api/x', null, null, ['X-Test-Ip' => '9.9.9.9'])->status);
        } finally {
            App::setRoutes(null);
        }
    }

    public function testWindowRolloverResets(): void
    {
        $this->setLimits(['login_ip' => [2, 900]]);
        RateLimit::hit('login_ip', 's');
        RateLimit::hit('login_ip', 's');
        self::assertNotNull(self::blocked(fn () => RateLimit::hit('login_ip', 's')));
        // Simulate the stored window being a previous one.
        Db::run('UPDATE rate_limits SET window_start = window_start - 900');
        self::assertNull(self::blocked(fn () => RateLimit::hit('login_ip', 's')));
        $row = Db::one('SELECT hits, window_start FROM rate_limits');
        self::assertSame(1, (int) $row['hits']);
        self::assertSame(intdiv(time(), 900) * 900, (int) $row['window_start']);
    }

    public function testCheckDoesNotCountAndClearWorks(): void
    {
        $this->setLimits(['login_email' => [2, 900]]);
        for ($i = 0; $i < 5; $i++) RateLimit::check('login_email', 'a@x.io');
        self::assertSame(0, (int) Db::one('SELECT COUNT(*) AS n FROM rate_limits')['n']);
        RateLimit::hit('login_email', 'a@x.io');
        self::assertNull(self::blocked(fn () => RateLimit::check('login_email', 'a@x.io')));
        RateLimit::hit('login_email', 'a@x.io');
        $e = self::blocked(fn () => RateLimit::check('login_email', 'a@x.io'));
        self::assertSame(429, $e?->status);
        self::assertArrayHasKey('Retry-After', $e->headers);
        RateLimit::clear('login_email', 'a@x.io');
        self::assertNull(self::blocked(fn () => RateLimit::check('login_email', 'a@x.io')));
        self::assertNull(self::blocked(fn () => RateLimit::hit('login_email', 'a@x.io')));
    }

    public function testBucketsAreHashedNotRaw(): void
    {
        $this->setLimits(['login_email' => [5, 900]]);
        RateLimit::hit('login_email', 'secret@x.io');
        $bucket = Db::one('SELECT bucket FROM rate_limits')['bucket'];
        self::assertSame(hash('sha256', 'login_email|secret@x.io'), $bucket);
    }

    public function testDisabledConfigBypasses(): void
    {
        $this->setLimits(['enabled' => false, 'login_ip' => [1, 900]]);
        for ($i = 0; $i < 5; $i++) {
            RateLimit::hit('login_ip', 'x');
            RateLimit::check('login_ip', 'x');
        }
        self::assertSame(0, (int) Db::one('SELECT COUNT(*) AS n FROM rate_limits')['n']);
    }

    public function testDefaultsWhenKeyAbsent(): void
    {
        $this->setLimits([]);
        self::assertSame([20, 900], RateLimit::limits('login_ip'));
        self::assertSame([10, 900], RateLimit::limits('login_email'));
        self::assertSame([10, 3600], RateLimit::limits('signup_ip'));
        self::assertSame([60, 3600], RateLimit::limits('customer_ip'));
        self::assertSame([500, 86400], RateLimit::limits('customer_business'));
        $this->setLimits(['customer_ip' => [7, 60]]);
        self::assertSame([7, 60], RateLimit::limits('customer_ip'));
    }
}
