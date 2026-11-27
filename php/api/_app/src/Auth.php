<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

final class Auth
{
    public const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

    /** argon2id when compiled in, else bcrypt(cost 12) over base64(sha256(pw)) to avoid bcrypt's 72-byte truncation. */
    public static function hashPassword(string $pw): string
    {
        if (defined('PASSWORD_ARGON2ID')) return password_hash($pw, PASSWORD_ARGON2ID);
        return self::hashBcrypt($pw);
    }

    /** The bcrypt path of hashPassword (public so tests can exercise it on hosts that do have argon2id). */
    public static function hashBcrypt(string $pw): string
    {
        return password_hash(self::prehash($pw), PASSWORD_BCRYPT, ['cost' => 12]);
    }

    /** Picks the pre-hash path from the stored prefix; malformed hashes are simply false. */
    public static function verifyPassword(string $pw, string $stored): bool
    {
        if (str_starts_with($stored, '$2y$')) return password_verify(self::prehash($pw), $stored);
        if (str_starts_with($stored, '$argon2id$')) return password_verify($pw, $stored);
        return false;
    }

    /** Equal work for unknown emails at login: hash the supplied password once and discard it. */
    public static function burn(string $pw): void
    {
        self::hashPassword($pw);
    }

    /** New session for the user; purges expired sessions first. Returns the raw token (only its sha256 is stored). */
    public static function createSession(string $userId): string
    {
        $token = Ids::token();
        $now = Time::nowMs();
        Db::run('DELETE FROM sessions WHERE expires_at <= ?', [Time::toIso($now)]);
        Db::run(
            'INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
            [hash('sha256', $token), $userId, Time::toIso($now), Time::toIso($now + self::SESSION_MS)],
        );
        return $token;
    }

    /** @return array{id:string,email:string,role:string,businessId:string,businessName:string}|null */
    public static function getUser(Request $r): ?array
    {
        $header = $r->header('authorization');
        if ($header === null) return null;
        if (preg_match('/^Bearer\s+(\S+)$/Di', trim($header), $m) !== 1) return null;
        $row = Db::one(
            'SELECT u.id AS id, u.email AS email, u.role AS role, u.business_id AS businessId, b.name AS businessName
             FROM sessions s JOIN users u ON u.id = s.user_id JOIN businesses b ON b.id = u.business_id
             WHERE s.token_hash = ? AND s.expires_at > ?',
            [hash('sha256', $m[1]), Time::nowIso()],
        );
        if ($row === null) return null;
        return [
            'id' => (string) $row['id'],
            'email' => (string) $row['email'],
            'role' => (string) $row['role'],
            'businessId' => (string) $row['businessId'],
            'businessName' => (string) $row['businessName'],
        ];
    }

    /** 401 without a valid session; 403 when $role is 'owner' and the user is staff. */
    public static function requireUser(Request $r, ?string $role = null): array
    {
        $user = self::getUser($r);
        if ($user === null) throw new ApiError(401, 'unauthorized', 'errors.unauthorized');
        if ($role === 'owner' && $user['role'] !== 'owner') throw new ApiError(403, 'forbidden', 'errors.forbidden');
        return $user;
    }

    private static function prehash(string $pw): string
    {
        return base64_encode(hash('sha256', $pw, true));
    }
}
