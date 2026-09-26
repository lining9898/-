import { describe, expect, it } from 'vitest';
import { calculateContinuousBeam } from '../../src/core/beam/continuous';

describe('continuous beam elastic analysis', () => {
  it('matches a simply supported uniformly loaded span', () => {
    const result = calculateContinuousBeam([{ length: 6, load: 10 }]);
    expect(result.reactions[0]).toBeCloseTo(30, 5);
    expect(result.reactions[1]).toBeCloseTo(30, 5);
    expect(result.supportMoments).toEqual([0, 0]);
    expect(result.spans[0].maximumMoment).toBeCloseTo(45, 5);
    expect(result.spans[0].maximumMomentAt).toBeCloseTo(3, 5);
  });

  it('matches the equal two-span closed-form solution', () => {
    const result = calculateContinuousBeam([{ length: 6, load: 10 }, { length: 6, load: 10 }]);
    expect(result.supportMoments[1]).toBeCloseTo(-45, 4);
    expect(result.reactions[0]).toBeCloseTo(22.5, 4);
    expect(result.reactions[1]).toBeCloseTo(75, 4);
    expect(result.reactions[2]).toBeCloseTo(22.5, 4);
    expect(result.spans[0].maximumMoment).toBeCloseTo(25.3125, 4);
    expect(result.spans[0].diagram[40].moment).toBeCloseTo(-45, 4);
    expect(result.spans[1].diagram[0].moment).toBeCloseTo(-45, 4);
  });

  it('respects asymmetrical loads and checks global equilibrium', () => {
    const result = calculateContinuousBeam([{ length: 5, load: 10 }, { length: 7, load: 0 }, { length: 4, load: 8 }]);
    expect(result.reactions.reduce((sum, value) => sum + value, 0)).toBeCloseTo(82, 5);
    expect(result.supportMoments[0]).toBe(0);
    expect(result.supportMoments[3]).toBe(0);
    expect(result.spans[1].diagram[20].shear).toBeCloseTo(result.spans[1].leftShear, 5);
  });

  it('matches an unequal two-span case with an unloaded second span and uplift', () => {
    const result = calculateContinuousBeam([{ length: 5, load: 10 }, { length: 7, load: 0 }]);
    expect(result.supportMoments[1]).toBeCloseTo(-1250 / 96, 5);
    expect(result.reactions[0]).toBeCloseTo(25 - 250 / 96, 5);
    expect(result.reactions[2]).toBeLessThan(0);
    expect(result.spans[1].maximumMoment).toBeCloseTo(0, 5);
  });

  it('handles four spans with equal loads and symmetric reactions', () => {
    const result = calculateContinuousBeam(Array.from({ length: 4 }, () => ({ length: 6, load: 10 })));
    expect(result.reactions).toHaveLength(5);
    expect(result.reactions[0]).toBeCloseTo(result.reactions[4], 5);
    expect(result.reactions[1]).toBeCloseTo(result.reactions[3], 5);
    expect(result.supportMoments[1]).toBeCloseTo(result.supportMoments[3], 5);
    expect(result.reactions.reduce((sum, reaction) => sum + reaction, 0)).toBeCloseTo(240, 5);
  });

  it('rejects invalid input', () => {
    expect(() => calculateContinuousBeam([])).toThrow();
    expect(() => calculateContinuousBeam([{ length: 0, load: 10 }])).toThrow();
    expect(() => calculateContinuousBeam([{ length: 6, load: -1 }])).toThrow();
    expect(() => calculateContinuousBeam([{ length: 6, load: 0 }])).toThrow();
  });
});
