<?php
// Copy to one of (first readable wins):
//   1. the file named by env EVECOO_CONFIG
//   2. <parent of the web root>/evecoo-config.php   (preferred on Hostinger)
//   3. api/_app/config.php                          (fallback, protected directory)
// This file must only return an array; it is never committed with real values.
return [
    'db' => [
        'dsn' => 'mysql:host=localhost;dbname=uXXX_evecoo;charset=utf8mb4',
        'user' => 'uXXX_evecoo',
        'pass' => 'CHANGE-ME',
    ],
    // Only set this when a trusted reverse proxy sits in front AND the origin is not reachable directly, e.g.
    // 'HTTP_CF_CONNECTING_IP'. For 'HTTP_X_FORWARDED_FOR' the last (proxy-appended) entry is used. Otherwise any
    // client can forge the header and get a fresh rate-limit bucket per request. Default: REMOTE_ADDR.
    'ip_header' => null,
    // [limit, windowSeconds]; these are the production defaults when a key is absent.
    'rate_limit' => [
        'enabled' => true,
        'login_ip' => [20, 900],
        'login_email' => [10, 900],
        'signup_ip' => [10, 3600],
        'customer_ip' => [60, 3600],
        'customer_business' => [500, 86400],
    ],
];
