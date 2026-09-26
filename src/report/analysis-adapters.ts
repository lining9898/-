import { ContinuousSpanInput, ContinuousBeamResult } from '../core/beam/continuous';
import { AxialColumnInput, AxialColumnResult } from '../core/column/axial';
import { CalculationResult, createEmptyResult } from '../types/calculation';
import { createReviewRequiredEvidence } from '../types/evidence';

const rounded = (value: number) => Number(value.toFixed(6));

export function continuousBeamReport(spans: ContinuousSpanInput[], result: ContinuousBeamResult): CalculationResult {
  const report = createEmptyResult('连续梁内力计算');
  report.inputs = spans.flatMap((span, index) => [
    { label: `第 ${index + 1} 跨跨度 L`, value: span.length, unit: 'm' },
    { label: `第 ${index + 1} 跨均布荷载 q`, value: span.load, unit: 'kN/m' },
  ]);
  report.materials = [{ label: '刚度假定', value: '各跨等刚度 EI', unit: '' }];
  report.geometry = [{ label: '总跨度', value: rounded(spans.reduce((sum, span) => sum + span.length, 0)), unit: 'm' }];
  report.steps = [
    ...spans.map((span, index) => ({
      name: `第 ${index + 1} 跨均布荷载合力`,
      description: '全跨均布荷载作用下的竖向合力。',
      formula: 'Q = q · L',
      substitutedFormula: `${span.load} × ${span.length}`,
      result: rounded(span.load * span.length), unit: 'kN', evidence: [],
    })),
    ...result.spans.map((span, index) => ({
      name: `第 ${index + 1} 跨截面内力`,
      description: `支座弯矩由 FERS 线弹性求解器计算；局部坐标 x 自本跨左端起。左端剪力 ${rounded(span.leftShear)} kN，右端剪力 ${rounded(span.rightShear)} kN。`,
      formula: 'V(x) = V左 − qx；M(x) = M左 + V左·x − qx²/2',
      substitutedFormula: `M(x) = ${rounded(result.supportMoments[index])} + ${rounded(span.leftShear)}x − ${spans[index].load}x²/2`,
      result: `${rounded(span.maximumMoment)} kN·m，x = ${rounded(span.maximumMomentAt)} m`,
      unit: '', evidence: [],
    })),
    {
      name: '整体竖向力平衡',
      description: '核对求解器支座反力与外荷载合力。',
      formula: 'ΣR − Σ(q·L) = 0',
      substitutedFormula: `${rounded(result.reactions.reduce((sum, reaction) => sum + reaction, 0))} − ${rounded(result.totalLoad)}`,
      result: rounded(result.reactions.reduce((sum, reaction) => sum + reaction, 0) - result.totalLoad),
      unit: 'kN', evidence: [],
    },
  ];
  report.results = [
    ...result.reactions.map((reaction, index) => ({ label: `支座 ${index + 1} 竖向反力`, value: rounded(reaction), unit: 'kN' })),
    ...result.supportMoments.map((moment, index) => ({ label: `支座 ${index + 1} 弯矩`, value: rounded(moment), unit: 'kN·m' })),
    ...result.spans.map((span, index) => ({ label: `第 ${index + 1} 跨最大正弯矩`, value: rounded(span.maximumMoment), unit: 'kN·m' })),
  ];
  report.conclusion.summary = '仅完成线弹性内力分析；未进行荷载组合或构件设计验算，不能据此判定设计通过。';
  report.advisories = [{ severity: 'warning', code: 'ANALYSIS_ONLY', message: report.conclusion.summary }];
  return report;
}

export function axialColumnReport(input: AxialColumnInput, result: AxialColumnResult): CalculationResult {
  const report = createEmptyResult('轴心受压柱');
  const evidence = createReviewRequiredEvidence('混凝土结构设计规范', 'GB 50010', '6.2.15');
  evidence.edition = '2010（2015年版）';
  evidence.status = 'superseded';
  evidence.sourceFile = 'references/codes/GB50010-2010_2015_.pdf';
  report.allEvidence = [evidence];
  report.inputs = [
    { label: '截面宽度 b', value: input.width, unit: 'mm' },
    { label: '截面高度 h', value: input.depth, unit: 'mm' },
    { label: '计算长度 l₀', value: input.effectiveLength, unit: 'mm' },
    { label: '全部纵筋面积 A′s', value: input.reinforcementArea, unit: 'mm²' },
    { label: '轴向压力设计值 N', value: input.axialForce, unit: 'kN' },
  ];
  report.materials = [
    { label: '混凝土轴心抗压强度设计值 fc', value: input.concreteStrength, unit: 'N/mm²', evidence: [evidence] },
    { label: '钢筋抗压强度设计值 f′y', value: input.steelCompressionStrength, unit: 'N/mm²', evidence: [evidence] },
  ];
  report.geometry = [
    { label: '全截面面积 A', value: rounded(result.grossArea), unit: 'mm²' },
    { label: '纵筋率', value: rounded(result.reinforcementRatio * 100), unit: '%' },
    { label: '计算长度与短边之比', value: rounded(result.slendernessRatio), unit: '' },
  ];
  report.steps = [
    { name: '截面面积', description: '矩形截面面积。', formula: 'A = b · h',
      substitutedFormula: `${input.width} × ${input.depth}`, result: rounded(result.grossArea), unit: 'mm²', evidence: [] },
    { name: '纵筋率', description: '按全部纵筋面积与全截面面积计算。', formula: 'ρ = A′s / A',
      substitutedFormula: `${input.reinforcementArea} / ${rounded(result.grossArea)}`, result: rounded(result.reinforcementRatio * 100), unit: '%', evidence: [evidence] },
    { name: '稳定系数', description: `l₀ / 短边 = ${rounded(result.slendernessRatio)}；向较大长细比档取表中 ${result.tableRatio} 档。`,
      formula: 'φ = 表列稳定系数', result: result.stabilityFactor, unit: '', evidence: [evidence] },
    { name: '混凝土计算面积', description: result.reinforcementRatio > 0.03 ? '纵筋率大于 3%，扣除全部纵筋面积。' : '纵筋率不大于 3%，采用全截面面积。',
      formula: result.reinforcementRatio > 0.03 ? 'A净 = A − A′s' : 'A计 = A',
      substitutedFormula: result.reinforcementRatio > 0.03 ? `${rounded(result.grossArea)} − ${input.reinforcementArea}` : `${rounded(result.grossArea)}`,
      result: rounded(result.concreteArea), unit: 'mm²', evidence: [evidence] },
    { name: '轴压承载力', description: 'N 和 Nu 均采用 kN。', formula: 'Nu = 0.9φ(fc·A计 + f′y·A′s) / 1000',
      substitutedFormula: `0.9 × ${result.stabilityFactor} × (${input.concreteStrength} × ${rounded(result.concreteArea)} + ${input.steelCompressionStrength} × ${input.reinforcementArea}) / 1000`,
      result: rounded(result.capacity), unit: 'kN', evidence: [evidence] },
  ];
  report.results = [
    { label: '稳定系数 φ', value: result.stabilityFactor, unit: '' },
    { label: '混凝土计算面积', value: rounded(result.concreteArea), unit: 'mm²' },
    { label: '轴压承载力 Nu', value: rounded(result.capacity), unit: 'kN' },
  ];
  report.checks = [{ name: '正截面轴压承载力单项验算', calculatedValue: input.axialForce,
    limitValue: result.capacity, comparison: '<=', passed: result.passed, unit: 'kN', evidence: [evidence] }];
  report.conclusion = { passed: result.passed,
    summary: result.passed ? '轴压承载力单项满足，待规范原文复核；不代表完整设计通过。' : '轴向压力超过计算承载力，单项不满足。', evidence: [evidence] };
  report.advisories = [{ severity: 'warning', code: 'LIMITED_SCOPE',
    message: '未验算最小偏心、弯矩、箍筋构造、配筋限值、抗震及 2024 年局部修订。' }];
  return report;
}
