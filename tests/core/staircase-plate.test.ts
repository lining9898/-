import { describe, it, expect } from 'vitest';
import { calculatePlateStair, PlateStairInput } from '../../src/core/stair/plate';

const defaultInput: PlateStairInput = {
  span: 3.6,
  stepRise: 160,
  stepRun: 280,
  t: 120,
  concreteGrade: 'C30',
  steelGrade: 'HRB400',
  cover: 20,
  barDiameter: 10,
  barSpacing: 100,
  gkExtra: 1.5,
  qk: 3.5,
  gammaG: 1.3,
  gammaQ: 1.5,
};

describe('板式楼梯计算', () => {
  describe('输入校验', () => {
    it('应拒绝无效输入', () => {
      const cases: Partial<PlateStairInput>[] = [
        { span: 0 }, { stepRise: -1 }, { stepRun: 0 }, { t: 0 }, { qk: -1 }, { t: 22, cover: 20, barDiameter: 10 },
      ];
      for (const ov of cases) {
        const r = calculatePlateStair({ ...defaultInput, ...ov });
        expect(r.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
      }
    });
    it('应拒绝未知材料', () => {
      expect(calculatePlateStair({ ...defaultInput, concreteGrade: 'C99' }).advisories.some(a => a.code === 'UNKNOWN_CONCRETE')).toBe(true);
    });
  });

  describe('正常算例与手算对比', () => {
    const result = calculatePlateStair(defaultInput);
    const value = (label: string) => result.results.find(item => item.label === label)?.value;

    it('恒载按水平投影折算：斜板 3.455 + 踏步 2.0 + 面层 1.5 = 6.955 kN/m²', () => {
      expect(value('斜板自重折算')).toBe(3.455);
      expect(value('踏步自重折算')).toBe(2.0);
      expect(value('恒载标准值 gk')).toBe(6.955);
    });

    it('荷载组合设计线荷载 q = γG·gk + γQ·qk = 14.292 kN/m', () => {
      expect(value('设计线荷载 q')).toBe(14.292);
    });

    it('跨中弯矩 M = q·l0²/8 = 23.15 kN·m', () => {
      expect(value('跨中弯矩 M')).toBe(23.15);
    });

    it('配筋与承载力：As,req=751.89，As,prov=785.4，Mu=24.07 ≥ M', () => {
      expect(value('所需钢筋 As,req')).toBe(751.89);
      expect(value('实配钢筋 As,prov')).toBe(785.4);
      expect(value('受弯承载力 Mu')).toBe(24.07);
      expect(value('配筋率 ρ')).toBe(0.65);
      expect(result.checks.map(c => c.passed)).toEqual([true, true, true, true, true, true]);
      expect(result.conclusion.passed).toBe(true);
    });

    it('返回完整 CalculationResult 且材料/受弯为 VERIFIED、荷载/构造为 REVIEW_REQUIRED', () => {
      expect(result.calculatorType).toBe('staircase-plate');
      expect(result.steps.length).toBeGreaterThan(0);
      const verified = result.allEvidence.filter(e => e.verificationStatus === 'VERIFIED');
      const review = result.allEvidence.filter(e => e.verificationStatus === 'REVIEW_REQUIRED');
      expect(verified.length).toBeGreaterThan(0);
      expect(review.length).toBeGreaterThan(0);
      verified.forEach(e => expect(e.pdfPage).not.toBeNull());
      review.filter(e => e.sourceFile === null)
        .forEach(e => expect(e.pdfPage).toBeNull());
      expect(review.some(e => e.clause === '4.1.2' && e.pdfPage === 6)).toBe(true);
      expect(result.overallStatus).toBe('REVIEW_REQUIRED');
    });
  });

  describe('边界值', () => {
    it('钢筋不足时承载力不通过', () => {
      const r = calculatePlateStair({ ...defaultInput, barSpacing: 200 });
      expect(r.checks.find(c => c.name === '受弯承载力验算')?.passed).toBe(false);
      expect(r.conclusion.passed).toBe(false);
    });

    it('大活载跨越承载力边界', () => {
      const r = calculatePlateStair({ ...defaultInput, qk: 8 });
      expect(r.checks.find(c => c.name === '受弯承载力验算')?.passed).toBe(false);
    });

    it('梯板过薄触发厚度构造不通过', () => {
      const r = calculatePlateStair({ ...defaultInput, t: 90, span: 3.6 });
      expect(r.checks.find(c => c.name === '梯板厚度构造验算')?.passed).toBe(false);
    });

    it('极小平坦坡度应能计算', () => {
      const r = calculatePlateStair({ ...defaultInput, stepRise: 100, stepRun: 300, span: 3.0, t: 110, barSpacing: 150 });
      expect(r.steps.length).toBeGreaterThan(0);
    });
  });

  describe('单位与数量级', () => {
    it('弯矩单位为 kN·m、荷载为 kN/m、配筋为 mm²/m', () => {
      const r = calculatePlateStair(defaultInput);
      expect(r.results.find(x => x.label === '跨中弯矩 M')?.unit).toBe('kN·m');
      expect(r.results.find(x => x.label === '设计线荷载 q')?.unit).toBe('kN/m');
      expect(r.results.find(x => x.label === '实配钢筋 As,prov')?.unit).toBe('mm²/m');
      expect(Number(r.results.find(x => x.label === '跨中弯矩 M')?.value)).toBeLessThan(1000);
    });
  });

  describe('步骤与 Evidence', () => {
    it('恒载折算步骤含斜板与踏步两部分', () => {
      const r = calculatePlateStair(defaultInput);
      const step = r.steps.find(s => s.name === '计算恒载标准值（水平投影折算）');
      expect(step?.formula).toContain('√');
      expect(step?.evidence[0]).toMatchObject({ codeNumber: 'GB 50009' });
    });
    it('配筋步骤证据指向 6.2.10', () => {
      const r = calculatePlateStair(defaultInput);
      const step = r.steps.find(s => s.name === '正截面配筋设计');
      expect(step?.evidence[0]).toMatchObject({ clause: '6.2.10', pdfPage: 55 });
    });
  });
});
