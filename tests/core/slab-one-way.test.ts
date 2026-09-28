import { describe, it, expect } from 'vitest';
import { calculateOneWaySlab, OneWaySlabInput, slabBarAreaPerMeter } from '../../src/core/slab/one-way';

const defaultInput: OneWaySlabInput = {
  h: 120,
  span: 3.0,
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

describe('单向板计算', () => {
  describe('输入校验', () => {
    it('应拒绝非正板厚/跨度/保护层/钢筋', () => {
      const cases: Partial<OneWaySlabInput>[] = [
        { h: 0 }, { span: -1 }, { cover: 0 }, { barDiameter: 0 }, { barSpacing: -5 },
        { h: Number.NaN }, { span: Number.POSITIVE_INFINITY },
      ];
      for (const ov of cases) {
        const r = calculateOneWaySlab({ ...defaultInput, ...ov });
        expect(r.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
      }
    });
    it('应拒绝钢筋放不下的板厚', () => {
      const r = calculateOneWaySlab({ ...defaultInput, h: 22, cover: 20, barDiameter: 10 });
      expect(r.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });
    it('应拒绝未知混凝土/钢筋等级', () => {
      expect(calculateOneWaySlab({ ...defaultInput, concreteGrade: 'C99' }).advisories.some(a => a.code === 'UNKNOWN_CONCRETE')).toBe(true);
      expect(calculateOneWaySlab({ ...defaultInput, steelGrade: 'HRB999' }).advisories.some(a => a.code === 'UNKNOWN_STEEL')).toBe(true);
    });
  });

  describe('正常算例框架', () => {
    const result = calculateOneWaySlab(defaultInput);
    const value = (label: string) => result.results.find(item => item.label === label)?.value;

    it('C30/HRB400 独立数值基准保持一致', () => {
      expect(value('板自重 gk(自重)')).toBe(3.0);
      expect(value('设计线荷载 q')).toBe(8.2);
      expect(value('跨中弯矩 M')).toBe(9.23);
      expect(value('所需钢筋 As,req')).toBe(280.13);
      expect(value('实配钢筋 As,prov')).toBe(392.7);
      expect(value('受弯承载力 Mu')).toBe(12.73);
      expect(result.checks.map(c => c.passed)).toEqual([true, true, true, true, true, true]);
      expect(result.overallStatus).toBe('REVIEW_REQUIRED');
    });

    it('手算对比：荷载→弯矩→配筋→承载力', () => {
      // 恒载：25×0.12=3.0，总恒载=4.0，gd=1.3×4=5.2，qd=1.5×2=3，q=8.2 kN/m
      // M = 8.2×9/8 = 9.225 kN·m
      const M = 8.2 * 9 / 8;
      expect(value('跨中弯矩 M')).toBe(Math.round(M * 100) / 100);
      // 配筋：h0=95mm，αs=9.225e6/(14.3×1000×95²)=0.07148，ξ=0.07424，x=7.053，As=280.16
      const fc = 14.3, b = 1000, h0 = 95, fy = 360, alpha1 = 1.0;
      const alphaS = M * 1e6 / (alpha1 * fc * b * h0 * h0);
      const xi = 1 - Math.sqrt(1 - 2 * alphaS);
      const x = xi * h0;
      const AsReq = alpha1 * fc * b * x / fy;
      expect(value('所需钢筋 As,req')).toBe(Math.round(AsReq * 100) / 100);
      // 承载力：As_prov=392.7，x=9.886，Mu=12.73
      const AsProv = slabBarAreaPerMeter(10, 200);
      const capX = fy * AsProv / (alpha1 * fc * b);
      const Mu = alpha1 * fc * b * capX * (h0 - capX / 2) / 1e6;
      expect(value('受弯承载力 Mu')).toBe(Math.round(Mu * 100) / 100);
    });

    it('slabBarAreaPerMeter 返回每延米面积', () => {
      expect(slabBarAreaPerMeter(10, 200)).toBeCloseTo(392.7, 1);
      expect(slabBarAreaPerMeter(12, 150)).toBeCloseTo(753.98, 1);
    });

    it('应返回完整 CalculationResult 结构', () => {
      expect(result.calculatorType).toBe('slab-one-way');
      expect(result.inputs.length).toBeGreaterThan(0);
      expect(result.materials.length).toBeGreaterThan(0);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.conclusion).toBeDefined();
    });

    it('VERIFIED 材料/受弯证据带页码，构造/荷载证据保持 REVIEW_REQUIRED', () => {
      const verified = result.allEvidence.filter(e => e.verificationStatus === 'VERIFIED');
      const review = result.allEvidence.filter(e => e.verificationStatus === 'REVIEW_REQUIRED');
      expect(verified.length).toBeGreaterThan(0);
      verified.forEach(e => {
        expect(e.pdfPage).not.toBeNull();
        expect(e.sourceFile).toBeTruthy();
      });
      review.forEach(e => expect(e.pdfPage).toBeNull());
      expect(review.length).toBeGreaterThan(0); // 荷载/构造不虚构页码
    });
  });

  describe('边界值测试', () => {
    it('实配钢筋不足时应不通过', () => {
      const r = calculateOneWaySlab({ ...defaultInput, barDiameter: 8, barSpacing: 300 });
      const check = r.checks.find(c => c.name === '实配面积验算');
      const capacity = r.checks.find(c => c.name === '受弯承载力验算');
      expect(check?.passed).toBe(false);
      expect(capacity?.passed).toBe(false);
      expect(r.conclusion.passed).toBe(false);
    });

    it('大荷载跨越承载力边界', () => {
      const r = calculateOneWaySlab({ ...defaultInput, qk: 15 });
      expect(r.checks.find(c => c.name === '受弯承载力验算')?.passed).toBe(false);
    });

    it('钢筋间距超限应触发构造不通过', () => {
      const r = calculateOneWaySlab({ ...defaultInput, barSpacing: 250 });
      expect(r.checks.find(c => c.name === '钢筋间距构造验算')?.passed).toBe(false);
    });

    it('极小板厚（满足构造）应能计算', () => {
      const r = calculateOneWaySlab({ ...defaultInput, h: 100, span: 2.0, barDiameter: 8, barSpacing: 150 });
      expect(r.steps.length).toBeGreaterThan(0);
    });
  });

  describe('单位与数量级', () => {
    it('弯矩单位为 kN·m，量级合理（9 kN·m 级，非 N·mm）', () => {
      const r = calculateOneWaySlab(defaultInput);
      const M = r.results.find(x => x.label === '跨中弯矩 M');
      expect(M?.unit).toBe('kN·m');
      expect(Number(M?.value)).toBeGreaterThan(1);
      expect(Number(M?.value)).toBeLessThan(1000);
    });
    it('设计线荷载单位为 kN/m，量级合理', () => {
      const q = calculateOneWaySlab(defaultInput).results.find(x => x.label === '设计线荷载 q');
      expect(q?.unit).toBe('kN/m');
      expect(Number(q?.value)).toBeLessThan(100);
    });
    it('配筋单位为 mm²/m', () => {
      const a = calculateOneWaySlab(defaultInput).results.find(x => x.label === '实配钢筋 As,prov');
      expect(a?.unit).toBe('mm²/m');
      expect(Number(a?.value)).toBeGreaterThan(100);
    });
  });

  describe('计算步骤与 Evidence', () => {
    it('步骤含公式、代入、结果和证据', () => {
      const r = calculateOneWaySlab(defaultInput);
      r.steps.forEach(s => {
        expect(s.formula).toBeTruthy();
        expect(s.substitutedFormula).toBeTruthy();
        expect(s.result).toBeDefined();
        expect(s.evidence.length).toBeGreaterThan(0);
      });
    });
    it('受弯配筋步骤证据指向 6.2.10 且带页码', () => {
      const r = calculateOneWaySlab(defaultInput);
      const step = r.steps.find(s => s.name === '正截面配筋设计');
      expect(step?.evidence[0]).toMatchObject({ clause: '6.2.10', pdfPage: 55, verificationStatus: 'VERIFIED' });
    });
  });
});
