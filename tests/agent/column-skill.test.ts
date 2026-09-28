import { describe, expect, it } from 'vitest';
import { skillRegistry } from '../../src/agent/skill-registry';
import { calculateAxialColumn, AxialColumnInput } from '../../src/core/column/axial';
import { calculateEccentricColumn, EccentricColumnInput } from '../../src/core/column/eccentric';

const axialInput: AxialColumnInput = {
  width: 400, depth: 500, effectiveLength: 3200, reinforcementArea: 2400,
  axialForce: 2200, concreteStrength: 14.3, steelCompressionStrength: 360,
};

const eccentricInput: EccentricColumnInput = {
  width: 400, depth: 500, coverToSteelCentroid: 50, reinforcementAreaEachFace: 1600,
  axialForce: 1200, firstOrderMoment: 60, concreteGrade: 'C30', steelGrade: 'HRB400',
};

describe('column Skill 完善：轴压柱与偏压柱', () => {
  describe('轴心受压柱', () => {
    it('Registry 分派与 legacy 核心一致（回归）', () => {
      const legacy = calculateAxialColumn(axialInput);
      const result = skillRegistry.calculate('column', { mode: 'axial', input: axialInput });
      expect(result.calculatorType).toBe('轴心受压柱');
      const nu = Number(result.results.find(r => r.label === '轴压承载力 Nu')?.value);
      expect(nu).toBeCloseTo(legacy.capacity, 6);
      expect(nu).toBeCloseTo(3351.6, 6);
      expect(result.checks[0].passed).toBe(legacy.passed);
      expect(result.conclusion.passed).toBe(true);
    });

    it('单位语义：kN、mm²、N/mm²、%', () => {
      const result = skillRegistry.calculate('column', { mode: 'axial', input: axialInput });
      expect(result.inputs.find(i => i.label === '轴向压力设计值 N')?.unit).toBe('kN');
      expect(result.results.find(r => r.label === '轴压承载力 Nu')?.unit).toBe('kN');
      expect(result.results.find(r => r.label === '混凝土计算面积')?.unit).toBe('mm²');
      expect(result.materials.find(m => m.label === '混凝土轴心抗压强度设计值 fc')?.unit).toBe('N/mm²');
      expect(result.geometry.find(g => g.label === '纵筋率')?.unit).toBe('%');
    });

    it('数量级：承载力 kN 与手算一致', () => {
      // Nu = 0.9 × 1 × (14.3 × 200000 + 360 × 2400) / 1000 = 3351.6 kN
      const result = skillRegistry.calculate('column', { mode: 'axial', input: axialInput });
      expect(Number(result.results.find(r => r.label === '轴压承载力 Nu')?.value)).toBe(3351.6);
      expect(Number(result.geometry.find(g => g.label === '全截面面积 A')?.value)).toBe(200000);
    });

    it('Evidence 挂接：步骤携带 GB 6.2.15 证据且为现行 REVIEW_REQUIRED', () => {
      const result = skillRegistry.calculate('column', { mode: 'axial', input: axialInput });
      const capacityStep = result.steps.find(s => s.name === '轴压承载力');
      expect(capacityStep?.evidence.length).toBeGreaterThan(0);
      const ev = result.allEvidence[0];
      expect(ev.codeNumber).toBe('GB 50010');
      expect(ev.clause).toBe('6.2.15');
      expect(ev.verificationStatus).toBe('REVIEW_REQUIRED');
      expect(ev.status).toBe('current');
      expect(ev.pdfPage).toBeNull();
    });
  });

  describe('偏心受压柱', () => {
    it('Registry 分派与 legacy 核心一致（回归）', () => {
      const legacy = calculateEccentricColumn(eccentricInput);
      const result = skillRegistry.calculate('column', { mode: 'eccentric', input: eccentricInput });
      expect(result.calculatorType).toBe('偏心受压柱');
      expect(Number(result.results.find(r => r.label === '附加偏心距 ea')?.value)).toBeCloseTo(legacy.additionalEccentricity, 4);
      expect(Number(result.results.find(r => r.label === '控制弯矩 M')?.value)).toBeCloseTo(legacy.designMoment, 4);
      expect(result.checks.find(c => c.name === '正截面单轴偏心受压承载力')?.passed).toBe(legacy.passed);
    });

    it('单位语义：mm、kN、kN·m、N/mm²', () => {
      const result = skillRegistry.calculate('column', { mode: 'eccentric', input: eccentricInput });
      expect(result.inputs.find(i => i.label === '轴向压力设计值 N')?.unit).toBe('kN');
      expect(result.inputs.find(i => i.label === '一阶弯矩设计值 M0')?.unit).toBe('kN·m');
      expect(result.results.find(r => r.label === '附加偏心距 ea')?.unit).toBe('mm');
      expect(result.results.find(r => r.label === '受压侧钢筋应力 σ′s')?.unit).toBe('N/mm²');
    });

    it('数量级：附加偏心距与控制弯矩与手算一致', () => {
      const result = skillRegistry.calculate('column', { mode: 'eccentric', input: eccentricInput });
      // ea = max(20, 500/30) = 20；M = 60 + 1200 × 20/1000 = 84 kN·m
      expect(Number(result.results.find(r => r.label === '附加偏心距 ea')?.value)).toBe(20);
      expect(Number(result.results.find(r => r.label === '控制弯矩 M')?.value)).toBeCloseTo(84, 4);
    });

    it('Evidence 挂接：步骤携带 GB 6.2.5 证据（附加偏心距）', () => {
      const result = skillRegistry.calculate('column', { mode: 'eccentric', input: eccentricInput });
      const step = result.steps.find(s => s.name === '附加偏心距');
      expect(step?.evidence.some(e => e.clause === '6.2.5')).toBe(true);
      expect(step?.evidence.some(e => e.pdfPage === 52)).toBe(true);
      expect(result.allEvidence.some(e => e.clause === '6.2.5')).toBe(true);
      expect(result.allEvidence.every(e => e.status === 'current')).toBe(true);
    });
  });

  it('未知 mode 返回结构化错误', () => {
    const result = skillRegistry.calculate('column', { mode: 'unknown', input: {} });
    expect(result.advisories.some(a => a.code === 'SKILL_INPUT_INVALID')).toBe(true);
  });
});
