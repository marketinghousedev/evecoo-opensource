<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

/** Port of main:lib/validate.ts (+ password rules of lib/accounts.ts). Lengths are UTF-16 code units like JS. */
final class Validate
{
    private const WS = '\s\p{Z}\x{FEFF}';

    public static function str(array $o, string $key, int $min = 1, int $max = 200): string
    {
        $v = $o[$key] ?? null;
        if (!is_string($v)) self::bad('errors.validation.string', $key, $min, $max);
        $t = self::trim($v);
        $n = self::len($t);
        if ($n < $min || $n > $max) self::bad('errors.validation.string', $key, $min, $max);
        return $t;
    }

    /** PHP int, or a finite integral float (JSON 3.0 / 1e2); never strings or bools. */
    public static function int(array $o, string $key, int $min, int $max): int
    {
        $v = $o[$key] ?? null;
        if (is_float($v) && is_finite($v) && floor($v) === $v && $v >= $min && $v <= $max) return (int) $v;
        if (is_int($v) && $v >= $min && $v <= $max) return $v;
        self::bad('errors.validation.int', $key, $min, $max);
    }

    public static function email(array $o, string $key): string
    {
        $v = $o[$key] ?? null;
        if (!is_string($v)) self::bad('errors.validation.email', $key);
        $t = mb_strtolower(self::trim($v), 'UTF-8');
        $w = self::WS;
        if (self::len($t) > 254 || preg_match("/^[^{$w}@]+@[^{$w}@]+\\.[^{$w}@]+$/Du", $t) !== 1) {
            self::bad('errors.validation.email', $key);
        }
        return $t;
    }

    public static function hexColor(array $o, string $key): string
    {
        $v = $o[$key] ?? null;
        if (!is_string($v) || preg_match('/^#[0-9a-fA-F]{6}$/D', $v) !== 1) self::bad('errors.validation.color', $key);
        return $v;
    }

    /** Optional YYYY-MM-DD: absent/null => null; otherwise must be a real calendar date. */
    public static function isoDate(array $o, string $key): ?string
    {
        $v = $o[$key] ?? null;
        if ($v === null) return null;
        if (!is_string($v) || preg_match('/^(\d{4})-(\d{2})-(\d{2})$/D', $v, $m) !== 1) self::bad('errors.validation.date', $key);
        $mo = (int) $m[2];
        $d = (int) $m[3];
        if ($mo < 1 || $mo > 12 || $d < 1 || $d > Time::daysInMonth((int) $m[1], $mo)) self::bad('errors.validation.date', $key);
        return $v;
    }

    /** Signup / staff: not trimmed, 8..200 UTF-16 units. */
    public static function newPassword(array $o, string $key = 'password'): string
    {
        $v = $o[$key] ?? null;
        if (!is_string($v) || self::len($v) < 8 || self::len($v) > 200) self::bad('errors.validation.string', $key, 8, 200);
        return $v;
    }

    /** Login: any string (a wrong short password must be 401, not 400). */
    public static function anyPassword(array $o, string $key = 'password'): string
    {
        $v = $o[$key] ?? null;
        if (!is_string($v)) self::bad('errors.validation.string', $key, 0, 200);
        return $v;
    }

    /** Length in UTF-16 code units (JS String.length). */
    public static function len(string $s): int
    {
        if ($s === '') return 0;
        if (!mb_check_encoding($s, 'UTF-8')) return strlen($s);
        return intdiv(strlen(mb_convert_encoding($s, 'UTF-16LE', 'UTF-8')), 2);
    }

    /** Strips Unicode whitespace at both ends (JS String.prototype.trim). */
    public static function trim(string $s): string
    {
        $r = preg_replace('/^[\p{Z}\s\x{FEFF}]+|[\p{Z}\s\x{FEFF}]+$/Du', '', $s);
        return $r ?? trim($s);
    }

    private static function bad(string $messageKey, string $field, ?int $min = null, ?int $max = null): never
    {
        $vars = ['field' => $field];
        if ($min !== null) $vars['min'] = $min;
        if ($max !== null) $vars['max'] = $max;
        throw new ApiError(400, 'validation_error', $messageKey, $vars);
    }
}
