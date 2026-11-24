import { getT, localeFromRequest, type Vars } from './i18n';

// messageKey is a catalog key (never user-visible text); it is rendered in route().
export class ApiError extends Error {
  status: number;
  code: string;
  messageKey: string;
  vars?: Vars;
  constructor(status: number, code: string, messageKey: string, vars?: Vars) {
    super(messageKey);
    this.status = status;
    this.code = code;
    this.messageKey = messageKey;
    this.vars = vars;
  }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// Upper bound for JSON request bodies; every accepted payload is far below this.
export const MAX_BODY_BYTES = 64 * 1024;

async function readBodyCapped(req: Request): Promise<string> {
  const tooLarge = () => new ApiError(400, 'validation_error', 'errors.invalidJson');
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw tooLarge();
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw tooLarge();
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const text = await readBodyCapped(req);
  if (text.trim() === '') return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ApiError(400, 'validation_error', 'errors.invalidJson');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ApiError(400, 'validation_error', 'errors.invalidJson');
  }
  return parsed as Record<string, unknown>;
}

export function route<P = object>(
  fn: (req: Request, params: P) => Response | Promise<Response>,
): (req: Request, ctx: { params: Promise<P> }) => Promise<Response> {
  return async (req, ctx) => {
    try {
      const params = (await ctx.params) as P;
      return await fn(req, params);
    } catch (e) {
      const t = getT(localeFromRequest(req));
      if (e instanceof ApiError) return json({ error: e.code, message: t(e.messageKey, e.vars) }, e.status);
      console.error('Unhandled API error:', e instanceof Error ? e.message : 'unknown');
      return json({ error: 'internal', message: t('errors.internal') }, 500);
    }
  };
}
