<?php
declare(strict_types=1);

namespace Evecoo\Tests\Core;

use Evecoo\Request;
use Evecoo\Tests\Support\TestCase;

/** S1 review fixes: client IP derivation for rate limiting. */
final class SecurityTest extends TestCase
{
    private static function ipOf(array $server): string
    {
        return Request::fromGlobals(['REQUEST_METHOD' => 'GET', 'REQUEST_URI' => '/api/health'] + $server, '', [])->ip;
    }

    public function testDefaultIgnoresForwardedHeaders(): void
    {
        self::assertSame('10.0.0.1', self::ipOf([
            'REMOTE_ADDR' => '10.0.0.1', 'HTTP_X_FORWARDED_FOR' => '6.6.6.6', 'HTTP_CF_CONNECTING_IP' => '7.7.7.7',
        ]));
    }

    public function testForwardedForUsesLastHopNotClientSuppliedFirst(): void
    {
        $this->setConfig('ip_header', 'HTTP_X_FORWARDED_FOR');
        // Client sends "X-Forwarded-For: 6.6.6.6"; the trusted proxy appends the real peer.
        self::assertSame('203.0.113.9', self::ipOf(['REMOTE_ADDR' => '10.0.0.1', 'HTTP_X_FORWARDED_FOR' => '6.6.6.6, 203.0.113.9']));
        self::assertSame('203.0.113.9', self::ipOf(['REMOTE_ADDR' => '10.0.0.1', 'HTTP_X_FORWARDED_FOR' => '203.0.113.9']));
    }

    public function testInvalidOrMissingHeaderFallsBackToRemoteAddr(): void
    {
        $this->setConfig('ip_header', 'HTTP_CF_CONNECTING_IP');
        self::assertSame('10.0.0.1', self::ipOf(['REMOTE_ADDR' => '10.0.0.1', 'HTTP_CF_CONNECTING_IP' => 'random-' . bin2hex(random_bytes(4))]));
        self::assertSame('10.0.0.1', self::ipOf(['REMOTE_ADDR' => '10.0.0.1', 'HTTP_CF_CONNECTING_IP' => '']));
        self::assertSame('10.0.0.1', self::ipOf(['REMOTE_ADDR' => '10.0.0.1']));
        self::assertSame('198.51.100.7', self::ipOf(['REMOTE_ADDR' => '10.0.0.1', 'HTTP_CF_CONNECTING_IP' => ' 198.51.100.7 ']));
    }

    public function testIpv6IsBucketedPer64(): void
    {
        $a = self::ipOf(['REMOTE_ADDR' => '2001:db8:1:2:aaaa::1']);
        $b = self::ipOf(['REMOTE_ADDR' => '2001:0db8:0001:0002:ffff:ffff:ffff:ffff']);
        self::assertSame('2001:db8:1:2::/64', $a);
        self::assertSame($a, $b);
        self::assertNotSame($a, self::ipOf(['REMOTE_ADDR' => '2001:db8:1:3::1']));
        self::assertSame('192.0.2.5', self::ipOf(['REMOTE_ADDR' => '::ffff:192.0.2.5']));
        self::assertSame('192.0.2.5', Request::ipSubject('192.0.2.5'));
    }

    public function testIpv6RotationWithinOne64IsRateLimited(): void
    {
        $this->setLimits(['login_ip' => [2, 900]]);
        $codes = [];
        foreach (['2001:db8::1', '2001:db8::2', '2001:db8::3'] as $ip) {
            $r = \Evecoo\App::handle(Request::fromGlobals([
                'REQUEST_METHOD' => 'POST', 'REQUEST_URI' => '/api/auth/login', 'REMOTE_ADDR' => $ip,
            ], '{"email":"x@y.zz","password":"p"}', []));
            $codes[] = $r->status;
        }
        self::assertSame([401, 401, 429], $codes);
    }

    public function testDeployHtaccessDeniesAppDirAndSetsSecurityHeaders(): void
    {
        $repo = dirname(__DIR__, 3);
        $root = (string) file_get_contents($repo . '/deploy/htaccess.root');
        foreach (['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Content-Security-Policy', 'Strict-Transport-Security'] as $h) {
            self::assertStringContainsString('Header always set ' . $h, $root);
        }
        self::assertMatchesRegularExpression("/Content-Security-Policy \"[^\"]*object-src 'none'[^\"]*frame-ancestors 'none'/", $root);
        self::assertStringContainsString('Options -Indexes', $root);
        $app = (string) file_get_contents($repo . '/php/api/_app/.htaccess');
        self::assertStringContainsString('Require all denied', $app);
        self::assertStringContainsString('Deny from all', $app);
        // every request under api/ (including api/_app/**) goes to the front controller
        self::assertStringContainsString('RewriteRule ^ index.php [L]', (string) file_get_contents($repo . '/php/api/.htaccess'));
    }

    public function testEveryAppPhpFileHasTheDirectAccessGuard(): void
    {
        $files = array_merge(glob(dirname(__DIR__, 2) . '/api/_app/src/*.php') ?: [], glob(dirname(__DIR__, 2) . '/api/_app/src/routes/*.php') ?: []);
        self::assertNotEmpty($files);
        foreach ($files as $f) {
            self::assertStringContainsString("defined('EVECOO') || exit;", (string) file_get_contents($f), basename($f));
        }
    }
}
