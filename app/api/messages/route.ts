import { requireUser } from '@/lib/auth';
import { json, readJson, route } from '@/lib/http';
import { listMessages, sendBroadcast } from '@/lib/messages';
import { str } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const user = requireUser(req, 'owner');
  const body = await readJson(req);
  const title = str(body, 'title', { min: 1, max: 80 });
  const text = str(body, 'body', { min: 1, max: 500 });
  return json(sendBroadcast(user.businessId, { title, body: text }));
});

export const GET = route(async (req) => {
  const user = requireUser(req, 'owner');
  return json(listMessages(user.businessId));
});
