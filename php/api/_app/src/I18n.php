<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

/** Port of the server half of main:lib/i18n.ts. Catalogs: _app/messages/ (bundle) or the repo's messages/ (dev/tests). */
final class I18n
{
    public const DEFAULT_LOCALE = 'en';

    private static ?array $locales = null;
    /** @var array<string,array<string,string>> */
    private static array $catalogs = [];
    /** @var array<string,array<string,string>> */
    private static array $merged = [];

    public static function dir(): string
    {
        $bundled = dirname(__DIR__) . '/messages';
        return is_dir($bundled) ? $bundled : dirname(__DIR__, 4) . '/messages';
    }

    /** Sorted locale codes discovered from file names (always includes 'en'). */
    public static function locales(): array
    {
        if (self::$locales !== null) return self::$locales;
        $list = [];
        foreach (scandir(self::dir()) ?: [] as $f) {
            if (preg_match('/^([A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)\.json$/D', $f, $m) === 1) $list[] = $m[1];
        }
        if (!in_array(self::DEFAULT_LOCALE, $list, true)) $list[] = self::DEFAULT_LOCALE;
        sort($list, SORT_STRING);
        return self::$locales = $list;
    }

    /** en merged with the locale's catalog; unknown locales give en. Only discovered locales touch the filesystem. */
    public static function messages(string $locale): array
    {
        if (isset(self::$merged[$locale])) return self::$merged[$locale];
        $en = self::catalog(self::DEFAULT_LOCALE);
        if ($locale === self::DEFAULT_LOCALE || !in_array($locale, self::locales(), true)) return $en;
        return self::$merged[$locale] = array_merge($en, self::catalog($locale));
    }

    public static function t(string $locale, string $key, array $vars = []): string
    {
        $messages = self::messages($locale);
        $text = $messages[$key] ?? null;
        if ($text === null && isset($vars['count']) && (is_int($vars['count']) || is_float($vars['count']))) {
            $cat = self::pluralCategory($locale, $vars['count']);
            $text = $messages["$key.$cat"] ?? $messages["$key.other"] ?? null;
        }
        if ($text === null) return $key;
        if ($vars === []) return $text;
        return (string) preg_replace_callback('/\{(\w+)\}/', static function (array $m) use ($vars): string {
            if (!array_key_exists($m[1], $vars)) return $m[0];
            $v = $vars[$m[1]];
            return is_bool($v) ? ($v ? 'true' : 'false') : (string) $v;
        }, $text);
    }

    /** cookie `locale`, then Accept-Language (q-sorted; exact then base tag), then en. */
    public static function resolve(?string $cookie, ?string $acceptLanguage): string
    {
        if ($cookie !== null && $cookie !== '') {
            $m = self::match($cookie);
            if ($m !== null) return $m;
        }
        if ($acceptLanguage !== null && $acceptLanguage !== '') {
            $tags = [];
            foreach (explode(',', $acceptLanguage) as $part) {
                $params = explode(';', trim($part));
                $tag = array_shift($params);
                $q = 1.0;
                foreach ($params as $p) {
                    if (preg_match('/^\s*q=([\d.]+)/', $p, $qm) === 1) {
                        $q = is_numeric($qm[1]) ? (float) $qm[1] : NAN;
                        break;
                    }
                }
                if ($tag !== '' && $tag !== '*' && $q > 0) $tags[] = ['tag' => $tag, 'q' => $q];
            }
            usort($tags, static fn (array $a, array $b): int => $b['q'] <=> $a['q']);
            foreach ($tags as $t) {
                $m = self::match($t['tag']);
                if ($m !== null) return $m;
            }
        }
        return self::DEFAULT_LOCALE;
    }

    public static function fromRequest(Request $r): string
    {
        return self::resolve(self::cookieValue($r->header('cookie'), 'locale'), $r->header('accept-language'));
    }

    public static function cookieValue(?string $header, string $name): ?string
    {
        if ($header === null || $header === '') return null;
        foreach (explode(';', $header) as $part) {
            $idx = strpos($part, '=');
            if ($idx !== false && $idx > 0 && trim(substr($part, 0, $idx)) === $name) {
                $raw = trim(substr($part, $idx + 1));
                if (preg_match('/%(?![0-9A-Fa-f]{2})/', $raw) === 1) return null;
                $v = rawurldecode($raw);
                return mb_check_encoding($v, 'UTF-8') ? $v : null;
            }
        }
        return null;
    }

    /** Clears caches (tests). */
    public static function reset(): void
    {
        self::$locales = null;
        self::$catalogs = [];
        self::$merged = [];
    }

    private static function match(string $tag): ?string
    {
        $t = strtolower(trim($tag));
        if ($t === '') return null;
        $avail = self::locales();
        foreach ($avail as $l) {
            if (strtolower($l) === $t) return $l;
        }
        $base = explode('-', $t)[0];
        foreach ($avail as $l) {
            if (strtolower($l) === $base) return $l;
        }
        return null;
    }

    private static function catalog(string $locale): array
    {
        if (isset(self::$catalogs[$locale])) return self::$catalogs[$locale];
        $data = [];
        $file = self::dir() . '/' . $locale . '.json';
        if (in_array($locale, self::locales(), true) && is_file($file)) {
            $raw = @file_get_contents($file);
            $decoded = is_string($raw) ? json_decode($raw, true) : null;
            if (is_array($decoded)) {
                foreach ($decoded as $k => $v) {
                    if (is_string($v)) $data[(string) $k] = $v;
                }
            }
        }
        return self::$catalogs[$locale] = $data;
    }

    private static function pluralCategory(string $locale, int|float $n): string
    {
        if (class_exists(\MessageFormatter::class)) {
            $f = \MessageFormatter::create($locale, '{n, plural, zero{zero} one{one} two{two} few{few} many{many} other{other}}');
            $out = $f?->format(['n' => $n]);
            if (is_string($out) && $out !== '') return $out;
        }
        return $n == 1 ? 'one' : 'other';
    }
}
