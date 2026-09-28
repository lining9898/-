import { describe, it, expect } from 'vitest';
import { calculateIndependentFoundation, IndependentFoundationInput } from '../../src/core/foundation/independent';

// 手算基准算例：
//   L=3.0m, B=2.4m, h=800mm, bc=500mm, hc=400mm, d=1.5m, γm=20, fa=300kPa
//   Nk=1200kN, N=1560kN, C30, HRB400, cover=40, Φ16@150
const defaultInput: IndependentFoundationInput = {
  L: 3.0,
  B: 2.4,
  h: 800,
  bc: 500,
  hc: 400,
  d: 1.5,
  gammaM: 20,
  fa: 300,
  Nk: 1200,
  N: 1560,
  concreteGrade: 'C30',
  steelGrade: 'HRB400',
  cover: 40,
  barDiameter: 16,
  barSpacing: 150,
};

describe('柱下独立基础计算（高风险单位模块）', () => {
  describe('输入校验', () => {
    it('应拒绝无效尺寸/荷载', () => {
      const cases: Partial<IndependentFoundationInput>[] = [
        { L: 0 }, { B: -1 }, { h: 0 }, { fa: 0 }, { N: -5 }, { bc: 0 }, { d: 0 }, { gammaM: 0 },
      ];
      for (const ov of cases) {
        const r = calculateIndependentFoundation({ ...defaultInput, ...ov });
        expect(r.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
      }
    });
    it('应拒绝柱截面超出基础底面', () => {
      const r = calculateIndependentFoundation({ ...defaultInput, bc: 3500 });
      expect(r.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });
    it('应拒绝未知材料等级', () => {
      expect(calculateIndependentFoundation({ ...defaultInput, concreteGrade: 'C99' }).advisories.some(a => a.code === 'UNKNOWN_CONCRETE')).toBe(true);
    });
  });

  describe('手算基准算例（全链路）', () => {
    const result = calculateIndependentFoundation(defaultInput);
    const value = (label: string) => result.results.find(item => item.label === label)?.value;
    const find = (name: string) => result.checks.find(c => c.name === name);

    it('地基承载力：pk = (Nk+Gk)/A = 196.67 kPa ≤ fa', () => {
      // A=7.2, Gk=20×1.5×7.2=216, pk=(1200+216)/7.2=196.67
      expect(value('基础底面面积 A')).toBe(7.2);
      expect(value('基础及覆土自重 Gk')).toBe(216);
      expect(value('基底平均压力 p_k')).toBe(196.67);
      expect(find('地基承载力验算')?.passed).toBe(true);
    });

    it('净反力 pj = N/A = 216.67 kPa', () => {
      expect(value('地基净反力 p_j')).toBe(216.67);
    });

    it('受弯：M1=293.4、M2=234.7 kN·m（单位与手算一致）', () => {
      expect(value('长边方向弯矩 M1')).toBe(293.4);
      expect(value('短边方向弯矩 M2')).toBe(234.72);
    });

    it('冲切：Fl=733.3 kN ≤ 0.7·βhp·ft·am·h0=942.4 kN', () => {
      expect(value('有效高度 h0')).toBe(752);
      expect(value('冲切力 F_l')).toBe(733.28);
      expect(value('受冲切承载力')).toBe(942.45);
      expect(find('冲切验算')?.passed).toBe(true);
    });

    it('抗剪：V=650 kN ≤ 0.7·βhs·ft·bw·h0=1806.6 kN', () => {
      expect(value('柱边剪力 V')).toBe(650);
      expect(value('斜截面受剪承载力')).toBe(1806.6);
      expect(find('斜截面受剪验算')?.passed).toBe(true);
    });

    it('配筋：As,req 与实配/最小配筋关系', () => {
      expect(value('长向所需钢筋 As,req')).toBe(1204.21);
      expect(value('短向所需钢筋 As,req')).toBe(963.37);
      expect(value('长向实配钢筋 As,prov')).toBe(3216.99);
      expect(value('短向实配钢筋 As,prov')).toBe(4021.24);
      expect(find('长向配筋验算')?.passed).toBe(true);
      expect(find('短向配筋验算')?.passed).toBe(true);
      expect(find('长向最小配筋率')?.passed).toBe(true);
      expect(find('短向最小配筋率')?.passed).toBe(true);
    });

    it('全验算通过且返回完整结构', () => {
      expect(result.conclusion.passed).toBe(true);
      expect(result.checks.map(c => c.passed)).toEqual([true, true, true, true, true, true, true]);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.calculatorType).toBe('foundation-independent');
    });
  });

  describe('边界值', () => {
    it('地基承载力不足时地基验算不通过', () => {
      const r = calculateIndependentFoundation({ ...defaultInput, fa: 150 });
      expect(r.checks.find(c => c.name === '地基承载力验算')?.passed).toBe(false);
      expect(r.conclusion.passed).toBe(false);
    });

    it('基础高度减小使冲切不通过', () => {
      const r = calculateIndependentFoundation({ ...defaultInput, h: 500 });
      const punch = r.checks.find(c => c.name === '冲切验算');
      expect(punch?.passed).toBe(false);
    });

    it('大轴力跨越承载力边界', () => {
      const r = calculateIndependentFoundation({ ...defaultInput, N: 4000, Nk: 3200 });
      expect(r.checks.find(c => c.name === '冲切验算')?.passed).toBe(false);
    });

    it('极小/极大基础应能计算', () => {
      const small = calculateIndependentFoundation({ ...defaultInput, L: 1.5, B: 1.2, N: 300, Nk: 240, bc: 300, hc: 300, h: 400 });
      expect(small.steps.length).toBeGreaterThan(0);
      const large = calculateIndependentFoundation({ ...defaultInput, L: 6, B: 5, N: 5000, Nk: 4000, h: 1500, bc: 800, hc: 700 });
      expect(large.steps.length).toBeGreaterThan(0);
    });
  });

  describe('10³/10⁶ 数量级保护测试', () => {
    it('弯矩为 kN·m 量级（百 kN·m），不得误作 N·mm（10⁶ 量级错误）', () => {
      const M1 = calculateIndependentFoundation(defaultInput).results.find(x => x.label === '长边方向弯矩 M1');
      expect(M1?.unit).toBe('kN·m');
      const v = Number(M1?.value);
      expect(v).toBeGreaterThan(10);
      expect(v).toBeLessThan(10000); // 若写成 N·mm 会达 ~1e8
    });

    it('冲切力与承载力为 kN 量级，不得误作 N（10³ 量级错误）', () => {
      const r = calculateIndependentFoundation(defaultInput);
      const Fl = Number(r.results.find(x => x.label === '冲切力 F_l')?.value);
      const Vc = Number(r.results.find(x => x.label === '受冲切承载力')?.value);
      const Vs = Number(r.results.find(x => x.label === '柱边剪力 V')?.value);
      const V = Number(r.results.find(x => x.label === '斜截面受剪承载力')?.value);
      [Fl, Vc, Vs, V].forEach(v => {
        expect(v).toBeGreaterThan(100);   // kN 量级
        expect(v).toBeLessThan(1e5);      // 若误作 N 会达 ~1e6
      });
    });

    it('配筋面积为 mm² 量级（~10³），不得误作 m² 或放大 10⁶', () => {
      const r = calculateIndependentFoundation(defaultInput);
      ['长向所需钢筋 As,req', '长向实配钢筋 As,prov', '短向实配钢筋 As,prov'].forEach(label => {
        const v = Number(r.results.find(x => x.label === label)?.value);
        expect(v).toBeGreaterThan(100);
        expect(v).toBeLessThan(1e5); // 若以 mm² 误作 m² 或放大 1e6 会越界
      });
    });

    it('地基反力为 kPa 量级（~10²），不得误作 Pa（10³ 量级错误）', () => {
      const pj = Number(calculateIndependentFoundation(defaultInput).results.find(x => x.label === '地基净反力 p_j')?.value);
      expect(pj).toBeGreaterThan(10);
      expect(pj).toBeLessThan(1e4); // kPa 量级
    });

    it('h0 单位为 mm，柱截面换算 mm→m 后用于面积/弯矩', () => {
      const r = calculateIndependentFoundation(defaultInput);
      expect(Number(r.results.find(x => x.label === '有效高度 h0')?.value)).toBe(752);
      // 长边弯矩 M1 依赖 a1=(L-bc)/2，若 bc 误用 mm 直接参与，M1 量级将异常
      expect(Number(r.results.find(x => x.label === '长边方向弯矩 M1')?.value)).toBeCloseTo(293.4, 1);
    });

    it('柱截面(mm)换算为 m 后参与弯矩/面积，避免 mm/m 混用', () => {
      const r = calculateIndependentFoundation(defaultInput);
      // a1 = (L - bc/1000)/2 = (3.0-0.5)/2 = 1.25m；若 bc=500 未换算为 m，a1 为负/异常
      // 以 M1 = 293.4 kN·m 为基准反验：M1 量级正确说明 bc 已按 mm→m 处理
      expect(Number(r.results.find(x => x.label === '长边方向弯矩 M1')?.value)).toBe(293.4);
      // 冲切锥面积用 (bc+2h0)/1000，若 h0 误当 m，锥面积量级将失真
      expect(Number(r.results.find(x => x.label === '冲切力 F_l')?.value)).toBe(733.28);
    });
  });

  describe('Evidence 追溯', () => {
    it('冲切/受弯/承载力步骤均有 Evidence，GB 50007 条款为 REVIEW_REQUIRED 且无虚构页码', () => {
      const r = calculateIndependentFoundation(defaultInput);
      const punchStep = r.steps.find(s => s.name === '计算冲切力');
      expect(punchStep?.evidence[0]).toMatchObject({ codeNumber: 'GB 50007', clause: '8.2.8' });
      const gb50007Records = r.allEvidence.filter(e => e.codeNumber === 'GB 50007');
      expect(gb50007Records.length).toBeGreaterThan(0);
      gb50007Records.forEach(e => {
        expect(e.verificationStatus).toBe('REVIEW_REQUIRED');
        expect(e.pdfPage).toBeNull();
        expect(e.sourceFile).toBeNull();
      });
      // 材料参数为 VERIFIED 带页码
      const gb50010Verified = r.allEvidence.filter(e => e.codeNumber === 'GB 50010' && e.verificationStatus === 'VERIFIED');
      expect(gb50010Verified.length).toBeGreaterThan(0);
      gb50010Verified.forEach(e => expect(e.pdfPage).not.toBeNull());
    });

    it('overallStatus 为 REVIEW_REQUIRED（GB 50007 待核验）', () => {
      expect(calculateIndependentFoundation(defaultInput).overallStatus).toBe('REVIEW_REQUIRED');
    });
  });
});
