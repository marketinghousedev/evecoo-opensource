import { runAutomations } from '@/lib/automations';
import { requireUser } from '@/lib/auth';
import { ApiError, json, readJson, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const user = requireUser(req, 'owner');
  const body = await readJson(req);
  let now = new Date();
  if (body.now !== undefined) {
    const ms = typeof body.now === 'string' ? Date.parse(body.now) : NaN;
    const year = Number.isNaN(ms) ? NaN : new Date(ms).getUTCFullYear();
    // Years outside 1970..9999 would break the YYYY-MM-DD day keys used by the automation log.
    if (!(year >= 1970 && year <= 9999)) {
      throw new ApiError(400, 'validation_error', 'errors.validation.now', { field: 'now' });
    }
    now = new Date(ms);
  }
  return json(runAutomations(user.businessId, now));
});
