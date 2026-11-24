import { json, readJson, route } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { str } from '@/lib/validate';
import { redeem } from '@/lib/loyalty';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const user = requireUser(req);
  const body = await readJson(req);
  const customerId = str(body, 'customerId', { min: 1, max: 200 });
  return json(redeem(user.businessId, customerId));
});
