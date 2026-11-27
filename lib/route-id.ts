'use client';

import { useEffect, useState } from 'react';

// Shell pages (/card, /join) serve every id. The id comes from the browser URL after mount:
// /<prefix>/<id> first, else ?id=. null before mount (matches the prerendered HTML).
export function useRouteId(prefix: 'card' | 'join'): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const i = parts.indexOf(prefix);
    let found: string | null = null;
    if (i >= 0 && parts[i + 1]) {
      try {
        found = decodeURIComponent(parts[i + 1]);
      } catch {
        found = parts[i + 1];
      }
    }
    if (!found) found = new URLSearchParams(window.location.search).get('id');
    setId(found || '');
  }, [prefix]);
  return id;
}
