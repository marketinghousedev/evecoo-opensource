<?php
declare(strict_types=1);

namespace Evecoo;

defined('EVECOO') || exit;

/** Port of main:lib/pass.ts. Wallet pass generation is mocked: plain JSON. */
final class Pass
{
    public static function build(string $customerId, string $platform): array
    {
        $v = Loyalty::customerView($customerId);
        if ($v === null) throw new ApiError(404, 'not_found', 'errors.notFound');
        return [
            'platform' => $platform,
            'serialNumber' => $v['customerId'],
            'stamps' => $v['stamps'],
            'stampsRequired' => $v['stampsRequired'],
            'reward' => $v['reward'],
            'businessName' => $v['businessName'],
            'customerName' => $v['name'],
            'cardName' => $v['cardName'],
            'color' => $v['color'],
            'redeemable' => $v['redeemable'],
            'barcode' => ['format' => 'QR', 'message' => $v['customerId']],
        ];
    }
}
