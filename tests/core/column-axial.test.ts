import { describe, expect, it } from 'vitest';
import { AxialColumnInput, calculateAxialColumn } from '../../src/core/column/axial';

const base: AxialColumnInput = {
  width: 400, depth: 500, effectiveLength: 3200, reinforcementArea: 2400,
  axialForce: 2200, concreteStrength: 14.3, steelCompressionStrength: 360,
};

describe('rectangular tied axial column, 2015 edition', () => {
  it('uses the short side, table coefficient and 0.9 reduction', () => {
    const result = calculateAxialColumn(base);
    expect(result.grossArea).toBe(200000);
    expect(result.slendernessRatio).toBe(8);
    expect(result.stabilityFactor).toBe(1);
    expect(result.concreteArea).toBe(200000);
    expect(result.capacity).toBeCloseTo(3351.6, 6);
    expect(result.passed).toBe(true);
  });

  it('conservatively rounds an intermediate length ratio to the next table row', () => {
    const result = calculateAxialColumn({ ...base, effectiveLength: 3600 });
    expect(result.slendernessRatio).toBe(9);
    expect(result.tableRatio).toBe(10);
    expect(result.stabilityFactor).toBe(0.98);
  });

  it('deducts all reinforcement from concrete area only above 3 percent', () => {
    const atLimit = calculateAxialColumn({ ...base, reinforcementArea: 6000 });
    const aboveLimit = calculateAxialColumn({ ...base, reinforcementArea: 8000 });
    expect(atLimit.concreteArea).toBe(200000);
    expect(aboveLimit.concreteArea).toBe(192000);
    expect(aboveLimit.capacity).toBeCloseTo(0.9 * (14.3 * 192000 + 360 * 8000) / 1000, 6);
  });

  it('reports failed axial checks and rejects unsupported inputs', () => {
    expect(calculateAxialColumn({ ...base, axialForce: 5000 }).passed).toBe(false);
    expect(() => calculateAxialColumn({ ...base, effectiveLength: 20400 })).toThrow('表 6.2.15');
    expect(() => calculateAxialColumn({ ...base, reinforcementArea: 200000 })).toThrow();
    expect(() => calculateAxialColumn({ ...base, concreteStrength: Number.NaN })).toThrow();
    expect(() => calculateAxialColumn({ ...base, width: 1e200, depth: 1e200 })).toThrow();
  });
});
