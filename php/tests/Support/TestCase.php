<?php
declare(strict_types=1);

namespace Evecoo\Tests\Support;

use Evecoo\App;
use Evecoo\Auth;
use Evecoo\Config;
use Evecoo\Db;
use Evecoo\I18n;
use Evecoo\Ids;
use Evecoo\Request;
use Evecoo\Response;
use Evecoo\Time;

/**
 * Base class for API tests. Each test class gets a fresh SQLite file (default), or, when EVECOO_TEST_DSN
 * (+ EVECOO_TEST_USER / EVECOO_TEST_PASS) is set, the same suite runs on MySQL/MariaDB with every table
 * truncated before each test. Rate limiting is disabled unless a test calls setLimits().
 */
abstract class TestCase extends \PHPUnit\Framework\TestCase
{
    private const TABLES = [
        'message_recipients', 'automation_log', 'messages', 'stamp_events', 'sessions', 'customers', 'users',
        'businesses', 'rate_limits',
    ];

    private static ?string $configFile = null;
    private static ?string $dbFile = null;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();
        $dsn = getenv('EVECOO_TEST_DSN');
        if (!is_string($dsn) || $dsn === '') {
            self::$dbFile = tempnam(sys_get_temp_dir(), 'evecoo-test-') . '.sqlite';
            $dsn = 'sqlite:' . self::$dbFile;
        }
        self::$configFile = tempnam(sys_get_temp_dir(), 'evecoo-config-') . '.php';
        self::writeConfig([
            'db' => [
                'dsn' => $dsn,
                'user' => getenv('EVECOO_TEST_USER') ?: null,
                'pass' => getenv('EVECOO_TEST_PASS') ?: null,
            ],
            'ip_header' => null,
            'rate_limit' => ['enabled' => false],
        ]);
        Db::reset();
        I18n::reset();
        App::setRoutes(null);
    }

    public static function tearDownAfterClass(): void
    {
        Db::reset();
        Config::reset();
        foreach ([self::$configFile, self::$dbFile] as $f) {
            if ($f !== null && is_file($f)) @unlink($f);
        }
        if (self::$dbFile !== null) {
            @unlink(substr(self::$dbFile, 0, -7)); // tempnam() placeholder
        }
        if (self::$configFile !== null) @unlink(substr(self::$configFile, 0, -4));
        putenv('EVECOO_CONFIG');
        self::$configFile = null;
        self::$dbFile = null;
        parent::tearDownAfterClass();
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->setConfig('ip_header', null);
        $this->setLimits(['enabled' => false]);
        if (Db::driver() === 'mysql') {
            Db::run('SET FOREIGN_KEY_CHECKS = 0');
            foreach (self::TABLES as $t) Db::run("TRUNCATE TABLE $t");
            Db::run('SET FOREIGN_KEY_CHECKS = 1');
        } else {
            foreach (self::TABLES as $t) Db::run("DELETE FROM $t");
        }
    }

    /**
     * Replaces the rate_limit config. Keys are limit names => [limit, windowSeconds] or 'enabled' => bool.
     * Passing any limit enables rate limiting unless 'enabled' => false is given too.
     */
    protected function setLimits(array $limits): void
    {
        $cfg = require self::$configFile;
        $cfg['rate_limit'] = array_merge(['enabled' => true], $limits);
        self::writeConfig($cfg);
    }

    /** Sets one top-level config key (e.g. 'ip_header') for the rest of the test class. */
    protected function setConfig(string $key, mixed $value): void
    {
        $cfg = require self::$configFile;
        $cfg[$key] = $value;
        self::writeConfig($cfg);
    }

    /** In-process request through App::handle(). $body null = no body. */
    protected function req(string $method, string $path, ?array $body = null, ?string $token = null, array $headers = []): Response
    {
        $raw = $body === null ? '' : (string) json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $this->rawReq($method, $path, $raw, $token, $headers);
    }

    /** Like req() with a raw body string (invalid JSON, oversized bodies, ...). */
    protected function rawReq(string $method, string $path, string $raw, ?string $token = null, array $headers = []): Response
    {
        $h = array_change_key_case($headers);
        if ($raw !== '') $h += ['content-type' => 'application/json'];
        if ($token !== null) $h['authorization'] = 'Bearer ' . $token;
        $ip = $h['x-test-ip'] ?? '127.0.0.1';
        unset($h['x-test-ip']);
        return App::handle(new Request($method, $path, $h, $raw, $ip, strlen($raw)));
    }

    /**
     * Port of main:tests/helpers.ts seedBusiness().
     * @return array{businessId:string, owner:array{id:string,email:string,role:string,businessId:string,businessName:string}, token:string}
     */
    protected function seedBusiness(array $over = []): array
    {
        $businessId = Ids::new();
        $userId = Ids::new();
        $name = $over['name'] ?? 'Testcafé';
        $email = 'owner-' . strtolower($userId) . '-' . bin2hex(random_bytes(3)) . '@example.com';
        $locale = $over['locale'] ?? 'en';
        Db::run(
            'INSERT INTO businesses (id, name, locale, card_name, card_reward, stamps_required, card_color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $businessId, $name, $locale, I18n::t($locale, 'defaults.cardName'), I18n::t($locale, 'defaults.reward'),
                $over['stampsRequired'] ?? 10, $over['color'] ?? '#1F6F5B', Time::nowIso(),
            ],
        );
        Db::run(
            'INSERT INTO users (id, business_id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [$userId, $businessId, $email, self::passwordHash(), 'owner', Time::nowIso()],
        );
        $owner = ['id' => $userId, 'email' => $email, 'role' => 'owner', 'businessId' => $businessId, 'businessName' => $name];
        return ['businessId' => $businessId, 'owner' => $owner, 'token' => Auth::createSession($userId)];
    }

    /**
     * A staff user of $businessId with password 'password123'.
     * @return array{user:array{id:string,email:string,role:string,businessId:string,businessName:string}, token:string}
     */
    protected function seedStaff(string $businessId, ?string $email = null): array
    {
        $id = Ids::new();
        $email ??= 'staff-' . strtolower($id) . '-' . bin2hex(random_bytes(3)) . '@example.com';
        Db::run(
            'INSERT INTO users (id, business_id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [$id, $businessId, $email, self::passwordHash(), 'staff', Time::nowIso()],
        );
        $b = Db::one('SELECT name FROM businesses WHERE id = ?', [$businessId]);
        $user = ['id' => $id, 'email' => $email, 'role' => 'staff', 'businessId' => $businessId, 'businessName' => (string) ($b['name'] ?? '')];
        return ['user' => $user, 'token' => Auth::createSession($id)];
    }

    /** Port of seedCustomer(); $over: name, birthday, stamps. Returns the customer id. */
    protected function seedCustomer(string $businessId, array $over = []): string
    {
        $id = Ids::new();
        Db::run(
            'INSERT INTO customers (id, business_id, name, birthday, stamps, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [$id, $businessId, $over['name'] ?? 'Erika Muster', $over['birthday'] ?? null, $over['stamps'] ?? 0, $over['createdAt'] ?? Time::nowIso()],
        );
        return $id;
    }

    /** Port of seedStamp(): one 'stamp' event at $iso (does not touch customers.stamps). */
    protected function seedStamp(string $businessId, string $customerId, string $iso): void
    {
        Db::run(
            "INSERT INTO stamp_events (customer_id, business_id, kind, created_at) VALUES (?, ?, 'stamp', ?)",
            [$customerId, $businessId, $iso],
        );
    }

    /** Decoded JSON body of a response as an array (round-trips through json_encode like the real emitter). */
    protected static function body(Response $r): mixed
    {
        return json_decode((string) json_encode($r->data, App::JSON_FLAGS), true);
    }

    private static function writeConfig(array $cfg): void
    {
        file_put_contents(self::$configFile, '<?php return ' . var_export($cfg, true) . ";\n", LOCK_EX);
        if (function_exists('opcache_invalidate')) @opcache_invalidate(self::$configFile, true);
        putenv('EVECOO_CONFIG=' . self::$configFile);
        Config::reset();
    }

    /** Hashing is slow by design; seed users share one hash of 'password123'. */
    private static function passwordHash(): string
    {
        static $hash = null;
        return $hash ??= Auth::hashPassword('password123');
    }
}
