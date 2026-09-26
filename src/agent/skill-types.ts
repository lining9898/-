import { CalculationResult } from '../types/calculation';

export type SkillKind = 'calculation' | 'auditor';

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
