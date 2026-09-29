// ============ BATCH 3.1: 真实工程算例基准库 + AI 审查准确率验证 ============

export type GoldenStatus = 'CANDIDATE' | 'REVIEW_REQUIRED' | 'HUMAN_VERIFIED' | 'REFERENCE_REQUIRED';
export type ToleranceType = 'ABSOLUTE' | 'RELATIVE' | 'ENGINEERING';

export interface GoldenCase {
  id: string;
  name: string;
  moduleId: string;
  sourceType: 'TEXTBOOK' | 'CODE_EXAMPLE' | 'HUMAN_CALC' | 'DESIGN_DOC' | 'INDEPENDENT_VERIFIED';
  sourceReference: string;
  inputs: Record<string, number>;
  expectedFinalResults: Record<string, number>;
  tolerance: { type: ToleranceType; value: number };
  evidenceIds: string[];
  codeEdition: string;
  verificationStatus: GoldenStatus;
  verifiedBy?: string;
  notes?: string;
}

export interface GoldenResult {
  caseId: string;
  expected: number;
  actual: number;
  absoluteError: number;
  relativeError: number;
  tolerance: number;
  pass: boolean;
}

export function runGoldenCase(gc: GoldenCase, actual: Record<string, number>): GoldenResult[] {
  const results: GoldenResult[] = [];
  for (const [key, expected] of Object.entries(gc.expectedFinalResults)) {
    const act = actual[key] ?? NaN;
    const absErr = Math.abs(act - expected);
    const relErr = expected !== 0 ? absErr / Math.abs(expected) : Infinity;
    const tol = gc.tolerance.value;
    const pass = gc.tolerance.type === 'ABSOLUTE'
      ? absErr <= tol
      : relErr <= tol;
    results.push({ caseId: gc.id, expected, actual: act, absoluteError: absErr, relativeError: relErr, tolerance: tol, pass });
  }
  return results;
}

// ============ Error Injection ============

export type ErrorCategory =
  | 'INPUT_ERROR' | 'UNIT_ERROR' | 'FORMULA_ERROR'
  | 'CONDITION_ERROR' | 'EVIDENCE_ERROR' | 'RULE_ERROR';

export interface ErrorInjectionCase {
  id: string;
  moduleId: string;
  injectedError: string;
  category: ErrorCategory;
  expectedDetection: boolean;
  expectedScope: string;
  expectedSeverity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  expectedLocation: string;
}

export interface DetectionResult {
  caseId: string;
  layerA_deterministic: boolean;
  layerB_ruleEvidence: boolean;
  layerC_deepseek: boolean;
  detectedBy: 'NONE' | 'DETERMINISTIC' | 'RULE' | 'AI' | 'MULTIPLE';
  locationCorrect: boolean;
  severityCorrect: boolean;
  hallucinatedReference: boolean;
}

export interface BenchmarkStats {
  sampleSize: number;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  trueNegative: number;
  precision: number;
  recall: number;
  f1: number;
}

export function computeBenchmark(results: DetectionResult[]): BenchmarkStats {
  const tp = results.filter(r => r.layerA_deterministic || r.layerB_ruleEvidence || r.layerC_deepseek).length;
  const fn = results.filter(r => !r.layerA_deterministic && !r.layerB_ruleEvidence && !r.layerC_deepseek).length;
  const fp = 0; // 需要无错误基线才能统计，本批留 0
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
  return { sampleSize: results.length, truePositive: tp, falsePositive: fp, falseNegative: fn, trueNegative: 0, precision, recall, f1 };
}
