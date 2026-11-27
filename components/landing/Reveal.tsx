'use client';

import { useEffect } from 'react';

/**
 * Adds a subtle fade/slide-in to every [data-reveal] element as it scrolls into view, and pauses every
 * CSS animation of a landing section while it is off screen or the tab is hidden ([data-paused], see landing.css).
 */
export function Reveal() {
  useEffect(() => {
    const secs = Array.from(document.querySelectorAll<HTMLElement>('.landing main > section'));
    const onScreen = new Set<Element>();
    const paint = () => {
      for (const s of secs) {
        if (document.hidden || !onScreen.has(s)) s.setAttribute('data-paused', '');
        else s.removeAttribute('data-paused');
      }
    };
    const vis = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target);
      paint();
    });
    secs.forEach((s) => vis.observe(s));
    document.addEventListener('visibilitychange', paint);
    const stopPause = () => { vis.disconnect(); document.removeEventListener('visibilitychange', paint); };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return stopPause;
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
    return () => { io.disconnect(); stopPause(); };
  }, []);
  return null;
}
