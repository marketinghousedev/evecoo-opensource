import { ApiClientError } from '@/lib/client';
import type { T } from '@/lib/i18n';

// API messages are already localized sentences; network errors carry a catalog key.
// translate() returns its input when the key is unknown, so t(message) is safe for both.
export function errorText(t: T, e: unknown): string {
  if (e instanceof ApiClientError) return t(e.message);
  return t('errors.internal');
}
