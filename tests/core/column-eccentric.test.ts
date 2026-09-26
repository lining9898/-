import { describe, expect, it } from 'vitest';
import { calculateEccentricColumn, EccentricColumnInput } from '../../src/core/column/eccentric';
import { eccentricColumnReport } from '../../src/report/eccentric-column-adapter';

const base: EccentricColumnInput = {
  width: 400, depth: 500, coverToSteelCentroid: 50, reinforcementAreaEachFace: 1600,
  axialForce: 1200, firstOrderMoment: 60, concreteGrade: 'C30', steelGrade: 'HRB400',
};

describe('single-axis symmetric eccentric column section check', () => {
  it('adds the code-based additional eccentricity and closes axial equilibrium', () => {
    const result = calculateEccentricColumn(base);
    expect(result.additionalEccentricity).toBe(20);
    expect(result.additionalMoment).toBe(24);
    expect(result.designMoment).toBe(84);
    expect(Math.abs(result.forceResidual)).toBeLessThan(0.001);
    expect(result.topSteelStress).toBeGreaterThan(0);
    expect(result.bottomSteelStress).toBeLessThan(0);
  });

  it('uses h / 30 when it controls the additional eccentricity', () => {
    const result = calculateEccentricColumn({ ...base, depth: 900 });
    expect(result.additionalEccentricity).toBe(30);
    expect(result.additionalMoment).toBe(36);
    expect(result.designMoment).toBe(96);
  });

  it('reports pass and fail according to the same axial force interaction capacity', () => {
    const passed = calculateEccentricColumn(base);
    expect(passed.passed).toBe(true);
    const failed = calculateEccentricColumn({ ...base, firstOrderMoment: passed.momentCapacity + 50 });
    expect(failed.passed).toBe(false);
  });

  it('creates a review-required calculation result with source records and scope warning', () => {
    const result = calculateEccentricColumn(base);
    const report = eccentricColumnReport(base, result);
    expect(report.overallStatus).toBe('REVIEW_REQUIRED');
    expect(report.allEvidence.map(item => item.clause)).toContain('6.2.5');
    expect(report.allEvidence.find(item => item.clause === '6.2.5')?.pdfPage).toBe(52);
    expect(report.advisories[0].code).toBe('SECOND_ORDER_NOT_CHECKED');
  });

  it('rejects invalid geometry, zero axial force and force outside the simplified model range', () => {
    expect(() => calculateEccentricColumn({ ...base, coverToSteelCentroid: 250 })).toThrow();
    expect(() => calculateEccentricColumn({ ...base, axialForce: 0 })).toThrow();
    expect(() => calculateEccentricColumn({ ...base, axialForce: 10000 })).toThrow();
    expect(() => calculateEccentricColumn({ ...base, concreteGrade: 'C30', firstOrderMoment: Number.NaN })).toThrow();
  });
});
