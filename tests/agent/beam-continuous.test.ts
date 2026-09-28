import { describe, expect, it } from 'vitest';
import { skillRegistry } from '../../src/agent/skill-registry';
import { calculateContinuousBeam } from '../../src/core/beam/continuous';

describe('beam-continuous Skill（结构力学方法，非 GB 规范公式）', () => {
  it('Registry 调用返回 CalculationResult 且核心结果一致', () => {
    const spans = [{ length: 6, load: 10 }, { length: 6, load: 10 }];
    const core = calculateContinuousBeam(spans);
    const result = skillRegistry.calculate('beam-continuous', spans);
    expect(result.calculatorType).toBe('连续梁内力计算');
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.results.length).toBeGreaterThan(0);
    // 核心支座反力与中间支座弯矩
    const midMoment = Number(result.results.find(r => r.label === '支座 2 弯矩')?.value);
    expect(midMoment).toBeCloseTo(core.supportMoments[1], 4);
    expect(midMoment).toBeCloseTo(-45, 4);
    expect(result.results.find(r => r.label === '支座 1 竖向反力')?.value).toBeCloseTo(core.reactions[0], 4);
  });

  it('单位语义：m、kN/m、kN、kN·m', () => {
    const result = skillRegistry.calculate('beam-continuous', [{ length: 6, load: 10 }]);
    expect(result.inputs[0].unit).toBe('m');
    expect(result.inputs[1].unit).toBe('kN/m');
    expect(result.results.find(r => r.label === '支座 1 竖向反力')?.unit).toBe('kN');
    expect(result.results.find(r => r.label === '支座 1 弯矩')?.unit).toBe('kN·m');
  });

  it('证据为结构力学方法（非 GB 规范公式），不挂 GB 条文', () => {
    const result = skillRegistry.calculate('beam-continuous', [{ length: 6, load: 10 }, { length: 6, load: 10 }]);
    // allEvidence 全部为 INTERNAL-MECHANICS，无 GB 50010 条文
    expect(result.allEvidence.length).toBeGreaterThan(0);
    result.allEvidence.forEach(e => {
      expect(e.codeNumber).toBe('INTERNAL-MECHANICS');
      expect(e.verificationStatus).toBe('REVIEW_REQUIRED');
      expect(e.status).toBe('current');
    });
    expect(result.allEvidence.some(e => e.codeNumber.includes('GB'))).toBe(false);
    // 步骤与结果挂接了非 GB 证据
    const step = result.steps.find(s => s.name === '整体竖向力平衡');
    expect(step?.evidence.length).toBeGreaterThan(0);
    // 提示为结构力学方法
    expect(result.advisories.some(a => a.code === 'NON_GB_METHOD')).toBe(true);
    expect(result.advisories.some(a => a.code === 'ANALYSIS_ONLY')).toBe(true);
    expect(result.overallStatus).toBe('REVIEW_REQUIRED');
  });

  it('非法输入返回结构化错误而非抛出', () => {
    const empty = skillRegistry.calculate('beam-continuous', []);
    expect(empty.advisories.some(a => a.code === 'SKILL_INPUT_INVALID')).toBe(true);
    const badType = skillRegistry.calculate('beam-continuous', [{ length: '6', load: 10 }]);
    expect(badType.advisories.some(a => a.code === 'SKILL_INPUT_INVALID')).toBe(true);
    const beyondRange = skillRegistry.calculate('beam-continuous', [{ length: 0, load: 10 }]);
    expect(beyondRange.advisories.some(a => a.code === 'CALCULATION_INPUT_INVALID')).toBe(true);
  });
});
