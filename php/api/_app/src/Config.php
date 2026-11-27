<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

final class Config
{
    private static ?array $cfg = null;

    /** First readable wins: env EVECOO_CONFIG, <parent of DOCUMENT_ROOT>/evecoo-config.php, api/_app/config.php. */
    public static function load(): array
    {
        if (self::$cfg !== null) return self::$cfg;
        $candidates = [];
        $env = getenv('EVECOO_CONFIG');
        if (is_string($env) && $env !== '') $candidates[] = $env;
        $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
        if (is_string($docRoot) && $docRoot !== '') $candidates[] = dirname($docRoot) . '/evecoo-config.php';
        $candidates[] = dirname(__DIR__) . '/config.php';
        foreach ($candidates as $file) {
            if (is_file($file) && is_readable($file)) {
                $cfg = (static fn (string $f): mixed => require $f)($file);
                if (!is_array($cfg)) throw new \RuntimeException('config file does not return an array');
                return self::$cfg = $cfg;
            }
        }
        throw new \RuntimeException('no config file found');
    }

    public static function get(string $dotPath, mixed $default = null): mixed
    {
        $v = self::load();
        foreach (explode('.', $dotPath) as $part) {
            if (!is_array($v) || !array_key_exists($part, $v)) return $default;
            $v = $v[$part];
        }
        return $v;
    }

    public static function reset(): void
    {
        self::$cfg = null;
    }
}
