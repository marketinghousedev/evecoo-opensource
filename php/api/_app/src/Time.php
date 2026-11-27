<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

/** All timestamps are UTC strings 'YYYY-MM-DDTHH:MM:SS.mmmZ' (string order = time order) or epoch milliseconds. */
final class Time
{
    private const PATTERN = '/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?(Z|[+-]\d{2}:?\d{2})?$/D';

    public static function nowMs(): int
    {
        return (int) floor(microtime(true) * 1000);
    }

    public static function nowIso(): string
    {
        return self::toIso(self::nowMs());
    }

    public static function toIso(int $ms): string
    {
        $sec = intdiv($ms, 1000);
        $frac = $ms % 1000;
        if ($frac < 0) {
            $frac += 1000;
            $sec -= 1;
        }
        return gmdate('Y-m-d\TH:i:s', $sec) . sprintf('.%03dZ', $frac);
    }

    /** Parses an ISO date/date-time (see parseNow for the grammar) to epoch ms; null if malformed or not a real date. */
    public static function isoToMs(string $iso): ?int
    {
        if (preg_match(self::PATTERN, $iso, $m) !== 1) return null;
        [$y, $mo, $d] = [(int) $m[1], (int) $m[2], (int) $m[3]];
        if ($mo < 1 || $mo > 12 || $d < 1 || $d > self::daysInMonth($y, $mo)) return null;
        $h = isset($m[4]) && $m[4] !== '' ? (int) $m[4] : 0;
        $mi = isset($m[5]) && $m[5] !== '' ? (int) $m[5] : 0;
        $s = isset($m[6]) && $m[6] !== '' ? (int) $m[6] : 0;
        if ($h > 23 || $mi > 59 || $s > 59) return null;
        $ms = isset($m[7]) && $m[7] !== '' ? (int) substr(str_pad($m[7], 3, '0'), 0, 3) : 0;
        $offsetMin = 0;
        $tz = $m[8] ?? '';
        if ($tz !== '' && $tz !== 'Z') {
            $digits = str_replace(':', '', substr($tz, 1));
            $oh = (int) substr($digits, 0, 2);
            $om = (int) substr($digits, 2, 2);
            if ($oh > 23 || $om > 59) return null;
            $offsetMin = ($tz[0] === '-' ? -1 : 1) * ($oh * 60 + $om);
        }
        $days = self::daysFromCivil($y, $mo, $d);
        return ((($days * 24 + $h) * 60 + $mi - $offsetMin) * 60 + $s) * 1000 + $ms;
    }

    /**
     * Value of a request's "now" field. Must be a string in the grammar
     * YYYY-MM-DD[(T| )HH:MM[:SS[.f{1,9}]]][Z|±HH[:]MM], a real calendar date, missing offset = UTC, fraction
     * truncated to ms, resulting UTC year 1970..9999. Anything else (including null and non-strings) is 400.
     * Callers decide "absent => Time::nowMs()" themselves (array_key_exists), like the Node route did.
     */
    public static function parseNow(mixed $v): int
    {
        $ms = is_string($v) ? self::isoToMs($v) : null;
        if ($ms === null || $ms < 0 || $ms >= self::daysFromCivil(10000, 1, 1) * 86400000) {
            throw new ApiError(400, 'validation_error', 'errors.validation.now', ['field' => 'now']);
        }
        return $ms;
    }

    public static function daysInMonth(int $y, int $m): int
    {
        return match ($m) {
            2 => ($y % 4 === 0 && ($y % 100 !== 0 || $y % 400 === 0)) ? 29 : 28,
            4, 6, 9, 11 => 30,
            default => 31,
        };
    }

    /** Days since 1970-01-01 for a proleptic Gregorian date (H. Hinnant's algorithm). */
    private static function daysFromCivil(int $y, int $m, int $d): int
    {
        $y -= $m <= 2 ? 1 : 0;
        $era = intdiv($y >= 0 ? $y : $y - 399, 400);
        $yoe = $y - $era * 400;
        $doy = intdiv(153 * ($m + ($m > 2 ? -3 : 9)) + 2, 5) + $d - 1;
        $doe = $yoe * 365 + intdiv($yoe, 4) - intdiv($yoe, 100) + $doy;
        return $era * 146097 + $doe - 719468;
    }
}
