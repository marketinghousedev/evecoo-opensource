<?php
// Local development config (SQLite, no secrets). Use with EVECOO_CONFIG=$PWD/php/config.local.php.
return [
    'db' => ['dsn' => 'sqlite:' . sys_get_temp_dir() . '/evecoo-dev.sqlite', 'user' => null, 'pass' => null],
    'ip_header' => null,
    'rate_limit' => [
        'enabled' => true,
        'login_ip' => [100000, 60],
        'login_email' => [100000, 60],
        'signup_ip' => [100000, 60],
        'customer_ip' => [100000, 60],
        'customer_business' => [100000, 60],
    ],
];
