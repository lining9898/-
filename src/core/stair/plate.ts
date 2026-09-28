/**
 * 现浇板式楼梯计算内核
 *
 * 数据链：几何 → 恒载 → 活载 → 荷载组合 → 内力 → 配筋 → 构造验算 → 结果
 *         → CalculationResult → Evidence → 计算书
 *
 * 状态：REVIEW_REQUIRED
 * 模型：单跨简支板式楼梯（按水平投影长度取 1m 宽梯板），梯段自重按水平投影折算，
 * 含斜板厚度与踏步三角形两部分。
 *
 * 规范依据：
 *   - GB 50010-2010(2015年版)：材料参数（4.1.4/4.2.3）、受弯（6.2.10）、最小配筋率（8.5.1）——VERIFIED。
 *   - GB 50009-2012：混凝土重度、荷载组合、楼梯活载——REVIEW_REQUIRED（无 PDF）。
 *   - 梯板厚度构造为工程经验建议——REVIEW_REQUIRED。
 */

import { CalculationResult, CalculationStep, CheckItem, createEmptyResult } from '../../types/calculation';
import { Evidence } from '../../types/evidence';
import {
  CONCRETE_PARAMS,
  STEEL_PARAMS,
  verifiedEvidence,
  reviewRequiredEvidence,
} from '../shared/materials';
import {
  designFlexure,
  flexureCapacity,
  limitingRelativeDepth,
  minimumReinforcementRatio,
} from '../shared/flexure';

/** 板式楼梯输入参数 */
export interface PlateStairInput {
  span: number;         // 梯段水平投影计算跨度 l0 (m)
  stepRise: number;     // 踏步高 (mm)
  stepRun: number;      // 踏步宽 (mm)
  t: number;            // 梯板厚 (mm)
  concreteGrade: string;
  steelGrade: string;
  cover: number;        // 梯板底受力钢筋外缘至板底面距离（保护层）(mm)
  barDiameter: number;  // 受力钢筋直径 (mm)
  barSpacing: number;   // 受力钢筋间距 (mm)
  gkExtra: number;      // 面层及板底抹灰等附加恒载 (kN/m²)
  qk: number;           // 活荷载标准值 (kN/m²)
  gammaG: number;       // 恒载分项系数
  gammaQ: number;       // 活载分项系数
  width?: number;       // 梯板计算宽度 (mm)，默认 1000
}

const DEFAULT_WIDTH = 1000;
const CONCRETE_UNIT_WEIGHT = 25; // 钢筋混凝土重度 (kN/m³)

export function calculatePlateStair(input: PlateStairInput): CalculationResult {
  const result = createEmptyResult('staircase-plate');
  const allEvidence: Evidence[] = [];
  const width = input.width ?? DEFAULT_WIDTH;

  const gb10 = (clause: string, chapter: string, text: string, page: number) => {
    const e = verifiedEvidence(clause, chapter, text, page);
    allEvidence.push(e);
    return e;
  };
  const gb50009 = (clause: string, text: string) => {
    const e = reviewRequiredEvidence(clause, '荷载', text, 'GB 50009', '建筑结构荷载规范', '2012');
    allEvidence.push(e);
    return e;
  };
  const rr = (clause: string, chapter: string, text: string) => {
    const e = reviewRequiredEvidence(clause, chapter, text);
    allEvidence.push(e);
    return e;
  };

  const numericFields = [input.span, input.stepRise, input.stepRun, input.t, input.cover, input.barDiameter, input.barSpacing, input.gkExtra, input.qk, input.gammaG, input.gammaQ, width];
  if (
    !numericFields.every(Number.isFinite) ||
    input.span <= 0 || input.stepRise <= 0 || input.stepRun <= 0 || input.t <= 0 ||
    input.cover <= 0 || input.barDiameter <= 0 || input.barSpacing <= 0 ||
    input.gkExtra < 0 || input.qk < 0 || input.gammaG <= 0 || input.gammaQ <= 0 ||
    width <= 0 || input.cover + input.barDiameter / 2 >= input.t
  ) {
    result.advisories.push({ severity: 'error', code: 'INVALID_INPUT', message: '请输入有效的梯板、踏步和荷载参数。' });
    return result;
  }
  const concrete = CONCRETE_PARAMS[input.concreteGrade];
  const steel = STEEL_PARAMS[input.steelGrade];
  if (!concrete) {
    result.advisories.push({ severity: 'error', code: 'UNKNOWN_CONCRETE', message: `未知混凝土等级: ${input.concreteGrade}` });
    return result;
  }
  if (!steel) {
    result.advisories.push({ severity: 'error', code: 'UNKNOWN_STEEL', message: `未知钢筋等级: ${input.steelGrade}` });
    return result;
  }

  result.inputs = [
    { label: '水平投影跨度 l0', value: input.span, unit: 'm' },
    { label: '踏步高', value: input.stepRise, unit: 'mm' },
    { label: '踏步宽', value: input.stepRun, unit: 'mm' },
    { label: '梯板厚 t', value: input.t, unit: 'mm' },
    { label: '保护层 c', value: input.cover, unit: 'mm' },
    { label: '受力钢筋直径', value: input.barDiameter, unit: 'mm' },
    { label: '受力钢筋间距', value: input.barSpacing, unit: 'mm' },
    { label: '附加恒载 gk', value: input.gkExtra, unit: 'kN/m²' },
    { label: '活载标准值 qk', value: input.qk, unit: 'kN/m²' },
    { label: '恒载分项系数 γG', value: input.gammaG, unit: '' },
    { label: '活载分项系数 γQ', value: input.gammaQ, unit: '' },
  ];

  const evFc = gb10('4.1.4', '第4章', '混凝土轴心抗压强度的设计值 fc 应按表 4.1.4-1 采用。', 34);
  const evFy = gb10('4.2.3', '第4章', '普通钢筋的抗拉强度设计值 fy 应按表 4.2.3-1 采用。', 38);
  const evAlpha = gb10('6.2.6', '第6章', '当混凝土强度等级不超过 C50 时，α1 取为 1.0。', 52);
  result.materials = [
    { label: '混凝土等级', value: input.concreteGrade, unit: '', evidence: [evFc] },
    { label: 'fc', value: concrete.fc, unit: 'MPa', evidence: [evFc] },
    { label: 'ft', value: concrete.ft, unit: 'MPa', evidence: [evFc] },
    { label: 'α1', value: concrete.alpha1, unit: '', evidence: [evAlpha] },
    { label: '钢筋等级', value: input.steelGrade, unit: '', evidence: [evFy] },
    { label: 'fy', value: steel.fy, unit: 'MPa', evidence: [evFy] },
  ];

  const h0 = input.t - input.cover - input.barDiameter / 2;
  const xiB = limitingRelativeDepth(concrete.beta1, steel.fy, steel.Es);
  result.geometry = [
    { label: '梯板计算宽度 b', value: width, unit: 'mm' },
    { label: '有效高度 h0', value: Math.round(h0 * 100) / 100, unit: 'mm' },
  ];

  const steps: CalculationStep[] = [];

  // ---- 恒载（水平投影折算）----
  const evWeight = gb50009('3.1.1', '永久荷载（钢筋混凝土重度 25 kN/m³）');
  // 斜板自重（水平投影）：25·(t/1000)·√(1+(h/b)²)
  const slopeFactor = Math.sqrt(1 + (input.stepRise / input.stepRun) * (input.stepRise / input.stepRun));
  const gSlab = CONCRETE_UNIT_WEIGHT * (input.t / 1000) * slopeFactor; // kN/m³ × 梯板厚(mm→m) × 斜面系数 → kN/m²（水平投影）
  // 踏步三角形自重（水平投影）：25·(1/2)·h = 12.5·(h/1000)
  const gStep = CONCRETE_UNIT_WEIGHT * (1 / 2) * (input.stepRise / 1000); // kN/m³ × 踏步高(mm→m) → kN/m²
  const gk = gSlab + gStep + input.gkExtra; // kN/m²
  steps.push({
    name: '计算恒载标准值（水平投影折算）',
    description: '斜板自重 g1=25·t·√(1+(h/b)²)，踏步三角形 g2=25·(h/2)，另加面层等 gkExtra，均按水平投影面积折算',
    formula: 'g_k = 25·t·√(1+(h/b)²) + 25·h/2 + g_k,extra',
    symbolDefinitions: [
      { symbol: 'h', meaning: '踏步高', unit: 'mm' },
      { symbol: 'b', meaning: '踏步宽', unit: 'mm' },
    ],
    substitutedFormula: `gk = 25×(${input.t}/1000)×${Math.round(slopeFactor * 1000) / 1000} + 12.5×(${input.stepRise}/1000) + ${input.gkExtra}`,
    result: Math.round(gk * 1000) / 1000,
    unit: 'kN/m²',
    evidence: [evWeight],
  });

  // ---- 荷载组合 ----
  const evCombo = gb50009('3.2.3', '荷载基本组合：恒载 1.3、活载 1.5（可变荷载控制）');
  const gd = input.gammaG * gk;
  const qd = input.gammaQ * input.qk;
  const qPerM2 = gd + qd;
  const q = qPerM2 * (width / 1000); // kN/m² × 梯板宽(mm→m) → 每延米线荷载 kN/m
  steps.push({
    name: '荷载组合设计值',
    description: 'q = γG·gk + γQ·qk，再乘以计算宽度折算为每延米线荷载',
    formula: 'q = (γ_G·g_k + γ_Q·q_k)·b',
    substitutedFormula: `q = (${input.gammaG}×${Math.round(gk * 1000) / 1000} + ${input.gammaQ}×${input.qk}) × ${width}/1000`,
    result: Math.round(q * 1000) / 1000,
    unit: 'kN/m',
    evidence: [evCombo],
  });

  // ---- 内力（单跨简支）----
  const evMoment = rr('2.1.2', '第2章', '板式楼梯按单跨简支梁计算：M=q·l0²/8、V=q·l0/2（结构力学简支梁内力，待规范原文校核）');
  const M = (q * input.span * input.span) / 8; // kN·m
  const V = (q * input.span) / 2;               // kN
  steps.push({
    name: '计算跨中弯矩',
    description: '单跨简支板式楼梯（水平投影）跨中最大弯矩 M=q·l0²/8',
    formula: 'M = q·l_0² / 8',
    substitutedFormula: `M = ${Math.round(q * 1000) / 1000} × ${input.span}² / 8`,
    result: Math.round(M * 100) / 100,
    unit: 'kN·m',
    evidence: [evMoment],
  });

  // ---- 配筋 ----
  const evFlex = gb10('6.2.10', '第6章', '正截面受弯承载力：M ≤ α1·fc·b·x·(h0 - x/2)。', 55);
  const design = designFlexure(M, concrete.fc, steel.fy, width, h0, concrete.alpha1);
  const AsReq = design.AsReq;
  const AsProv = (Math.PI * input.barDiameter * input.barDiameter) / 4 * (1000 / input.barSpacing);
  const rhoMin = minimumReinforcementRatio(concrete.ft, steel.fy);
  const AsMin = rhoMin * width * input.t;
  const rhoProv = AsProv / (width * input.t);
  steps.push({
    name: '正截面配筋设计',
    description: '由弯矩 M 求所需钢筋面积 As,req（单筋矩形截面）',
    formula: 'A_s,req = α_1·f_c·b·x / f_y',
    substitutedFormula: `As,req = ${concrete.alpha1}×${concrete.fc}×${width}×${Math.round(design.x * 100) / 100} / ${steel.fy}`,
    result: Math.round(AsReq * 100) / 100,
    unit: 'mm²/m',
    evidence: [evFlex],
  });
  steps.push({
    name: '实配钢筋面积',
    description: '梯板底受力钢筋每延米面积 As,prov = (π·d²/4)·(1000/s)',
    formula: 'A_s,prov = (π·d²/4)·(1000/s)',
    substitutedFormula: `As,prov = (π×${input.barDiameter}²/4)×(1000/${input.barSpacing})`,
    result: Math.round(AsProv * 100) / 100,
    unit: 'mm²/m',
    evidence: [gb10('8.5.1', '第8章', '受弯构件纵向受力钢筋最小配筋百分率 ρmin 不应小于表 8.5.1。', 124)],
  });

  const cap = flexureCapacity(AsProv, concrete.fc, steel.fy, width, h0, concrete.alpha1);
  result.steps = steps;

  result.results = [
    { label: '斜板自重折算', value: Math.round(gSlab * 1000) / 1000, unit: 'kN/m²' },
    { label: '踏步自重折算', value: Math.round(gStep * 1000) / 1000, unit: 'kN/m²' },
    { label: '恒载标准值 gk', value: Math.round(gk * 1000) / 1000, unit: 'kN/m²' },
    { label: '设计线荷载 q', value: Math.round(q * 1000) / 1000, unit: 'kN/m' },
    { label: '跨中弯矩 M', value: Math.round(M * 100) / 100, unit: 'kN·m' },
    { label: '支座剪力 V', value: Math.round(V * 100) / 100, unit: 'kN' },
    { label: '所需钢筋 As,req', value: Math.round(AsReq * 100) / 100, unit: 'mm²/m' },
    { label: '实配钢筋 As,prov', value: Math.round(AsProv * 100) / 100, unit: 'mm²/m' },
    { label: '受弯承载力 Mu', value: Math.round(cap.Mu * 100) / 100, unit: 'kN·m' },
    { label: '配筋率 ρ', value: Math.round(rhoProv * 10000) / 100, unit: '%' },
  ];

  const evRhoMin = gb10('8.5.1', '第8章', '受弯构件最小配筋率 ρmin = max(0.20%, 45ft/fy%)。', 124);
  const evSpacing = rr('9.1.3', '第9章', '板中受力钢筋间距不宜大于 200mm，且不宜小于 70mm。');
  const evThick = rr('6.1.2', '第6章', '板式楼梯梯板厚度建议不宜小于水平投影跨度的 1/30（工程经验构造，待核验）');
  const evXiB = gb10('6.2.7', '第6章', 'ξb = β1 / (1 + fy / (Es·εcu))，εcu=0.0033。', 53);

  const checks: CheckItem[] = [
    {
      name: '相对受压区高度验算', calculatedValue: Math.round(cap.xi * 10000) / 10000,
      limitValue: Math.round(xiB * 10000) / 10000, comparison: '<=', passed: cap.xi <= xiB, unit: '', evidence: [evXiB],
    },
    {
      name: '最小配筋率验算', calculatedValue: Math.round(rhoProv * 10000) / 100,
      limitValue: Math.round(rhoMin * 10000) / 100, comparison: '>=', passed: rhoProv >= rhoMin, unit: '%', evidence: [evRhoMin],
    },
    {
      name: '实配面积验算', calculatedValue: Math.round(AsProv * 100) / 100,
      limitValue: Math.round(AsReq * 100) / 100, comparison: '>=', passed: AsProv >= AsReq, unit: 'mm²/m', evidence: [evFlex],
    },
    {
      name: '受弯承载力验算', calculatedValue: Math.round(cap.Mu * 100) / 100,
      limitValue: Math.round(M * 100) / 100, comparison: '>=', passed: cap.Mu >= M, unit: 'kN·m', evidence: [evFlex],
    },
    {
      name: '钢筋间距构造验算', calculatedValue: input.barSpacing,
      limitValue: 200, comparison: '<=', passed: input.barSpacing <= 200 && input.barSpacing >= 70, unit: 'mm', evidence: [evSpacing],
    },
    {
      name: '梯板厚度构造验算', calculatedValue: input.t,
      limitValue: Math.round((input.span * 1000) / 30 * 100) / 100, comparison: '>=',
      passed: input.t >= (input.span * 1000) / 30, unit: 'mm', evidence: [evThick],
    },
  ];
  result.checks = checks;

  const allPassed = checks.every(c => c.passed);
  result.conclusion = {
    passed: allPassed,
    summary: allPassed
      ? '所列验算项均满足。材料与受弯公式已按 GB 50010-2010(2015年版) 校核；荷载取值与梯板厚度构造待规范原文复核。'
      : '存在不满足的验算项，请调整梯板厚度、钢筋或荷载。',
    evidence: [],
  };
  result.advisories.push({
    severity: 'warning',
    code: 'SIMPLIFIED_MODEL',
    message: '本模块按单跨简支板式楼梯（水平投影）计算，未计梯梁弹性支承及斜板受扭影响。',
  });
  result.advisories.push({
    severity: 'warning',
    code: 'NORM_REVIEW_REQUIRED',
    message: '荷载取值（GB 50009-2012）与梯板厚度构造建议无规范 PDF 页码，保持 REVIEW_REQUIRED，待规范 Agent 核验。',
  });

  result.allEvidence = allEvidence;
  result.overallStatus = 'REVIEW_REQUIRED';
  return result;
}
