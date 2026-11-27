<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

// Ports of main:app/api/{auth/signup,auth/login,auth/me,staff,health}/route.ts.
return [
    App::route('POST', '/api/auth/signup', static function (Request $r, array $params): Response {
        RateLimit::hit('signup_ip', $r->ip);
        $b = Http::readJson($r);
        $input = [
            'email' => Validate::email($b, 'email'),
            'password' => Validate::newPassword($b),
            'businessName' => Validate::str($b, 'businessName', 1, 100),
        ];
        return Http::json(Accounts::signup($input, I18n::fromRequest($r)), 201);
    }),

    App::route('POST', '/api/auth/login', static function (Request $r, array $params): Response {
        RateLimit::hit('login_ip', $r->ip);
        $b = Http::readJson($r);
        $input = ['email' => Validate::str($b, 'email', 1, 254), 'password' => Validate::anyPassword($b)];
        return Http::json(Accounts::login($input));
    }),

    App::route('GET', '/api/auth/me', static function (Request $r, array $params): Response {
        $u = Auth::requireUser($r);
        return Http::json([
            'email' => $u['email'], 'role' => $u['role'], 'businessId' => $u['businessId'], 'businessName' => $u['businessName'],
        ]);
    }),

    App::route('POST', '/api/staff', static function (Request $r, array $params): Response {
        $u = Auth::requireUser($r, 'owner');
        $b = Http::readJson($r);
        $input = ['email' => Validate::email($b, 'email'), 'password' => Validate::newPassword($b)];
        return Http::json(Accounts::createStaff($u, $input), 201);
    }),

    App::route('GET', '/api/staff', static function (Request $r, array $params): Response {
        $u = Auth::requireUser($r, 'owner');
        return Http::json(Accounts::listStaff($u['businessId']));
    }),

    App::route('GET', '/api/health', static fn (Request $r, array $params): Response => Http::json(['ok' => true])),
];
