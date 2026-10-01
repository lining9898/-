import type { CalculationResult } from '../types/calculation';
import type { VerificationStatus } from '../types/evidence';
import { normalizeCode, normativeVersionRegistry } from '../normative/registry';

export const REVIEW_PACKAGE_VERSION = '1.1.0';

/** 规范版本信息（从 Evidence 汇总） */
export interface NormativeVersionInfo {
  codeNumber: string;
  codeName: string;
  edition: string;
  designation?: string;
  status: string;
  verificationStatus?: VerificationStatus;
  source?: string | null;
}

/** 复核包内与本次计算规范有关的版本差异 */
export interface ReviewNormativeChange {
  codeNumber: string;
  fromEdition: string;
  toEdition: string;
  changedClauses: string[];
  changedFormulas: string[];
  changedParameters: string[];
  changedApplicability: string[];
  reviewDate: string;
  source: string;
  verificationStatus: VerificationStatus;
  note?: string;
  affectedSkills?: string[];
}

/** Evidence 在复核包中的投影 */
export interface ReviewEvidenceRef {
  codeName: string;
  codeNumber: string;
  edition: string;
  chapter: string;
  clause: string;
  text: string;
  page: number | null;
  source: string | null;
  verificationStatus: VerificationStatus;
}

/** 步骤在复核包中的投影 */
export interface ReviewStep {
  index: number;
  name: string;
  description: string;
  formula: string;
  substitutedFormula: string;
  result: number | string;
  unit: string;
  evidence: ReviewEvidenceRef[];
}

/** 复核包 */
export interface AIReviewPackage {
  reviewPackageVersion: string;
  calculationSkill: string;
  calculationTitle: string;
  generatedAt: string;
  input: { label: string; value: number | string; unit: string }[];
  geometry: { label: string; value: number | string; unit: string }[];
  materials: { label: string; value: number | string; unit: string }[];
  steps: ReviewStep[];
  checks: { name: string; calculated: number; limit: number; comparison: string; passed: boolean; unit: string }[];
  results: { label: string; value: number | string; unit: string }[];
  conclusion: { passed: boolean; summary: string };
  evidence: ReviewEvidenceRef[];
  normativeVersions: NormativeVersionInfo[];
  normativeChanges?: ReviewNormativeChange[];
  warnings: string[];
  verificationStatus: VerificationStatus;
  /** 特殊标记：INTERNAL-MECHANICS（连续梁等结构力学方法） */
  internalMechanics?: boolean;
  /** 特殊标记：数量级高风险模块（独立基础） */
  magnitudeHighRisk?: boolean;
}

/** 未来 LLM API 接入时的复核结果类型（本批次只定义，不调用） */
export type ReviewIssueSeverity = 'BLOCKER' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ReviewIssueCategory =
  | 'CALCULATION_LOGIC'
  | 'NUMERICAL'
  | 'UNIT'
  | 'EVIDENCE'
  | 'APPLICABILITY'
  | 'REPORT';

export interface ReviewIssue {
  id: string;
  severity: ReviewIssueSeverity;
  category: ReviewIssueCategory;
  title: string;
  description: string;
  location?: string;
  expected?: string;
  actual?: string;
  recommendation?: string;
}

export type ReviewStatus = 'PASS' | 'PASS_WITH_WARNINGS' | 'REVIEW_REQUIRED' | 'FAIL';

export interface ReviewResult {
  status: ReviewStatus;
  summary: string;
  issues: ReviewIssue[];
  reviewedAt: string;
  reviewer: string;
}

export const EMPTY_REVIEW_RESULT: ReviewResult = {
  status: 'REVIEW_REQUIRED',
  summary: '',
  issues: [],
  reviewedAt: '',
  reviewer: '',
};

/**
 * 规范确认记录（预留数据结构）
 * AI 审查 ≠ 规范认证。AI 认为某条规范正确不代表该规范已 VERIFIED。
 */
export type NormativeVerificationStatus = 'VERIFIED' | 'REVIEW_REQUIRED' | 'UNVERIFIED' | 'CONFLICT';

export interface NormativeVerification {
  codeName: string;
  codeNumber: string;
  edition: string;
  clause: string;
  page: number | null;
  quotedText: string;
  evidenceSource: string | null;
  evidenceStatus: VerificationStatus;
  verificationStatus: NormativeVerificationStatus;
  conflictStatus: 'NONE' | 'MINOR' | 'MAJOR';
  notes: string;
}

/**
 * AI 修改建议（只读，不写回工程引擎）
 * 未来必须经过：AI 建议 → Evidence 核验 → 人工确认 → 才允许进入代码修改
 */
export interface ReviewSuggestion {
  issue: string;
  severity: ReviewIssueSeverity;
  location: string;
  reason: string;
  suggestedChange: string;
  evidenceRequired: string;
}

/** 扩展 ReviewResult */
export interface ExtendedReviewResult extends ReviewResult {
  /** AI 发现的规范依据待确认项 */
  normativeVerifications?: NormativeVerification[];
  /** AI 建议的修改（不自动执行） */
  suggestions?: ReviewSuggestion[];
}

/** 从 CalculationResult 构建复核包（纯转换，不重新计算） */
export function buildReviewPackage(
  result: CalculationResult,
  skillTitle?: string,
  options?: { internalMechanics?: boolean; magnitudeHighRisk?: boolean }
): AIReviewPackage {
  // 汇总所有 evidence，去重
  const evidenceMap = new Map<string, ReviewEvidenceRef>();
  const collectEvidence = (evs: {
    codeName: string; codeNumber: string; edition: string; chapter: string;
    clause: string; originalText: string; pdfPage: number | null;
    sourceFile: string | null; verificationStatus: VerificationStatus;
  }[]) => {
    for (const e of evs) {
      const key = `${e.codeNumber}|${e.clause}|${e.edition}`;
      if (!evidenceMap.has(key)) {
        evidenceMap.set(key, {
          codeName: e.codeName,
          codeNumber: e.codeNumber,
          edition: e.edition,
          chapter: e.chapter,
          clause: e.clause,
          text: e.originalText || '',
          page: e.pdfPage,
          source: e.sourceFile,
          verificationStatus: e.verificationStatus,
        });
      }
    }
  };
  collectEvidence(result.allEvidence);
  for (const s of result.steps) collectEvidence(s.evidence);
  for (const c of result.checks) collectEvidence(c.evidence);
  for (const m of result.materials) if (m.evidence) collectEvidence(m.evidence);
  for (const g of result.geometry) if (g.evidence) collectEvidence(g.evidence);
  collectEvidence(result.conclusion.evidence);
  for (const r of result.results) if (r.evidence) collectEvidence(r.evidence);

  // 汇总规范版本
  const versions = new Map<string, NormativeVersionInfo>();
  for (const ev of evidenceMap.values()) {
    if (/^INTERNAL-/.test(ev.codeNumber) || !ev.edition) continue;
    const key = `${ev.codeNumber}|${ev.edition}`;
    if (!versions.has(key)) {
      const registeredVersion = normativeVersionRegistry.getVersions(ev.codeNumber).find(
        v => v.edition === ev.edition || v.designation === ev.edition
      );
      versions.set(key, {
        codeNumber: ev.codeNumber,
        codeName: ev.codeName,
        edition: ev.edition,
        designation: registeredVersion?.designation,
        status: registeredVersion?.status ?? 'UNRESOLVED',
        verificationStatus: registeredVersion?.verificationStatus,
        source: registeredVersion?.source ?? null,
      });
    }
  }

  // 步骤
  const steps: ReviewStep[] = result.steps.map((s, i) => ({
    index: i + 1,
    name: s.name,
    description: s.description,
    formula: s.formula,
    substitutedFormula: s.substitutedFormula || '',
    result: s.result,
    unit: s.unit,
    evidence: s.evidence.map(e => ({
      codeName: e.codeName, codeNumber: e.codeNumber, edition: e.edition,
      chapter: e.chapter, clause: e.clause, text: e.originalText || '',
      page: e.pdfPage, source: e.sourceFile, verificationStatus: e.verificationStatus,
    })),
  }));

  const warnings = result.advisories.map(a => `[${a.severity}] ${a.code}: ${a.message}`);

  return {
    reviewPackageVersion: REVIEW_PACKAGE_VERSION,
    calculationSkill: result.calculatorType,
    calculationTitle: skillTitle || result.calculatorType,
    generatedAt: new Date().toISOString(),
    input: result.inputs,
    geometry: result.geometry.map(g => ({ label: g.label, value: g.value, unit: g.unit })),
    materials: result.materials.map(m => ({ label: m.label, value: m.value, unit: m.unit })),
    steps,
    checks: result.checks.map(c => ({
      name: c.name, calculated: c.calculatedValue, limit: c.limitValue,
      comparison: c.comparison, passed: c.passed, unit: c.unit,
    })),
    results: result.results.map(r => ({ label: r.label, value: r.value, unit: r.unit })),
    conclusion: { passed: result.conclusion.passed, summary: result.conclusion.summary },
    evidence: [...evidenceMap.values()],
    normativeVersions: [...versions.values()],
    normativeChanges: normativeVersionRegistry.listChangeSets().filter(change =>
      [...evidenceMap.values()].some(ev => normalizeCode(ev.codeNumber) === normalizeCode(change.codeNumber))
    ),
    warnings,
    verificationStatus: result.overallStatus,
    internalMechanics: options?.internalMechanics,
    magnitudeHighRisk: options?.magnitudeHighRisk,
  };
}
