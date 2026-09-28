import {
  SkillPackage,
  SkillEvidenceRecord,
  SkillTestCategory,
} from './skill-types';
import { CalculationResult, CalculationStep, CheckItem } from '../types/calculation';
import { Evidence } from '../types/evidence';

export type AuditSeverity = 'error' | 'warning' | 'info';

export interface AuditIssue {
  severity: AuditSeverity;
  code: string;
  message: string;
}

export interface CalculationAuditResult {
  skillId: string;
  checkedAt: string;
  passed: boolean;
  issues: AuditIssue[];
  summary: string;
}

const supportedUnits = new Set([
  '', 'dimensionless', 'enum', 'grade', '%', 'mm', 'mm²', 'm', 'm²', 'N', 'kN', 'N·m', 'kN·m', 'MPa', 'N/mm²', '肢', '根',
  'kN/m', 'kN/m²', 'kN/m³', 'kPa', 'mm²/m', 'kN·m/m',
]);

const normalizeFormula = (formula: string) => formula.replace(/\s+/g, '').replace(/·/g, '*');

function issue(issues: AuditIssue[], severity: AuditSeverity, code: string, message: string) {
  issues.push({ severity, code, message });
}

function auditFormulaMappings(skill: SkillPackage, issues: AuditIssue[]) {
  const records = new Map(skill.evidence.records.map(record => [record.id, record]));
  for (const mapping of skill.manifest.formulaMappings) {
    const record = records.get(mapping.evidenceId);
    if (!record) {
      issue(issues, 'error', 'FORMULA_EVIDENCE_MISSING', `公式 ${mapping.id} 没有对应 Evidence：${mapping.evidenceId}`);
      continue;
    }
    if (!record.formulaExpression) {
      issue(issues, 'error', 'FORMULA_SOURCE_MISSING', `Evidence ${record.id} 未登记公式表达式`);
    } else if (normalizeFormula(mapping.expression) !== normalizeFormula(record.formulaExpression)) {
      issue(issues, 'error', 'FORMULA_MAPPING_MISMATCH', `公式 ${mapping.id} 与 Evidence ${record.id} 的表达式不一致`);
    }
    for (const field of mapping.requiredInputFields) {
      if (!skill.schema.properties[field]) {
        issue(issues, 'error', 'FORMULA_INPUT_MISSING', `公式 ${mapping.id} 使用了未在 schema 登记的输入：${field}`);
      }
    }
  }
}

function auditUnits(skill: SkillPackage, issues: AuditIssue[]) {
  // 单位声明只对 calculation Skill 有意义；normative / auditor 无工程量。
  if (skill.manifest.kind !== 'calculation') return;
  for (const [name, property] of Object.entries(skill.schema.properties)) {
    if (property.unit === undefined) {
      issue(issues, 'error', 'UNIT_MISSING', `输入 ${name} 没有单位声明`);
    } else if (!supportedUnits.has(property.unit)) {
      issue(issues, 'warning', 'UNIT_UNKNOWN', `输入 ${name} 使用了未登记的单位：${property.unit}`);
    }
  }
  for (const unit of skill.manifest.supportedUnits) {
    if (!supportedUnits.has(unit)) issue(issues, 'warning', 'SKILL_UNIT_UNKNOWN', `Skill 声明了未知单位：${unit}`);
  }
}

function auditEvidence(skill: SkillPackage, issues: AuditIssue[]) {
  if (skill.evidence.records.length === 0) {
    issue(issues, 'error', 'EVIDENCE_EMPTY', 'Skill 没有规范依据记录');
  }
  for (const record of skill.evidence.records) {
    const required: [keyof SkillEvidenceRecord, string][] = [
      ['codeName', '规范名称'], ['codeNumber', '规范编号'], ['edition', '版本'],
      ['chapter', '章节'], ['clause', '条文号'], ['applicability', '适用条件'],
    ];
    for (const [key, label] of required) {
      if (!record[key]) issue(issues, 'error', 'EVIDENCE_FIELD_MISSING', `${record.id} 缺少${label}`);
    }
    if (record.verificationStatus !== 'VERIFIED') {
      issue(issues, 'warning', 'EVIDENCE_REVIEW_REQUIRED', `${record.id} 仍为 ${record.verificationStatus}`);
    }
    if (record.verificationStatus === 'VERIFIED' && (!record.sourceFile || record.pdfPage === null)) {
      issue(issues, 'error', 'VERIFIED_SOURCE_MISSING', `${record.id} 标记 VERIFIED 但缺少 PDF 来源或页码`);
    }
  }
  // 同一 Skill 的规范证据必须引用一致的设计依据版本，避免旧算例随默认版本漂移。
  // 仅统计真正的规范证据（codeNumber 以 INTERNAL- 开头或 edition 为 platform 的内部记录除外）。
  const normativeRecords = skill.evidence.records.filter(
    r => !/^INTERNAL-/.test(r.codeNumber) && r.edition !== 'platform'
  );
  const editions = new Set(normativeRecords.map(r => r.edition).filter(Boolean));
  if (editions.size > 1) {
    issue(issues, 'error', 'EDITION_INCONSISTENT',
      `Skill 的规范 Evidence 版本不一致：${[...editions].join(' / ')}`);
  }
}

function auditTests(skill: SkillPackage, issues: AuditIssue[]) {
  // 六类测试登记是 calculation Skill 的质量要求；normative / auditor 不需要此契约。
  if (skill.manifest.kind !== 'calculation') return;
  const categories = new Set(skill.tests.cases.map(test => test.category));
  const required: SkillTestCategory[] = ['normal', 'boundary', 'invalid', 'unit', 'formula', 'pass-fail'];
  for (const category of required) {
    if (!categories.has(category)) issue(issues, 'error', 'TEST_CATEGORY_MISSING', `缺少 ${category} 测试登记`);
  }
  for (const test of skill.tests.cases) {
    if (!test.file || !test.description) issue(issues, 'error', 'TEST_METADATA_MISSING', `测试 ${test.id} 元数据不完整`);
  }
}

export function auditSkillPackage(skill: SkillPackage): CalculationAuditResult {
  const issues: AuditIssue[] = [];
  if (!skill.manifest.id || !skill.manifest.name || !skill.manifest.description) {
    issue(issues, 'error', 'MANIFEST_IDENTITY_MISSING', 'Skill manifest 缺少身份或功能描述');
  }
  if (skill.manifest.applicability.length === 0) issue(issues, 'error', 'APPLICABILITY_EMPTY', 'Skill 没有登记适用条件');
  if (skill.manifest.boundaryChecks.length === 0) issue(issues, 'error', 'BOUNDARY_CHECKS_EMPTY', 'Skill 没有登记边界条件');
  auditFormulaMappings(skill, issues);
  auditUnits(skill, issues);
  auditEvidence(skill, issues);
  auditTests(skill, issues);
  const errors = issues.filter(item => item.severity === 'error').length;
  return {
    skillId: skill.manifest.id,
    checkedAt: new Date().toISOString(),
    passed: errors === 0,
    issues,
    summary: errors === 0
      ? `Skill ${skill.manifest.id} 的公式映射、单位、边界、Evidence 和测试登记通过结构审查；规范校核状态仍以 Evidence 为准。`
      : `Skill ${skill.manifest.id} 存在 ${errors} 个错误，需要修复后才能进入调用层。`,
  };
}

// ---------------------------------------------------------------------------
// Runtime CalculationResult auditor
// ---------------------------------------------------------------------------
// 说明：本审计只“检查”一个已生成的计算结果，不自行执行任何结构计算公式。
// 用于在结果进入计算书/UI 之前发现 NaN、Infinity、单位不一致、Evidence 版本漂移等缺陷。

export interface CalculationResultAuditOptions {
  /** 期望的设计依据版本（如 '2010（2015年版）'）。传入后，结果证据版本必须一致。 */
  expectedEdition?: string;
}

export function auditCalculationResult(
  result: CalculationResult,
  options: CalculationResultAuditOptions = {}
): CalculationAuditResult {
  const issues: AuditIssue[] = [];

  // 1) invalid numeric result / NaN / Infinity
  const collectFinite = (where: string, value: number | string | undefined) => {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      const kind = Number.isNaN(value) ? 'NaN' : (value === Infinity || value === -Infinity ? 'Infinity' : '非有限值');
      issue(issues, 'error', 'NON_FINITE_RESULT', `${where} 产生了 ${kind}：${value}`);
    }
  };
  for (const item of result.inputs) collectFinite(`输入 ${item.label}`, item.value);
  for (const item of result.materials) collectFinite(`材料 ${item.label}`, item.value);
  for (const item of result.geometry) collectFinite(`几何 ${item.label}`, item.value);
  for (const step of result.steps) {
    collectFinite(`步骤 ${step.name}`, step.result);
    for (const e of step.evidence) collectEvidence(e);
  }
  for (const item of result.results) collectFinite(`结果 ${item.label}`, item.value);
  for (const check of result.checks) {
    collectFinite(`验算 ${check.name} calculatedValue`, check.calculatedValue);
    collectFinite(`验算 ${check.name} limitValue`, check.limitValue);
  }

  // 2) unit mismatch：数值结果/步骤缺少单位或单位含歧义标签
  for (const step of result.steps) {
    if (typeof step.result === 'number' && !step.unit) {
      issue(issues, 'warning', 'STEP_UNIT_MISSING', `步骤 ${step.name} 的数值结果缺少单位`);
    } else if (typeof step.result === 'number' && /[()（）]/.test(step.unit)) {
      issue(issues, 'warning', 'STEP_UNIT_AMBIGUOUS', `步骤 ${step.name} 的单位含歧义标签：${step.unit}`);
    }
  }
  for (const item of result.results) {
    if (typeof item.value === 'number' && !item.unit) {
      issue(issues, 'warning', 'RESULT_UNIT_MISSING', `结果 ${item.label} 缺少单位`);
    }
  }

  // 3) missing evidence：带工程数值的步骤缺少规范依据
  const engineeringNames = /承载力|弯矩|剪力|配筋|高度|面积|应力|内力|反力/;
  for (const step of result.steps) {
    if (step.evidence.length === 0 && engineeringNames.test(step.name)) {
      issue(issues, 'warning', 'STEP_EVIDENCE_MISSING', `工程步骤 ${step.name} 缺少 Evidence`);
    }
  }

  // 4) version mismatch：结果证据版本与指定设计依据不一致，或结果内部版本漂移
  function collectEvidence(e: Evidence) {
    if (options.expectedEdition && e.edition !== options.expectedEdition) {
      issue(issues, 'error', 'EDITION_MISMATCH', `证据 ${e.clause} 版本 "${e.edition}" 与指定设计依据 "${options.expectedEdition}" 不一致`);
    }
  }
  const allResultEvidence = [
    ...result.allEvidence,
    ...result.steps.flatMap(s => s.evidence),
    ...result.checks.flatMap(c => c.evidence),
    ...result.conclusion.evidence,
  ];
  const editions = new Set(allResultEvidence.map(e => e.edition).filter(Boolean));
  for (const e of allResultEvidence) {
    if (!e.edition) issue(issues, 'warning', 'EVIDENCE_EDITION_EMPTY', `证据 ${e.clause} 未声明版本`);
    collectEvidence(e);
  }
  if (editions.size > 1) {
    issue(issues, 'error', 'RESULT_EDITION_MIXED', `CalculationResult 内 Evidence 版本混杂：${[...editions].join(' / ')}`);
  }

  // 5) unsupported applicability / unknown evidenceId / unverified evidence
  for (const e of allResultEvidence) {
    if (e.verificationStatus === 'REVIEW_REQUIRED' || e.verificationStatus === 'UNVERIFIED') {
      issue(issues, 'warning', 'UNVERIFIED_EVIDENCE', `证据 ${e.clause} 仍未校核：${e.verificationStatus}`);
    }
  }

  const errors = issues.filter(item => item.severity === 'error').length;
  return {
    skillId: result.calculatorType,
    checkedAt: new Date().toISOString(),
    passed: errors === 0,
    issues,
    summary: errors === 0
      ? `CalculationResult ${result.calculatorType} 未发现 NaN/Infinity、单位缺失、版本混杂或缺失证据等阻断问题。`
      : `CalculationResult ${result.calculatorType} 存在 ${errors} 个错误，需修复后才能用于计算书。`,
  };
}
