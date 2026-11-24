import { createStaff, listStaff, newPassword } from '@/lib/accounts';
import { requireUser } from '@/lib/auth';
import { json, readJson, route } from '@/lib/http';
import { email } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const u = requireUser(req, 'owner');
  const b = await readJson(req);
  const input = { email: email(b, 'email'), password: newPassword(b) };
  return json(createStaff(u, input), 201);
});

export const GET = route((req) => {
  const u = requireUser(req, 'owner');
  return json(listStaff(u.businessId));
});
