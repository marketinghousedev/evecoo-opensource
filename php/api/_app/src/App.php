<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

final class App
{
    public const JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE;

    private const DEFAULT_HEADERS = [
        'Content-Type' => 'application/json; charset=utf-8',
        'Cache-Control' => 'no-store',
        'X-Content-Type-Options' => 'nosniff',
    ];

    /** @var list<array{method:string,pattern:string,segments:list<string>,handler:callable}>|null */
    private static ?array $routes = null;

    /** Front controller: globals -> Request -> handle() -> emit. */
    public static function run(): void
    {
        try {
            $declared = $_SERVER['CONTENT_LENGTH'] ?? 0;
            $body = '';
            if (!(is_numeric($declared) && (int) $declared > Http::MAX_BODY_BYTES)) {
                $in = fopen('php://input', 'rb');
                if ($in !== false) {
                    $body = (string) stream_get_contents($in, Http::MAX_BODY_BYTES + 1);
                    fclose($in);
                }
            }
            $response = self::handle(Request::fromGlobals($_SERVER, $body));
        } catch (\Throwable $e) {
            self::log($e);
            $response = self::internal('en');
        }
        self::emit($response);
    }

    /** Routing and error mapping; pure (no globals, no output). */
    public static function handle(Request $r): Response
    {
        try {
            $segments = self::segments($r->path);
            $allowed = [];
            foreach (self::routes() as $route) {
                $params = $segments === null ? null : self::match($route['segments'], $segments);
                if ($params === null) continue;
                if ($route['method'] !== $r->method) {
                    $allowed[] = $route['method'];
                    continue;
                }
                $res = ($route['handler'])($r, $params);
                if (!$res instanceof Response) throw new \UnexpectedValueException('handler did not return a Response');
                return self::finish($res);
            }
            if ($allowed !== []) {
                $allowed = array_values(array_unique($allowed));
                throw new ApiError(405, 'method_not_allowed', 'errors.methodNotAllowed', [], ['Allow' => implode(', ', $allowed)]);
            }
            throw new ApiError(404, 'not_found', 'errors.notFound');
        } catch (ApiError $e) {
            $locale = self::localeOf($r);
            return self::finish(new Response(
                $e->status,
                ['error' => $e->errorCode, 'message' => I18n::t($locale, $e->messageKey, $e->vars)],
                $e->headers,
            ));
        } catch (\Throwable $e) {
            self::log($e);
            return self::internal(self::localeOf($r));
        }
    }

    /** @return array{method:string,pattern:string,segments:list<string>,handler:callable} */
    public static function route(string $method, string $pattern, callable $handler): array
    {
        return [
            'method' => strtoupper($method),
            'pattern' => $pattern,
            'segments' => array_values(array_filter(explode('/', $pattern), static fn (string $s): bool => $s !== '')),
            'handler' => $handler,
        ];
    }

    /** Route table: every src/routes/*.php returns a list of App::route(...) entries. */
    public static function routes(): array
    {
        if (self::$routes !== null) return self::$routes;
        $all = [];
        $files = glob(__DIR__ . '/routes/*.php') ?: [];
        sort($files, SORT_STRING);
        foreach ($files as $file) {
            $list = (static fn (string $f): mixed => require $f)($file);
            if (is_array($list)) {
                foreach ($list as $route) $all[] = $route;
            }
        }
        return self::$routes = $all;
    }

    /** Replace the route table (tests); null re-discovers routes/*.php on next use. */
    public static function setRoutes(?array $routes): void
    {
        self::$routes = $routes;
    }

    public static function emit(Response $res): void
    {
        $res = self::finish($res);
        $json = json_encode($res->data, self::JSON_FLAGS);
        if ($json === false) {
            $res = self::internal('en');
            $json = (string) json_encode($res->data, self::JSON_FLAGS);
        }
        if (!headers_sent()) {
            header_remove('X-Powered-By');
            http_response_code($res->status);
            foreach ($res->headers as $name => $value) {
                header($name . ': ' . str_replace(["\r", "\n"], '', (string) $value));
            }
        }
        echo $json;
    }

    /** Path segments, URI-decoded one by one; null for an empty segment (e.g. '//'). Single trailing slash ignored. */
    private static function segments(string $path): ?array
    {
        if ($path !== '/' && str_ends_with($path, '/')) $path = substr($path, 0, -1);
        $parts = explode('/', ltrim($path, '/'));
        $out = [];
        foreach ($parts as $p) {
            if ($p === '') return null;
            $out[] = rawurldecode($p);
        }
        return $out;
    }

    private static function match(array $pattern, array $segments): ?array
    {
        if (count($pattern) !== count($segments)) return null;
        $params = [];
        foreach ($pattern as $i => $p) {
            if (strlen($p) > 2 && $p[0] === '{' && str_ends_with($p, '}')) {
                $params[substr($p, 1, -1)] = $segments[$i];
            } elseif ($p !== $segments[$i]) {
                return null;
            }
        }
        return $params;
    }

    private static function finish(Response $res): Response
    {
        $res->headers = array_merge(self::DEFAULT_HEADERS, $res->headers);
        return $res;
    }

    private static function internal(string $locale): Response
    {
        try {
            $message = I18n::t($locale, 'errors.internal');
        } catch (\Throwable) {
            $message = 'errors.internal';
        }
        return self::finish(new Response(500, ['error' => 'internal', 'message' => $message]));
    }

    private static function localeOf(Request $r): string
    {
        try {
            return I18n::fromRequest($r);
        } catch (\Throwable) {
            return I18n::DEFAULT_LOCALE;
        }
    }

    private static function log(\Throwable $e): void
    {
        error_log('evecoo: ' . get_class($e) . ': ' . $e->getMessage());
    }
}
