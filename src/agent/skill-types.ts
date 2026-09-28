import { CalculationResult } from '../types/calculation';
import { VerificationStatus } from '../types/evidence';
import { CodeStatus } from '../normative/types';

export type SkillKind = 'calculation' | 'normative' | 'auditor';

export interface SkillFormulaMapping {
  id: string;
  expression: string;
  evidenceId: string;
  requiredInputFields: string[];
}

export interface SkillManifest {
  id: string;
  name: string;
  kind: SkillKind;
  version: string;
  description: string;
  component: string;
  calculatorEntry: string;
  legacyEntry?: string;
  inputSchema: string;
  evidenceCatalog: string;
  testCatalog: string;
  outputType: string;
  applicability: string[];
  boundaryChecks: string[];
  formulaMappings: SkillFormulaMapping[];
  status: 'REVIEW_REQUIRED' | 'VERIFIED';
  supportedUnits: string[];
}

export interface SkillSchemaProperty {
  type: string;
  unit?: string;
  description?: string;
  enum?: string[];
}

export interface SkillInputSchema {
  $schema?: string;
  type: 'object';
  required: string[];
  properties: Record<string, SkillSchemaProperty>;
  allOf?: Record<string, unknown>[];
}

export interface SkillEvidenceRecord {
  id: string;
  codeName: string;
  codeNumber: string;
  edition: string;
  chapter: string;
  clause: string;
  /** 条文原文（仅来自可靠原文核验，未核验时为空，绝不编造） */
  text?: string;
  sourceFile: string | null;
  pdfPage: number | null;
  applicability: string;
  formulaExpression?: string;
  verificationStatus: 'REVIEW_REQUIRED' | 'VERIFIED' | 'UNVERIFIED';
}

export interface SkillEvidenceCatalog {
  records: SkillEvidenceRecord[];
}

export type SkillTestCategory = 'normal' | 'boundary' | 'invalid' | 'unit' | 'formula' | 'pass-fail';

export interface SkillTestCase {
  id: string;
  category: SkillTestCategory;
  file: string;
  description: string;
}

export interface SkillTestCatalog {
  cases: SkillTestCase[];
}

export interface SkillPackage {
  manifest: SkillManifest;
  schema: SkillInputSchema;
  evidence: SkillEvidenceCatalog;
  tests: SkillTestCatalog;
}

export interface CalculationSkill {
  package: SkillPackage;
  accepts(input: unknown): boolean;
  calculate(input: unknown): CalculationResult;
}

// ---------------------------------------------------------------------------
// Normative Skill: 只回答"规范说什么"，不做任何工程计算
// ---------------------------------------------------------------------------

export interface NormativeQuery {
  /** 规范编号，如 "GB50010" 或 "GB 50010" */
  code: string;
  /** 条文号，如 "6.2.10" */
  clause: string;
  /** 可选：指定规范版本（edition 标识，如 "2010（2015年版）"） */
  edition?: string;
  /** 可选：按项目实施日期选择版本（ISO yyyy-mm-dd） */
  effectiveDate?: string;
}

export interface NormativeAnswer {
  /** 原始查询 */
  query: NormativeQuery;
  /** 规范名称，如 "混凝土结构设计规范" */
  codeName: string;
  /** 规范编号，如 "GB 50010" */
  codeNumber: string;
  /** 版本/年份，如 "2010（2015年版）" */
  edition: string;
  /** 版本生命周期状态（CURRENT/UPCOMING/SUPERSEDED/REVIEW_REQUIRED） */
  codeStatus?: CodeStatus;
  /** 该版本实施日期 */
  effectiveDate?: string;
  /** 被哪个版本取代（如有） */
  replacedBy?: string;
  /** 章节号 */
  chapter: string;
  /** 条文号 */
  clause: string;
  /** 条文原文（仅来自可靠原文核验，未校核时为空字符串，绝不编造） */
  text: string;
  /** PDF 页码，未导入时为 null */
  page: number | null;
  /** 来源文件 */
  source: string | null;
  /** 校核状态 */
  verificationStatus: VerificationStatus;
  /** 适用范围说明 */
  applicability: string;
  /** 警告（如"该条文已修订""该版本已被取代"） */
  warnings: string[];
}

export interface NormativeSkill {
  package: SkillPackage;
  /** 查询规范条文，返回 NormativeAnswer（禁止返回 CalculationResult） */
  resolve(query: NormativeQuery): NormativeAnswer;
}

