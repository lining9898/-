import { describe, expect, it } from 'vitest';
import { calculateContinuousBeam } from '../../src/core/beam/continuous';
import { calculateAxialColumn, AxialColumnInput } from '../../src/core/column/axial';
import { axialColumnReport, continuousBeamReport } from '../../src/report/analysis-adapters';
import { generateReport } from '../../src/report/generator';

const column: AxialColumnInput = {
  width: 400, depth: 500, effectiveLength: 3200, reinforcementArea: 2400,
  axialForce: 2200, concreteStrength: 14.3, steelCompressionStrength: 360,
};

describe('analysis report adapters', () => {
  it('reports beam equilibrium without claiming a design check or code evidence', () => {
    const spans = [{ length: 6, load: 10 }, { length: 6, load: 10 }];
    const report = continuousBeamReport(spans, calculateContinuousBeam(spans));
    expect(report.overallStatus).toBe('REVIEW_REQUIRED');
    expect(report.allEvidence).toEqual([]);
    expect(report.checks).toEqual([]);
    expect(report.results.find(item => item.label === '支座 2 竖向反力')?.value).toBe(75);
    expect(generateReport(report).find(section => section.title === '七、验算结果')?.content).toBe('未进行设计验算');
  });

  it('retains axial result and pending evidence when the check passes or fails', () => {
    const passed = axialColumnReport(column, calculateAxialColumn(column));
    expect(passed.results.find(item => item.label === '轴压承载力 Nu')?.value).toBe(3351.6);
    expect(passed.checks[0].passed).toBe(true);
    expect(passed.overallStatus).toBe('REVIEW_REQUIRED');
    expect(passed.allEvidence[0].pdfPage).toBeNull();
    expect(passed.allEvidence[0].originalText).toBe('待规范原文校核');
    const overloaded = { ...column, axialForce: 5000 };
    const failed = axialColumnReport(overloaded, calculateAxialColumn(overloaded));
    expect(failed.checks[0].passed).toBe(false);
    expect(failed.conclusion.passed).toBe(false);
  });
});
