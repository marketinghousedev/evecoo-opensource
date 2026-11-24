import { newPassword, signup } from '@/lib/accounts';
import { json, readJson, route } from '@/lib/http';
import { localeFromRequest } from '@/lib/i18n';
import { email, str } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const b = await readJson(req);
  const input = {
    email: email(b, 'email'),
    password: newPassword(b),
    businessName: str(b, 'businessName', { min: 1, max: 100 }),
  };
  return json(signup(input, localeFromRequest(req)), 201);
});
