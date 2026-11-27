<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

final class Ids
{
    /** 16 random bytes, base64url (22 chars). Customer ids are capabilities. */
    public static function new(): string
    {
        return self::b64url(random_bytes(16));
    }

    /** Session token: 32 random bytes, base64url (43 chars). Only its sha256 is stored. */
    public static function token(): string
    {
        return self::b64url(random_bytes(32));
    }

    private static function b64url(string $bytes): string
    {
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }
}
