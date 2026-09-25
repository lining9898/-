import { describe, expect, it } from 'vitest';
import { calculateSteelBeam, SteelBeamInput } from '../../src/core/steel/beam';

const base: SteelBeamInput = {
  h: 400, bf: 200, tf: 12, tw: 8,
  moment: 120, shear: 80,
  bendingStrength: 215, shearStrength: 125, stabilityFactor: 0.8,
};

describe('symmetric I-section steel beam', () => {
  it('computes elastic section properties from dimensions', () => {
    const result = calculateSteelBeam(base);
    expect(result.area).toBe(7808);
    expect(result.inertia).toBeCloseTo(216148650.67, 1);
    expect(result.sectionModulus).toBeCloseTo(result.inertia / 200, 6);
    expect(result.firstMoment).toBeCloseTo(606976, 6);
  });

  it('checks bending, shear and stability independently', () => {
    const result = calculateSteelBeam(base);
    expect(result.bendingStress).toBeCloseTo(120e6 / result.sectionModulus, 8);
    expect(result.shearStress).toBeCloseTo(80e3 * result.firstMoment / (result.inertia * 8), 8);
    expect(result.stabilityStress).toBeCloseTo(result.bendingStress / 0.8, 8);
    expect(result.bendingPassed).toBe(true);
    expect(result.shearPassed).toBe(true);
    expect(result.stabilityPassed).toBe(true);
  });

  it('reports failed checks without hiding other results', () => {
    const result = calculateSteelBeam({ ...base, moment: 250, shear: 400, stabilityFactor: 0.5 });
    expect(result.bendingPassed).toBe(false);
    expect(result.shearPassed).toBe(false);
    expect(result.stabilityPassed).toBe(false);
  });

  it('rejects impossible geometry and invalid stability factors', () => {
    expect(() => calculateSteelBeam({ ...base, h: 24 })).toThrow();
    expect(() => calculateSteelBeam({ ...base, bf: 8 })).toThrow();
    expect(() => calculateSteelBeam({ ...base, stabilityFactor: 0 })).toThrow();
    expect(() => calculateSteelBeam({ ...base, stabilityFactor: 1.1 })).toThrow();
    expect(() => calculateSteelBeam({ ...base, shear: Number.NaN })).toThrow();
  });
});
