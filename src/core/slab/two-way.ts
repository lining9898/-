/**
 * 双向板（四边简支）计算内核
 *
 * 数据链：输入 → 几何 → 荷载 → 内力 → 配筋 → 构造验算 → CalculationResult → Evidence → 计算书
 *
 * 状态：REVIEW_REQUIRED
 * 弯矩系数采用《混凝土结构设计手册》四边简支板（泊松比 μ=0.2）跨中弯矩系数表，
 * 并按 λ=ly/lx 线性内插。该系数表无对应规范 PDF 页码，整体保持 REVIEW_REQUIRED，
 * 待规范 Agent 以可靠算例或规范原文核验。
 *
 * 模型：四边简支双向板，跨中弯矩 Mx=αx·q·lx²、My=αy·q·lx²（q 为单位面积设计荷载）。
 * 短向（lx）钢筋置于底层，长向（ly）钢筋置于上层，故 h0x > h0y。
 */

import { CalculationResult, CalculationStep, CheckItem, createEmptyResult } from '../../types/calculation';
import { Evidence } from '../../types/evidence';
import {
  CONCRETE_PARAMS,
  STEEL_PARAMS,
  verifiedEvidence,
  reviewRequiredEvidence,
  concreteGradeCompliance,
} from '../shared/materials';
import {
  designFlexure,
  flexureCapacity,
  limitingRelativeDepth,
  minimumReinforcementRatio,
} from '../shared/flexure';

/** 双向板输入参数 */
export interface TwoWaySlabInput {
  h: number;            // 板厚 (mm)
  spanX: number;        // 短跨计算跨度 lx (m)
  spanY: number;        // 长跨计算跨度 ly (m)
  concreteGrade: string;
  steelGrade: string;
  cover: number;        // 短向受力钢筋外缘至板底距离（保护层）(mm)
  barDiameter: number;  // 受力钢筋直径 (mm)
  barSpacing: number;   // 受力钢筋间距 (mm)
  gkExtra: number;      // 附加恒载（面层、吊顶等，不含板自重）(kN/m²)
  qk: number;           // 活荷载标准值 (kN/m²)
  gammaG: number;       // 恒载分项系数
  gammaQ: number;       // 活载分项系数
  width?: number;       // 计算单元宽度 (mm)，默认 1000
}

const DEFAULT_WIDTH = 1000;
const CONCRETE_UNIT_WEIGHT = 25; // 钢筋混凝土重度 (kN/m³)

/**
 * 四边简支板跨中弯矩系数（μ=0.2），λ=ly/lx。
 * 来源：《混凝土结构设计手册》弹性板系数表（待核验）。
 * αx 控制短跨方向 Mx=αx·q·lx²，αy 控制长跨方向 My=αy·q·lx²。
 */
const MOMENT_COEF: { lambda: number; ax: number; ay: number }[] = [
  { lambda: 1.0, ax: 0.0368, ay: 0.0368 },
  { lambda: 1.1, ax: 0.0357, ay: 0.0398 },
  { lambda: 1.2, ax: 0.0343, ay: 0.0424 },
  { lambda: 1.3, ax: 0.0328, ay: 0.0447 },
  { lambda: 1.4, ax: 0.0312, ay: 0.0467 },
  { lambda: 1.5, ax: 0.0296, ay: 0.0485 },
  { lambda: 1.6, ax: 0.0280, ay: 0.0500 },
  { lambda: 1.7, ax: 0.0265, ay: 0.0513 },
  { lambda: 1.8, ax: 0.0251, ay: 0.0525 },
  { lambda: 1.9, ax: 0.0238, ay: 0.0535 },
  { lambda: 2.0, ax: 0.0226, ay: 0.0543 },
];

/** 按 λ=ly/lx 线性内插跨中弯矩系数（λ 介于 1.0~2.0） */
export function momentCoefficients(lambda: number): { ax: number; ay: number } {
  const clamped = Math.min(2.0, Math.max(1.0, lambda));
  const hi = MOMENT_COEF.findIndex(c => c.lambda >= clamped);
  if (hi <= 0) return { ax: MOMENT_COEF[0].ax, ay: MOMENT_COEF[0].ay };
  const lower = MOMENT_COEF[hi - 1];
  const upper = MOMENT_COEF[hi];
  if (upper.lambda === lower.lambda) return { ax: upper.ax, ay: upper.ay };
  const t = (clamped - lower.lambda) / (upper.lambda - lower.lambda);
  return { ax: lower.ax + t * (upper.ax - lower.ax), ay: lower.ay + t * (upper.ay - lower.ay) };
}

export function calculateTwoWaySlab(input: TwoWaySlabInput): CalculationResult {
  const result = createEmptyResult('slab-two-way');
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

  const numericFields = [input.h, input.spanX, input.spanY, input.cover, input.barDiameter, input.barSpacing, input.gkExtra, input.qk, input.gammaG, input.gammaQ, width];
  if (
    !numericFields.every(Number.isFinite) ||
    input.h <= 0 || input.spanX <= 0 || input.spanY <= 0 || input.cover <= 0 ||
    input.barDiameter <= 0 || input.barSpacing <= 0 || input.gkExtra < 0 || input.qk < 0 ||
    input.gammaG <= 0 || input.gammaQ <= 0 || width <= 0 ||
    input.cover + input.barDiameter / 2 >= input.h
  ) {
    result.advisories.push({ severity: 'error', code: 'INVALID_INPUT', message: '请输入有效的板厚、跨度、保护层、钢筋和荷载参数。' });
    return result;
  }
  const [lx, ly] = input.spanX <= input.spanY ? [input.spanX, input.spanY] : [input.spanY, input.spanX];
  const concrete = CONCRETE_PARAMS[input.concreteGrade];
  // IG-001 硬限制
  const gradeCheck = concreteGradeCompliance(input.concreteGrade, 25);
  if (!gradeCheck.passed) {
    result.advisories.push({ severity: 'error', code: 'CONCRETE_GRADE_BELOW_MINIMUM', message: gradeCheck.message });
    return result;
  }

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
    { label: '板厚 h', value: input.h, unit: 'mm' },
    { label: '短跨 lx', value: lx, unit: 'm' },
    { label: '长跨 ly', value: ly, unit: 'm' },
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

  // 短向钢筋在底层：h0x = h - c - d/2；长向钢筋在上层：h0y = h - c - d - d/2
  const h0x = input.h - input.cover - input.barDiameter / 2;
  const h0y = input.h - input.cover - input.barDiameter - input.barDiameter / 2;
  const xiB = limitingRelativeDepth(concrete.beta1, steel.fy, steel.Es);
  result.geometry = [
    { label: '计算单元宽度 b', value: width, unit: 'mm' },
    { label: '短向有效高度 h0x', value: Math.round(h0x * 100) / 100, unit: 'mm' },
    { label: '长向有效高度 h0y', value: Math.round(h0y * 100) / 100, unit: 'mm' },
  ];

  const steps: CalculationStep[] = [];

  // ---- 荷载 ----
  const evWeight = gb50009('3.1.1', '永久荷载（钢筋混凝土重度取 25 kN/m³）');
  const evCombo = gb50009('3.2.3', '荷载基本组合：恒载 1.3、活载 1.5（可变荷载控制）');
  const gkSelf = CONCRETE_UNIT_WEIGHT * (input.h / 1000); // kN/m³ × 板厚(mm→m) → kN/m²
  const gk = gkSelf + input.gkExtra;
  const gd = input.gammaG * gk;
  const qd = input.gammaQ * input.qk;
  const qPerM2 = gd + qd;
  steps.push({
    name: '计算荷载设计值',
    description: 'q = γG·(gk+gkExtra) + γQ·qk（单位面积设计荷载）',
    formula: 'q = γ_G·g_k + γ_Q·q_k',
    substitutedFormula: `q = ${input.gammaG}×${Math.round(gk * 100) / 100} + ${input.gammaQ}×${input.qk}`,
    result: Math.round(qPerM2 * 1000) / 1000,
    unit: 'kN/m²',
    evidence: [evWeight, evCombo],
  });

  // ---- 内力 ----
  const lambda = ly / lx;
  const coef = momentCoefficients(lambda);
  const evCoef = rr('9.1.1', '第9章', '四边简支双向板跨中弯矩按弹性板系数 M=α·q·lx² 计算（系数表无规范页码，待核验）');
  const Mx = coef.ax * qPerM2 * lx * lx; // kN·m/m（短跨方向）
  const My = coef.ay * qPerM2 * lx * lx; // kN·m/m（长跨方向）
  steps.push({
    name: '计算短跨方向跨中弯矩',
    description: `λ=ly/lx=${lambda.toFixed(2)}，内插系数 αx=${coef.ax.toFixed(4)}，Mx=αx·q·lx²`,
    formula: 'M_x = α_x·q·l_x²',
    substitutedFormula: `Mx = ${coef.ax.toFixed(4)} × ${Math.round(qPerM2 * 1000) / 1000} × ${lx}²`,
    result: Math.round(Mx * 100) / 100,
    unit: 'kN·m/m',
    evidence: [evCoef],
  });
  steps.push({
    name: '计算长跨方向跨中弯矩',
    description: `内插系数 αy=${coef.ay.toFixed(4)}，My=αy·q·lx²`,
    formula: 'M_y = α_y·q·l_x²',
    substitutedFormula: `My = ${coef.ay.toFixed(4)} × ${Math.round(qPerM2 * 1000) / 1000} × ${lx}²`,
    result: Math.round(My * 100) / 100,
    unit: 'kN·m/m',
    evidence: [evCoef],
  });

  // ---- 配筋（两个方向）----
  const evFlex = gb10('6.2.10', '第6章', '正截面受弯承载力：M ≤ α1·fc·b·x·(h0 - x/2)。', 55);
  const evRhoMin = gb10('8.5.1', '第8章', '受弯构件最小配筋率 ρmin = max(0.20%, 45ft/fy%)。', 124);
  const rhoMin = minimumReinforcementRatio(concrete.ft, steel.fy);
  const AsMin = rhoMin * width * input.h;
  const AsProv = (Math.PI * input.barDiameter * input.barDiameter) / 4 * (1000 / input.barSpacing);
  const rhoProv = AsProv / (width * input.h);

  const dx = designFlexure(Mx, concrete.fc, steel.fy, width, h0x, concrete.alpha1);
  const dy = designFlexure(My, concrete.fc, steel.fy, width, h0y, concrete.alpha1);
  steps.push({
    name: '短跨方向配筋设计',
    description: `由 Mx 求短向钢筋 As,req（h0x=${Math.round(h0x)}mm）`,
    formula: 'A_s,req = α_1·f_c·b·x / f_y',
    substitutedFormula: `As,req = ${concrete.alpha1}×${concrete.fc}×${width}×${Math.round(dx.x * 100) / 100} / ${steel.fy}`,
    result: Math.round(dx.AsReq * 100) / 100,
    unit: 'mm²/m',
    evidence: [evFlex],
  });
  steps.push({
    name: '长跨方向配筋设计',
    description: `由 My 求长向钢筋 As,req（h0y=${Math.round(h0y)}mm）`,
    formula: 'A_s,req = α_1·f_c·b·x / f_y',
    substitutedFormula: `As,req = ${concrete.alpha1}×${concrete.fc}×${width}×${Math.round(dy.x * 100) / 100} / ${steel.fy}`,
    result: Math.round(dy.AsReq * 100) / 100,
    unit: 'mm²/m',
    evidence: [evFlex],
  });
  steps.push({
    name: '实配钢筋面积',
    description: '两个方向均按 As,prov = (π·d²/4)·(1000/s)',
    formula: 'A_s,prov = (π·d²/4)·(1000/s)',
    substitutedFormula: `As,prov = (π×${input.barDiameter}²/4)×(1000/${input.barSpacing})`,
    result: Math.round(AsProv * 100) / 100,
    unit: 'mm²/m',
    evidence: [evRhoMin],
  });

  const capX = flexureCapacity(AsProv, concrete.fc, steel.fy, width, h0x, concrete.alpha1);
  const capY = flexureCapacity(AsProv, concrete.fc, steel.fy, width, h0y, concrete.alpha1);
  result.steps = steps;

  result.results = [
    { label: 'λ=ly/lx', value: Math.round(lambda * 100) / 100, unit: '' },
    { label: '设计荷载 q', value: Math.round(qPerM2 * 1000) / 1000, unit: 'kN/m²' },
    { label: '短向弯矩 Mx', value: Math.round(Mx * 100) / 100, unit: 'kN·m/m' },
    { label: '长向弯矩 My', value: Math.round(My * 100) / 100, unit: 'kN·m/m' },
    { label: '短向 As,req', value: Math.round(dx.AsReq * 100) / 100, unit: 'mm²/m' },
    { label: '长向 As,req', value: Math.round(dy.AsReq * 100) / 100, unit: 'mm²/m' },
    { label: '实配 As,prov', value: Math.round(AsProv * 100) / 100, unit: 'mm²/m' },
    { label: '短向 Mu', value: Math.round(capX.Mu * 100) / 100, unit: 'kN·m/m' },
    { label: '长向 Mu', value: Math.round(capY.Mu * 100) / 100, unit: 'kN·m/m' },
    { label: '配筋率 ρ', value: Math.round(rhoProv * 10000) / 100, unit: '%' },
  ];

  const evSpacing = rr('9.1.3', '第9章', '板中受力钢筋间距不宜大于 200mm，且不宜小于 70mm。');
  const evThick = rr('9.1.2', '第9章', '双向板厚度不宜小于短跨的 1/45（构造要求）。');
  const checks: CheckItem[] = [
    {
      name: '短向受压区高度验算', calculatedValue: Math.round(capX.xi * 10000) / 10000,
      limitValue: Math.round(xiB * 10000) / 10000, comparison: '<=', passed: capX.xi <= xiB, unit: '', evidence: [evFlex],
    },
    {
      name: '长向受压区高度验算', calculatedValue: Math.round(capY.xi * 10000) / 10000,
      limitValue: Math.round(xiB * 10000) / 10000, comparison: '<=', passed: capY.xi <= xiB, unit: '', evidence: [evFlex],
    },
    {
      name: '短向实配面积验算', calculatedValue: Math.round(AsProv * 100) / 100,
      limitValue: Math.round(dx.AsReq * 100) / 100, comparison: '>=', passed: AsProv >= dx.AsReq, unit: 'mm²/m', evidence: [evFlex],
    },
    {
      name: '长向实配面积验算', calculatedValue: Math.round(AsProv * 100) / 100,
      limitValue: Math.round(dy.AsReq * 100) / 100, comparison: '>=', passed: AsProv >= dy.AsReq, unit: 'mm²/m', evidence: [evFlex],
    },
    {
      name: '最小配筋率验算', calculatedValue: Math.round(rhoProv * 10000) / 100,
      limitValue: Math.round(rhoMin * 10000) / 100, comparison: '>=', passed: rhoProv >= rhoMin, unit: '%', evidence: [evRhoMin],
    },
    {
      name: '短向承载力验算', calculatedValue: Math.round(capX.Mu * 100) / 100,
      limitValue: Math.round(Mx * 100) / 100, comparison: '>=', passed: capX.Mu >= Mx, unit: 'kN·m/m', evidence: [evFlex],
    },
    {
      name: '长向承载力验算', calculatedValue: Math.round(capY.Mu * 100) / 100,
      limitValue: Math.round(My * 100) / 100, comparison: '>=', passed: capY.Mu >= My, unit: 'kN·m/m', evidence: [evFlex],
    },
    {
      name: '钢筋间距构造验算', calculatedValue: input.barSpacing,
      limitValue: 200, comparison: '<=', passed: input.barSpacing <= 200 && input.barSpacing >= 70, unit: 'mm', evidence: [evSpacing],
    },
    {
      name: '板厚构造验算', calculatedValue: input.h,
      limitValue: Math.round((lx * 1000) / 45 * 100) / 100, comparison: '>=',
      passed: input.h >= (lx * 1000) / 45, unit: 'mm', evidence: [evThick],
    },
  ];
  result.checks = checks;

  const allPassed = checks.every(c => c.passed);
  result.conclusion = {
    passed: allPassed,
    summary: allPassed
      ? '所列验算项均满足。材料与受弯公式已按 GB 50010-2010(2015年版) 校核；弯矩系数表与荷载/构造待规范原文复核。'
      : '存在不满足的验算项，请调整板厚、钢筋或荷载。',
    evidence: [],
  };
  result.advisories.push({
    severity: 'warning',
    code: 'COEF_REVIEW_REQUIRED',
    message: '四边简支板弯矩系数（μ=0.2）取自《混凝土结构设计手册》，无规范 PDF 页码，保持 REVIEW_REQUIRED。',
  });
  result.advisories.push({
    severity: 'warning',
    code: 'NORM_REVIEW_REQUIRED',
    message: '荷载取值（GB 50009-2012）与板厚/间距构造（GB 50010 9.1.2、9.1.3）待规范 Agent 核验。',
  });

  result.allEvidence = allEvidence;
  result.overallStatus = 'REVIEW_REQUIRED';
  return result;
}
