import { requireUser } from '@/lib/auth';
import { json, route } from '@/lib/http';
import { getStats } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  const user = requireUser(req, 'owner');
  return json(getStats(user.businessId));
});
