<?php
declare(strict_types=1);

// PHPUnit bootstrap: load the app core without running the front controller.
define('EVECOO', true);
require dirname(__DIR__, 2) . '/api/_app/src/bootstrap.php';

// error_log() from 500 paths goes to a file instead of cluttering test output.
ini_set('error_log', sys_get_temp_dir() . '/evecoo-phpunit-error.log');
ini_set('display_errors', 'stderr');
