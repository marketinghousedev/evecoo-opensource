<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

/** Port of main:lib/automations.ts. */
final class Automations
{
    private const DAY_MS = 86400000;

    /** MM-DD match on the UTC day; a 02-29 birthday is celebrated on 02-28 in non-leap years. */
    private static function birthdayMatches(string $birthday, string $nowIso): bool
    {
        $md = substr($birthday, 5);
        $today = substr($nowIso, 5, 5);
        if ($md === $today) return true;
        $y = (int) substr($nowIso, 0, 4);
        return $md === '02-29' && Time::daysInMonth($y, 2) === 28 && $today === '02-28';
    }

    /** @return array{sent:int} */
    public static function run(string $businessId, int $nowMs): array
    {
        $nowIso = Time::toIso($nowMs);
        $day = substr($nowIso, 0, 10);

        return Db::tx(static function () use ($businessId, $nowMs, $nowIso, $day): array {
            $biz = Db::one('SELECT name, locale, card_reward FROM businesses WHERE id = ?', [$businessId]);
            if ($biz === null) return ['sent' => 0];
            $locale = (string) $biz['locale'];
            $customers = Db::all('SELECT id, name, birthday FROM customers WHERE business_id = ?', [$businessId]);

            $sent = 0;
            $send = static function (array $c, string $kind) use ($businessId, $biz, $locale, $nowIso, &$sent): void {
                $vars = ['name' => (string) $c['name'], 'reward' => (string) $biz['card_reward'], 'business' => (string) $biz['name']];
                [$title, $body] = match ($kind) {
                    'welcome' => [I18n::t($locale, 'automations.welcome.title', $vars), I18n::t($locale, 'automations.welcome.body', $vars)],
                    'winback' => [I18n::t($locale, 'automations.winback.title', $vars), I18n::t($locale, 'automations.winback.body', $vars)],
                    default => [I18n::t($locale, 'automations.birthday.title', $vars), I18n::t($locale, 'automations.birthday.body', $vars)],
                };
                Messages::deliver($businessId, $kind, $title, $body, [(string) $c['id']], $nowIso);
                $sent++;
            };
            $claim = static fn (array $c, string $kind): bool => Db::insertIgnore(
                'automation_log',
                ['customer_id' => (string) $c['id'], 'kind' => $kind, 'day' => $day],
            ) > 0;

            foreach ($customers as $c) {
                $cid = (string) $c['id'];
                $lastRow = Db::one(
                    "SELECT MAX(created_at) AS last FROM stamp_events WHERE customer_id = ? AND business_id = ? AND kind = 'stamp'",
                    [$cid, $businessId],
                );
                $last = $lastRow['last'] ?? null;
                $last = is_string($last) && $last !== '' ? $last : null;

                if ($last !== null
                    && Db::one("SELECT 1 AS x FROM automation_log WHERE customer_id = ? AND kind = 'welcome'", [$cid]) === null
                    && $claim($c, 'welcome')) {
                    $send($c, 'welcome');
                }

                if ($last !== null) {
                    $lastMs = Time::isoToMs($last);
                    if ($lastMs !== null && $lastMs < $nowMs - 30 * self::DAY_MS) {
                        $prior = Db::one(
                            "SELECT COUNT(*) AS n FROM automation_log WHERE customer_id = ? AND kind = 'winback' AND day > ?",
                            [$cid, substr($last, 0, 10)],
                        );
                        if ((int) ($prior['n'] ?? 0) === 0 && $claim($c, 'winback')) $send($c, 'winback');
                    }
                }

                $bd = $c['birthday'] ?? null;
                if (is_string($bd) && $bd !== '' && self::birthdayMatches($bd, $nowIso) && $claim($c, 'birthday')) {
                    $send($c, 'birthday');
                }
            }
            return ['sent' => $sent];
        });
    }
}
