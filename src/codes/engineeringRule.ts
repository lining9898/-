// ============ BATCH 2.5: 规范条文 → 工程规则 → 计算引擎映射 ============

export type RuleType =
  | 'FORMULA' | 'LIMIT' | 'COEFFICIENT' | 'MATERIAL_VALUE'
  | 'APPLICABILITY' | 'CONDITION' | 'MINIMUM' | 'MAXIMUM'
  | 'CLASSIFICATION' | 'COMBINATION_RULE' | 'UNIT_RULE';

export type RuleVerificationStatus = 'CANDIDATE' | 'REVIEW_REQUIRED' | 'VERIFIED' | 'CONFLICT' | 'SUPERSEDED';

export interface RuleVariable {
  symbol: string;
  semanticName: string;
  unit: string;
  required: boolean;
  description?: string;
}

export interface Applicability {
  materialType?: string;
  sectionType?: string;
  memberType?: string;
  loadCondition?: string;
  codeEdition?: string;
}

export interface EngineeringRule {
  id: string;
  name: string;
  ruleType: RuleType;
  designTopic: string;
  sourceEvidenceIds: string[];
  description: string;
  applicability: Applicability;
  variables: RuleVariable[];
  expression: {
    humanReadable: string;
    machineReadable?: string;
  };
  limitValues?: Record<string, number | string>;
  unitRequirements?: Record<string, string>;
  conditions?: string[];
  verificationStatus: RuleVerificationStatus;
  createdBy: string;
  createdAt: string;
  ruleHash: string;
}

export type BindingStatus = 'CANDIDATE' | 'MATCHED' | 'MISMATCH' | 'REVIEW_REQUIRED' | 'VERIFIED' | 'STALE';

export interface RuleBinding {
  id: string;
  ruleId: string;
  moduleId: string;
  calculationStepId: string;
  codeReference: { file: string; symbol: string; function: string; };
  implementationType: 'FORMULA' | 'CONSTANT' | 'LIMIT' | 'BRANCH' | 'LOOKUP_TABLE' | 'MATERIAL_PROPERTY';
  bindingStatus: BindingStatus;
}

export interface EngineRuleSnapshot {
  moduleId: string;
  calculationStepId: string;
  formula: string;
  constants: Record<string, number>;
  limits: Record<string, number>;
  units: Record<string, string>;
  sourceCodeReference: string;
  engineVersion: string;
  snapshotHash: string;
}

export type DiffType =
  | 'FORMULA_MATCH' | 'FORMULA_MISMATCH'
  | 'CONSTANT_MATCH' | 'CONSTANT_MISMATCH'
  | 'LIMIT_MATCH' | 'LIMIT_MISMATCH'
  | 'UNIT_MATCH' | 'UNIT_MISMATCH'
  | 'MISSING_IMPLEMENTATION' | 'UNKNOWN';

export interface RuleDiff {
  ruleId: string;
  bindingId: string;
  moduleId: string;
  calculationStepId: string;
  differenceType: DiffType;
  normativeValue?: string;
  engineValue?: string;
  evidenceIds: string[];
  severity: 'INFO' | 'WARNING' | 'HIGH';
  explanation: string;
}

export interface RuleChangeProposal {
  proposalId: string;
  ruleId: string;
  bindingId: string;
  affectedModule: string;
  currentImplementation: string;
  normativeRequirement: string;
  proposedChange: string;
  evidenceIds: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'DRAFT' | 'REVIEW_REQUIRED' | 'APPROVED' | 'REJECTED' | 'APPLIED';
}

/** RuleDiff 比较器 */
export function compareRuleToSnapshot(
  rule: EngineeringRule,
  binding: RuleBinding,
  snapshot: EngineRuleSnapshot
): RuleDiff[] {
  const diffs: RuleDiff[] = [];

  // 公式比较
  if (rule.expression.humanReadable.replace(/\s/g, '') !== snapshot.formula.replace(/\s/g, '')) {
    diffs.push({
      ruleId: rule.id,
      bindingId: binding.id,
      moduleId: snapshot.moduleId,
      calculationStepId: snapshot.calculationStepId,
      differenceType: 'FORMULA_MISMATCH',
      normativeValue: rule.expression.humanReadable,
      engineValue: snapshot.formula,
      evidenceIds: rule.sourceEvidenceIds,
      severity: 'HIGH',
      explanation: '规范公式与 Engine 实现不一致',
    });
  } else {
    diffs.push({
      ruleId: rule.id,
      bindingId: binding.id,
      moduleId: snapshot.moduleId,
      calculationStepId: snapshot.calculationStepId,
      differenceType: 'FORMULA_MATCH',
      evidenceIds: rule.sourceEvidenceIds,
      severity: 'INFO',
      explanation: '公式一致',
    });
  }

  // 常数比较
  for (const [key, normVal] of Object.entries(rule.limitValues || {})) {
    const engineVal = snapshot.constants[key];
    if (engineVal === undefined) {
      diffs.push({
        ruleId: rule.id, bindingId: binding.id,
        moduleId: snapshot.moduleId, calculationStepId: snapshot.calculationStepId,
        differenceType: 'MISSING_IMPLEMENTATION',
        normativeValue: String(normVal), engineValue: 'undefined',
        evidenceIds: rule.sourceEvidenceIds, severity: 'HIGH',
        explanation: `规范要求常数 ${key}=${normVal}，Engine 未实现`,
      });
    } else if (Number(engineVal) !== Number(normVal)) {
      diffs.push({
        ruleId: rule.id, bindingId: binding.id,
        moduleId: snapshot.moduleId, calculationStepId: snapshot.calculationStepId,
        differenceType: 'CONSTANT_MISMATCH',
        normativeValue: String(normVal), engineValue: String(engineVal),
        evidenceIds: rule.sourceEvidenceIds, severity: 'HIGH',
        explanation: `常数 ${key} 规范=${normVal}，Engine=${engineVal}`,
      });
    }
  }

  return diffs;
}
