import { ApiError } from './http';

type O = Record<string, unknown>;

function bad(sub: 'string' | 'int' | 'email' | 'color' | 'date', field: string, min?: number, max?: number): never {
  const vars: Record<string, string | number> = { field };
  if (min !== undefined) vars.min = min;
  if (max !== undefined) vars.max = max;
  throw new ApiError(400, 'validation_error', `errors.validation.${sub}`, vars);
}

export function str(o: O, key: string, opts: { min?: number; max?: number } = {}): string {
  const { min = 1, max = 200 } = opts;
  const v = o[key];
  if (typeof v !== 'string') return bad('string', key, min, max);
  const t = v.trim();
  if (t.length < min || t.length > max) return bad('string', key, min, max);
  return t;
}

export function optStr(o: O, key: string, opts: { min?: number; max?: number } = {}): string | undefined {
  if (o[key] === undefined || o[key] === null) return undefined;
  return str(o, key, opts);
}

export function int(o: O, key: string, opts: { min: number; max: number }): number {
  const v = o[key];
  if (typeof v !== 'number' || !Number.isInteger(v) || v < opts.min || v > opts.max) {
    return bad('int', key, opts.min, opts.max);
  }
  return v;
}

export function email(o: O, key: string): string {
  const v = o[key];
  if (typeof v !== 'string') return bad('email', key);
  const t = v.trim().toLowerCase();
  if (t.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return bad('email', key);
  return t;
}

export function hexColor(o: O, key: string): string {
  const v = o[key];
  if (typeof v !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(v)) return bad('color', key);
  return v;
}

export function isoDate(o: O, key: string): string | undefined {
  const v = o[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return bad('date', key);
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return bad('date', key);
  return v;
}
