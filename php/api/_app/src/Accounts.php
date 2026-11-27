<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

/** Port of main:lib/accounts.ts. Inputs arrive validated by routes/auth.php. */
final class Accounts
{
    /**
     * New business + owner in one transaction. Duplicate email => 409 (pre-check and unique violation).
     * @param array{email:string,password:string,businessName:string} $i
     * @return array{token:string,businessId:string}
     */
    public static function signup(array $i, string $locale): array
    {
        $email = self::normEmail((string) $i['email']);
        if (self::emailExists($email)) self::taken();
        $hash = Auth::hashPassword((string) $i['password']);
        $businessId = Ids::new();
        $userId = Ids::new();
        $now = Time::nowIso();
        try {
            Db::tx(static function () use ($businessId, $userId, $email, $hash, $now, $locale, $i): void {
                Db::run(
                    'INSERT INTO businesses (id, name, locale, card_name, card_reward, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [
                        $businessId, (string) $i['businessName'], $locale,
                        I18n::t($locale, 'defaults.cardName'), I18n::t($locale, 'defaults.reward'), $now,
                    ],
                );
                Db::run(
                    'INSERT INTO users (id, business_id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [$userId, $businessId, $email, $hash, 'owner', $now],
                );
            });
        } catch (\PDOException $e) {
            if (Db::isUniqueViolation($e)) self::taken();
            throw $e;
        }
        return ['token' => Auth::createSession($userId), 'businessId' => $businessId];
    }

    /**
     * Unknown email and wrong password give the same 401 after equal hashing work.
     * Failed attempts count against 'login_email' (checked before verification, cleared on success).
     * @param array{email:string,password:string} $i
     * @return array{token:string,role:string}
     */
    public static function login(array $i): array
    {
        $email = self::normEmail((string) $i['email']);
        $password = (string) $i['password'];
        RateLimit::check('login_email', $email);
        $row = Db::one('SELECT id, password_hash, role FROM users WHERE email = ?', [$email]);
        if ($row === null) {
            Auth::burn($password);
            $ok = false;
        } else {
            $ok = Auth::verifyPassword($password, (string) $row['password_hash']);
        }
        if (!$ok || $row === null) {
            RateLimit::hit('login_email', $email);
            throw new ApiError(401, 'invalid_credentials', 'errors.invalidCredentials');
        }
        RateLimit::clear('login_email', $email);
        return ['token' => Auth::createSession((string) $row['id']), 'role' => (string) $row['role']];
    }

    /**
     * @param array{id:string,email:string,role:string,businessId:string,businessName:string} $owner
     * @param array{email:string,password:string} $i
     * @return array{id:string}
     */
    public static function createStaff(array $owner, array $i): array
    {
        // Defense in depth: the route already enforces requireUser($r, 'owner').
        if (($owner['role'] ?? null) !== 'owner') throw new ApiError(403, 'forbidden', 'errors.forbidden');
        $email = self::normEmail((string) $i['email']);
        if (self::emailExists($email)) self::taken();
        $hash = Auth::hashPassword((string) $i['password']);
        $id = Ids::new();
        try {
            Db::run(
                'INSERT INTO users (id, business_id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                [$id, (string) $owner['businessId'], $email, $hash, 'staff', Time::nowIso()],
            );
        } catch (\PDOException $e) {
            if (Db::isUniqueViolation($e)) self::taken();
            throw $e;
        }
        return ['id' => $id];
    }

    /** @return list<array{id:string,email:string}> */
    public static function listStaff(string $businessId): array
    {
        $rows = Db::all(
            "SELECT id, email FROM users WHERE business_id = ? AND role = 'staff' ORDER BY created_at, id",
            [$businessId],
        );
        return array_map(static fn (array $r): array => ['id' => (string) $r['id'], 'email' => (string) $r['email']], $rows);
    }

    private static function normEmail(string $email): string
    {
        return mb_strtolower(Validate::trim($email), 'UTF-8');
    }

    private static function emailExists(string $email): bool
    {
        return Db::one('SELECT 1 AS x FROM users WHERE email = ?', [$email]) !== null;
    }

    private static function taken(): never
    {
        throw new ApiError(409, 'email_taken', 'errors.emailTaken');
    }
}
