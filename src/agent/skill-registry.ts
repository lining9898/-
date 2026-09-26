import beamManifest from '../../skills/beam-shear/skill.json';
import beamSchema from '../../skills/beam-shear/schema.json';
import beamEvidence from '../../skills/beam-shear/evidence.json';
import beamTests from '../../skills/beam-shear/tests.json';
import auditorManifest from '../../skills/calculation-auditor/skill.json';
import auditorSchema from '../../skills/calculation-auditor/schema.json';
import auditorEvidence from '../../skills/calculation-auditor/evidence.json';
import auditorTests from '../../skills/calculation-auditor/tests.json';
import { invokeBeamShear, isBeamShearInput } from '../../skills/beam-shear/calculator';
import { auditSkillPackage, CalculationAuditResult } from './calculation-auditor';
import {
  CalculationSkill,
  SkillEvidenceCatalog,
  SkillInputSchema,
  SkillManifest,
  SkillPackage,
  SkillTestCatalog,
} from './skill-types';

const beamShearPackage: SkillPackage = {
  manifest: beamManifest as SkillManifest,
  schema: beamSchema as SkillInputSchema,
  evidence: beamEvidence as SkillEvidenceCatalog,
  tests: beamTests as SkillTestCatalog,
};

export const beamShearSkillPackage = beamShearPackage;

const beamShearSkill: CalculationSkill = {
  package: beamShearPackage,
  accepts: isBeamShearInput,
  calculate: invokeBeamShear,
};

const calculationAuditorPackage: SkillPackage = {
  manifest: auditorManifest as SkillManifest,
  schema: auditorSchema as SkillInputSchema,
  evidence: auditorEvidence as SkillEvidenceCatalog,
  tests: auditorTests as SkillTestCatalog,
};

export const calculationAuditorSkillPackage = calculationAuditorPackage;

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
  private readonly auditPackages = new Map<string, SkillPackage>();

  constructor() {
    this.registerCalculation(beamShearSkill);
    this.registerAuditor(calculationAuditorPackage);
  }

  registerCalculation(skill: CalculationSkill) {
    if (skill.package.manifest.kind !== 'calculation') {
      throw new Error(`只能注册 calculation Skill：${skill.package.manifest.id}`);
    }
    if (this.calculationSkills.has(skill.package.manifest.id)) {
      throw new Error(`Skill 已注册：${skill.package.manifest.id}`);
    }
    this.calculationSkills.set(skill.package.manifest.id, skill);
  }

  registerAuditor(skill: SkillPackage) {
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
      ...[...this.calculationSkills.values()].map(skill => skill.package),
      ...this.auditPackages.values(),
    ];
    return packages.map(skill => ({
      id: skill.manifest.id,
      name: skill.manifest.name,
      kind: skill.manifest.kind,
      description: skill.manifest.description,
      status: skill.manifest.status,
      component: skill.manifest.component,
      inputSchema: skill.manifest.inputSchema,
    }));
  }

  describe(id: string): SkillPackage | undefined {
    return this.calculationSkills.get(id)?.package ?? this.auditPackages.get(id);
  }

  calculate(id: string, input: unknown) {
    const skill = this.calculationSkills.get(id);
    if (!skill) throw new Error(`未找到计算 Skill：${id}`);
    return skill.calculate(input);
  }

  audit(id: string): CalculationAuditResult {
    const packageDefinition = this.describe(id);
    if (!packageDefinition) throw new Error(`未找到 Skill：${id}`);
    return auditSkillPackage(packageDefinition);
  }
}

export const skillRegistry = new SkillRegistry();
export const registeredAuditorSkillId = auditorManifest.id;
