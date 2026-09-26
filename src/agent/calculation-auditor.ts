import {
  SkillPackage,
  SkillEvidenceRecord,
  SkillTestCategory,
} from './skill-types';

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
  '', 'dimensionless', 'enum', 'grade', '%', 'mm', 'mm²', 'm', 'm²', 'N', 'kN', 'N·m', 'kN·m', 'MPa', '肢',
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
}

function auditTests(skill: SkillPackage, issues: AuditIssue[]) {
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
