import { describe, expect, it } from 'vitest';
import { skillRegistry } from '../../src/agent/skill-registry';
import { calculateOneWaySlab, OneWaySlabInput } from '../../src/core/slab/one-way';
import { calculateTwoWaySlab, TwoWaySlabInput } from '../../src/core/slab/two-way';
import { calculateIndependentFoundation, IndependentFoundationInput } from '../../src/core/foundation/independent';
import { calculatePlateStair, PlateStairInput } from '../../src/core/stair/plate';

const oneWayInput: OneWaySlabInput = {
  h: 120, span: 3.0, concreteGrade: 'C30', steelGrade: 'HRB400', cover: 20,
  barDiameter: 10, barSpacing: 200, gkExtra: 1.0, qk: 2.0, gammaG: 1.3, gammaQ: 1.5,
};
const twoWayInput: TwoWaySlabInput = {
  h: 120, spanX: 3.0, spanY: 4.0, concreteGrade: 'C30', steelGrade: 'HRB400', cover: 20,
  barDiameter: 10, barSpacing: 200, gkExtra: 1.0, qk: 2.0, gammaG: 1.3, gammaQ: 1.5,
};
const foundationInput: IndependentFoundationInput = {
  L: 3.0, B: 2.4, h: 800, bc: 500, hc: 400, d: 1.5, gammaM: 20, fa: 300,
  Nk: 1200, N: 1560, concreteGrade: 'C30', steelGrade: 'HRB400', cover: 40,
  barDiameter: 16, barSpacing: 150,
};
const stairInput: PlateStairInput = {
  span: 3.6, stepRise: 160, stepRun: 280, t: 120, concreteGrade: 'C30', steelGrade: 'HRB400',
  cover: 20, barDiameter: 10, barSpacing: 100, gkExtra: 1.5, qk: 3.5, gammaG: 1.3, gammaQ: 1.5,
};

describe('板/基础/楼梯 Skill Registry 集成', () => {
  it('四个新 Skill 均已注册且无重复 ID', () => {
    const ids = skillRegistry.list().map(s => s.id);
    const newIds = ['slab-one-way', 'slab-two-way', 'foundation-independent', 'staircase-plate'];
    newIds.forEach(id => expect(ids).toContain(id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('Registry 调用与 core 引擎核心结果一致（单向板）', () => {
    const legacy = calculateOneWaySlab(oneWayInput);
    const viaRegistry = skillRegistry.calculate('slab-one-way', oneWayInput);
    expect(viaRegistry.results).toEqual(legacy.results);
    expect(viaRegistry.checks).toEqual(legacy.checks);
    expect(viaRegistry.conclusion).toEqual(legacy.conclusion);
  });

  it('Registry 调用与 core 引擎核心结果一致（双向板）', () => {
    const legacy = calculateTwoWaySlab(twoWayInput);
    const viaRegistry = skillRegistry.calculate('slab-two-way', twoWayInput);
    expect(viaRegistry.results).toEqual(legacy.results);
    expect(viaRegistry.checks).toEqual(legacy.checks);
  });

  it('Registry 调用与 core 引擎核心结果一致（独立基础）', () => {
    const legacy = calculateIndependentFoundation(foundationInput);
    const viaRegistry = skillRegistry.calculate('foundation-independent', foundationInput);
    expect(viaRegistry.results).toEqual(legacy.results);
    expect(viaRegistry.checks).toEqual(legacy.checks);
    expect(viaRegistry.conclusion).toEqual(legacy.conclusion);
  });

  it('Registry 调用与 core 引擎核心结果一致（板式楼梯）', () => {
    const legacy = calculatePlateStair(stairInput);
    const viaRegistry = skillRegistry.calculate('staircase-plate', stairInput);
    expect(viaRegistry.results).toEqual(legacy.results);
    expect(viaRegistry.checks).toEqual(legacy.checks);
  });

  it('非法 Agent 输入返回结构化错误结果', () => {
    const result = skillRegistry.calculate('foundation-independent', { ...foundationInput, L: '3.0' });
    expect(result.advisories.some(a => a.code === 'SKILL_INPUT_INVALID')).toBe(true);
  });

  it('四个新 Skill 均通过结构审查（无 error）', () => {
    const ids = ['slab-one-way', 'slab-two-way', 'foundation-independent', 'staircase-plate'];
    for (const id of ids) {
      const audit = skillRegistry.audit(id);
      expect(audit.passed, `${id}: ${audit.issues.map(i => i.message).join('; ')}`).toBe(true);
      expect(audit.issues.some(i => i.severity === 'error')).toBe(false);
    }
  });

  it('formulaMappings 的 evidenceId 均存在且可追溯', () => {
    const ids = ['slab-one-way', 'slab-two-way', 'foundation-independent', 'staircase-plate'];
    for (const id of ids) {
      const pkg = skillRegistry.describe(id)!;
      const evidenceIds = new Set(pkg.evidence.records.map(r => r.id));
      for (const m of pkg.manifest.formulaMappings) {
        expect(evidenceIds.has(m.evidenceId), `${id}: ${m.id}`).toBe(true);
        // evidenceId 必须能追溯到 CalculationResult 步骤
        const result = skillRegistry.calculate(id, {
          'slab-one-way': oneWayInput, 'slab-two-way': twoWayInput,
          'foundation-independent': foundationInput, 'staircase-plate': stairInput,
        }[id]);
        expect(result.allEvidence.some(e => e.clause !== '' || e.codeNumber === 'GB 50007' || e.codeNumber === 'GB 50009')).toBe(true);
      }
    }
  });

  it('VERIFIED evidence 均带来源与页码，REVIEW_REQUIRED 不虚构页码', () => {
    const ids = ['slab-one-way', 'slab-two-way', 'foundation-independent', 'staircase-plate'];
    for (const id of ids) {
      const pkg = skillRegistry.describe(id)!;
      for (const r of pkg.evidence.records) {
        if (r.verificationStatus === 'VERIFIED') {
          expect(r.sourceFile).toBeTruthy();
          expect(r.pdfPage).not.toBeNull();
        } else {
          expect(r.pdfPage).toBeNull();
        }
      }
    }
  });

  it('独立基础 Skill 声明数量级保护为边界项', () => {
    const pkg = skillRegistry.describe('foundation-independent')!;
    expect(pkg.manifest.boundaryChecks.some(b => b.includes('10³/10⁶') || b.includes('数量级'))).toBe(true);
  });
});
