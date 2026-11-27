<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

/** Port of main:lib/loyalty.ts. addStamp/redeem lock the customer row (php-fpm is multi-process). */
final class Loyalty
{
    public static function createCustomer(array $i): array
    {
        $name = Validate::str(['name' => $i['name'] ?? null], 'name', 1, 80);
        $birthday = Validate::isoDate(['birthday' => $i['birthday'] ?? null], 'birthday');
        $businessId = (string) ($i['businessId'] ?? '');
        if (Db::one('SELECT id FROM businesses WHERE id = ?', [$businessId]) === null) self::notFound();
        $id = Ids::new();
        Db::run(
            'INSERT INTO customers (id, business_id, name, birthday, stamps, created_at) VALUES (?, ?, ?, ?, 0, ?)',
            [$id, $businessId, $name, $birthday, Time::nowIso()],
        );
        return ['customerId' => $id, 'passUrl' => '/card/?id=' . $id];
    }

    public static function addStamp(string $businessId, string $customerId): array
    {
        return Db::tx(static function () use ($businessId, $customerId): array {
            $row = self::loadOwned($businessId, $customerId);
            $cap = $row['req'];
            if ($row['stamps'] >= $cap) return ['stamps' => $cap, 'redeemable' => true];
            $next = $row['stamps'] + 1;
            Db::run('UPDATE customers SET stamps = ? WHERE id = ? AND business_id = ?', [$next, $customerId, $businessId]);
            Db::run(
                "INSERT INTO stamp_events (customer_id, business_id, kind, created_at) VALUES (?, ?, 'stamp', ?)",
                [$customerId, $businessId, Time::nowIso()],
            );
            return ['stamps' => $next, 'redeemable' => $next >= $cap];
        });
    }

    public static function redeem(string $businessId, string $customerId): array
    {
        return Db::tx(static function () use ($businessId, $customerId): array {
            $row = self::loadOwned($businessId, $customerId);
            if (min($row['stamps'], $row['req']) < $row['req']) {
                throw new ApiError(409, 'not_redeemable', 'errors.notRedeemable');
            }
            Db::run('UPDATE customers SET stamps = 0 WHERE id = ? AND business_id = ?', [$customerId, $businessId]);
            Db::run(
                "INSERT INTO stamp_events (customer_id, business_id, kind, created_at) VALUES (?, ?, 'redeem', ?)",
                [$customerId, $businessId, Time::nowIso()],
            );
            return ['stamps' => 0];
        });
    }

    public static function customerView(string $customerId): ?array
    {
        $r = Db::one(
            'SELECT c.id AS id, c.name AS name, c.stamps AS stamps, b.stamps_required AS req, b.card_reward AS reward, '
            . 'b.name AS business_name, b.card_name AS card_name, b.card_color AS color '
            . 'FROM customers c JOIN businesses b ON b.id = c.business_id WHERE c.id = ?',
            [$customerId],
        );
        if ($r === null) return null;
        $req = (int) $r['req'];
        $stamps = min((int) $r['stamps'], $req);
        return [
            'customerId' => (string) $r['id'],
            'name' => (string) $r['name'],
            'stamps' => $stamps,
            'stampsRequired' => $req,
            'redeemable' => $stamps >= $req,
            'reward' => (string) $r['reward'],
            'businessName' => (string) $r['business_name'],
            'cardName' => (string) $r['card_name'],
            'color' => (string) $r['color'],
        ];
    }

    /** @return array{stamps:int,req:int} customer row, locked FOR UPDATE on MySQL; 404 for another tenant's customer. */
    private static function loadOwned(string $businessId, string $customerId): array
    {
        $r = Db::one(
            'SELECT c.stamps AS stamps, b.stamps_required AS req FROM customers c JOIN businesses b ON b.id = c.business_id '
            . 'WHERE c.id = ? AND c.business_id = ?' . Db::forUpdate(),
            [$customerId, $businessId],
        );
        if ($r === null) self::notFound();
        return ['stamps' => (int) $r['stamps'], 'req' => (int) $r['req']];
    }

    private static function notFound(): never
    {
        throw new ApiError(404, 'not_found', 'errors.notFound');
    }
}
