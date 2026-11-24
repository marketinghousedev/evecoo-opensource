import { anyPassword, login } from '@/lib/accounts';
import { json, readJson, route } from '@/lib/http';
import { str } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const b = await readJson(req);
  const input = { email: str(b, 'email', { min: 1, max: 254 }), password: anyPassword(b) };
  return json(login(input));
});
