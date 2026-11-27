<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

/** Port of main:lib/card.ts. */
final class Card
{
    public static function getPublic(string $businessId): array
    {
        $r = Db::one(
            'SELECT id, name, card_name, card_reward, stamps_required, card_color FROM businesses WHERE id = ?',
            [$businessId],
        );
        if ($r === null) throw new ApiError(404, 'not_found', 'errors.notFound');
        return [
            'businessId' => (string) $r['id'],
            'businessName' => (string) $r['name'],
            'name' => (string) $r['card_name'],
            'reward' => (string) $r['card_reward'],
            'stampsRequired' => (int) $r['stamps_required'],
            'color' => (string) $r['card_color'],
        ];
    }

    public static function get(string $businessId): array
    {
        $p = self::getPublic($businessId);
        return ['name' => $p['name'], 'reward' => $p['reward'], 'stampsRequired' => $p['stampsRequired'], 'color' => $p['color']];
    }

    public static function update(string $businessId, array $card): array
    {
        // Existence is checked first: MySQL reports 0 affected rows for an UPDATE that changes nothing.
        self::getPublic($businessId);
        Db::run(
            'UPDATE businesses SET card_name = ?, card_reward = ?, stamps_required = ?, card_color = ? WHERE id = ?',
            [$card['name'], $card['reward'], $card['stampsRequired'], $card['color'], $businessId],
        );
        return self::get($businessId);
    }
}
