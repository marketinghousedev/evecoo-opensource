<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

/** messageKey is a catalog key (never user-visible text); App renders it in the request locale. */
final class ApiError extends \Exception
{
    /**
     * @param array<string,string|int|float> $vars
     * @param array<string,string> $headers extra response headers (e.g. Retry-After)
     */
    public function __construct(
        public int $status,
        public string $errorCode,
        public string $messageKey,
        public array $vars = [],
        public array $headers = [],
    ) {
        parent::__construct($messageKey);
    }
}
