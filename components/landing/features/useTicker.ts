'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Ticks while the element is on screen, the tab is visible and the user does not prefer
 * reduced motion. With reduced motion it never ticks, so tick stays 0 (a static, complete state).
 */
export function useTicker(ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const [active, setActive] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let id: number | undefined;
    const sync = () => {
      const run = visible && !document.hidden && !mq.matches;
      setActive(run);
      if (run && id === undefined) id = window.setInterval(() => setTick((t) => t + 1), ms);
      else if (!run && id !== undefined) { window.clearInterval(id); id = undefined; }
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) setSeen(true); sync(); }, { threshold: 0.25 });
    io.observe(el);
    document.addEventListener('visibilitychange', sync);
    mq.addEventListener('change', sync);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      mq.removeEventListener('change', sync);
      if (id !== undefined) window.clearInterval(id);
    };
  }, [ms]);

  return { ref, tick, setTick, active, seen };
}

export const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Smoothly tweens a number toward its target (rAF, ease-out). */
export function useTween(target: number, ms = 900) {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    const from = cur.current;
    if (from === target) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { cur.current = target; setV(target); return; }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      cur.current = from + (target - from) * e;
      setV(cur.current);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return Math.round(v);
}
