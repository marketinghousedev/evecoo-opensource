<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

return [
    App::route('POST', '/api/messages', static function (Request $r, array $params): Response {
        $user = Auth::requireUser($r, 'owner');
        $b = Http::readJson($r);
        $title = Validate::str($b, 'title', 1, 80);
        $body = Validate::str($b, 'body', 1, 500);
        return Http::json(Messages::sendBroadcast($user['businessId'], ['title' => $title, 'body' => $body]));
    }),
    App::route('GET', '/api/messages', static function (Request $r, array $params): Response {
        $user = Auth::requireUser($r, 'owner');
        return Http::json(Messages::listForBusiness($user['businessId']));
    }),
    App::route('GET', '/api/customers/{id}/messages', static function (Request $r, array $params): Response {
        return Http::json(Messages::listForCustomer((string) $params['id']));
    }),
    App::route('POST', '/api/automations/run', static function (Request $r, array $params): Response {
        $user = Auth::requireUser($r, 'owner');
        $b = Http::readJson($r);
        $now = array_key_exists('now', $b) ? Time::parseNow($b['now']) : Time::nowMs();
        return Http::json(Automations::run($user['businessId'], $now));
    }),
    App::route('GET', '/api/stats', static function (Request $r, array $params): Response {
        $user = Auth::requireUser($r, 'owner');
        return Http::json(Stats::get($user['businessId']));
    }),
];
