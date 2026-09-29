import type { ClauseEvidence, DesignTopic } from './registry';

// ============ BATCH 2.0: 解析质量报告 & 证据缺口报告 ============

export interface SampleVerification {
  codeDocumentId: string;
  clauseNumber: string;
  extractedText: string;
  sourcePdfPage: number;
  printedPage?: string;
  textCorrect: boolean;
  pageCorrect: boolean;
  boundaryCorrect: boolean;
  formulaCorrect: boolean;
  tableCorrect: boolean;
  reviewer: string;
  reviewedAt: string;
  notes?: string;
}

export interface ParsingQualityReport {
  codeDocumentId: string;
  fileName: string;
  totalDetectedClauses: number;
  parsedClauses: number;
  failedClauses: number;
  verifiedClauses: number;
  reviewRequiredClauses: number;
  formulasDetected: number;
  tablesDetected: number;
  sampleSize: number;
  clauseNumberAccuracy: number;
  textCompleteness: number;
  pdfPageAccuracy: number;
  crossPageAccuracy: number;
  formulaPreservation: number;
  tablePreservation: number;
  samples: SampleVerification[];
}

export interface EvidenceGap {
  moduleId: string;
  topic: DesignTopic;
  verifiedEvidence: string[];
  unverifiedEvidence: string[];
  reviewRequiredEvidence: string[];
  missing: boolean;
  gapSummary: string;
}

export interface EvidenceGapReport {
  generatedAt: string;
  totalModules: number;
  gaps: EvidenceGap[];
  modulesWithNoEvidence: string[];
}

/** 从抽样结果计算准确率 */
export function computeQualityMetrics(samples: SampleVerification[]): {
  clauseNumberAccuracy: number;
  textCompleteness: number;
  pdfPageAccuracy: number;
  crossPageAccuracy: number;
  formulaPreservation: number;
  tablePreservation: number;
} {
  if (samples.length === 0) {
    return { clauseNumberAccuracy: 0, textCompleteness: 0, pdfPageAccuracy: 0, crossPageAccuracy: 0, formulaPreservation: 0, tablePreservation: 0 };
  }
  const pct = (n: number) => Math.round(n / samples.length * 1000) / 10;
  return {
    clauseNumberAccuracy: pct(samples.filter(s => s.textCorrect).length),
    textCompleteness: pct(samples.filter(s => s.textCorrect).length),
    pdfPageAccuracy: pct(samples.filter(s => s.pageCorrect).length),
    crossPageAccuracy: pct(samples.filter(s => s.boundaryCorrect).length),
    formulaPreservation: pct(samples.filter(s => s.formulaCorrect).length),
    tablePreservation: pct(samples.filter(s => s.tableCorrect).length),
  };
}

/** 生成 Evidence Gap 报告 */
export function generateEvidenceGapReport(
  clauses: ClauseEvidence[],
  moduleIds: string[],
  clauseToModule: Record<string, string[]>
): EvidenceGapReport {
  const gaps: EvidenceGap[] = [];
  const modulesWithNoEvidence: string[] = [];

  for (const moduleId of moduleIds) {
    const moduleClauses = clauses.filter(c => (c as any).linkedSkills?.includes(moduleId));
    if (moduleClauses.length === 0) {
      modulesWithNoEvidence.push(moduleId);
      gaps.push({
        moduleId,
        topic: 'FLEXURE' as DesignTopic,
        verifiedEvidence: [],
        unverifiedEvidence: [],
        reviewRequiredEvidence: [],
        missing: true,
        gapSummary: '无任何规范证据',
      });
    } else {
      const verified = moduleClauses.filter(c => c.verificationStatus === 'VERIFIED').map(c => c.evidenceId);
      const unverified = moduleClauses.filter(c => c.verificationStatus === 'UNVERIFIED').map(c => c.evidenceId);
      const review = moduleClauses.filter(c => c.verificationStatus === 'REVIEW_REQUIRED').map(c => c.evidenceId);
      gaps.push({
        moduleId,
        topic: 'FLEXURE' as DesignTopic,
        verifiedEvidence: verified,
        unverifiedEvidence: unverified,
        reviewRequiredEvidence: review,
        missing: false,
        gapSummary: `${verified.length} VERIFIED, ${review.length} REVIEW_REQUIRED, ${unverified.length} UNVERIFIED`,
      });
    }
  }

  return { generatedAt: new Date().toISOString(), totalModules: moduleIds.length, gaps, modulesWithNoEvidence };
}
