import { describe, expect, it } from 'vitest';
import { skillRegistry } from '../../src/agent/skill-registry';
import { calculateBeamFlexure, BeamFlexureInput } from '../../src/core/beam/flexure';
import type { NormativeAnswer, NormativeQuery } from '../../src/agent/skill-types';

const flexureInput: BeamFlexureInput = {
  b: 250, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400', cover: 25,
  barDiameter: 20, barCount: 4, moment: 120,
};

describe('架构契约：Skill 类型隔离', () => {
  it('1. Calculation Skill 返回 CalculationResult', () => {
    const result = skillRegistry.calculate('beam-flexure', flexureInput);
    expect(result.calculatorType).toBeDefined();
    expect(result.steps).toBeDefined();
    expect(result.checks).toBeDefined();
    expect(result.conclusion).toBeDefined();
  });

  it('2. resolve() 返回 NormativeAnswer 而非 CalculationResult', () => {
    const answer = skillRegistry.resolve({ code: 'GB50010', clause: '6.2.10' });
    // NormativeAnswer 不应有 calculation steps/checks/results
    expect((answer as any).steps).toBeUndefined();
    expect((answer as any).checks).toBeUndefined();
    expect((answer as any).results).toBeUndefined();
    expect((answer as any).inputs).toBeUndefined();
    // NormativeAnswer 应有自己的字段
    expect(answer.codeName).toBe('混凝土结构设计规范');
    expect(answer.codeNumber).toBe('GB 50010');
    expect(answer.clause).toBe('6.2.10');
  });

  it('3. calculate() 不允许调用 normative Skill', () => {
    expect(() => skillRegistry.calculate('gb50010', {})).toThrow();
  });

  it('4. resolve() 不允许调用 calculation Skill', () => {
    // beam-flexure 不是 normative skill，resolve 应兜底返回未收录
    const answer = skillRegistry.resolve({ code: 'beam-flexure', clause: '6.2.10' });
    expect(answer.verificationStatus).toBe('UNVERIFIED');
    expect(answer.warnings.length).toBeGreaterThan(0);
  });

  it('5. NormativeAnswer 不包含工程计算结果字段', () => {
    const answer = skillRegistry.resolve({ code: 'GB50010', clause: '6.2.10' });
    const forbiddenKeys = ['Mu', 'Vu', 'Nu', 'As', 'capacity', 'stress', 'deflection'];
    for (const key of forbiddenKeys) {
      expect((answer as any)[key]).toBeUndefined();
    }
  });

  it('6. VERIFIED evidence 必须具有必要来源信息', () => {
    const allSkills = skillRegistry.list();
    for (const s of allSkills) {
      const pkg = skillRegistry.describe(s.id);
      if (!pkg) continue;
      for (const record of pkg.evidence.records) {
        if (record.verificationStatus === 'VERIFIED') {
          expect(record.sourceFile, `${record.id} VERIFIED 但无 sourceFile`).toBeTruthy();
          expect(record.pdfPage, `${record.id} VERIFIED 但无 pdfPage`).not.toBeNull();
        }
      }
    }
  });

  it('7. Registry 不允许重复 Skill ID', () => {
    const ids = skillRegistry.list().map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('8. formulaMappings 中 evidenceId 必须存在', () => {
    for (const s of skillRegistry.list()) {
      const pkg = skillRegistry.describe(s.id);
      if (!pkg) continue;
      const evidenceIds = new Set(pkg.evidence.records.map(r => r.id));
      for (const mapping of pkg.manifest.formulaMappings) {
        expect(evidenceIds.has(mapping.evidenceId),
          `${s.id}: formulaMapping ${mapping.id} 引用了不存在的 evidenceId ${mapping.evidenceId}`
        ).toBe(true);
      }
    }
  });

  it('9. audit() 能检查 calculation Skill 且不执行工程计算', () => {
    const audit = skillRegistry.audit('beam-flexure');
    expect(audit.skillId).toBe('beam-flexure');
    expect(audit.issues).toBeDefined();
    // audit 返回的是结构审查结果，不是 CalculationResult
    expect((audit as any).steps).toBeUndefined();
    expect((audit as any).checks).toBeUndefined();
  });

  it('10. 未收录条文返回 UNVERIFIED + 警告', () => {
    const answer = skillRegistry.resolve({ code: 'GB50010', clause: '99.99.99' });
    expect(answer.verificationStatus).toBe('UNVERIFIED');
    expect(answer.warnings.length).toBeGreaterThan(0);
    expect(answer.text).toBe('');
  });

  it('11. 已有 beam-flexure 计算结果不受影响', () => {
    const legacy = calculateBeamFlexure(flexureInput);
    const throughRegistry = skillRegistry.calculate('beam-flexure', flexureInput);
    expect(throughRegistry.results).toEqual(legacy.results);
  });
});
