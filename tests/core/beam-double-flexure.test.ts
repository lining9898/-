import { describe, it, expect } from 'vitest';
import { calculateBeamDoubleFlexure, BeamDoubleFlexureInput } from '../../src/core/beam/double-flexure';

// 正常双筋算例（x ≥ 2a′s，受压钢筋屈服）
const normalCase: BeamDoubleFlexureInput = {
  b: 300, h: 600, concreteGrade: 'C30', steelGrade: 'HRB400', compressionSteelGrade: 'HRB400',
  cover: 35, barDiameter: 25, barCount: 5,
  coverToCompressionCentroid: 40, compressionBarDiameter: 20, compressionBarCount: 2,
  moment: 300,
};

// 受压钢筋未屈服算例（x < 2a′s）
const noYieldCase: BeamDoubleFlexureInput = {
  b: 300, h: 600, concreteGrade: 'C30', steelGrade: 'HRB400', compressionSteelGrade: 'HRB400',
  cover: 25, barDiameter: 20, barCount: 3,
  coverToCompressionCentroid: 40, compressionBarDiameter: 20, compressionBarCount: 2,
  moment: 150,
};

// 超筋算例（x > ξb·h0）
const overCase: BeamDoubleFlexureInput = {
  b: 250, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400', compressionSteelGrade: 'HRB400',
  cover: 25, barDiameter: 28, barCount: 8,
  coverToCompressionCentroid: 40, compressionBarDiameter: 20, compressionBarCount: 2,
  moment: 300,
};

describe('双筋矩形梁正截面受弯承载力计算', () => {
  describe('手算/参考算例（C30、HRB400 双筋）', () => {
    it('基准算例的受压区高度 x 与界限 ξb 与手算一致', () => {
      const result = calculateBeamDoubleFlexure(normalCase);
      const x = Number(result.results.find(r => r.label === '受压区高度 x')?.value);
      const xiB = Number(result.results.find(r => r.label === '界限相对受压区高度 ξb')?.value);
      expect(x).toBeCloseTo(153.24, 2);
      expect(xiB).toBeCloseTo(0.5176, 4);
    });

    it('有效高度 h0 与钢筋面积与手算一致', () => {
      const result = calculateBeamDoubleFlexure(normalCase);
      const h0 = Number(result.results.find(r => r.label === '有效高度 h₀')?.value);
      const As = Number(result.results.find(r => r.label === '受拉钢筋面积 As')?.value);
      const AsPrime = Number(result.results.find(r => r.label === '受压钢筋面积 A′s')?.value);
      expect(h0).toBeCloseTo(552.5, 2);
      expect(As).toBeCloseTo(2454.37, 2);
      expect(AsPrime).toBeCloseTo(628.32, 2);
    });

    it('受弯承载力 Mu 与手算一致（kN·m）', () => {
      const result = calculateBeamDoubleFlexure(normalCase);
      const Mu = Number(result.results.find(r => r.label === '受弯承载力 Mu')?.value);
      // 手算：Mu = [14.3·300·153.235·(552.5−153.235/2) + 360·628.32·(552.5−40)] / 1e6 ≈ 428.76
      expect(Mu).toBeCloseTo(428.76, 2);
    });

    it('最小配筋面积 AsMin = ρmin·b·h = 0.2%·300·600 = 360 mm²', () => {
      const result = calculateBeamDoubleFlexure(normalCase);
      const AsMin = Number(result.results.find(r => r.label === '最小配筋面积 As,min')?.value);
      expect(AsMin).toBeCloseTo(360, 2);
    });
  });

  describe('CalculationResult 完整性', () => {
    it('应返回完整的 CalculationResult 结构', () => {
      const result = calculateBeamDoubleFlexure(normalCase);
      expect(result.calculatorType).toBe('beam-double-flexure');
      expect(result.inputs.length).toBeGreaterThan(0);
      expect(result.materials.length).toBeGreaterThan(0);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.checks.length).toBe(3);
      expect(result.conclusion).toBeDefined();
    });

    it('所有步骤必须有 formula 和 result', () => {
      const result = calculateBeamDoubleFlexure(normalCase);
      result.steps.forEach(step => {
        expect(step.formula).toBeTruthy();
        expect(step.result).toBeDefined();
        expect(step.unit).toBeDefined();
      });
    });

    it('conclusion 必须包含 passed 和 summary', () => {
      const result = calculateBeamDoubleFlexure(normalCase);
      expect(typeof result.conclusion.passed).toBe('boolean');
      expect(result.conclusion.summary).toBeTruthy();
    });
  });

  describe('计算分支', () => {
    it('正常算例应进入“正常”分支', () => {
      const result = calculateBeamDoubleFlexure(normalCase);
      expect(result.results.find(r => r.label === '计算分支')?.value).toBe('正常');
      expect(result.advisories.some(a => a.code === 'COMPRESSION_STEEL_NOT_YIELD')).toBe(false);
      expect(result.advisories.some(a => a.code === 'OVER_REINFORCED')).toBe(false);
    });

    it('x < 2a′s 应切换受压钢筋未屈服简化分支', () => {
      const result = calculateBeamDoubleFlexure(noYieldCase);
      expect(result.results.find(r => r.label === '计算分支')?.value).toBe('受压钢筋未屈服');
      expect(result.advisories.some(a => a.code === 'COMPRESSION_STEEL_NOT_YIELD')).toBe(true);
      const Mu = Number(result.results.find(r => r.label === '受弯承载力 Mu')?.value);
      // 手算：Mu = fy·As·(h0 − a′s) = 360·942.48·(565−40)/1e6 ≈ 178.13
      expect(Mu).toBeCloseTo(178.13, 2);
    });

    it('x > ξb·h0 应按界限控制并判超筋', () => {
      const result = calculateBeamDoubleFlexure(overCase);
      expect(result.results.find(r => r.label === '计算分支')?.value).toBe('超筋（界限控制）');
      expect(result.advisories.some(a => a.code === 'OVER_REINFORCED')).toBe(true);
      expect(result.checks.find(c => c.name === '相对受压区高度验算')?.passed).toBe(false);
      const Mu = Number(result.results.find(r => r.label === '受弯承载力 Mu')?.value);
      expect(Mu).toBeCloseTo(386.72, 2);
    });
  });

  describe('验算项', () => {
    it('正常算例三项安全验算全部通过', () => {
      const result = calculateBeamDoubleFlexure(normalCase);
      expect(result.checks.every(c => c.passed)).toBe(true);
      expect(result.conclusion.passed).toBe(true);
    });

    it('设计弯矩跨过承载力时承载力验算应翻转', () => {
      const mu = Number(calculateBeamDoubleFlexure(normalCase).results.find(r => r.label === '受弯承载力 Mu')?.value);
      const lower = calculateBeamDoubleFlexure({ ...normalCase, moment: mu - 1 });
      const higher = calculateBeamDoubleFlexure({ ...normalCase, moment: mu + 1 });
      expect(lower.checks.find(c => c.name === '承载力验算')?.passed).toBe(true);
      expect(higher.checks.find(c => c.name === '承载力验算')?.passed).toBe(false);
      expect(higher.conclusion.passed).toBe(false);
    });

    it('受压钢筋未屈服分支结论由安全验算决定，不应因简化分支误判失败', () => {
      const result = calculateBeamDoubleFlexure(noYieldCase);
      // 界限、最小配筋、承载力均满足，结论应通过；简化分支仅以警告提示
      expect(result.checks.find(c => c.name === '承载力验算')?.passed).toBe(true);
      expect(result.conclusion.passed).toBe(true);
    });
  });

  describe('输入校验', () => {
    it('应拒绝零宽度', () => {
      expect(calculateBeamDoubleFlexure({ ...normalCase, b: 0 }).advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });
    it('应拒绝负高度', () => {
      expect(calculateBeamDoubleFlexure({ ...normalCase, h: -100 }).advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });
    it('应拒绝零保护层', () => {
      expect(calculateBeamDoubleFlexure({ ...normalCase, cover: 0 }).advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });
    it('应拒绝非整数受拉钢筋根数', () => {
      expect(calculateBeamDoubleFlexure({ ...normalCase, barCount: 2.5 }).advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });
    it('应拒绝非整数受压钢筋根数', () => {
      expect(calculateBeamDoubleFlexure({ ...normalCase, compressionBarCount: 1.5 }).advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });
    it('应拒绝无效有效高度', () => {
      expect(calculateBeamDoubleFlexure({ ...normalCase, cover: 590 }).advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });
    it('应拒绝受压钢筋合力点超出截面', () => {
      expect(calculateBeamDoubleFlexure({ ...normalCase, coverToCompressionCentroid: 560 }).advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });
    it('应拒绝零弯矩', () => {
      expect(calculateBeamDoubleFlexure({ ...normalCase, moment: 0 }).advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });
    it('应拒绝非有限数值', () => {
      expect(calculateBeamDoubleFlexure({ ...normalCase, b: Number.NaN }).advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });
    it('应拒绝未知混凝土等级', () => {
      expect(calculateBeamDoubleFlexure({ ...normalCase, concreteGrade: 'C99' }).advisories.some(a => a.code === 'UNKNOWN_CONCRETE')).toBe(true);
    });
    it('应拒绝未知受拉钢筋等级', () => {
      expect(calculateBeamDoubleFlexure({ ...normalCase, steelGrade: 'HRB999' }).advisories.some(a => a.code === 'UNKNOWN_STEEL')).toBe(true);
    });
    it('应拒绝未知受压钢筋等级', () => {
      expect(calculateBeamDoubleFlexure({ ...normalCase, compressionSteelGrade: 'HRB999' }).advisories.some(a => a.code === 'UNKNOWN_STEEL')).toBe(true);
    });
  });

  describe('单位换算语义', () => {
    it('受弯承载力单位应为 kN·m（由 N·mm 换算）', () => {
      const result = calculateBeamDoubleFlexure(normalCase);
      expect(result.results.find(r => r.label === '受弯承载力 Mu')?.unit).toBe('kN·m');
      const capacityStep = result.steps.find(s => s.name === '计算正截面受弯承载力');
      expect(capacityStep?.unit).toBe('kN·m');
    });

    it('钢筋面积单位应为 mm²', () => {
      const result = calculateBeamDoubleFlexure(normalCase);
      expect(result.results.find(r => r.label === '受拉钢筋面积 As')?.unit).toBe('mm²');
      expect(result.results.find(r => r.label === '受压钢筋面积 A′s')?.unit).toBe('mm²');
    });

    it('尺寸单位应为 mm，强度单位应为 MPa', () => {
      const result = calculateBeamDoubleFlexure(normalCase);
      expect(result.results.find(r => r.label === '受压区高度 x')?.unit).toBe('mm');
      expect(result.materials.find(m => m.label === 'fc')?.unit).toBe('MPa');
      expect(result.materials.find(m => m.label === 'fy')?.unit).toBe('MPa');
    });
  });

  describe('规范依据与 Evidence', () => {
    it('历史公式证据和现行材料条文分别保留来源与状态', () => {
      const result = calculateBeamDoubleFlexure(normalCase);
      expect(result.overallStatus).toBe('REVIEW_REQUIRED');
      result.allEvidence.forEach(e => {
        expect(['VERIFIED','REVIEW_REQUIRED']).toContain(e.verificationStatus);
        expect(e.status).toBe('current');
        expect(e.sourceFile).toBe(e.codeNumber === 'GB 55008'
          ? 'GB55008-2021.pdf'
          : e.edition.includes('2024')
            ? 'GBT50010-2010_2024_amendment.pdf'
            : 'GB50010-2010_2015_.pdf');
      });
    });

    it('应包含 REVIEW_REQUIRED 警告', () => {
      const result = calculateBeamDoubleFlexure(normalCase);
      expect(result.advisories.some(a => a.code === 'REVIEW_REQUIRED')).toBe(true);
    });

    it('应包含 6.2.10 条文依据（受压区高度与受弯承载力）', () => {
      const result = calculateBeamDoubleFlexure(normalCase);
      expect(result.allEvidence.some(e => e.clause === '6.2.10')).toBe(true);
      expect(result.allEvidence.some(e => e.clause === '6.2.7')).toBe(true);
      expect(result.allEvidence.some(e => e.clause === '8.5.1')).toBe(true);
    });
  });
});
