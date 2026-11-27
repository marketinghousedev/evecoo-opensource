<?php
declare(strict_types=1);

namespace Evecoo\Tests\Core;

use Evecoo\ApiError;
use Evecoo\App;
use Evecoo\Auth;
use Evecoo\Db;
use Evecoo\Request;
use Evecoo\Response;
use Evecoo\Tests\Support\TestCase;
use Evecoo\Time;

final class AuthTest extends TestCase
{
    private static function authReq(?string $header): Request
    {
        return new Request('GET', '/api/x', $header === null ? [] : ['Authorization' => $header], '', '127.0.0.1');
    }

    private static function errStatus(callable $fn): ?int
    {
        try {
            $fn();
            return null;
        } catch (ApiError $e) {
            return $e->status;
        }
    }

    public function testArgon2idRoundTrip(): void
    {
        $h = Auth::hashPassword('geheim123');
        if (defined('PASSWORD_ARGON2ID')) self::assertStringStartsWith('$argon2id$', $h);
        self::assertStringNotContainsString('geheim123', $h);
        self::assertTrue(Auth::verifyPassword('geheim123', $h));
        self::assertFalse(Auth::verifyPassword('falsch', $h));
        self::assertFalse(Auth::verifyPassword('x', 'garbage'));
        self::assertFalse(Auth::verifyPassword('x', ''));
    }

    public function testBcryptPathRoundTripAndNo72ByteTruncation(): void
    {
        $h = Auth::hashBcrypt('geheim123');
        self::assertStringStartsWith('$2y$12$', $h);
        self::assertTrue(Auth::verifyPassword('geheim123', $h));
        self::assertFalse(Auth::verifyPassword('geheim1234', $h));

        $a = str_repeat('a', 80) . 'X';
        $b = str_repeat('a', 80) . 'Y';
        $ha = Auth::hashBcrypt($a);
        self::assertTrue(Auth::verifyPassword($a, $ha));
        self::assertFalse(Auth::verifyPassword($b, $ha), 'passwords differing after byte 72 must not collide');
        // Sanity: raw bcrypt would collide, which is what the pre-hash prevents.
        self::assertTrue(password_verify($b, password_hash($a, PASSWORD_BCRYPT, ['cost' => 4])));
    }

    public function testBurnDoesWorkAndReturnsNothing(): void
    {
        $t = microtime(true);
        Auth::burn('whatever-password');
        self::assertGreaterThan(0.0, microtime(true) - $t);
    }

    public function testSessionCreateLookupExpiry(): void
    {
        $s = $this->seedBusiness(['name' => 'Café A']);
        self::assertSame(401, self::errStatus(fn () => Auth::requireUser(self::authReq(null))));
        self::assertSame(401, self::errStatus(fn () => Auth::requireUser(self::authReq('Bearer nope'))));
        self::assertSame(401, self::errStatus(fn () => Auth::requireUser(self::authReq('Basic abc'))));

        $token = Auth::createSession($s['owner']['id']);
        self::assertMatchesRegularExpression('/^[A-Za-z0-9_-]{43}$/', $token);
        $u = Auth::requireUser(self::authReq('Bearer ' . $token));
        self::assertSame($s['owner'], $u);
        self::assertSame(['id', 'email', 'role', 'businessId', 'businessName'], array_keys($u));
        // case-insensitive scheme, surrounding whitespace, multiple spaces
        self::assertNotNull(Auth::getUser(self::authReq("  bearer   $token  ")));
        self::assertNull(Auth::getUser(self::authReq("Bearer $token extra")));

        $row = Db::one('SELECT created_at, expires_at FROM sessions WHERE token_hash = ?', [hash('sha256', $token)]);
        self::assertNotNull($row);
        $days = (Time::isoToMs($row['expires_at']) - Time::isoToMs($row['created_at'])) / 86400000;
        self::assertSame(30.0, (float) $days);

        Db::run('UPDATE sessions SET expires_at = ?', ['2000-01-01T00:00:00.000Z']);
        self::assertSame(401, self::errStatus(fn () => Auth::requireUser(self::authReq('Bearer ' . $token))));
    }

    public function testRolesAndTokenStoredOnlyHashed(): void
    {
        $s = $this->seedBusiness();
        $staff = $this->seedStaff($s['businessId']);
        self::assertSame('staff', Auth::requireUser(self::authReq('Bearer ' . $staff['token']))['role']);
        self::assertSame(403, self::errStatus(fn () => Auth::requireUser(self::authReq('Bearer ' . $staff['token']), 'owner')));
        $ownerToken = Auth::createSession($s['owner']['id']);
        self::assertSame('owner', Auth::requireUser(self::authReq('Bearer ' . $ownerToken), 'owner')['role']);

        $hashes = array_column(Db::all('SELECT token_hash FROM sessions'), 'token_hash');
        self::assertNotContains($ownerToken, $hashes);
        self::assertContains(hash('sha256', $ownerToken), $hashes);
        foreach ($hashes as $h) self::assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $h);
    }

    public function testExpiredSessionsArePurgedOnCreate(): void
    {
        $s = $this->seedBusiness();
        Db::run('DELETE FROM sessions');
        Db::run(
            'INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
            [str_repeat('d', 64), $s['owner']['id'], Time::nowIso(), Time::toIso(Time::nowMs() - 1000)],
        );
        Auth::createSession($s['owner']['id']);
        $rows = Db::all('SELECT token_hash FROM sessions');
        self::assertCount(1, $rows);
        self::assertNotSame(str_repeat('d', 64), $rows[0]['token_hash']);
    }

    public function testBearerFromAllThreeServerSources(): void
    {
        $s = $this->seedBusiness();
        $base = ['REQUEST_METHOD' => 'GET', 'REQUEST_URI' => '/api/x?y=1', 'REMOTE_ADDR' => '10.0.0.1'];
        $hdr = 'Bearer ' . $s['token'];

        $r1 = Request::fromGlobals($base + ['HTTP_AUTHORIZATION' => $hdr], '', []);
        // Apache's E= rule sets an empty HTTP_AUTHORIZATION when the header is absent: fall through.
        $r2 = Request::fromGlobals($base + ['HTTP_AUTHORIZATION' => '', 'REDIRECT_HTTP_AUTHORIZATION' => $hdr], '', []);
        $r3 = Request::fromGlobals($base, '', ['Host' => 'x', 'authorization' => $hdr]);
        $r4 = Request::fromGlobals($base, '', ['AUTHORIZATION' => $hdr]);
        $none = Request::fromGlobals($base + ['HTTP_AUTHORIZATION' => ''], '', []);

        foreach ([$r1, $r2, $r3, $r4] as $r) {
            self::assertSame($hdr, $r->header('Authorization'));
            self::assertSame($s['owner']['id'], Auth::requireUser($r)['id']);
        }
        self::assertNull($none->header('authorization'));
        self::assertNull(Auth::getUser($none));
        self::assertSame('/api/x', $r1->path);
        self::assertSame('GET', $r1->method);
        self::assertSame('10.0.0.1', $r1->ip);
    }

    public function testFromGlobalsHeadersAndLength(): void
    {
        $r = Request::fromGlobals([
            'REQUEST_METHOD' => 'post', 'REQUEST_URI' => '/api/stamps', 'REMOTE_ADDR' => '1.2.3.4',
            'CONTENT_LENGTH' => '12', 'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT_LANGUAGE' => 'de',
            'HTTP_COOKIE' => 'locale=en',
        ], '{"a":1}', []);
        self::assertSame('POST', $r->method);
        self::assertSame(12, $r->declaredLength);
        self::assertSame('application/json', $r->header('Content-Type'));
        self::assertSame('de', $r->header('accept-language'));
        self::assertSame('locale=en', $r->header('cookie'));
        self::assertSame('{"a":1}', $r->body);
    }

    public function testRequireUserThroughAppGives401Json(): void
    {
        App::setRoutes([
            App::route('GET', '/api/me', static fn (Request $r): Response => new Response(200, Auth::requireUser($r, 'owner'))),
        ]);
        try {
            $s = $this->seedBusiness();
            $staff = $this->seedStaff($s['businessId']);
            $r = $this->req('GET', '/api/me');
            self::assertSame(401, $r->status);
            self::assertSame('unauthorized', self::body($r)['error']);
            self::assertSame(403, $this->req('GET', '/api/me', null, $staff['token'])->status);
            $ok = $this->req('GET', '/api/me', null, $s['token']);
            self::assertSame(200, $ok->status);
            self::assertSame($s['businessId'], self::body($ok)['businessId']);
        } finally {
            App::setRoutes(null);
        }
    }
}
