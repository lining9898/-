import { describe, it, expect } from 'vitest';
import { calculateTwoWaySlab, TwoWaySlabInput, momentCoefficients } from '../../src/core/slab/two-way';

const defaultInput: TwoWaySlabInput = {
  h: 120,
  spanX: 3.0,
  spanY: 4.0,
  concreteGrade: 'C30',
  steelGrade: 'HRB400',
  cover: 20,
  barDiameter: 10,
  barSpacing: 200,
  gkExtra: 1.0,
  qk: 2.0,
  gammaG: 1.3,
  gammaQ: 1.5,
};

describe('双向板计算', () => {
  describe('弯矩系数内插', () => {
    it('λ=1.0 时两向系数相等（0.0368）', () => {
      const c = momentCoefficients(1.0);
      expect(c.ax).toBeCloseTo(0.0368, 4);
      expect(c.ay).toBeCloseTo(0.0368, 4);
    });
    it('λ=1.3333 内插在 1.3 与 1.4 之间', () => {
      const c = momentCoefficients(4 / 3);
      expect(c.ax).toBeGreaterThan(momentCoefficients(1.4).ax);
      expect(c.ax).toBeLessThan(momentCoefficients(1.3).ax);
      expect(c.ay).toBeGreaterThan(momentCoefficients(1.3).ay);
      expect(c.ay).toBeLessThan(momentCoefficients(1.4).ay);
    });
    it('λ 超范围时钳制到 [1.0, 2.0]', () => {
      expect(momentCoefficients(0.5).ax).toBeCloseTo(0.0368, 4);
      expect(momentCoefficients(3).ax).toBeCloseTo(0.0226, 4);
    });
  });

  describe('输入校验', () => {
    it('应拒绝无效输入', () => {
      const cases: Partial<TwoWaySlabInput>[] = [
        { h: 0 }, { spanX: -1 }, { spanY: 0 }, { qk: -1 }, { h: 20, cover: 20, barDiameter: 10 },
      ];
      for (const ov of cases) {
        const r = calculateTwoWaySlab({ ...defaultInput, ...ov });
        expect(r.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
      }
    });
    it('应拒绝未知材料', () => {
      expect(calculateTwoWaySlab({ ...defaultInput, concreteGrade: 'C99' }).advisories.some(a => a.code === 'UNKNOWN_CONCRETE')).toBe(true);
    });
  });

  describe('正常算例与手算对比', () => {
    const result = calculateTwoWaySlab(defaultInput);
    const value = (label: string) => result.results.find(item => item.label === label)?.value;

    it('荷载组合设计值 q=8.2 kN/m²', () => {
      expect(value('设计荷载 q')).toBe(8.2);
    });

    it('弯矩与手算一致（系数内插×q×lx²）', () => {
      const q = 8.2;
      const c = momentCoefficients(4 / 3);
      const Mx = c.ax * q * 3 * 3;
      const My = c.ay * q * 3 * 3;
      expect(value('短向弯矩 Mx')).toBe(Math.round(Mx * 100) / 100);
      expect(value('长向弯矩 My')).toBe(Math.round(My * 100) / 100);
      // 长向弯矩 > 短向弯矩（λ>1）
      expect(Number(value('长向弯矩 My'))).toBeGreaterThan(Number(value('短向弯矩 Mx')));
    });

    it('h0x > h0y（短向钢筋在底层）', () => {
      const g = result.geometry;
      const h0x = g.find(x => x.label === '短向有效高度 h0x')?.value;
      const h0y = g.find(x => x.label === '长向有效高度 h0y')?.value;
      expect(Number(h0x)).toBe(95);
      expect(Number(h0y)).toBe(85);
    });

    it('实配钢筋足够，各验算项通过', () => {
      expect(result.checks.map(c => c.passed)).toEqual([true, true, true, true, true, true, true, true, true]);
      expect(result.conclusion.passed).toBe(true);
    });

    it('返回完整 CalculationResult', () => {
      expect(result.calculatorType).toBe('slab-two-way');
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.allEvidence.some(e => e.verificationStatus === 'VERIFIED')).toBe(true);
      expect(result.allEvidence.some(e => e.verificationStatus === 'REVIEW_REQUIRED')).toBe(true); // 系数待核验
    });
  });

  describe('边界值', () => {
    it('配筋率过低时最小配筋率验算不通过', () => {
      const r = calculateTwoWaySlab({ ...defaultInput, barDiameter: 6, barSpacing: 300 });
      expect(r.checks.find(c => c.name === '最小配筋率验算')?.passed).toBe(false);
      expect(r.conclusion.passed).toBe(false);
    });

    it('大荷载跨越承载力边界', () => {
      const r = calculateTwoWaySlab({ ...defaultInput, qk: 40 });
      expect(r.checks.find(c => c.name === '短向承载力验算')?.passed).toBe(false);
    });

    it('方形板 λ=1.0 两向弯矩接近', () => {
      const r = calculateTwoWaySlab({ ...defaultInput, spanY: 3.0 });
      const Mx = Number(r.results.find(x => x.label === '短向弯矩 Mx')?.value);
      const My = Number(r.results.find(x => x.label === '长向弯矩 My')?.value);
      expect(Math.abs(Mx - My)).toBeLessThan(0.01);
    });
  });

  describe('单位与数量级', () => {
    it('弯矩单位为 kN·m/m', () => {
      const Mx = calculateTwoWaySlab(defaultInput).results.find(x => x.label === '短向弯矩 Mx');
      expect(Mx?.unit).toBe('kN·m/m');
      expect(Number(Mx?.value)).toBeGreaterThan(1);
      expect(Number(Mx?.value)).toBeLessThan(100);
    });
  });
});
