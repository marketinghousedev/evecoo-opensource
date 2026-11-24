import { ApiError } from './http';
import { getCustomerView } from './loyalty';
import type { PassJson } from './types';

// Wallet pass generation is mocked: plain JSON, kept behind this interface.
export function buildPass(customerId: string, platform: 'apple' | 'google'): PassJson {
  const v = getCustomerView(customerId);
  if (!v) throw new ApiError(404, 'not_found', 'errors.notFound');
  return {
    platform,
    serialNumber: v.customerId,
    stamps: v.stamps,
    stampsRequired: v.stampsRequired,
    reward: v.reward,
    businessName: v.businessName,
    customerName: v.name,
    cardName: v.cardName,
    color: v.color,
    redeemable: v.redeemable,
    barcode: { format: 'QR', message: v.customerId },
  };
}
