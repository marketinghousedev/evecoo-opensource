import { describe, it, expect } from 'vitest';
import { bowlTarget, edge, signedDistance, paintBowl, GW, GH } from '@/components/landing/herob/bowl';

describe('hero B bowl maths', () => {
  it('matches the scroll table at keys and between them', () => {
    expect(bowlTarget(0)).toEqual({ tip: 0.3, half: 0.34, soft: 0.22 });
    expect(bowlTarget(1.43)).toEqual({ tip: 1.3, half: 1.6, soft: 0.1 });
    expect(bowlTarget(5).tip).toBe(2.4);
    expect(bowlTarget(0.015).tip).toBeCloseTo(0.375, 6);
  });
  it('signed distance is negative inside the bowl and positive outside', () => {
    const a = 1.6, tip = 0.5, half = 0.34;
    const { cx, cy } = edge(tip, half, a);
    expect(signedDistance(0, 0.1, tip, half, a, cx, cy)).toBeLessThan(0);
    expect(signedDistance(0.7 * a, 0.9, tip, half, a, cx, cy)).toBeGreaterThan(0);
  });
  it('is solid cyan by q=1.43 and not at rest', () => {
    const d = new Uint8ClampedArray(GW * GH * 4);
    expect(paintBowl(d, bowlTarget(1.43), 1.6, null)).toBe(true);
    expect([d[0], d[1], d[2]]).toEqual([0x8f, 0xd5, 0xf1]);
    expect(paintBowl(d, bowlTarget(0), 1.6, null)).toBe(false);
  });
});
