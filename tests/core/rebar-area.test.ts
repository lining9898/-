import { describe, expect, it } from 'vitest';
import { calculateRebarArea } from '../../src/core/tools/rebar-area';

describe('nominal rebar area geometry', () => {
  it('calculates one bar, multiple bars and per-metre area', () => {
    const result = calculateRebarArea({ diameter: 20, count: 4, spacing: 150 });
    expect(result.singleArea).toBeCloseTo(100 * Math.PI, 9);
    expect(result.totalArea).toBeCloseTo(400 * Math.PI, 9);
    expect(result.areaPerMetre).toBeCloseTo(100 * Math.PI * 1000 / 150, 9);
  });

  it('rejects nonphysical and fractional counts', () => {
    expect(() => calculateRebarArea({ diameter: 0, count: 4, spacing: 150 })).toThrow();
    expect(() => calculateRebarArea({ diameter: 20, count: 1.5, spacing: 150 })).toThrow();
    expect(() => calculateRebarArea({ diameter: 20, count: 4, spacing: 0 })).toThrow();
  });
});
