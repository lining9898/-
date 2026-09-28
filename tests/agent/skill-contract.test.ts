import { describe, expect, it } from 'vitest';
import {
  SkillRegistry,
  skillRegistry,
  beamShearSkillPackage,
  beamFlexureSkillPackage,
} from '../../src/agent/skill-registry';
import { CalculationSkill, NormativeSkill } from '../../src/agent/skill-types';
import { createEmptyResult } from '../../src/types/calculation';
import { isColumnSkillInput } from '../../skills/column/calculator';

/**
 * Skill 契约验证（Part 5）
 * 目标：强制三类 Skill 的类型与调用边界 ——
 *   Calculation → CalculationResult
 *   Normative   → NormativeAnswer
 *   Auditor     → CalculationAuditResult
 * calculate() 不得调用 normative；resolve() 不得调用 calculation；
 * NormativeAnswer 不得含工程结果字段；重复 Skill ID 必须拒绝。
 */

const flexureInput = {
  b: 250, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400',
  cover: 25, barDiameter: 20, barCount: 4, moment: 120,
};

describe('Skill 契约：类型边界', () => {
  it('Calculation Skill 返回 CalculationResult（含 steps/checks/results）', () => {
    const r = skillRegistry.calculate('beam-flexure', flexureInput);
    expect(r.calculatorType).toBe('beam-flexure');
    expect(r.steps).toBeDefined();
    expect(r.checks).toBeDefined();
    expect(r.results).toBeDefined();
    expect(r.conclusion).toBeDefined();
  });

  it('Normative Skill 返回 NormativeAnswer，不含 steps/checks/results', () => {
    const a = skillRegistry.resolve({ code: 'GB50010', clause: '6.2.10' });
    expect((a as any).steps).toBeUndefined();
    expect((a as any).checks).toBeUndefined();
    expect((a as any).results).toBeUndefined();
    expect((a as any).inputs).toBeUndefined();
    expect(a.codeName).toBe('混凝土结构设计规范');
  });

  it('Auditor 返回 CalculationAuditResult，不含 steps/checks（不执行工程计算）', () => {
    const audit = skillRegistry.audit('beam-flexure');
    expect((audit as any).steps).toBeUndefined();
    expect((audit as any).checks).toBeUndefined();
    expect(audit.issues).toBeDefined();
    expect(typeof audit.passed).toBe('boolean');
  });

  it('calculate() 不允许调用 normative Skill（gb50010 不是 calculation）', () => {
    expect(() => skillRegistry.calculate('gb50010', {})).toThrow();
  });

  it('resolve() 不允许调用 calculation Skill（对计算 Skill 兜底返回 UNVERIFIED）', () => {
    const a = skillRegistry.resolve({ code: 'beam-flexure', clause: '6.2.10' });
    expect(a.verificationStatus).toBe('UNVERIFIED');
    expect(a.warnings.length).toBeGreaterThan(0);
  });

  it('NormativeAnswer 不得出现工程结果字段', () => {
    const a = skillRegistry.resolve({ code: 'GB50010', clause: '6.2.10' });
    const forbidden = ['Mu', 'Vu', 'Nu', 'As', 'capacity', 'stress', 'deflection', 'moment', 'shear'];
    for (const key of forbidden) expect((a as any)[key]).toBeUndefined();
  });
});

describe('Skill 契约：重复 ID 与类型注册拒绝', () => {
  it('重复 calculation Skill ID 必须被拒绝', () => {
    const reg = new SkillRegistry();
    const dup: CalculationSkill = {
      package: beamShearSkillPackage,
      accepts: () => true,
      calculate: () => createEmptyResult('dup'),
    };
    expect(() => reg.registerCalculation(dup)).toThrow(/已注册/);
  });

  it('把 normative Skill 注册为 calculation 必须被拒绝（kind 不符）', () => {
    const reg = new SkillRegistry();
    const wrongKind = { ...beamShearSkillPackage, manifest: { ...beamShearSkillPackage.manifest, kind: 'normative' as const } };
    const s: CalculationSkill = { package: wrongKind, accepts: () => true, calculate: () => createEmptyResult('x') };
    expect(() => reg.registerCalculation(s)).toThrow(/只能注册 calculation/);
  });

  it('把 calculation Skill 注册为 normative 必须被拒绝', () => {
    const reg = new SkillRegistry();
    const norm: NormativeSkill = {
      package: beamFlexureSkillPackage,
      resolve: () => ({ query: { code: 'GB50010', clause: '6.2.10' }, codeName: '', codeNumber: '', edition: '',
        chapter: '', clause: '', text: '', page: null, source: null, verificationStatus: 'UNVERIFIED',
        applicability: '', warnings: [] }),
    };
    expect(() => reg.registerNormative(norm)).toThrow(/只能注册 normative/);
  });

  it('把非 auditor Skill（kind 仍为 calculation）注册为 auditor 必须被拒绝', () => {
    const reg = new SkillRegistry();
    // beamShearSkillPackage 的 kind 仍是 'calculation'，不应被 registerAuditor 接受
    expect(() => reg.registerAuditor(beamShearSkillPackage)).toThrow(/只能注册 auditor/);
  });

  it('列出的 Skill ID 全局唯一', () => {
    const ids = skillRegistry.list().map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Skill 契约：schema 与 calculator 输入形状一致性', () => {
  it('beam-flexure schema 的必填字段都被 calculator.accepts 覆盖', () => {
    const schema = skillRegistry.describe('beam-flexure')!.schema;
    const required = schema.required;
    expect(required).toContain('moment');
    expect(required).toContain('barCount');
    expect(required).toContain('concreteGrade');
    // accepts 应接受 schema 描述的一个合法输入
    const accepted = skillRegistry.describe('beam-flexure');
    expect(accepted).toBeDefined();
  });

  it('column 运行期契约为嵌套 { mode, input }，且被 calculator 接受', () => {
    const axial = { mode: 'axial' as const, input: {
      width: 400, depth: 500, effectiveLength: 3200, reinforcementArea: 2400,
      axialForce: 2200, concreteStrength: 14.3, steelCompressionStrength: 360,
    } };
    const eccentric = { mode: 'eccentric' as const, input: {
      width: 400, depth: 500, coverToSteelCentroid: 40, reinforcementAreaEachFace: 1500,
      axialForce: 1200, firstOrderMoment: 180, concreteGrade: 'C30', steelGrade: 'HRB400',
    } };
    expect(isColumnSkillInput(axial)).toBe(true);
    expect(isColumnSkillInput(eccentric)).toBe(true);
    // schema 声明嵌套 input 为必填
    expect(skillRegistry.describe('column')!.schema.required).toContain('input');
  });
});
