<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

final class Request
{
    /** @param array<string,string> $headers header name (any case, stored lowercase) => value */
    public function __construct(
        public string $method,
        public string $path,
        public array $headers,
        public string $body,
        public string $ip,
        public int $declaredLength = 0,
    ) {
        $this->method = strtoupper($method);
        $norm = [];
        foreach ($headers as $k => $v) {
            $norm[strtolower((string) $k)] = (string) $v;
        }
        $this->headers = $norm;
    }

    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }

    /**
     * Builds a request from PHP's globals. Authorization is taken from HTTP_AUTHORIZATION, then
     * REDIRECT_HTTP_AUTHORIZATION, then getallheaders() (php-fpm often strips it); empty values are skipped.
     *
     * @param array<string,mixed> $server  usually $_SERVER
     * @param array<string,string>|null $allHeaders  getallheaders() result; null = call it if available
     */
    public static function fromGlobals(array $server, string $body, ?array $allHeaders = null): self
    {
        $headers = [];
        foreach ($server as $k => $v) {
            if (!is_string($k) || !is_scalar($v)) continue;
            if (str_starts_with($k, 'HTTP_')) {
                $headers[strtolower(str_replace('_', '-', substr($k, 5)))] = (string) $v;
            } elseif ($k === 'CONTENT_TYPE' || $k === 'CONTENT_LENGTH') {
                $headers[strtolower(str_replace('_', '-', $k))] = (string) $v;
            }
        }

        $auth = null;
        foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $k) {
            if (isset($server[$k]) && is_string($server[$k]) && trim($server[$k]) !== '') {
                $auth = $server[$k];
                break;
            }
        }
        if ($auth === null) {
            if ($allHeaders === null && function_exists('getallheaders')) {
                $all = getallheaders();
                $allHeaders = is_array($all) ? $all : [];
            }
            foreach ($allHeaders ?? [] as $name => $value) {
                if (is_string($name) && strtolower($name) === 'authorization' && is_string($value) && trim($value) !== '') {
                    $auth = $value;
                    break;
                }
            }
        }
        unset($headers['authorization']);
        if ($auth !== null) $headers['authorization'] = $auth;

        $uri = is_string($server['REQUEST_URI'] ?? null) ? $server['REQUEST_URI'] : '/';
        $q = strpos($uri, '?');
        $path = $q === false ? $uri : substr($uri, 0, $q);
        $h = strpos($path, '#');
        if ($h !== false) $path = substr($path, 0, $h);

        $method = is_string($server['REQUEST_METHOD'] ?? null) ? $server['REQUEST_METHOD'] : 'GET';
        $declared = $server['CONTENT_LENGTH'] ?? 0;
        $declared = is_numeric($declared) ? (int) $declared : 0;

        return new self($method, $path === '' ? '/' : $path, $headers, $body, self::clientIp($server), $declared);
    }

    /**
     * Rate-limit subject: REMOTE_ADDR unless config 'ip_header' names a trusted proxy header ($_SERVER key such as
     * HTTP_CF_CONNECTING_IP). For a comma list (X-Forwarded-For) the LAST entry is used: it is the one appended by the
     * trusted proxy, everything left of it is client-controlled. A value that is not an IP falls back to REMOTE_ADDR.
     */
    private static function clientIp(array $server): string
    {
        $remote = is_string($server['REMOTE_ADDR'] ?? null) ? $server['REMOTE_ADDR'] : '';
        $name = Config::get('ip_header');
        if (is_string($name) && $name !== '' && is_string($server[$name] ?? null)) {
            $parts = explode(',', $server[$name]);
            $last = trim((string) end($parts));
            if (filter_var($last, FILTER_VALIDATE_IP) !== false) return self::ipSubject($last);
        }
        return self::ipSubject($remote);
    }

    /**
     * IPv4 as is; IPv4-mapped IPv6 as the IPv4; other IPv6 reduced to its /64 (one end user typically owns a whole /64,
     * so per-address buckets would be trivially bypassed). Anything unparsable is returned unchanged.
     */
    public static function ipSubject(string $ip): string
    {
        $bin = @inet_pton(trim($ip));
        if ($bin === false) return $ip;
        if (strlen($bin) === 4) return (string) inet_ntop($bin);
        if (str_starts_with($bin, str_repeat("\0", 10) . "\xff\xff")) return (string) inet_ntop(substr($bin, 12));
        return inet_ntop(substr($bin, 0, 8) . str_repeat("\0", 8)) . '/64';
    }
}
