// ============ BATCH 3.0: AI 结构计算智能审查闭环 ============

export type ReviewScope =
  | 'INPUT_REVIEW' | 'UNIT_REVIEW' | 'FORMULA_REVIEW'
  | 'EVIDENCE_REVIEW' | 'RULE_REVIEW' | 'RESULT_REVIEW' | 'COMPLETENESS_REVIEW';

export type IssueSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type IssueSource = 'DETERMINISTIC' | 'AI' | 'BOTH';
export type IssueStatus = 'OPEN' | 'ACKNOWLEDGED' | 'REJECTED' | 'RESOLVED';

export interface ReviewIssue {
  id: string;
  scope: ReviewScope;
  severity: IssueSeverity;
  moduleId: string;
  calculationStepId?: string;
  ruleIds?: string[];
  evidenceIds?: string[];
  title: string;
  description: string;
  observedValue?: string;
  expectedCondition?: string;
  reasoning?: string;
  confidence?: number;
  source: IssueSource;
  status: IssueStatus;
}

export interface DeterministicResult {
  issues: ReviewIssue[];
  hasError: boolean;
  hasCritical: boolean;
}

export interface AIReviewResult {
  issues: ReviewIssue[];
  summary?: string;
}

export interface MergedReview {
  issues: ReviewIssue[];
  critical: number;
  error: number;
  warning: number;
  info: number;
}

// ============ Deterministic Review Checks ============

export function runDeterministicChecks(input: {
  moduleId: string;
  values: Record<string, number | undefined>;
  units?: Record<string, string>;
  evidenceStatus?: Record<string, string>;
  hasRuleBinding?: boolean;
  ruleDiffStatus?: string;
}): DeterministicResult {
  const issues: ReviewIssue[] = [];
  let hasError = false;
  let hasCritical = false;

  for (const [key, val] of Object.entries(input.values)) {
    if (val === undefined || val === null || Number.isNaN(val)) {
      issues.push({
        id: `det-nan-${key}`,
        scope: 'RESULT_REVIEW', severity: 'CRITICAL',
        moduleId: input.moduleId,
        title: `数值无效: ${key}`,
        description: `${key} = ${val}，不是合法数值`,
        source: 'DETERMINISTIC', status: 'OPEN',
      });
      hasError = true; hasCritical = true;
    } else if (!Number.isFinite(val)) {
      issues.push({
        id: `det-infinity-${key}`,
        scope: 'RESULT_REVIEW', severity: 'CRITICAL',
        moduleId: input.moduleId,
        title: `Infinity: ${key}`,
        description: `${key} = ${val}，存在除零或溢出`,
        source: 'DETERMINISTIC', status: 'OPEN',
      });
      hasError = true; hasCritical = true;
    } else if (val < 0 && ['b', 'h', 'h0', 'length', 'cover'].includes(key)) {
      issues.push({
        id: `det-neg-${key}`,
        scope: 'INPUT_REVIEW', severity: 'ERROR',
        moduleId: input.moduleId,
        title: `负几何尺寸: ${key}`,
        description: `${key} = ${val}，尺寸必须为正`,
        source: 'DETERMINISTIC', status: 'OPEN',
      });
      hasError = true;
    }
  }

  // Evidence 检查
  if (input.evidenceStatus) {
    for (const [eid, st] of Object.entries(input.evidenceStatus)) {
      if (st === 'MISSING' || st === 'UNVERIFIED' || st === 'REVIEW_REQUIRED') {
        issues.push({
          id: `det-evidence-${eid}`,
          scope: 'EVIDENCE_REVIEW', severity: 'WARNING',
          moduleId: input.moduleId, evidenceIds: [eid],
          title: `Evidence ${st}: ${eid}`,
          description: `关键计算步骤规范证据状态: ${st}`,
          source: 'DETERMINISTIC', status: 'OPEN',
        });
      }
    }
  }

  if (input.ruleDiffStatus === 'MISMATCH') {
    issues.push({
      id: 'det-rulediff-mismatch',
      scope: 'RULE_REVIEW', severity: 'ERROR',
      moduleId: input.moduleId,
      title: 'RuleDiff MISMATCH',
      description: 'EngineeringRule 与 Engine 实现不一致',
      source: 'DETERMINISTIC', status: 'OPEN',
    });
    hasError = true;
  }

  return { issues, hasError, hasCritical };
}

// ============ ReviewMerger ============

export function mergeReviews(det: DeterministicResult, ai: AIReviewResult): MergedReview {
  const merged: ReviewIssue[] = [...det.issues];
  const detIds = new Set(det.issues.map(i => i.id));

  for (const aiIssue of ai.issues) {
    // 检查 AI 引用是否真实（简化：id 冲突则标 BOTH）
    if (detIds.has(aiIssue.id)) {
      const existing = merged.find(m => m.id === aiIssue.id)!;
      existing.source = 'BOTH';
    } else {
      // AI 发现的问题不会升级 ERROR 为更高级别，但保留
      merged.push(aiIssue);
    }
  }

  // 关键：Deterministic ERROR 不被 AI PASS 覆盖
  return {
    issues: merged,
    critical: merged.filter(i => i.severity === 'CRITICAL').length,
    error: merged.filter(i => i.severity === 'ERROR').length,
    warning: merged.filter(i => i.severity === 'WARNING').length,
    info: merged.filter(i => i.severity === 'INFO').length,
  };
}

// ============ STALE 检测 ============

export function isReviewStale(
  session: { calculationHash: string; evidenceHash: string; ruleHash: string },
  current: { calculationHash: string; evidenceHash: string; ruleHash: string }
): boolean {
  return (
    session.calculationHash !== current.calculationHash ||
    session.evidenceHash !== current.evidenceHash ||
    session.ruleHash !== current.ruleHash
  );
}
