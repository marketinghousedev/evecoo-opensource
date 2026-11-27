<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

/** Port of main:lib/stats.ts. Hour and weekday buckets are Europe/Berlin local time. */
final class Stats
{
    /** @return array{customers:int,returning:int,returningPercent:int,visitsByHour:list<int>,visitsByWeekday:list<int>} */
    public static function get(string $businessId): array
    {
        $customers = (int) (Db::one('SELECT COUNT(*) AS n FROM customers WHERE business_id = ?', [$businessId])['n'] ?? 0);
        $returning = (int) (Db::one(
            "SELECT COUNT(*) AS n FROM (
                SELECT e.customer_id FROM stamp_events e JOIN customers c ON c.id = e.customer_id
                WHERE c.business_id = ? AND e.business_id = ? AND e.kind = 'stamp'
                GROUP BY e.customer_id HAVING COUNT(*) >= 2) t",
            [$businessId, $businessId],
        )['n'] ?? 0);

        $byHour = array_fill(0, 24, 0);
        $byWeekday = array_fill(0, 7, 0);
        $tz = new \DateTimeZone('Europe/Berlin');
        $rows = Db::all("SELECT created_at FROM stamp_events WHERE business_id = ? AND kind = 'stamp'", [$businessId]);
        foreach ($rows as $r) {
            $ms = Time::isoToMs((string) $r['created_at']);
            if ($ms === null) continue;
            $d = (new \DateTimeImmutable('@' . intdiv($ms, 1000)))->setTimezone($tz);
            $byHour[(int) $d->format('G')]++;
            $byWeekday[(int) $d->format('N') - 1]++;
        }

        return [
            'customers' => $customers,
            'returning' => $returning,
            'returningPercent' => $customers > 0 ? (int) floor($returning / $customers * 100 + 0.5) : 0,
            'visitsByHour' => $byHour,
            'visitsByWeekday' => $byWeekday,
        ];
    }
}
