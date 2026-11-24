'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionUser } from './types';

const KEY = 'evecoo_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
export function setToken(t: string): void {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* ignore */
  }
}
export function clearToken(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

// For code 'network' (or a missing body) message is a catalog key; UIs may t(message) it.
export class ApiClientError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiClientError(0, 'network', 'errors.network');
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    const d = (data ?? {}) as { error?: string; message?: string };
    throw new ApiClientError(res.status, d.error ?? 'internal', d.message ?? 'errors.internal');
  }
  return data as T;
}

export function useSession(require: 'owner' | 'any' = 'any'): { user: SessionUser | null; loading: boolean } {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api<Omit<SessionUser, 'id'> & { id?: string }>('/api/auth/me');
        if (cancelled) return;
        const u = { id: me.id ?? '', email: me.email, role: me.role, businessId: me.businessId, businessName: me.businessName };
        if (require === 'owner' && u.role !== 'owner') {
          router.replace('/staff');
          return;
        }
        setUser(u);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiClientError && e.status === 401) {
          clearToken();
          router.replace('/login');
          return;
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [require, router]);

  return { user, loading };
}
