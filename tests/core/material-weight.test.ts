import { describe, expect, it } from 'vitest';
import { calculateMaterialWeight, materialWeightPresets } from '../../src/core/tools/material-weight';
import { materialWeightReport } from '../../src/report/material-weight-adapter';

describe('material unit weight and volume self-weight', () => {
  it('matches the inspected GB 50009 Appendix A reinforced-concrete range', () => {
    const preset = materialWeightPresets.find(item => item.id === 'reinforced-concrete')!;
    expect([preset.min, preset.max, preset.pdfPage]).toEqual([24, 25, 84]);
    const input = { unitWeight: 24.5, volume: 2 };
    expect(calculateMaterialWeight(input)).toBe(49);
    const report = materialWeightReport(preset, input, 49);
    expect(report.results[0].value).toBe(49);
    expect(report.allEvidence[0].verificationStatus).toBe('REVIEW_REQUIRED');
  });

  it('accepts a zero volume and boundary reference values', () => {
    expect(calculateMaterialWeight({ unitWeight: 24, volume: 0 })).toBe(0);
    expect(calculateMaterialWeight({ unitWeight: 25, volume: 2 })).toBe(50);
  });

  it('flags a value outside the table range without hiding the calculated weight', () => {
    const preset = materialWeightPresets.find(item => item.id === 'reinforced-concrete')!;
    const input = { unitWeight: 30, volume: 2 };
    const report = materialWeightReport(preset, input, calculateMaterialWeight(input));
    expect(report.results[0].value).toBe(60);
    expect(report.conclusion.passed).toBe(false);
  });

  it('rejects invalid input and overflow', () => {
    expect(() => calculateMaterialWeight({ unitWeight: 0, volume: 1 })).toThrow();
    expect(() => calculateMaterialWeight({ unitWeight: 24, volume: -1 })).toThrow();
    expect(() => calculateMaterialWeight({ unitWeight: Number.NaN, volume: 1 })).toThrow();
    expect(() => calculateMaterialWeight({ unitWeight: 1e300, volume: 1e300 })).toThrow();
  });
});
