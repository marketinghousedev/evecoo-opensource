'use client';

import { useEffect } from 'react';

/** Adds a subtle fade/slide-in to every [data-reveal] element as it scrolls into view. */
export function Reveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight) {
        el.classList.add('reveal-pre');
        io.observe(el);
      }
    }
    return () => io.disconnect();
  }, []);
  return null;
}
