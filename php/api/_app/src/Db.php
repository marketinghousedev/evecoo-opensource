<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

/**
 * PDO wrapper. All SQL outside this class is written once and must run on MySQL/MariaDB and SQLite;
 * the dialect differences live only in insertIgnore(), forUpdate(), upsertHit(), tx() and isUniqueViolation().
 */
final class Db
{
    public const SCHEMA_VERSION = 1;

    private static ?\PDO $pdo = null;
    private static ?string $driver = null;
    private static int $txDepth = 0;

    public static function pdo(): \PDO
    {
        if (self::$pdo !== null) return self::$pdo;
        $dsn = (string) Config::get('db.dsn', '');
        $driver = self::driverOf($dsn);
        $pdo = new \PDO($dsn, self::strOrNull(Config::get('db.user')), self::strOrNull(Config::get('db.pass')), [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_EMULATE_PREPARES => false,
            \PDO::ATTR_STRINGIFY_FETCHES => false,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
        ]);
        if ($driver === 'mysql') {
            $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci, time_zone = '+00:00', sql_mode = 'STRICT_ALL_TABLES'");
        } else {
            $pdo->exec('PRAGMA foreign_keys = ON');
            $pdo->exec('PRAGMA busy_timeout = 5000');
        }
        self::$pdo = $pdo;
        self::$driver = $driver;
        self::$txDepth = 0;
        self::migrate();
        return $pdo;
    }

    /** 'mysql' or 'sqlite', from the DSN prefix. */
    public static function driver(): string
    {
        if (self::$driver === null) self::pdo();
        return (string) self::$driver;
    }

    /**
     * MySQL: runs schema/mysql.sql when var/schema-1.ok is absent (or was written for another DSN), then writes it;
     * if var/ is not writable it simply runs every request (idempotent).
     * SQLite (dev/tests): runs schema/sqlite.sql when the schema is not present in that file (no marker, so a
     * deleted or new dev database is always initialised).
     */
    public static function migrate(): void
    {
        $pdo = self::pdo();
        if (self::$driver === 'sqlite') {
            $have = $pdo->query("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'rate_limits'")->fetchColumn();
            if ((int) $have === 0) self::applySchema();
            return;
        }
        $marker = dirname(__DIR__) . '/var/schema-' . self::SCHEMA_VERSION . '.ok';
        $stamp = hash('sha256', (string) Config::get('db.dsn', ''));
        if (is_file($marker) && @file_get_contents($marker) === $stamp) return;
        self::applySchema();
        $dir = dirname($marker);
        if (!is_dir($dir)) @mkdir($dir, 0755, true);
        @file_put_contents($marker, $stamp, LOCK_EX);
    }

    /** Executes the dialect's schema file unconditionally (all statements are CREATE ... IF NOT EXISTS). */
    public static function applySchema(): void
    {
        $pdo = self::pdo();
        $sql = file_get_contents(dirname(__DIR__) . '/schema/' . self::$driver . '.sql');
        if ($sql === false) throw new \RuntimeException('schema file missing');
        foreach (explode(";\n", str_replace("\r\n", "\n", $sql)) as $stmt) {
            $lines = array_filter(explode("\n", $stmt), static fn (string $l): bool => !str_starts_with(ltrim($l), '--'));
            $stmt = trim(implode("\n", $lines));
            if ($stmt !== '') $pdo->exec($stmt);
        }
    }

    /** Closes the connection (tests, config switch). */
    public static function reset(): void
    {
        self::$pdo = null;
        self::$driver = null;
        self::$txDepth = 0;
    }

    public static function run(string $sql, array $params = []): \PDOStatement
    {
        $st = self::pdo()->prepare($sql);
        if (array_is_list($params)) {
            foreach ($params as $i => $v) $st->bindValue($i + 1, $v, self::type($v));
        } else {
            foreach ($params as $k => $v) $st->bindValue(':' . ltrim((string) $k, ':'), $v, self::type($v));
        }
        $st->execute();
        return $st;
    }

    public static function one(string $sql, array $params = []): ?array
    {
        $row = self::run($sql, $params)->fetch();
        return $row === false ? null : $row;
    }

    public static function all(string $sql, array $params = []): array
    {
        return self::run($sql, $params)->fetchAll();
    }

    /**
     * Runs $fn in a transaction and returns its result. SQLite: BEGIN IMMEDIATE (takes the write lock up front).
     * MySQL: retried up to 3 times on SQLSTATE 40001 (deadlock / serialization failure). Nested calls join the
     * outer transaction.
     */
    public static function tx(callable $fn): mixed
    {
        $pdo = self::pdo();
        if (self::$txDepth > 0) return $fn();
        $attempts = self::$driver === 'mysql' ? 3 : 1;
        for ($attempt = 1; ; $attempt++) {
            if (self::$driver === 'sqlite') {
                $pdo->exec('BEGIN IMMEDIATE');
            } else {
                $pdo->beginTransaction();
            }
            self::$txDepth = 1;
            try {
                $result = $fn();
                self::$txDepth = 0;
                if (self::$driver === 'sqlite') {
                    $pdo->exec('COMMIT');
                } else {
                    $pdo->commit();
                }
                return $result;
            } catch (\Throwable $e) {
                self::$txDepth = 0;
                try {
                    if (self::$driver === 'sqlite') {
                        $pdo->exec('ROLLBACK');
                    } elseif ($pdo->inTransaction()) {
                        $pdo->rollBack();
                    }
                } catch (\Throwable) {
                    // connection already rolled back
                }
                $retry = $e instanceof \PDOException && self::sqlState($e) === '40001' && $attempt < $attempts;
                if (!$retry) throw $e;
            }
        }
    }

    /**
     * INSERT that silently does nothing when a PRIMARY/UNIQUE key already exists. Returns affected rows (0 or 1).
     * Table and column names must be plain identifiers (they are constants in calling code).
     */
    public static function insertIgnore(string $table, array $row): int
    {
        if ($row === []) throw new \InvalidArgumentException('empty row');
        $cols = array_keys($row);
        foreach ([$table, ...$cols] as $ident) {
            if (!is_string($ident) || preg_match('/^[a-z_][a-z0-9_]*$/D', $ident) !== 1) {
                throw new \InvalidArgumentException('bad identifier');
            }
        }
        $place = implode(', ', array_fill(0, count($cols), '?'));
        $list = implode(', ', $cols);
        $sql = self::driver() === 'mysql'
            // Not INSERT IGNORE: that would also swallow strict-mode errors. A no-op update reports 0 rows.
            ? "INSERT INTO $table ($list) VALUES ($place) ON DUPLICATE KEY UPDATE {$cols[0]} = {$cols[0]}"
            : "INSERT OR IGNORE INTO $table ($list) VALUES ($place)";
        return self::run($sql, array_values($row))->rowCount();
    }

    /** Row lock suffix for SELECT inside tx(): ' FOR UPDATE' on MySQL, '' on SQLite (BEGIN IMMEDIATE already locks). */
    public static function forUpdate(): string
    {
        return self::driver() === 'mysql' ? ' FOR UPDATE' : '';
    }

    /**
     * Rate-limit counter: one atomic upsert (hits+1 in the same window, else reset to 1 with the new window),
     * then reads the resulting hits.
     */
    public static function upsertHit(string $bucket, int $windowStart): int
    {
        if (self::driver() === 'mysql') {
            self::run(
                'INSERT INTO rate_limits (bucket, window_start, hits) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE '
                . 'hits = IF(window_start = VALUES(window_start), hits + 1, 1), window_start = VALUES(window_start)',
                [$bucket, $windowStart],
            );
        } else {
            self::run(
                'INSERT INTO rate_limits (bucket, window_start, hits) VALUES (?, ?, 1) ON CONFLICT(bucket) DO UPDATE SET '
                . 'hits = CASE WHEN rate_limits.window_start = excluded.window_start THEN rate_limits.hits + 1 ELSE 1 END, '
                . 'window_start = excluded.window_start',
                [$bucket, $windowStart],
            );
        }
        $row = self::one('SELECT hits, window_start FROM rate_limits WHERE bucket = ?', [$bucket]);
        return $row === null ? 1 : (int) $row['hits'];
    }

    /** True only for duplicate PRIMARY/UNIQUE key errors (SQLSTATE 23000 class, narrowed per driver). */
    public static function isUniqueViolation(\Throwable $e): bool
    {
        if (!$e instanceof \PDOException || self::sqlState($e) !== '23000') return false;
        $driverCode = (int) ($e->errorInfo[1] ?? 0);
        if ($driverCode === 1062 || $driverCode === 1586) return true; // MySQL/MariaDB duplicate entry
        return (bool) preg_match('/UNIQUE constraint failed|PRIMARY KEY constraint failed/i', $e->getMessage());
    }

    private static function sqlState(\PDOException $e): string
    {
        $s = $e->errorInfo[0] ?? null;
        return is_string($s) ? $s : (string) $e->getCode();
    }

    private static function driverOf(string $dsn): string
    {
        if (str_starts_with($dsn, 'mysql:')) return 'mysql';
        if (str_starts_with($dsn, 'sqlite:')) return 'sqlite';
        throw new \RuntimeException('unsupported database driver');
    }

    private static function strOrNull(mixed $v): ?string
    {
        return is_string($v) ? $v : null;
    }

    private static function type(mixed $v): int
    {
        return match (true) {
            is_int($v) => \PDO::PARAM_INT,
            is_bool($v) => \PDO::PARAM_BOOL,
            $v === null => \PDO::PARAM_NULL,
            default => \PDO::PARAM_STR,
        };
    }
}
