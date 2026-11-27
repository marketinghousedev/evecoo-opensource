<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

/** Fixed-window counters in the rate_limits table. Limits: Config 'rate_limit.<name>' = [limit, windowSeconds]. */
final class RateLimit
{
    public const DEFAULTS = [
        'login_ip' => [20, 900],
        'login_email' => [10, 900],
        'signup_ip' => [10, 3600],
        'customer_ip' => [60, 3600],
        'customer_business' => [500, 86400],
    ];

    /** Counts one hit; throws 429 (with Retry-After) when the count exceeds the limit. Limit N allows N hits. */
    public static function hit(string $name, string $subject): void
    {
        if (!self::enabled()) return;
        [$limit, $window] = self::limits($name);
        $now = time();
        $windowStart = intdiv($now, $window) * $window;
        if (random_int(1, 100) === 1) {
            Db::run('DELETE FROM rate_limits WHERE window_start < ?', [$now - 86400]);
        }
        $hits = Db::upsertHit(self::bucket($name, $subject), $windowStart);
        if ($hits > $limit) self::fail($windowStart + $window - $now);
    }

    /** Throws 429 if the subject is already at the limit in the current window; does not count. */
    public static function check(string $name, string $subject): void
    {
        if (!self::enabled()) return;
        [$limit, $window] = self::limits($name);
        $now = time();
        $windowStart = intdiv($now, $window) * $window;
        $row = Db::one('SELECT window_start, hits FROM rate_limits WHERE bucket = ?', [self::bucket($name, $subject)]);
        if ($row !== null && (int) $row['window_start'] === $windowStart && (int) $row['hits'] >= $limit) {
            self::fail($windowStart + $window - $now);
        }
    }

    public static function clear(string $name, string $subject): void
    {
        if (!self::enabled()) return;
        Db::run('DELETE FROM rate_limits WHERE bucket = ?', [self::bucket($name, $subject)]);
    }

    /** @return array{0:int,1:int} [limit, windowSeconds] */
    public static function limits(string $name): array
    {
        $v = Config::get('rate_limit.' . $name);
        if (is_array($v) && count($v) === 2) {
            [$limit, $window] = array_values($v);
            if (is_int($limit) && is_int($window) && $limit >= 0 && $window > 0) return [$limit, $window];
        }
        if (!isset(self::DEFAULTS[$name])) throw new \InvalidArgumentException('unknown rate limit');
        return self::DEFAULTS[$name];
    }

    private static function enabled(): bool
    {
        return Config::get('rate_limit.enabled', true) !== false;
    }

    private static function bucket(string $name, string $subject): string
    {
        return hash('sha256', "$name|$subject");
    }

    private static function fail(int $retryAfter): never
    {
        throw new ApiError(429, 'rate_limited', 'errors.rateLimited', [], ['Retry-After' => (string) max(1, $retryAfter)]);
    }
}
