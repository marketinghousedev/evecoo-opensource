import { requireUser } from '@/lib/auth';
import { getCard, updateCard } from '@/lib/card';
import { json, readJson, route } from '@/lib/http';
import { hexColor, int, str } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export const GET = route((req) => {
  const u = requireUser(req);
  return json(getCard(u.businessId));
});

export const PUT = route(async (req) => {
  const u = requireUser(req, 'owner');
  const b = await readJson(req);
  const card = {
    name: str(b, 'name', { min: 1, max: 60 }),
    reward: str(b, 'reward', { min: 1, max: 100 }),
    stampsRequired: int(b, 'stampsRequired', { min: 2, max: 20 }),
    color: hexColor(b, 'color'),
  };
  return json(updateCard(u.businessId, card));
});
