import beamShearManifest from '../../skills/beam-shear/skill.json';
import beamShearSchema from '../../skills/beam-shear/schema.json';
import beamShearEvidence from '../../skills/beam-shear/evidence.json';
import beamShearTests from '../../skills/beam-shear/tests.json';
import beamFlexureManifest from '../../skills/beam-flexure/skill.json';
import beamFlexureSchema from '../../skills/beam-flexure/schema.json';
import beamFlexureEvidence from '../../skills/beam-flexure/evidence.json';
import beamFlexureTests from '../../skills/beam-flexure/tests.json';
import beamTFlexureManifest from '../../skills/beam-t-flexure/skill.json';
import beamTFlexureSchema from '../../skills/beam-t-flexure/schema.json';
import beamTFlexureEvidence from '../../skills/beam-t-flexure/evidence.json';
import beamTFlexureTests from '../../skills/beam-t-flexure/tests.json';
import beamDoubleFlexureManifest from '../../skills/beam-double-flexure/skill.json';
import beamDoubleFlexureSchema from '../../skills/beam-double-flexure/schema.json';
import beamDoubleFlexureEvidence from '../../skills/beam-double-flexure/evidence.json';
import beamDoubleFlexureTests from '../../skills/beam-double-flexure/tests.json';
import beamContinuousManifest from '../../skills/beam-continuous/skill.json';
import beamContinuousSchema from '../../skills/beam-continuous/schema.json';
import beamContinuousEvidence from '../../skills/beam-continuous/evidence.json';
import beamContinuousTests from '../../skills/beam-continuous/tests.json';
import auditorManifest from '../../skills/calculation-auditor/skill.json';
import auditorSchema from '../../skills/calculation-auditor/schema.json';
import auditorEvidence from '../../skills/calculation-auditor/evidence.json';
import auditorTests from '../../skills/calculation-auditor/tests.json';
import columnManifest from '../../skills/column/skill.json';
import columnSchema from '../../skills/column/schema.json';
import columnEvidence from '../../skills/column/evidence.json';
import columnTests from '../../skills/column/tests.json';
import gb50010Manifest from '../../skills/gb50010/skill.json';
import gb50010Schema from '../../skills/gb50010/schema.json';
import gb50010Evidence from '../../skills/gb50010/evidence.json';
import gb50010Tests from '../../skills/gb50010/tests.json';

import { invokeBeamFlexure, isBeamFlexureInput } from '../../skills/beam-flexure/calculator';
import { invokeBeamTFlexure, isBeamTFlexureInput } from '../../skills/beam-t-flexure/calculator';
import { invokeBeamDoubleFlexure, isBeamDoubleFlexureInput } from '../../skills/beam-double-flexure/calculator';
import { invokeBeamShear, isBeamShearInput } from '../../skills/beam-shear/calculator';
import { invokeContinuousBeam, isContinuousBeamInput } from '../../skills/beam-continuous/calculator';
import { invokeColumn, isColumnSkillInput } from '../../skills/column/calculator';
import { auditSkillPackage, CalculationAuditResult } from './calculation-auditor';
import { gb50010Skill } from '../../skills/gb50010/resolver';
import {
  CalculationSkill,
  NormativeAnswer,
  NormativeQuery,
  NormativeSkill,
  SkillEvidenceCatalog,
  SkillInputSchema,
  SkillManifest,
  SkillPackage,
  SkillTestCatalog,
} from './skill-types';

// ---------------------------------------------------------------------------
// Build packages
// ---------------------------------------------------------------------------

const beamShearPackage: SkillPackage = {
  manifest: beamShearManifest as SkillManifest,
  schema: beamShearSchema as SkillInputSchema,
  evidence: beamShearEvidence as SkillEvidenceCatalog,
  tests: beamShearTests as SkillTestCatalog,
};

const beamFlexurePackage: SkillPackage = {
  manifest: beamFlexureManifest as SkillManifest,
  schema: beamFlexureSchema as SkillInputSchema,
  evidence: beamFlexureEvidence as SkillEvidenceCatalog,
  tests: beamFlexureTests as SkillTestCatalog,
};

const beamTFlexurePackage: SkillPackage = {
  manifest: beamTFlexureManifest as SkillManifest,
  schema: beamTFlexureSchema as SkillInputSchema,
  evidence: beamTFlexureEvidence as SkillEvidenceCatalog,
  tests: beamTFlexureTests as SkillTestCatalog,
};

const beamDoubleFlexurePackage: SkillPackage = {
  manifest: beamDoubleFlexureManifest as SkillManifest,
  schema: beamDoubleFlexureSchema as SkillInputSchema,
  evidence: beamDoubleFlexureEvidence as SkillEvidenceCatalog,
  tests: beamDoubleFlexureTests as SkillTestCatalog,
};

const beamContinuousPackage: SkillPackage = {
  manifest: beamContinuousManifest as SkillManifest,
  schema: beamContinuousSchema as SkillInputSchema,
  evidence: beamContinuousEvidence as SkillEvidenceCatalog,
  tests: beamContinuousTests as SkillTestCatalog,
};

const columnPackage: SkillPackage = {
  manifest: columnManifest as SkillManifest,
  schema: columnSchema as SkillInputSchema,
  evidence: columnEvidence as SkillEvidenceCatalog,
  tests: columnTests as SkillTestCatalog,
};

const calculationAuditorPackage: SkillPackage = {
  manifest: auditorManifest as SkillManifest,
  schema: auditorSchema as SkillInputSchema,
  evidence: auditorEvidence as SkillEvidenceCatalog,
  tests: auditorTests as SkillTestCatalog,
};

const gb50010Package: SkillPackage = {
  manifest: gb50010Manifest as SkillManifest,
  schema: gb50010Schema as SkillInputSchema,
  evidence: gb50010Evidence as SkillEvidenceCatalog,
  tests: gb50010Tests as SkillTestCatalog,
};

// ---------------------------------------------------------------------------
// Skill instances
// ---------------------------------------------------------------------------

const beamShearSkill: CalculationSkill = {
  package: beamShearPackage,
  accepts: isBeamShearInput,
  calculate: invokeBeamShear,
};

const beamFlexureSkill: CalculationSkill = {
  package: beamFlexurePackage,
  accepts: isBeamFlexureInput,
  calculate: invokeBeamFlexure,
};

const beamTFlexureSkill: CalculationSkill = {
  package: beamTFlexurePackage,
  accepts: isBeamTFlexureInput,
  calculate: invokeBeamTFlexure,
};

const beamDoubleFlexureSkill: CalculationSkill = {
  package: beamDoubleFlexurePackage,
  accepts: isBeamDoubleFlexureInput,
  calculate: invokeBeamDoubleFlexure,
};

const beamContinuousSkill: CalculationSkill = {
  package: beamContinuousPackage,
  accepts: isContinuousBeamInput,
  calculate: invokeContinuousBeam,
};

const columnSkill: CalculationSkill = {
  package: columnPackage,
  accepts: isColumnSkillInput,
  calculate: invokeColumn,
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export interface SkillSummary {
  id: string;
  name: string;
  kind: string;
  description: string;
  status: string;
  component: string;
  inputSchema: string;
}

export class SkillRegistry {
  private readonly calculationSkills = new Map<string, CalculationSkill>();
  private readonly normativeSkills = new Map<string, NormativeSkill>();
  private readonly auditPackages = new Map<string, SkillPackage>();

  constructor() {
    this.registerCalculation(beamFlexureSkill);
    this.registerCalculation(beamTFlexureSkill);
    this.registerCalculation(beamDoubleFlexureSkill);
    this.registerCalculation(beamShearSkill);
    this.registerCalculation(columnSkill);
    this.registerCalculation(beamContinuousSkill);
    this.registerNormative(gb50010Skill);
    this.registerAuditor(calculationAuditorPackage);
  }

  registerCalculation(skill: CalculationSkill): void {
    if (skill.package.manifest.kind !== 'calculation') {
      throw new Error(`只能注册 calculation Skill：${skill.package.manifest.id}`);
    }
    if (this.calculationSkills.has(skill.package.manifest.id)) {
      throw new Error(`Skill 已注册：${skill.package.manifest.id}`);
    }
    this.calculationSkills.set(skill.package.manifest.id, skill);
  }

  registerNormative(skill: NormativeSkill): void {
    if (skill.package.manifest.kind !== 'normative') {
      throw new Error(`只能注册 normative Skill：${skill.package.manifest.id}`);
    }
    if (this.normativeSkills.has(skill.package.manifest.id)) {
      throw new Error(`Skill 已注册：${skill.package.manifest.id}`);
    }
    this.normativeSkills.set(skill.package.manifest.id, skill);
  }

  registerAuditor(skill: SkillPackage): void {
    if (skill.manifest.kind !== 'auditor') {
      throw new Error(`只能注册 auditor Skill：${skill.manifest.id}`);
    }
    if (this.auditPackages.has(skill.manifest.id)) {
      throw new Error(`Skill 已注册：${skill.manifest.id}`);
    }
    this.auditPackages.set(skill.manifest.id, skill);
  }

  list(): SkillSummary[] {
    const packages = [
      ...[...this.calculationSkills.values()].map(s => s.package),
      ...[...this.normativeSkills.values()].map(s => s.package),
      ...this.auditPackages.values(),
    ];
    return packages.map(p => ({
      id: p.manifest.id,
      name: p.manifest.name,
      kind: p.manifest.kind,
      description: p.manifest.description,
      status: p.manifest.status,
      component: p.manifest.component,
      inputSchema: p.manifest.inputSchema,
    }));
  }

  describe(id: string): SkillPackage | undefined {
    return (
      this.calculationSkills.get(id)?.package ??
      this.normativeSkills.get(id)?.package ??
      this.auditPackages.get(id)
    );
  }

  calculate(id: string, input: unknown) {
    const skill = this.calculationSkills.get(id);
    if (!skill) throw new Error(`未找到计算 Skill：${id}`);
    return skill.calculate(input);
  }

  resolve(query: NormativeQuery): NormativeAnswer {
    // 在所有 normative skills 中查找匹配规范编号的 skill
    for (const skill of this.normativeSkills.values()) {
      const codeMatch = skill.package.evidence.records.some(
        r => r.codeNumber.replace(/[\s-]/g, '').toUpperCase() ===
              query.code.replace(/[\s-]/g, '').toUpperCase()
      );
      if (codeMatch) return skill.resolve(query);
    }
    // 兜底：返回未收录
    return {
      query,
      codeName: '未知规范',
      codeNumber: query.code,
      edition: '',
      chapter: '',
      clause: query.clause,
      text: '',
      page: null,
      source: null,
      verificationStatus: 'UNVERIFIED',
      applicability: '未收录规范',
      warnings: ['该规范暂未接入 normative Skill。'],
    };
  }

  audit(id: string): CalculationAuditResult {
    const pkg = this.describe(id);
    if (!pkg) throw new Error(`未找到 Skill：${id}`);
    return auditSkillPackage(pkg);
  }
}

export const skillRegistry = new SkillRegistry();
export const registeredAuditorSkillId = auditorManifest.id;
export { beamShearPackage as beamShearSkillPackage };
export { beamFlexurePackage as beamFlexureSkillPackage };
export { beamTFlexurePackage as beamTFlexureSkillPackage };
export { beamDoubleFlexurePackage as beamDoubleFlexureSkillPackage };
export { beamContinuousPackage as beamContinuousSkillPackage };
export { columnPackage as columnSkillPackage };
export { calculationAuditorPackage as calculationAuditorSkillPackage };
export { gb50010Package };
