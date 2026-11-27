<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

final class Response
{
    /** @param array<string,string> $headers */
    public function __construct(public int $status, public mixed $data, public array $headers = [])
    {
    }
}
