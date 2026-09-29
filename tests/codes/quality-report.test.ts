import { describe, it, expect } from 'vitest';
import { computeQualityMetrics, generateEvidenceGapReport } from '../../src/codes/qualityReport';
import type { SampleVerification } from '../../src/codes/qualityReport';
import { INITIAL_CLAUSES } from '../../src/codes/initialData';

describe('BATCH 2.0: 解析质量报告与证据缺口', () => {
  it('质量指标计算：全部正确时 100%', () => {
    const samples: SampleVerification[] = Array(20).fill(null).map(() => ({
      codeDocumentId: 'x',
      clauseNumber: '6.2.10',
      extractedText: 'test',
      sourcePdfPage: 54,
      textCorrect: true,
      pageCorrect: true,
      boundaryCorrect: true,
      formulaCorrect: true,
      tableCorrect: true,
      reviewer: 'human',
      reviewedAt: '2026-09-29',
    }));
    const m = computeQualityMetrics(samples);
    expect(m.clauseNumberAccuracy).toBe(100);
    expect(m.pdfPageAccuracy).toBe(100);
  });

  it('质量指标计算：1 条错误时 95%', () => {
    const samples: SampleVerification[] = Array(20).fill(null).map((_, i) => ({
      codeDocumentId: 'x',
      clauseNumber: '6.2.10',
      extractedText: 'test',
      sourcePdfPage: 54,
      textCorrect: i !== 0,
      pageCorrect: true,
      boundaryCorrect: true,
      formulaCorrect: true,
      tableCorrect: true,
      reviewer: 'human',
      reviewedAt: '2026-09-29',
    }));
    const m = computeQualityMetrics(samples);
    expect(m.textCompleteness).toBe(95);
  });

  it('EvidenceGap：beam-flexure 有 3 条 VERIFIED', () => {
    const report = generateEvidenceGapReport(INITIAL_CLAUSES, ['beam-flexure'], {});
    const gap = report.gaps.find(g => g.moduleId === 'beam-flexure');
    expect(gap).toBeTruthy();
    expect(gap!.verifiedEvidence.length).toBeGreaterThanOrEqual(3);
    expect(gap!.missing).toBe(false);
  });

  it('EvidenceGap：不存在的模块报告无证据', () => {
    const report = generateEvidenceGapReport(INITIAL_CLAUSES, ['fake-module'], {});
    expect(report.modulesWithNoEvidence).toContain('fake-module');
  });

  it('已有 4 条 VERIFIED Evidence 完整保留', () => {
    const verified = INITIAL_CLAUSES.filter(c => c.verificationStatus === 'VERIFIED');
    expect(verified.length).toBe(4);
  });
});
