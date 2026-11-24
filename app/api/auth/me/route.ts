import { requireUser } from '@/lib/auth';
import { json, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route((req) => {
  const u = requireUser(req);
  return json({ email: u.email, role: u.role, businessId: u.businessId, businessName: u.businessName });
});
