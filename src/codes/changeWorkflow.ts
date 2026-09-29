// ============ BATCH 2.6: 人工批准后规范变更驱动计算模块修改 ============

export type ApprovalStage = 'NONE' | 'APPROVE_FOR_IMPLEMENTATION' | 'APPROVE_FOR_MERGE';
export type TaskStatus =
  | 'WAITING' | 'IMPLEMENTING' | 'TESTING' | 'VALIDATION_REQUIRED'
  | 'FAILED' | 'READY_FOR_HUMAN_REVIEW' | 'APPROVED_FOR_MERGE'
  | 'REJECTED' | 'MERGED' | 'SCOPE_EXPANSION_REQUIRED' | 'BLOCKED';

export interface ChangeExecutionTask {
  taskId: string;
  proposalId: string;
  ruleId: string;
  bindingId: string;
  targetModule: string;
  targetCalculationStep: string;
  expectedChange: string;
  evidenceIds: string[];
  baselineCommit: string;
  changeBranch: string;
  requiredTests: string[];
  approvalStage: ApprovalStage;
  status: TaskStatus;
  createdAt: string;
}

export interface BeforeAfterComparison {
  caseId: string;
  inputs: Record<string, number | string>;
  beforeResult: number;
  afterResult: number;
  absoluteDifference: number;
  percentageDifference: number;
  classification: 'NO_CHANGE' | 'EXPECTED_CHANGE' | 'UNEXPECTED_CHANGE' | 'PASS_TO_FAIL' | 'FAIL_TO_PASS' | 'LARGE_NUMERICAL_CHANGE';
}

export interface ChangeValidationReport {
  taskId: string;
  ruleId: string;
  proposalId: string;
  evidenceIds: string[];
  codeDiff: string;
  beforeAfterComparisons: BeforeAfterComparison[];
  targetedTestsPass: boolean;
  regressionTestsPass: boolean;
  buildPass: boolean;
  affectedModules: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: 'READY_FOR_MERGE' | 'DO_NOT_MERGE';
  unresolvedIssues: string[];
}

export interface RollbackPlan {
  taskId: string;
  baselineCommit: string;
  changeBranch: string;
  rollbackCommand: string;
  status: 'PLANNED' | 'EXECUTED';
}

export interface ChangeAuditLog {
  taskId: string;
  events: Array<{ event: string; at: string; by: string; }>;
}

// ============ 守卫逻辑 ============

export interface GateContext {
  ruleVerified: boolean;
  evidenceVerified: boolean;
  proposalApprovedForImpl: boolean;
  filesModified: string[];
  allowedFiles: string[];
  targetedTestsPass: boolean;
  regressionTestsPass: boolean;
  buildPass: boolean;
  proposalApprovedForMerge: boolean;
}

export function canCreateChangeTask(ctx: GateContext): { allowed: boolean; reason: string } {
  if (!ctx.ruleVerified) return { allowed: false, reason: 'EngineeringRule 未 VERIFIED' };
  if (!ctx.evidenceVerified) return { allowed: false, reason: 'Evidence 未 VERIFIED (Evidence Gate)' };
  if (!ctx.proposalApprovedForImpl) return { allowed: false, reason: '未获得第一次人工批准 APPROVE_FOR_IMPLEMENTATION' };
  return { allowed: true, reason: 'OK' };
}

export function checkScope(ctx: GateContext): { allowed: boolean; reason: string } {
  const outOfScope = ctx.filesModified.filter(f => !ctx.allowedFiles.includes(f));
  if (outOfScope.length > 0) {
    return { allowed: false, reason: `范围外修改: ${outOfScope.join(', ')}` };
  }
  return { allowed: true, reason: 'OK' };
}

export function canMerge(ctx: GateContext): { allowed: boolean; reason: string } {
  if (!ctx.targetedTestsPass) return { allowed: false, reason: 'Targeted Tests 未通过' };
  if (!ctx.regressionTestsPass) return { allowed: false, reason: 'Regression Tests 未通过' };
  if (!ctx.buildPass) return { allowed: false, reason: 'Build 未通过' };
  if (!ctx.proposalApprovedForMerge) return { allowed: false, reason: '未获得第二次人工批准 APPROVE_FOR_MERGE' };
  return { allowed: true, reason: 'OK' };
}

export function classifyComparison(before: number, after: number, expectedDelta?: number): BeforeAfterComparison['classification'] {
  if (before === after) return 'NO_CHANGE';
  const diff = Math.abs(after - before);
  const pct = before !== 0 ? diff / Math.abs(before) * 100 : Infinity;
  if (expectedDelta !== undefined && Math.abs(after - before - expectedDelta) < 1e-6) return 'EXPECTED_CHANGE';
  if (pct > 10) return 'LARGE_NUMERICAL_CHANGE';
  return 'UNEXPECTED_CHANGE';
}
