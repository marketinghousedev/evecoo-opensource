<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

final class Http
{
    /** Upper bound for JSON request bodies; App::run reads at most MAX_BODY_BYTES + 1 bytes. */
    public const MAX_BODY_BYTES = 65536;

    /** Decodes the body as a JSON object. Empty/whitespace => []; oversized, invalid or non-object => 400. */
    public static function readJson(Request $r): array
    {
        $bad = static fn (): ApiError => new ApiError(400, 'validation_error', 'errors.invalidJson');
        $declared = $r->declaredLength;
        $header = $r->header('content-length');
        if ($header !== null && is_numeric(trim($header))) $declared = max($declared, (int) trim($header));
        if ($declared > self::MAX_BODY_BYTES || strlen($r->body) > self::MAX_BODY_BYTES) throw $bad();
        if (Validate::trim($r->body) === '') return [];
        try {
            $v = json_decode($r->body, false, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw $bad();
        }
        if (!$v instanceof \stdClass) throw $bad();
        return (array) $v;
    }

    public static function json(mixed $data, int $status = 200): Response
    {
        return new Response($status, $data);
    }
}
