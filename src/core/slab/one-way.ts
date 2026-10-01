/**
 * 单向板（板式楼盖）计算内核
 *
 * 数据链：输入 → 几何 → 荷载 → 内力 → 配筋 → 构造验算 → CalculationResult → Evidence → 计算书
 *
 * 状态：REVIEW_REQUIRED
 * 已校核并标记 VERIFIED 的证据：混凝土/钢筋材料参数（4.1.4/4.2.3/4.2.5）、
 *   等效矩形应力图系数（6.2.6）、界限受压区高度（6.2.7）、正截面受弯（6.2.10）、
 *   最小配筋率（8.5.1）——页码来自仓库内 GB50010-2010_2015_.pdf 校核记录。
 * 待核验（REVIEW_REQUIRED）：混凝土重度与荷载分项系数（GB 50009-2012）、
 *   板厚构造（9.1.2）、板受力钢筋间距构造（9.1.3）、保护层厚度（8.2.1）——无对应 PDF 页码。
 *
 * 模型：按单跨简支单向板（取 1m 宽计算单元）设计，未计塑性内力重分布。
 */

import { CalculationResult, CalculationStep, CheckItem, createEmptyResult } from '../../types/calculation';
import { Evidence } from '../../types/evidence';
import {
  CONCRETE_PARAMS,
  STEEL_PARAMS,
  verifiedEvidence,
  reviewRequiredEvidence,
  materialSelectionCompliance,
  attachCurrentMaterialSelectionEvidence,
  currentMinimumReinforcementEvidence,
} from '../shared/materials';
import { sectionDimensionCompliance } from '../shared/construction';
import {
  designFlexure,
  flexureCapacity,
  limitingRelativeDepth,
  minimumReinforcementRatio,
} from '../shared/flexure';

/** 单向板输入参数 */
export interface OneWaySlabInput {
  h: number;            // 板厚 (mm)
  span: number;         // 计算跨度 l0（简支，水平净跨）(m)
  concreteGrade: string;
  steelGrade: string;
  cover: number;        // 板底受力钢筋外缘至板底面距离（保护层，无箍筋）(mm)
  barDiameter: number;  // 板底受力钢筋直径 (mm)
  barSpacing: number;   // 板底受力钢筋间距 (mm)
  gkExtra: number;      // 附加恒载（面层、吊顶等，不含板自重）(kN/m²)
  qk: number;           // 活荷载标准值 (kN/m²)
  gammaG: number;       // 恒载分项系数
  gammaQ: number;       // 活载分项系数
  width?: number;       // 计算单元宽度 (mm)，默认 1000
  slabType?: 'solidCastInPlace' | 'hollow' | 'composite' | 'unknown';  // IG-005
}

const DEFAULT_WIDTH = 1000;
const CONCRETE_UNIT_WEIGHT = 25; // 钢筋混凝土重度 (kN/m³)，GB 50009-2012（待核验）

/** 每延米钢筋面积：直径 d、间距 s 的板受力钢筋 (mm²/m) */
export function slabBarAreaPerMeter(diameter: number, spacing: number): number {
  return (Math.PI * diameter * diameter) / 4 * (1000 / spacing);
}

export function calculateOneWaySlab(input: OneWaySlabInput): CalculationResult {
  const result = createEmptyResult('slab-one-way');
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

  // ---- 输入校验 ----
  const numericFields = [input.h, input.span, input.cover, input.barDiameter, input.barSpacing, input.gkExtra, input.qk, input.gammaG, input.gammaQ, width];
  if (
    !numericFields.every(Number.isFinite) ||
    input.h <= 0 || input.span <= 0 || input.cover <= 0 || input.barDiameter <= 0 ||
    input.barSpacing <= 0 || input.gkExtra < 0 || input.qk < 0 ||
    input.gammaG <= 0 || input.gammaQ <= 0 || width <= 0 ||
    input.cover + input.barDiameter / 2 >= input.h
  ) {
    result.advisories.push({ severity: 'error', code: 'INVALID_INPUT', message: '请输入有效的板厚、跨度、保护层、钢筋和荷载参数。' });
    return result;
  }
  const concrete = CONCRETE_PARAMS[input.concreteGrade];
  // IG-001 硬限制
  const gradeCheck = materialSelectionCompliance(input.concreteGrade, input.steelGrade);
  if (!gradeCheck.passed) {
    result.advisories.push({ severity: 'error', code: gradeCheck.code!, message: gradeCheck.message });
    return result;
  }

  // IG-005 硬限制：GB 55008-2021 §4.4.4 现浇实心板最小厚度 80mm
  const slabType = input.slabType ?? 'unknown';
  if (slabType === 'solidCastInPlace') {
    const dimCheck = sectionDimensionCompliance({ componentType: 'solidSlab', dimension: input.h });
    if (!dimCheck.passed) {
      result.advisories.push({ severity: 'error', code: 'SECTION_DIMENSION_BELOW_MINIMUM', message: dimCheck.message });
      return result;
    }
  } else if (slabType === 'unknown') {
    result.advisories.push({
      severity: 'warning',
      code: 'SLAB_TYPE_UNKNOWN',
      message: '板类型未声明，GB 55008-2021 §4.4.4 最小截面校核未执行，请补充。',
    });
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

  // ---- 输入 ----
  result.inputs = [
    { label: '板厚 h', value: input.h, unit: 'mm' },
    { label: '计算跨度 l0', value: input.span, unit: 'm' },
    { label: '保护层 c', value: input.cover, unit: 'mm' },
    { label: '受力钢筋直径', value: input.barDiameter, unit: 'mm' },
    { label: '受力钢筋间距', value: input.barSpacing, unit: 'mm' },
    { label: '附加恒载 gk', value: input.gkExtra, unit: 'kN/m²' },
    { label: '活载标准值 qk', value: input.qk, unit: 'kN/m²' },
    { label: '恒载分项系数 γG', value: input.gammaG, unit: '' },
    { label: '活载分项系数 γQ', value: input.gammaQ, unit: '' },
  ];

  // ---- 材料 ----
  const evFc = gb10('4.1.4', '第4章', '混凝土轴心抗压强度的设计值 fc 应按表 4.1.4-1 采用；轴心抗拉强度的设计值 ft 应按表 4.1.4-2 采用。', 34);
  const evFy = gb10('4.2.3', '第4章', '普通钢筋的抗拉强度设计值 fy、抗压强度设计值 fy\' 应按表 4.2.3-1 采用。', 38);
  const evAlpha = gb10('6.2.6', '第6章', '当混凝土强度等级不超过 C50 时，α1 取为 1.0。', 52);
  result.materials = [
    { label: '混凝土等级', value: input.concreteGrade, unit: '', evidence: [evFc] },
    { label: 'fc', value: concrete.fc, unit: 'MPa', evidence: [evFc] },
    { label: 'ft', value: concrete.ft, unit: 'MPa', evidence: [evFc] },
    { label: 'α1', value: concrete.alpha1, unit: '', evidence: [evAlpha] },
    { label: '钢筋等级', value: input.steelGrade, unit: '', evidence: [evFy] },
    { label: 'fy', value: steel.fy, unit: 'MPa', evidence: [evFy] },
  ];

  // ---- 几何 ----
  const h0 = input.h - input.cover - input.barDiameter / 2;
  const xiB = limitingRelativeDepth(concrete.beta1, steel.fy, steel.Es);
  result.geometry = [
    { label: '计算单元宽度 b', value: width, unit: 'mm' },
    { label: '有效高度 h0', value: Math.round(h0 * 100) / 100, unit: 'mm' },
  ];

  const steps: CalculationStep[] = [];

  // ---- 荷载 ----
  const evWeight = gb50009('3.1.1', '永久荷载（钢筋混凝土重度取 25 kN/m³）');
  const evCombo = gb50009('3.2.3', '荷载基本组合：恒载分项系数 1.3、活载分项系数 1.5（可变荷载控制）');
  const gkSelf = CONCRETE_UNIT_WEIGHT * (input.h / 1000); // kN/m³ × 板厚(mm→m) → kN/m²
  const gk = gkSelf + input.gkExtra;                       // 总恒载标准值 kN/m²
  const gd = input.gammaG * gk;                            // 恒载设计值 kN/m²
  const qd = input.gammaQ * input.qk;                      // 活载设计值 kN/m²
  const qPerM2 = gd + qd;                                  // 设计荷载 kN/m²
  const q = qPerM2 * (width / 1000);                       // kN/m² × 宽度(mm→m) → 每延米线荷载 kN/m
  steps.push({
    name: '计算荷载设计值',
    description: '板自重 gk=25·h/1000，恒载设计值 gd=γG·(gk+gkExtra)，活载设计值 qd=γQ·qk，每延米线荷载 q=(gd+qd)·(b/1000)',
    formula: 'q = (γG·g_k + γQ·q_k) · b',
    symbolDefinitions: [
      { symbol: 'γG', meaning: '恒载分项系数', unit: '' },
      { symbol: 'γQ', meaning: '活载分项系数', unit: '' },
      { symbol: 'b', meaning: '计算单元宽度', unit: 'mm' },
    ],
    substitutedFormula: `q = (${input.gammaG}×${Math.round(gk * 100) / 100} + ${input.gammaQ}×${input.qk}) × ${width}/1000`,
    result: Math.round(q * 1000) / 1000,
    unit: 'kN/m',
    evidence: [evWeight, evCombo],
  });

  // ---- 内力（单跨简支）----
  const evMoment = rr('2.1.2', '第2章', '简支板跨中最大弯矩按 M=q·l0²/8（结构力学简支梁内力，待规范原文校核）');
  const M = (q * input.span * input.span) / 8; // kN·m
  const V = (q * input.span) / 2;               // kN
  steps.push({
    name: '计算跨中弯矩',
    description: '单跨简支单向板取 1m 宽计算，跨中最大弯矩 M=q·l0²/8',
    formula: 'M = q·l_0² / 8',
    substitutedFormula: `M = ${Math.round(q * 1000) / 1000} × ${input.span}² / 8`,
    result: Math.round(M * 100) / 100,
    unit: 'kN·m',
    evidence: [evMoment],
  });
  steps.push({
    name: '计算支座剪力',
    description: '简支板支座剪力 V=q·l0/2',
    formula: 'V = q·l_0 / 2',
    substitutedFormula: `V = ${Math.round(q * 1000) / 1000} × ${input.span} / 2`,
    result: Math.round(V * 100) / 100,
    unit: 'kN',
    evidence: [evMoment],
  });

  // ---- 配筋 ----
  const evXiB = gb10('6.2.7', '第6章', 'ξb = β1 / (1 + fy / (Es·εcu))，εcu=0.0033。', 53);
  const evFlex = gb10('6.2.10', '第6章', '正截面受弯承载力：M ≤ α1·fc·b·x·(h0 - x/2)。', 55);
  const design = designFlexure(M, concrete.fc, steel.fy, width, h0, concrete.alpha1);
  const AsReq = design.AsReq;
  const AsProv = slabBarAreaPerMeter(input.barDiameter, input.barSpacing); // mm²/m
  const rhoMin = minimumReinforcementRatio(concrete.ft, steel.fy);
  const AsMin = rhoMin * width * input.h; // mm²
  const rhoProv = AsProv / (width * input.h);
  steps.push({
    name: '正截面配筋设计',
    description: '由弯矩 M 求所需钢筋面积 As,req（单筋矩形截面）：αs=M/(α1·fc·b·h0²)，ξ=1-√(1-2αs)，As=α1·fc·b·ξ·h0/fy',
    formula: 'A_s,req = α_1·f_c·b·x / f_y',
    symbolDefinitions: [
      { symbol: 'x', meaning: '受压区高度', unit: 'mm' },
      { symbol: 'b', meaning: '计算单元宽度', unit: 'mm' },
    ],
    substitutedFormula: `As,req = ${concrete.alpha1}×${concrete.fc}×${width}×${Math.round(design.x * 100) / 100} / ${steel.fy}`,
    result: Math.round(AsReq * 100) / 100,
    unit: 'mm²/m',
    evidence: [evFlex],
  });
  steps.push({
    name: '实配钢筋面积',
    description: '板底受力钢筋每延米面积 As,prov = (π·d²/4)·(1000/s)',
    formula: 'A_s,prov = (π·d²/4)·(1000/s)',
    substitutedFormula: `As,prov = (π×${input.barDiameter}²/4)×(1000/${input.barSpacing})`,
    result: Math.round(AsProv * 100) / 100,
    unit: 'mm²/m',
    evidence: [gb10('8.5.1', '第8章', '受弯构件纵向受力钢筋最小配筋百分率 ρmin 不应小于表 8.5.1。', 124)],
  });

  // ---- 承载力校核 ----
  const cap = flexureCapacity(AsProv, concrete.fc, steel.fy, width, h0, concrete.alpha1);
  steps.push({
    name: '正截面受弯承载力',
    description: '由实配钢筋 As,prov 计算受压区高度 x 与承载力 Mu=α1·fc·b·x·(h0-x/2)',
    formula: 'M_u = α_1·f_c·b·x·(h_0 - x/2)',
    substitutedFormula: `Mu = ${concrete.alpha1}×${concrete.fc}×${width}×${Math.round(cap.x * 100) / 100}×(${Math.round(h0 * 100) / 100}-${Math.round(cap.x * 100) / 100}/2)`,
    result: Math.round(cap.Mu * 100) / 100,
    unit: 'kN·m',
    evidence: [evFlex],
  });

  result.steps = steps;

  // ---- 主要结果 ----
  result.results = [
    { label: '有效高度 h0', value: Math.round(h0 * 100) / 100, unit: 'mm' },
    { label: '板自重 gk(自重)', value: Math.round(gkSelf * 100) / 100, unit: 'kN/m²' },
    { label: '设计线荷载 q', value: Math.round(q * 1000) / 1000, unit: 'kN/m' },
    { label: '跨中弯矩 M', value: Math.round(M * 100) / 100, unit: 'kN·m' },
    { label: '所需钢筋 As,req', value: Math.round(AsReq * 100) / 100, unit: 'mm²/m' },
    { label: '实配钢筋 As,prov', value: Math.round(AsProv * 100) / 100, unit: 'mm²/m' },
    { label: '受压区高度 x', value: Math.round(cap.x * 100) / 100, unit: 'mm' },
    { label: '受弯承载力 Mu', value: Math.round(cap.Mu * 100) / 100, unit: 'kN·m' },
    { label: '配筋率 ρ', value: Math.round(rhoProv * 10000) / 100, unit: '%' },
  ];

  // ---- 构造验算 ----
  const evRhoMin = gb10('8.5.1', '第8章', '受弯构件最小配筋率 ρmin = max(0.20%, 45ft/fy%)。', 124);
  const minReinforcementEvidence = [evRhoMin, ...currentMinimumReinforcementEvidence()];
  allEvidence.push(...minReinforcementEvidence.slice(1));
  const evSpacing = rr('9.1.3', '第9章', '板中受力钢筋间距不宜大于 200mm，且不宜小于 70mm。');
  const evThick = rr('9.1.2', '第9章', '单跨简支板厚度不宜小于跨度的 1/35（构造要求）。');

  const checks: CheckItem[] = [
    {
      name: '相对受压区高度验算', calculatedValue: Math.round(cap.xi * 10000) / 10000,
      limitValue: Math.round(xiB * 10000) / 10000, comparison: '<=', passed: cap.xi <= xiB, unit: '',
      evidence: [evXiB],
    },
    {
      name: '最小配筋率验算', calculatedValue: Math.round(rhoProv * 10000) / 100,
      limitValue: Math.round(rhoMin * 10000) / 100, comparison: '>=', passed: rhoProv >= rhoMin, unit: '%',
      evidence: minReinforcementEvidence,
    },
    {
      name: '实配面积验算', calculatedValue: Math.round(AsProv * 100) / 100,
      limitValue: Math.round(AsReq * 100) / 100, comparison: '>=', passed: AsProv >= AsReq, unit: 'mm²/m',
      evidence: [evFlex],
    },
    {
      name: '受弯承载力验算', calculatedValue: Math.round(cap.Mu * 100) / 100,
      limitValue: Math.round(M * 100) / 100, comparison: '>=', passed: cap.Mu >= M, unit: 'kN·m',
      evidence: [evFlex],
    },
    {
      name: '钢筋间距构造验算', calculatedValue: input.barSpacing,
      limitValue: 200, comparison: '<=', passed: input.barSpacing <= 200 && input.barSpacing >= 70, unit: 'mm',
      evidence: [evSpacing],
    },
    {
      name: '板厚构造验算', calculatedValue: input.h,
      limitValue: Math.round((input.span * 1000) / 35 * 100) / 100, comparison: '>=',
      passed: input.h >= (input.span * 1000) / 35, unit: 'mm',
      evidence: [evThick],
    },
  ];
  result.checks = checks;

  const allPassed = checks.every(c => c.passed);
  result.conclusion = {
    passed: allPassed,
    summary: allPassed
      ? '所列验算项均满足。材料与受弯公式已按 GB 50010-2010(2015年版) 校核；荷载、板厚与间距构造待规范原文复核。'
      : '存在不满足的验算项，请调整板厚、钢筋或荷载。',
    evidence: [],
  };
  result.advisories.push({
    severity: 'warning',
    code: 'SIMPLIFIED_MODEL',
    message: '本模块按单跨简支单向板计算，未计塑性内力重分布；连续板应按规范内力系数或塑性方法另行计算。',
  });
  result.advisories.push({
    severity: 'warning',
    code: 'NORM_REVIEW_REQUIRED',
    message: '荷载取值（GB 50009-2012）与板厚/间距构造（GB 50010 9.1.2、9.1.3、8.2.1）无对应 PDF 页码，保持 REVIEW_REQUIRED，待规范 Agent 核验。',
  });
  // IG-004：GB 55008-2021 §4.4.6（HUMAN_VERIFIED 2026-10-01）
  // 纵向受力钢筋最小配筋率表与 GB/T 50010-2010 8.5.1 一致。
  result.advisories.push({
    severity: 'info',
    code: 'GB55008_4_4_6_EVIDENCE',
    message: 'GB 55008-2021 §4.4.6：纵向受力普通钢筋最小配筋率表与 GB/T 50010-2010 8.5.1 一致。',
  });

  result.allEvidence = allEvidence;
  attachCurrentMaterialSelectionEvidence(result);
  result.overallStatus = 'REVIEW_REQUIRED';
  return result;
}
