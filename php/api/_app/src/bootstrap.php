<?php
declare(strict_types=1);
defined('EVECOO') || exit;

ini_set('display_errors', '0');
date_default_timezone_set('UTC');

set_error_handler(static function (int $severity, string $message, string $file = '', int $line = 0): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new \ErrorException($message, 0, $severity, $file, $line);
});

spl_autoload_register(static function (string $class): void {
    if (str_starts_with($class, 'Evecoo\\') && preg_match('/^Evecoo\\\\([A-Za-z0-9]+)$/D', $class, $m) === 1) {
        $file = __DIR__ . '/' . $m[1] . '.php';
        if (is_file($file)) require $file;
    }
});
