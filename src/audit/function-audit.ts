import { calculateBeamShear, BeamShearInput } from '../core/beam/shear';
import { calculateBeamFlexure, BeamFlexureInput } from '../core/beam/flexure';
import { calculateBeamTFlexure, BeamTFlexureInput } from '../core/beam/t-flexure';
import { CalculationResult } from '../types/calculation';
import { calculateSteelBeam } from '../core/steel/beam';

export interface AuditProbe {
  name: string;
  input: string;
  expected: number | null;
  actual: number | null;
  unit: string;
  status: 'matched' | 'mismatch' | 'not-covered';
  note?: string;
}

function value(result: CalculationResult, label: string): number | null {
  const found = result.results.find(item => item.label === label)?.value;
  return typeof found === 'number' && Number.isFinite(found) ? found : null;
}

function compare(name: string, input: string, expected: number, actual: number | null, unit: string, note?: string): AuditProbe {
  return {
    name, input, expected: Math.round(expected * 100) / 100, actual, unit,
    status: actual !== null && Math.abs(actual - expected) <= 0.011 ? 'matched' : 'mismatch',
    note,
  };
}

const shearBase: BeamShearInput = {
  b: 200, h: 700, h0: 600, concreteGrade: 'C30', stirrupGrade: 'HPB300',
  V: 120, stirrupLegs: 2, stirrupSpacing: 200, stirrupDiameter: 8, loadType: 'uniform',
};

const tBase: BeamTFlexureInput = {
  b: 200, h: 500, bf: 600, hf: 100, concreteGrade: 'C30', steelGrade: 'HRB400',
  cover: 25, barDiameter: 20, barCount: 4, moment: 120,
};

const flexureBase: BeamFlexureInput = {
  b: 250, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400',
  cover: 25, barDiameter: 20, barCount: 4, moment: 120,
};

export interface AuditCalculators {
  shear: typeof calculateBeamShear;
  flexure: typeof calculateBeamFlexure;
  tFlexure: typeof calculateBeamTFlexure;
}

const defaultCalculators: AuditCalculators = {
  shear: calculateBeamShear, flexure: calculateBeamFlexure, tFlexure: calculateBeamTFlexure,
};

export function auditRule(clause: string, calculators: AuditCalculators = defaultCalculators): AuditProbe[] {
  switch (clause) {
    case 'GB50017:6.1.1':
    case 'GB50017:6.1.3':
    case 'GB50017:6.2.2': {
      const result = calculateSteelBeam({
        h: 400, bf: 200, tf: 12, tw: 8, moment: 120, shear: 80,
        bendingStrength: 215, shearStrength: 125, stabilityFactor: 0.8,
      });
      const I = 216148650.66666666;
      const W = I / 200;
      const S = 606976;
      if (clause === 'GB50017:6.1.1') {
        return [compare('钢梁弹性受弯应力', 'h=400, bf=200, tf=12, tw=8, M=120',
          120e6 / W, result.bendingStress, 'N/mm²')];
      }
      if (clause === 'GB50017:6.1.3') {
        return [compare('钢梁腹板中和轴剪应力', 'h=400, bf=200, tf=12, tw=8, V=80',
          80e3 * S / (I * 8), result.shearStress, 'N/mm²')];
      }
      return [compare('钢梁整体稳定应力', 'M=120, W=1080743.25, φb=0.8（用户给定）',
        120e6 / (0.8 * W), result.stabilityStress, 'N/mm²',
        '仅核对公式代入；φb 的附录 C 取值及侧向支承条件尚未自动审计。')];
    }
    case '6.2.10': {
      const input = flexureBase;
      const As = input.barCount * Math.PI * input.barDiameter ** 2 / 4;
      const h0 = input.h - input.cover - input.barDiameter / 2;
      const x = 360 * As / (14.3 * input.b);
      const expected = 14.3 * input.b * x * (h0 - x / 2) / 1e6;
      return [compare('单筋矩形梁受弯承载力', `b=${input.b}, h=${input.h}, As=${As.toFixed(2)}, C30, HRB400`,
        expected, value(calculators.flexure(input), '受弯承载力 Mu'), 'kN·m')];
    }
    case '6.3.1':
      return [4, 5, 6.5].map(ratio => {
        const b = shearBase.b;
        const h0 = b * ratio;
        const coefficient = ratio <= 4 ? 0.25 : ratio >= 6 ? 0.20 : 0.25 - (ratio - 4) * 0.025;
        const result = calculators.shear({ ...shearBase, h: h0 + 100, h0, V: ratio === 6.5 ? 800 : 120 });
        const expected = coefficient * 14.3 * b * h0 / 1000;
        const actual = value(result, '截面限制值 Vmax');
        const decision = result.checks.find(check => check.name === '截面限制条件验算')?.passed;
        const expectedDecision = (ratio === 6.5 ? 800 : 120) <= expected;
        const probe = compare(`h₀/b = ${ratio}`, `b=${b}, h₀=${h0}, C30`, expected, actual, 'kN');
        if (decision !== expectedDecision) probe.status = 'mismatch';
        probe.note = `截面限制验算：期望${expectedDecision ? '通过' : '不通过'}，函数${decision ? '通过' : '不通过'}`;
        return probe;
      });
    case '6.3.4':
      return ['uniform', 'concentrated'].map(loadType => {
        const input: BeamShearInput = { ...shearBase, loadType: loadType as BeamShearInput['loadType'], shearSpan: loadType === 'concentrated' ? 1200 : undefined };
        const alphaCv = loadType === 'uniform' ? 0.7 : 1.75 / 3;
        const Asv = input.stirrupLegs * Math.PI * input.stirrupDiameter ** 2 / 4;
        const expected = (alphaCv * 1.43 * input.b * input.h0 + 270 * Asv * input.h0 / input.stirrupSpacing) / 1000;
        return compare(loadType === 'uniform' ? '一般受弯' : '集中荷载', `b=${input.b}, h₀=${input.h0}, C30, HPB300`, expected,
          value(calculators.shear(input), '斜截面受剪承载力 Vcs'), 'kN');
      });
    case '8.5.1': {
      const tProbes = [600, 800].map(bf => {
        const input = { ...tBase, bf };
        return compare(`b_f = ${bf}`, `b=200, h=500, b_f=${bf}, C30, HRB400`, 0.002 * input.b * input.h,
          value(calculators.tFlexure(input), '最小配筋面积 As,min'), 'mm²');
      });
      const input = flexureBase;
      const As = input.barCount * Math.PI * input.barDiameter ** 2 / 4;
      return [...tProbes, compare('矩形梁受拉钢筋配筋率', `b=${input.b}, h=${input.h}, As=${As.toFixed(2)}`,
        As / (input.b * input.h) * 100, value(calculators.flexure(input), '配筋率 ρ'), '%')];
    }
    case '6.2.11':
      return [tBase, { ...tBase, h: 600, hf: 120, bf: 800, cover: 30, barDiameter: 28, barCount: 10, moment: 500 }]
        .map(input => {
          const As = input.barCount * Math.PI * input.barDiameter ** 2 / 4;
          const h0 = input.h - input.cover - input.barDiameter / 2;
          const flangeForce = 14.3 * input.bf * input.hf;
          const inFlange = 360 * As <= flangeForce;
          const x = inFlange ? 360 * As / (14.3 * input.bf)
            : (360 * As - 14.3 * (input.bf - input.b) * input.hf) / (14.3 * input.b);
          const expected = (inFlange ? 14.3 * input.bf * x * (h0 - x / 2)
            : 14.3 * (input.b * x * (h0 - x / 2) + (input.bf - input.b) * input.hf * (h0 - input.hf / 2))) / 1e6;
          return compare(inFlange ? '中和轴在翼缘内' : '中和轴在腹板内',
            `b=${input.b}, b_f=${input.bf}, h_f=${input.hf}, As=${As.toFixed(2)}`,
            expected, value(calculators.tFlexure(input), '受弯承载力 Mu'), 'kN·m');
        });
    case '6.2.12':
      return [{
        name: '翼缘计算宽度取值', input: 'T形梁 bf 由用户输入', expected: null, actual: null,
        unit: '', status: 'not-covered', note: '函数缺少表 5.2.4 所需的跨度、梁间距等条件，当前只能提示用户，不能自动核查 bf。',
      }];
    default:
      return [];
  }
}
