<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

return [
    App::route('GET', '/api/card', function (Request $r, array $params): Response {
        $u = Auth::requireUser($r);
        return Http::json(Card::get($u['businessId']));
    }),
    App::route('PUT', '/api/card', function (Request $r, array $params): Response {
        $u = Auth::requireUser($r, 'owner');
        $b = Http::readJson($r);
        $card = [
            'name' => Validate::str($b, 'name', 1, 60),
            'reward' => Validate::str($b, 'reward', 1, 100),
            'stampsRequired' => Validate::int($b, 'stampsRequired', 2, 20),
            'color' => Validate::hexColor($b, 'color'),
        ];
        return Http::json(Card::update($u['businessId'], $card));
    }),
    App::route('GET', '/api/public/card/{businessId}', fn (Request $r, array $params): Response
        => Http::json(Card::getPublic((string) $params['businessId']))),
    App::route('POST', '/api/customers', function (Request $r, array $params): Response {
        RateLimit::hit('customer_ip', $r->ip);
        $b = Http::readJson($r);
        $businessId = Validate::str($b, 'businessId', 1, 200);
        $name = Validate::str($b, 'name', 1, 80);
        $birthday = Validate::isoDate($b, 'birthday');
        RateLimit::hit('customer_business', $businessId);
        return Http::json(Loyalty::createCustomer(['businessId' => $businessId, 'name' => $name, 'birthday' => $birthday]), 201);
    }),
    App::route('POST', '/api/stamps', function (Request $r, array $params): Response {
        $u = Auth::requireUser($r);
        $b = Http::readJson($r);
        return Http::json(Loyalty::addStamp($u['businessId'], Validate::str($b, 'customerId', 1, 200)));
    }),
    App::route('POST', '/api/redeem', function (Request $r, array $params): Response {
        $u = Auth::requireUser($r);
        $b = Http::readJson($r);
        return Http::json(Loyalty::redeem($u['businessId'], Validate::str($b, 'customerId', 1, 200)));
    }),
    App::route('GET', '/api/pass/{customerId}/apple', fn (Request $r, array $params): Response
        => Http::json(Pass::build((string) $params['customerId'], 'apple'))),
    App::route('GET', '/api/pass/{customerId}/google', fn (Request $r, array $params): Response
        => Http::json(Pass::build((string) $params['customerId'], 'google'))),
];
