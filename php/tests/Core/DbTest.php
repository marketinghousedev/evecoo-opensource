<?php
declare(strict_types=1);

namespace Evecoo\Tests\Core;

use Evecoo\Db;
use Evecoo\Ids;
use Evecoo\Tests\Support\TestCase;
use Evecoo\Time;

final class DbTest extends TestCase
{
    public function testMigrateIsIdempotent(): void
    {
        $b = $this->seedBusiness();
        Db::migrate();
        Db::applySchema();
        Db::applySchema();
        Db::migrate();
        self::assertSame($b['businessId'], Db::one('SELECT id FROM businesses WHERE id = ?', [$b['businessId']])['id']);
        foreach (['businesses', 'users', 'sessions', 'customers', 'stamp_events', 'messages', 'message_recipients', 'automation_log', 'rate_limits'] as $t) {
            self::assertIsArray(Db::all("SELECT * FROM $t LIMIT 1"), $t);
        }
    }

    public function testFreshConnectionMigratesAutomatically(): void
    {
        Db::reset();
        self::assertSame(0, (int) Db::one('SELECT COUNT(*) AS n FROM rate_limits')['n']);
        self::assertContains(Db::driver(), ['sqlite', 'mysql']);
    }

    public function testIntegersAreNative(): void
    {
        $b = $this->seedBusiness(['stampsRequired' => 7]);
        $row = Db::one('SELECT stamps_required, name FROM businesses WHERE id = ?', [$b['businessId']]);
        self::assertSame(7, $row['stamps_required']);
        self::assertSame('Testcafé', $row['name']);
    }

    public function testNamedParams(): void
    {
        $b = $this->seedBusiness();
        self::assertSame($b['businessId'], Db::one('SELECT id FROM businesses WHERE id = :id', ['id' => $b['businessId']])['id']);
    }

    public function testIdsAreCaseSensitive(): void
    {
        $b = $this->seedBusiness();
        $flipped = strtolower($b['businessId']) === $b['businessId'] ? strtoupper($b['businessId']) : strtolower($b['businessId']);
        self::assertNull(Db::one('SELECT id FROM businesses WHERE id = ?', [$flipped]));
    }

    public function testEmailUniqueIsCaseInsensitive(): void
    {
        $b = $this->seedBusiness();
        try {
            Db::run(
                'INSERT INTO users (id, business_id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                [Ids::new(), $b['businessId'], strtoupper($b['owner']['email']), 'x', 'staff', Time::nowIso()],
            );
            self::fail('duplicate email accepted');
        } catch (\PDOException $e) {
            self::assertTrue(Db::isUniqueViolation($e));
        }
        self::assertNotNull(Db::one('SELECT id FROM users WHERE email = ?', [strtoupper($b['owner']['email'])]));
    }

    public function testIsUniqueViolationIsNarrow(): void
    {
        self::assertFalse(Db::isUniqueViolation(new \RuntimeException('UNIQUE constraint failed')));
        try {
            Db::run('INSERT INTO customers (id, business_id, name, stamps, created_at) VALUES (?, ?, ?, ?, ?)', [Ids::new(), 'missing', 'x', 0, Time::nowIso()]);
            self::fail('FK violation accepted');
        } catch (\PDOException $e) {
            self::assertFalse(Db::isUniqueViolation($e), 'FK violation is not a unique violation');
        }
    }

    public function testInsertIgnore(): void
    {
        $b = $this->seedBusiness();
        $c = $this->seedCustomer($b['businessId']);
        self::assertSame(1, Db::insertIgnore('automation_log', ['customer_id' => $c, 'kind' => 'welcome', 'day' => '2027-01-01']));
        self::assertSame(0, Db::insertIgnore('automation_log', ['customer_id' => $c, 'kind' => 'welcome', 'day' => '2027-01-01']));
        self::assertSame(1, Db::insertIgnore('automation_log', ['customer_id' => $c, 'kind' => 'welcome', 'day' => '2027-01-02']));
        self::assertSame(2, (int) Db::one('SELECT COUNT(*) AS n FROM automation_log')['n']);
        $this->expectException(\InvalidArgumentException::class);
        Db::insertIgnore('automation_log; DROP TABLE users', ['customer_id' => $c]);
    }

    public function testTxCommitsRollsBackAndNests(): void
    {
        $b = $this->seedBusiness();
        $c = $this->seedCustomer($b['businessId']);
        $out = Db::tx(function () use ($c): int {
            $row = Db::one('SELECT stamps FROM customers WHERE id = ?' . Db::forUpdate(), [$c]);
            Db::run('UPDATE customers SET stamps = ? WHERE id = ?', [$row['stamps'] + 1, $c]);
            return Db::tx(fn (): int => 41) + 1; // nested call joins
        });
        self::assertSame(42, $out);
        self::assertSame(1, Db::one('SELECT stamps FROM customers WHERE id = ?', [$c])['stamps']);

        try {
            Db::tx(function () use ($c): void {
                Db::run('UPDATE customers SET stamps = 99 WHERE id = ?', [$c]);
                throw new \RuntimeException('abort');
            });
        } catch (\RuntimeException) {
        }
        self::assertSame(1, Db::one('SELECT stamps FROM customers WHERE id = ?', [$c])['stamps']);
        // connection still usable for a new transaction afterwards
        self::assertSame('ok', Db::tx(fn (): string => 'ok'));
    }

    public function testForUpdateDialect(): void
    {
        self::assertSame(Db::driver() === 'mysql' ? ' FOR UPDATE' : '', Db::forUpdate());
    }

    public function testUpsertHit(): void
    {
        $bucket = hash('sha256', 'x');
        self::assertSame(1, Db::upsertHit($bucket, 1000));
        self::assertSame(2, Db::upsertHit($bucket, 1000));
        self::assertSame(3, Db::upsertHit($bucket, 1000));
        self::assertSame(1, Db::upsertHit($bucket, 2000));
        self::assertSame(2000, (int) Db::one('SELECT window_start FROM rate_limits WHERE bucket = ?', [$bucket])['window_start']);
    }

    public function testIdsShape(): void
    {
        $ids = [];
        for ($i = 0; $i < 50; $i++) $ids[] = Ids::new();
        foreach ($ids as $id) self::assertMatchesRegularExpression('/^[A-Za-z0-9_-]{22}$/D', $id);
        self::assertCount(50, array_unique($ids));
        self::assertMatchesRegularExpression('/^[A-Za-z0-9_-]{43}$/D', Ids::token());
    }
}
