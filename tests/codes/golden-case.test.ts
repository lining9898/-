import { describe, it, expect } from 'vitest';
import { runGoldenCase, computeBenchmark, type GoldenCase, type DetectionResult } from '../../src/codes/goldenCase';

describe('BATCH 3.1: Golden Case 基准库', () => {
  it('Golden Case PASS（相对误差内）', () => {
    const gc: GoldenCase = {
      id: 'gc-beam-1', name: '矩形梁正截面', moduleId: 'beam-flexure',
      sourceType: 'TEXTBOOK', sourceReference: '示例',
      inputs: { b: 200, h: 500 },
      expectedFinalResults: { Mu: 100 },
      tolerance: { type: 'RELATIVE', value: 0.05 },
      evidenceIds: ['GB50010-6.2.10'], codeEdition: 'GB50010-2010-2015',
      verificationStatus: 'HUMAN_VERIFIED',
    };
    const r = runGoldenCase(gc, { Mu: 102 })[0];
    expect(r.pass).toBe(true);
  });

  it('Golden Case FAIL（误差超 5%）', () => {
    const gc: GoldenCase = {
      id: 'gc-beam-2', name: '矩形梁正截面', moduleId: 'beam-flexure',
      sourceType: 'TEXTBOOK', sourceReference: '示例',
      inputs: {}, expectedFinalResults: { Mu: 100 },
      tolerance: { type: 'RELATIVE', value: 0.05 },
      evidenceIds: [], codeEdition: 'GB50010-2010-2015',
      verificationStatus: 'HUMAN_VERIFIED',
    };
    const r = runGoldenCase(gc, { Mu: 120 })[0];
    expect(r.pass).toBe(false);
  });

  it('Benchmark 统计', () => {
    const results: DetectionResult[] = [
      { caseId: 'e1', moduleId: '', injectedError: '', category: 'UNIT_ERROR', expectedDetection: true, expectedScope: '', expectedSeverity: 'ERROR', expectedLocation: '', layerA_deterministic: true, layerB_ruleEvidence: false, layerC_deepseek: true, detectedBy: 'MULTIPLE', locationCorrect: true, severityCorrect: true, hallucinatedReference: false },
      { caseId: 'e2', moduleId: '', injectedError: '', category: 'FORMULA_ERROR', expectedDetection: true, expectedScope: '', expectedSeverity: 'ERROR', expectedLocation: '', layerA_deterministic: false, layerB_ruleEvidence: false, layerC_deepseek: false, detectedBy: 'NONE', locationCorrect: false, severityCorrect: false, hallucinatedReference: false },
    ];
    const bm = computeBenchmark(results);
    expect(bm.sampleSize).toBe(2);
    expect(bm.truePositive).toBe(1);
    expect(bm.falseNegative).toBe(1);
    expect(bm.recall).toBe(0.5);
  });
});
