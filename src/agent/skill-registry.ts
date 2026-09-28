import beamShearManifest from '../../skills/beam-shear/skill.json';
import beamShearSchema from '../../skills/beam-shear/schema.json';
import beamShearEvidence from '../../skills/beam-shear/evidence.json';
import beamShearTests from '../../skills/beam-shear/tests.json';
import beamFlexureManifest from '../../skills/beam-flexure/skill.json';
import beamFlexureSchema from '../../skills/beam-flexure/schema.json';
import beamFlexureEvidence from '../../skills/beam-flexure/evidence.json';
import beamFlexureTests from '../../skills/beam-flexure/tests.json';
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
import slabOneWayManifest from '../../skills/slab-one-way/skill.json';
import slabOneWaySchema from '../../skills/slab-one-way/schema.json';
import slabOneWayEvidence from '../../skills/slab-one-way/evidence.json';
import slabOneWayTests from '../../skills/slab-one-way/tests.json';
import slabTwoWayManifest from '../../skills/slab-two-way/skill.json';
import slabTwoWaySchema from '../../skills/slab-two-way/schema.json';
import slabTwoWayEvidence from '../../skills/slab-two-way/evidence.json';
import slabTwoWayTests from '../../skills/slab-two-way/tests.json';
import foundationIndependentManifest from '../../skills/foundation-independent/skill.json';
import foundationIndependentSchema from '../../skills/foundation-independent/schema.json';
import foundationIndependentEvidence from '../../skills/foundation-independent/evidence.json';
import foundationIndependentTests from '../../skills/foundation-independent/tests.json';
import staircasePlateManifest from '../../skills/staircase-plate/skill.json';
import staircasePlateSchema from '../../skills/staircase-plate/schema.json';
import staircasePlateEvidence from '../../skills/staircase-plate/evidence.json';
import staircasePlateTests from '../../skills/staircase-plate/tests.json';

import { invokeBeamFlexure, isBeamFlexureInput } from '../../skills/beam-flexure/calculator';
import { invokeBeamShear, isBeamShearInput } from '../../skills/beam-shear/calculator';
import { invokeColumn, isColumnSkillInput } from '../../skills/column/calculator';
import { invokeOneWaySlab, isOneWaySlabInput } from '../../skills/slab-one-way/calculator';
import { invokeTwoWaySlab, isTwoWaySlabInput } from '../../skills/slab-two-way/calculator';
import { invokeIndependentFoundation, isIndependentFoundationInput } from '../../skills/foundation-independent/calculator';
import { invokePlateStair, isPlateStairInput } from '../../skills/staircase-plate/calculator';
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

const slabOneWayPackage: SkillPackage = {
  manifest: slabOneWayManifest as SkillManifest,
  schema: slabOneWaySchema as SkillInputSchema,
  evidence: slabOneWayEvidence as SkillEvidenceCatalog,
  tests: slabOneWayTests as SkillTestCatalog,
};

const slabTwoWayPackage: SkillPackage = {
  manifest: slabTwoWayManifest as SkillManifest,
  schema: slabTwoWaySchema as SkillInputSchema,
  evidence: slabTwoWayEvidence as SkillEvidenceCatalog,
  tests: slabTwoWayTests as SkillTestCatalog,
};

const foundationIndependentPackage: SkillPackage = {
  manifest: foundationIndependentManifest as SkillManifest,
  schema: foundationIndependentSchema as SkillInputSchema,
  evidence: foundationIndependentEvidence as SkillEvidenceCatalog,
  tests: foundationIndependentTests as SkillTestCatalog,
};

const staircasePlatePackage: SkillPackage = {
  manifest: staircasePlateManifest as SkillManifest,
  schema: staircasePlateSchema as SkillInputSchema,
  evidence: staircasePlateEvidence as SkillEvidenceCatalog,
  tests: staircasePlateTests as SkillTestCatalog,
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

const columnSkill: CalculationSkill = {
  package: columnPackage,
  accepts: isColumnSkillInput,
  calculate: invokeColumn,
};

const slabOneWaySkill: CalculationSkill = {
  package: slabOneWayPackage,
  accepts: isOneWaySlabInput,
  calculate: invokeOneWaySlab,
};

const slabTwoWaySkill: CalculationSkill = {
  package: slabTwoWayPackage,
  accepts: isTwoWaySlabInput,
  calculate: invokeTwoWaySlab,
};

const foundationIndependentSkill: CalculationSkill = {
  package: foundationIndependentPackage,
  accepts: isIndependentFoundationInput,
  calculate: invokeIndependentFoundation,
};

const staircasePlateSkill: CalculationSkill = {
  package: staircasePlatePackage,
  accepts: isPlateStairInput,
  calculate: invokePlateStair,
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
    this.registerCalculation(beamShearSkill);
    this.registerCalculation(columnSkill);
    this.registerCalculation(slabOneWaySkill);
    this.registerCalculation(slabTwoWaySkill);
    this.registerCalculation(foundationIndependentSkill);
    this.registerCalculation(staircasePlateSkill);
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
export { columnPackage as columnSkillPackage };
export { calculationAuditorPackage as calculationAuditorSkillPackage };
export { gb50010Package };
export { slabOneWayPackage as slabOneWaySkillPackage };
export { slabTwoWayPackage as slabTwoWaySkillPackage };
export { foundationIndependentPackage as foundationIndependentSkillPackage };
export { staircasePlatePackage as staircasePlateSkillPackage };
