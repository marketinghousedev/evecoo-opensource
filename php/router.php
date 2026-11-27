<?php
// Dev-only router for `php -S 127.0.0.1:8080 -t dist/public_html php/router.php`.
// Mirrors deploy/htaccess.root. Never part of the bundle.
declare(strict_types=1);

$root = rtrim((string) $_SERVER['DOCUMENT_ROOT'], '/');
$path = rawurldecode((string) parse_url((string) $_SERVER['REQUEST_URI'], PHP_URL_PATH));
if ($path === '' || $path[0] !== '/' || strpos($path, "\0") !== false) {
    $path = '/';
}
// Reject traversal.
foreach (explode('/', $path) as $seg) {
    if ($seg === '..') {
        http_response_code(400);
        exit;
    }
}

$types = [
    'html' => 'text/html; charset=utf-8', 'txt' => 'text/plain; charset=utf-8',
    'json' => 'application/json; charset=utf-8', 'js' => 'text/javascript; charset=utf-8',
    'mjs' => 'text/javascript; charset=utf-8', 'css' => 'text/css; charset=utf-8',
    'woff2' => 'font/woff2', 'woff' => 'font/woff', 'ttf' => 'font/ttf', 'otf' => 'font/otf',
    'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
    'gif' => 'image/gif', 'webp' => 'image/webp', 'avif' => 'image/avif', 'ico' => 'image/x-icon',
    'map' => 'application/json', 'xml' => 'application/xml', 'webmanifest' => 'application/manifest+json',
];

$serve = static function (string $file, int $status = 200) use ($types): never {
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    http_response_code($status);
    header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
    header('X-Content-Type-Options: nosniff');
    // Mirrors mod_deflate in deploy/htaccess.root, so local Lighthouse runs see production-like transfer sizes.
    $text = in_array($ext, ['html', 'txt', 'css', 'js', 'mjs', 'json', 'svg', 'map', 'xml'], true);
    if ($text && function_exists('gzencode') && str_contains((string) ($_SERVER['HTTP_ACCEPT_ENCODING'] ?? ''), 'gzip')) {
        $body = (string) gzencode((string) file_get_contents($file), 6);
        header('Content-Encoding: gzip');
        header('Vary: Accept-Encoding');
        header('Content-Length: ' . strlen($body));
        echo $body;
        exit;
    }
    header('Content-Length: ' . filesize($file));
    readfile($file);
    exit;
};

// 1. API
if (preg_match('#^/api(/|$)#', $path)) {
    if (preg_match('#^/api/_app(/|$)#', $path) && $path !== '/api/_app') {
        // _app is never served directly; it is not an API route either.
        http_response_code(403);
        exit;
    }
    $_SERVER['SCRIPT_NAME'] = '/api/index.php';
    $_SERVER['SCRIPT_FILENAME'] = $root . '/api/index.php';
    chdir($root . '/api');
    require $root . '/api/index.php';
    exit;
}

// 2. Existing static file
$file = $root . $path;
if ($path !== '/' && is_file($file)) {
    $serve($file);
}

// 3. Shell pages for dynamic ids
if (preg_match('#^/(card|join)/[^/]+/?$#', $path, $m) && is_file("$root/{$m[1]}/index.html")) {
    $serve("$root/{$m[1]}/index.html");
}

// 4. /x -> /x/index.html (also / -> index.html)
$trim = rtrim($path, '/');
if (is_file("$root$trim/index.html")) {
    $serve("$root$trim/index.html");
}

// 5. 404 page
if (is_file("$root/404.html")) {
    $serve("$root/404.html", 404);
}
http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo "Not found\n";
