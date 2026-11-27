<?php
declare(strict_types=1);

namespace Evecoo\Tests\Core;

use Evecoo\ApiError;
use Evecoo\App;
use Evecoo\Http;
use Evecoo\I18n;
use Evecoo\Request;
use Evecoo\Response;
use Evecoo\Tests\Support\TestCase;
use Evecoo\Validate;

final class AppTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        App::setRoutes([
            App::route('POST', '/api/echo', static fn (Request $r): Response => Http::json(['got' => Http::readJson($r)], 201)),
            App::route('GET', '/api/echo', static fn (Request $r): Response => Http::json(['ok' => true])),
            App::route('GET', '/api/pass/{customerId}/google', static fn (Request $r, array $p): Response => Http::json($p)),
            App::route('GET', '/api/boom', static function (): Response {
                throw new \RuntimeException('secret SQLSTATE detail /etc/passwd');
            }),
            App::route('GET', '/api/validate', static function (): Response {
                Validate::str([], 'name', 1, 5);
                return Http::json([]);
            }),
            App::route('GET', '/api/notfound', static function (): Response {
                throw new ApiError(404, 'not_found', 'errors.notFound');
            }),
            App::route('GET', '/api/bad', static fn (): mixed => 'not a response'),
        ]);
    }

    protected function tearDown(): void
    {
        App::setRoutes(null);
        parent::tearDown();
    }

    public function testDefaultRouteTableAnswers404JsonEvenWithoutRouteFiles(): void
    {
        App::setRoutes(null);
        $r = $this->req('GET', '/api/definitely-not-a-route-' . bin2hex(random_bytes(4)));
        self::assertSame(404, $r->status);
        self::assertSame(['error' => 'not_found', 'message' => I18n::t('en', 'errors.notFound')], self::body($r));
        self::assertSame('application/json; charset=utf-8', $r->headers['Content-Type']);
    }

    public function testUnknownPath404(): void
    {
        foreach (['/api/nope', '/api', '/', '/api/echo/extra', '/api//echo', '/api/pass//google'] as $p) {
            $r = $this->req('GET', $p);
            self::assertSame(404, $r->status, $p);
            self::assertSame('not_found', self::body($r)['error']);
        }
    }

    public function testWrongMethod405WithAllow(): void
    {
        $r = $this->req('DELETE', '/api/echo');
        self::assertSame(405, $r->status);
        self::assertSame('method_not_allowed', self::body($r)['error']);
        self::assertSame('This action is not supported.', self::body($r)['message']);
        self::assertSame('POST, GET', $r->headers['Allow']);
        self::assertSame('GET', $this->req('POST', '/api/boom')->headers['Allow']);
    }

    public function testParamsAreDecodedPerSegmentAndTrailingSlashIgnored(): void
    {
        $r = $this->req('GET', '/api/pass/a%2Fb%20c/google');
        self::assertSame(200, $r->status);
        self::assertSame(['customerId' => 'a/b c'], self::body($r));
        self::assertSame(200, $this->req('GET', '/api/echo/')->status);
    }

    public function testSecurityHeadersOnEveryResponse(): void
    {
        foreach ([$this->req('GET', '/api/echo'), $this->req('GET', '/api/nope'), $this->req('GET', '/api/boom')] as $r) {
            self::assertSame('application/json; charset=utf-8', $r->headers['Content-Type']);
            self::assertSame('no-store', $r->headers['Cache-Control']);
            self::assertSame('nosniff', $r->headers['X-Content-Type-Options']);
            self::assertArrayNotHasKey('Access-Control-Allow-Origin', $r->headers);
        }
    }

    public function testUncaughtThrowableIs500WithoutLeak(): void
    {
        foreach (['/api/boom', '/api/bad'] as $p) {
            $r = $this->req('GET', $p);
            self::assertSame(500, $r->status);
            $json = (string) json_encode($r->data);
            self::assertStringNotContainsString('secret', $json);
            self::assertStringNotContainsString('passwd', $json);
            self::assertSame(['error' => 'internal', 'message' => I18n::t('en', 'errors.internal')], self::body($r));
        }
    }

    public function testApiErrorRenderedThroughCatalog(): void
    {
        $r = $this->req('GET', '/api/validate');
        self::assertSame(400, $r->status);
        self::assertSame('validation_error', self::body($r)['error']);
        self::assertSame('"name" must be text between 1 and 5 characters long.', self::body($r)['message']);
        $nf = $this->req('GET', '/api/notfound', null, null, ['Cookie' => 'locale=zz', 'Accept-Language' => '../../etc']);
        self::assertSame(I18n::t('en', 'errors.notFound'), self::body($nf)['message']);
    }

    public function testJsonBodies(): void
    {
        $ok = $this->req('POST', '/api/echo', ['a' => 1, 'ü' => 'é/']);
        self::assertSame(201, $ok->status);
        self::assertSame(['got' => ['a' => 1, 'ü' => 'é/']], self::body($ok));
        self::assertSame(['got' => []], self::body($this->rawReq('POST', '/api/echo', '')));
        self::assertSame(['got' => []], self::body($this->rawReq('POST', '/api/echo', "  \n\t ")));
        self::assertSame(['got' => []], self::body($this->rawReq('POST', '/api/echo', '{}')));

        foreach (['[]', '[1,2]', '"str"', '42', 'null', 'true', '{bad', '{"a":1}x', "\xff\xfe"] as $raw) {
            $r = $this->rawReq('POST', '/api/echo', $raw);
            self::assertSame(400, $r->status, $raw);
            self::assertSame('validation_error', self::body($r)['error']);
            self::assertSame(I18n::t('en', 'errors.invalidJson'), self::body($r)['message']);
        }
    }

    public function testBodyCapDeclaredAndActual(): void
    {
        $max = Http::MAX_BODY_BYTES;
        $atCap = '{"a":"' . str_repeat('x', $max - 8) . '"}';
        self::assertSame($max, strlen($atCap));
        self::assertSame(201, $this->rawReq('POST', '/api/echo', $atCap)->status);

        $big = '{"a":"' . str_repeat('x', $max) . '"}';
        self::assertSame(400, $this->rawReq('POST', '/api/echo', $big)->status);

        // actual bytes over the cap while the declared length lies
        $lying = App::handle(new Request('POST', '/api/echo', [], $big, '127.0.0.1', 10));
        self::assertSame(400, $lying->status);
        // declared length over the cap with an empty (unread) body
        $declared = App::handle(new Request('POST', '/api/echo', [], '', '127.0.0.1', $max + 1));
        self::assertSame(400, $declared->status);
        self::assertSame('validation_error', self::body($declared)['error']);
        $hdr = App::handle(new Request('POST', '/api/echo', ['Content-Length' => (string) ($max + 1)], '', '127.0.0.1'));
        self::assertSame(400, $hdr->status);
    }

    public function testEmitWritesJson(): void
    {
        ob_start();
        App::emit(new Response(200, ['name' => 'Café/€', 'n' => 3]));
        $out = (string) ob_get_clean();
        self::assertSame('{"name":"Café/€","n":3}', $out);
    }
}
