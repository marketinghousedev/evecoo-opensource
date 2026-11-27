<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

/** Port of main:lib/messages.ts. */
final class Messages
{
    /** Inserts one message plus a recipient row per customer. Caller owns the transaction. */
    public static function deliver(string $businessId, string $kind, string $title, string $body, array $customerIds, string $createdAt): string
    {
        $id = Ids::new();
        Db::run(
            'INSERT INTO messages (id, business_id, title, body, kind, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [$id, $businessId, $title, $body, $kind, $createdAt],
        );
        foreach ($customerIds as $cid) {
            Db::insertIgnore('message_recipients', ['message_id' => $id, 'customer_id' => (string) $cid]);
        }
        return $id;
    }

    /** @return array{recipients:int} */
    public static function sendBroadcast(string $businessId, array $i): array
    {
        return Db::tx(static function () use ($businessId, $i): array {
            $rows = Db::all('SELECT id FROM customers WHERE business_id = ?', [$businessId]);
            $ids = array_map(static fn (array $r): string => (string) $r['id'], $rows);
            self::deliver($businessId, 'broadcast', (string) $i['title'], (string) $i['body'], $ids, Time::nowIso());
            return ['recipients' => count($ids)];
        });
    }

    public static function listForBusiness(string $businessId): array
    {
        $rows = Db::all(
            'SELECT m.id AS id, m.title AS title, m.body AS body, m.kind AS kind, m.created_at AS createdAt,
                (SELECT COUNT(*) FROM message_recipients r WHERE r.message_id = m.id) AS recipients
             FROM messages m WHERE m.business_id = ? ORDER BY m.created_at DESC, m.seq DESC',
            [$businessId],
        );
        return array_map(static fn (array $r): array => [
            'id' => (string) $r['id'],
            'title' => (string) $r['title'],
            'body' => (string) $r['body'],
            'kind' => (string) $r['kind'],
            'recipients' => (int) $r['recipients'],
            'createdAt' => (string) $r['createdAt'],
        ], $rows);
    }

    public static function listForCustomer(string $customerId): array
    {
        if (Db::one('SELECT id FROM customers WHERE id = ?', [$customerId]) === null) {
            throw new ApiError(404, 'not_found', 'errors.notFound');
        }
        $rows = Db::all(
            'SELECT m.id AS id, m.title AS title, m.body AS body, m.kind AS kind, m.created_at AS createdAt
             FROM message_recipients r JOIN messages m ON m.id = r.message_id
             WHERE r.customer_id = ? ORDER BY m.created_at DESC, m.seq DESC',
            [$customerId],
        );
        return array_map(static fn (array $r): array => [
            'id' => (string) $r['id'],
            'title' => (string) $r['title'],
            'body' => (string) $r['body'],
            'kind' => (string) $r['kind'],
            'createdAt' => (string) $r['createdAt'],
        ], $rows);
    }
}
