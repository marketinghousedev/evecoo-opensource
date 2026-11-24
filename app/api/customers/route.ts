import { json, readJson, route } from '@/lib/http';
import { isoDate, str } from '@/lib/validate';
import { createCustomer } from '@/lib/loyalty';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const body = await readJson(req);
  const businessId = str(body, 'businessId', { min: 1, max: 200 });
  const name = str(body, 'name', { min: 1, max: 80 });
  const birthday = isoDate(body, 'birthday');
  return json(createCustomer({ businessId, name, birthday }), 201);
});
