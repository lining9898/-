/**
 * 柱下独立基础（轴心受压矩形）计算内核
 *
 * 数据链：柱荷载 → 基础尺寸 → 地基反力 → 地基承载力 → 受弯 → 冲切 → 抗剪(必要) → 配筋
 *         → CalculationResult → Evidence → 计算书
 *
 * 状态：REVIEW_REQUIRED
 * 本模块属高风险模块：历史上曾出现冲切单位数量级错误（N↔kN、mm↔m、N·mm↔kN·m、MPa↔Pa）。
 * 因此所有单位换算均显式、带语义命名，并建立 10³/10⁶ 数量级保护测试。
 *
 * 规范依据：
 *   - GB 50007-2011《建筑地基基础设计规范》5.2.2（地基承载力）、8.2.7（受弯）、
 *     8.2.8（冲切）、8.2.9（受剪）、8.2.1/8.2.12（构造配筋）——无仓库 PDF，保持 REVIEW_REQUIRED。
 *   - GB 50010-2010(2015年版) 材料参数（4.1.4/4.2.3）与受弯公式（6.2.10）——VERIFIED。
 *
 * 单位约定：
 *   - 基础尺寸 L/B 用 m，柱截面 bc/hc 输入为 mm、内部换算为 m；
 *   - 地基反力 p_k、净反力 p_j 用 kPa = kN/m²；
 *   - 弯矩用 kN·m；钢筋面积用 mm²；混凝土强度 f_t 用 MPa = N/mm²。
 */

import { CalculationResult, CalculationStep, CheckItem, createEmptyResult } from '../../types/calculation';
import { Evidence } from '../../types/evidence';
import { CONCRETE_PARAMS, STEEL_PARAMS, verifiedEvidence, reviewRequiredEvidence } from '../shared/materials';

/** 柱下独立基础输入参数（轴心受压） */
export interface IndependentFoundationInput {
  L: number;            // 基础底面长边 (m)
  B: number;            // 基础底面短边 (m)
  h: number;            // 基础高度 (mm)
  bc: number;           // 柱截面沿长边 L 方向的边长 (mm)
  hc: number;           // 柱截面沿短边 B 方向的边长 (mm)
  d: number;            // 基础埋深（室外地坪至基底）(m)
  gammaM: number;       // 基础及覆土平均重度 (kN/m³)，默认 20
  fa: number;           // 修正后的地基承载力特征值 (kPa)
  Nk: number;           // 柱轴心荷载标准值（用于地基承载力验算）(kN)
  N: number;            // 柱轴心荷载设计值（用于配筋/冲切/抗剪）(kN)
  concreteGrade: string;
  steelGrade: string;
  cover: number;        // 基础底面保护层（有垫层）(mm)，默认 40
  barDiameter: number;  // 受力钢筋直径 (mm)
  barSpacing: number;   // 受力钢筋间距 (mm)
}

/** 最小配筋率（基础底板钢筋，GB 50007-2011 8.2.1/8.2.12，待核验） */
const RHO_MIN = 0.0015; // 0.15%

export function calculateIndependentFoundation(input: IndependentFoundationInput): CalculationResult {
  const result = createEmptyResult('foundation-independent');
  const allEvidence: Evidence[] = [];

  const gb50007 = (clause: string, text: string) => {
    const e = reviewRequiredEvidence(clause, '地基基础', text, 'GB 50007', '建筑地基基础设计规范', '2011');
    allEvidence.push(e);
    return e;
  };
  const gb10 = (clause: string, chapter: string, text: string, page: number) => {
    const e = verifiedEvidence(clause, chapter, text, page);
    allEvidence.push(e);
    return e;
  };
  const rr = (clause: string, chapter: string, text: string) => {
    const e = reviewRequiredEvidence(clause, chapter, text);
    allEvidence.push(e);
    return e;
  };

  const numericFields = [input.L, input.B, input.h, input.bc, input.hc, input.d, input.gammaM, input.fa, input.Nk, input.N, input.cover, input.barDiameter, input.barSpacing];
  if (
    !numericFields.every(Number.isFinite) ||
    input.L <= 0 || input.B <= 0 || input.h <= 0 || input.bc <= 0 || input.hc <= 0 ||
    input.d <= 0 || input.gammaM <= 0 || input.fa <= 0 || input.Nk <= 0 || input.N <= 0 ||
    input.cover <= 0 || input.barDiameter <= 0 || input.barSpacing <= 0 ||
    input.bc >= input.L * 1000 || input.hc >= input.B * 1000 // 柱截面(mm) 与基础边长(m→mm) 比较，柱不得超出基底
  ) {
    result.advisories.push({ severity: 'error', code: 'INVALID_INPUT', message: '请输入有效的尺寸、荷载和材料参数，且柱截面不得超出基础底面。' });
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
    { label: '基础长边 L', value: input.L, unit: 'm' },
    { label: '基础短边 B', value: input.B, unit: 'm' },
    { label: '基础高度 h', value: input.h, unit: 'mm' },
    { label: '柱截面 bc(沿L)', value: input.bc, unit: 'mm' },
    { label: '柱截面 hc(沿B)', value: input.hc, unit: 'mm' },
    { label: '埋深 d', value: input.d, unit: 'm' },
    { label: '基础及覆土重度 γm', value: input.gammaM, unit: 'kN/m³' },
    { label: '地基承载力特征值 fa', value: input.fa, unit: 'kPa' },
    { label: '轴力标准值 Nk', value: input.Nk, unit: 'kN' },
    { label: '轴力设计值 N', value: input.N, unit: 'kN' },
    { label: '保护层 c', value: input.cover, unit: 'mm' },
    { label: '受力钢筋直径', value: input.barDiameter, unit: 'mm' },
    { label: '受力钢筋间距', value: input.barSpacing, unit: 'mm' },
  ];

  const evFc = gb10('4.1.4', '第4章', '混凝土轴心抗压强度的设计值 fc 应按表 4.1.4-1 采用。', 34);
  const evFy = gb10('4.2.3', '第4章', '普通钢筋的抗拉强度设计值 fy 应按表 4.2.3-1 采用。', 38);
  result.materials = [
    { label: '混凝土等级', value: input.concreteGrade, unit: '', evidence: [evFc] },
    { label: 'fc', value: concrete.fc, unit: 'MPa', evidence: [evFc] },
    { label: 'ft', value: concrete.ft, unit: 'MPa', evidence: [evFc] },
    { label: '钢筋等级', value: input.steelGrade, unit: '', evidence: [evFy] },
    { label: 'fy', value: steel.fy, unit: 'MPa', evidence: [evFy] },
  ];

  const steps: CalculationStep[] = [];
  const A = input.L * input.B;                    // 基础底面面积 (m²)

  // ---- 地基反力与承载力 ----
  // 柱截面边长换算：mm → m（语义换算）
  const bcM = input.bc / 1000; // mm → m
  const hcM = input.hc / 1000; // mm → m
  // 基础及覆土自重标准值：γm·d·A (kN)
  const Gk = input.gammaM * input.d * A; // kN
  const evBearing = gb50007('5.2.2', '地基承载力验算：轴心荷载 p_k = (F_k + G_k)/A ≤ f_a（第5.2.1、5.2.2条）。');
  // 基底平均压力（标准组合）：(Nk + Gk)/A (kPa)
  const pk = (input.Nk + Gk) / A; // kPa = kN/m²
  steps.push({
    name: '计算基底平均压力（标准组合）',
    description: '地基承载力验算采用标准组合，p_k = (Nk + Gk) / A',
    formula: 'p_k = (N_k + G_k) / A',
    symbolDefinitions: [
      { symbol: 'G_k', meaning: '基础及覆土自重标准值', unit: 'kN' },
      { symbol: 'A', meaning: '基础底面面积', unit: 'm²' },
    ],
    substitutedFormula: `p_k = (${input.Nk} + ${Math.round(Gk * 10) / 10}) / ${Math.round(A * 100) / 100}`,
    result: Math.round(pk * 100) / 100,
    unit: 'kPa',
    evidence: [evBearing],
  });

  // 净反力（设计值，扣除基础自重及覆土；自重不产生内力）：N/A (kPa)
  const pj = input.N / A; // kPa = kN/m²（设计值净反力）
  const evNet = rr('8.2.7', '第8章', '基础底板配筋与冲切采用扣除基础自重及覆土后的地基净反力（设计值）p_j = N/A。');
  steps.push({
    name: '计算地基净反力（设计值）',
    description: '配筋与冲切采用净反力 p_j = N / A（不含基础自重，因自重不产生内力）',
    formula: 'p_j = N / A',
    substitutedFormula: `p_j = ${input.N} / ${Math.round(A * 100) / 100}`,
    result: Math.round(pj * 100) / 100,
    unit: 'kPa',
    evidence: [evNet],
  });

  // ---- 受弯（GB 50007-2011 8.2.7，轴心受压）----
  const evMoment = gb50007('8.2.7', '轴心受压矩形独立基础柱边截面弯矩：MⅠ = a₁²(2l+a′)p_j/6、MⅡ = a₁′²(2b+b′)p_j/6。');
  // 柱边至基础边缘距离（沿各自方向）
  const a1 = (input.L - bcM) / 2;  // m（沿长边 L）
  const a1b = (input.B - hcM) / 2; // m（沿短边 B）
  // 长边方向弯矩 M1（绕平行短边轴，控制沿长边 L 方向钢筋 AsL）：
  //   M1 = (1/6)·a1²·(2B + hc)·p_j   —— 尺寸用 m、p_j 用 kN/m²，结果 kN·m
  const M1 = (a1 * a1 * (2 * input.B + hcM) * pj) / 6; // kN·m
  // 短边方向弯矩 M2（绕平行长边轴，控制沿短边 B 方向钢筋 AsB）：
  const M2 = (a1b * a1b * (2 * input.L + bcM) * pj) / 6; // kN·m
  steps.push({
    name: '计算柱边截面弯矩（长边方向）',
    description: 'M1 = a1²·(2B + hc)·p_j / 6，a1 = (L - bc)/2',
    formula: 'M₁ = a₁²·(2B + h_c)·p_j / 6',
    substitutedFormula: `M1 = ${Math.round(a1 * 100) / 100}²×(2×${input.B}+${hcM})×${Math.round(pj * 100) / 100}/6`,
    result: Math.round(M1 * 100) / 100,
    unit: 'kN·m',
    evidence: [evMoment],
  });
  steps.push({
    name: '计算柱边截面弯矩（短边方向）',
    description: 'M2 = a1b²·(2L + bc)·p_j / 6，a1b = (B - hc)/2',
    formula: 'M₂ = a₁′²·(2L + b_c)·p_j / 6',
    substitutedFormula: `M2 = ${Math.round(a1b * 100) / 100}²×(2×${input.L}+${bcM})×${Math.round(pj * 100) / 100}/6`,
    result: Math.round(M2 * 100) / 100,
    unit: 'kN·m',
    evidence: [evMoment],
  });

  // ---- 冲切（GB 50007-2011 8.2.8）----
  const evPunch = gb50007('8.2.8', '受冲切承载力：F_l ≤ 0.7·β_hp·f_t·a_m·h0；F_l = p_j·A_l。');
  const h0 = input.h - input.cover - input.barDiameter / 2; // mm
  // 受冲切承载力截面高度影响系数 β_hp：h≤800→1.0；h≥2000→0.9；其间线性内插（h 用 mm）
  const betaHp = input.h <= 800 ? 1.0 : input.h >= 2000 ? 0.9 : 1.0 - (0.1 * (input.h - 800)) / 1200;
  // 冲切破坏锥最不利一侧：a_t = bc（柱长边），a_b = bc + 2·h0，a_m = (a_t + a_b)/2 = bc + h0（mm）
  const am = input.bc + h0; // mm
  // 冲切锥外面积 A_l = L·B − (bc+2h0)·(hc+2h0)（m²）
  const coneLenM = (input.bc + 2 * h0) / 1000; // mm → m
  const coneWidM = (input.hc + 2 * h0) / 1000; // mm → m
  const Al = A - coneLenM * coneWidM; // m²
  // 冲切力（设计值）：F_l = p_j·A_l（p_j 用 kN/m²、A_l 用 m² → kN）
  const Fl = pj * Al; // kN
  // 冲切承载力：0.7·β_hp·f_t·a_m·h0，f_t 用 MPa=N/mm²、a_m 与 h0 用 mm → N；再 /1000 → kN（语义换算）
  const punchCapacityN = 0.7 * betaHp * concrete.ft * am * h0; // N
  const punchCapacity = punchCapacityN / 1000;                 // N → kN（语义：1kN=1000N）
  steps.push({
    name: '计算冲切力',
    description: '冲切锥外面积 A_l = L·B − (bc+2h0)(hc+2h0)，冲切力 F_l = p_j·A_l',
    formula: 'F_l = p_j·A_l',
    substitutedFormula: `F_l = ${Math.round(pj * 100) / 100} × ${Math.round(Al * 1000) / 1000}`,
    result: Math.round(Fl * 100) / 100,
    unit: 'kN',
    evidence: [evPunch],
  });
  steps.push({
    name: '计算受冲切承载力',
    description: '0.7·β_hp·f_t·a_m·h0，β_hp 按高度内插；结果由 N 换算为 kN',
    formula: '0.7·β_hp·f_t·a_m·h_0',
    symbolDefinitions: [
      { symbol: 'β_hp', meaning: '受冲切承载力截面高度影响系数', unit: '' },
      { symbol: 'a_m', meaning: '冲切锥最不利一侧计算长度', unit: 'mm' },
    ],
    substitutedFormula: `0.7×${Math.round(betaHp * 100) / 100}×${concrete.ft}×${am}×${h0} N = ${Math.round(punchCapacity * 100) / 100} kN`,
    result: Math.round(punchCapacity * 100) / 100,
    unit: 'kN',
    evidence: [evPunch],
  });

  // ---- 抗剪（GB 50007-2011 8.2.9，必要验算）----
  const evShear = gb50007('8.2.9', '基础斜截面受剪承载力：V ≤ 0.7·β_hs·f_t·b_w·h0，β_hs=(800/h0)^(1/4)。');
  // 长边方向柱边剪力：V = p_j·a1·B（kN）
  const Vs = pj * a1 * input.B; // kN
  // 受剪切承载力截面高度影响系数 β_hs = (800/h0)^(1/4)，h0<800 取 800
  const h0Eff = Math.max(h0, 800); // mm
  const betaHs = Math.pow(800 / h0Eff, 0.25);
  // 验算截面宽度取垂直于剪力方向的边长 B（mm），剪力沿 L 方向作用
  const bw = input.B * 1000; // m → mm
  const shearCapacityN = 0.7 * betaHs * concrete.ft * bw * h0; // N
  const shearCapacity = shearCapacityN / 1000;                 // N → kN
  steps.push({
    name: '计算柱边剪力（长边方向）',
    description: 'V = p_j·a1·B（剪力设计值）',
    formula: 'V = p_j·a_1·B',
    substitutedFormula: `V = ${Math.round(pj * 100) / 100} × ${Math.round(a1 * 100) / 100} × ${input.B}`,
    result: Math.round(Vs * 100) / 100,
    unit: 'kN',
    evidence: [evShear],
  });
  steps.push({
    name: '计算斜截面受剪承载力',
    description: '0.7·β_hs·f_t·b_w·h0，β_hs=(800/h0)^(1/4)；结果由 N 换算为 kN',
    formula: '0.7·β_hs·f_t·b_w·h_0',
    substitutedFormula: `0.7×${Math.round(betaHs * 1000) / 1000}×${concrete.ft}×${bw}×${h0} N = ${Math.round(shearCapacity * 100) / 100} kN`,
    result: Math.round(shearCapacity * 100) / 100,
    unit: 'kN',
    evidence: [evShear],
  });

  // ---- 配筋 ----
  const evReinf = rr('8.2.1', '第8章', '基础底板受力钢筋最小配筋率不应小于 0.15%，直径不宜小于 10mm，间距不宜大于 200mm（GB 50007-2011）。');
  const evFlex = gb10('6.2.10', '第6章', '受弯承载力简化为内力臂 z≈0.9·h0：As = M/(0.9·fy·h0)。', 55);
  // 所需钢筋面积：M(kN·m) → N·mm(×1e6)，fy(MPa=N/mm²)、h0(mm) → As(mm²)
  const AsLReq = (M1 * 1e6) / (0.9 * steel.fy * h0); // mm²（抵抗 M1，沿长边 L 布置钢筋的总量）
  const AsBReq = (M2 * 1e6) / (0.9 * steel.fy * h0); // mm²（抵抗 M2，沿短边 B 布置钢筋的总量）
  // 实配钢筋：每延米面积 × 分布宽度
  // 沿长边 L 布置的钢筋（受力筋∥L，抵抗 M1）沿短边 B 方向分布：总量 = 每延米 × B
  // 沿短边 B 布置的钢筋（受力筋∥B，抵抗 M2）沿长边 L 方向分布：总量 = 每延米 × L
  const perMeter = (Math.PI * input.barDiameter * input.barDiameter) / 4 * (1000 / input.barSpacing); // mm²/m
  const AsLProv = perMeter * input.B; // mm²（沿 L 布置的钢筋总量，分布于 B）
  const AsBProv = perMeter * input.L; // mm²（沿 B 布置的钢筋总量，分布于 L）
  // 最小配筋面积：0.15% × 截面面积（分布宽 × 基础高）
  const AsLMin = RHO_MIN * (input.B * 1000) * input.h; // mm²（沿 L 布置钢筋的 min，分布宽 B）
  const AsBMin = RHO_MIN * (input.L * 1000) * input.h; // mm²（沿 B 布置钢筋的 min，分布宽 L）
  steps.push({
    name: '长边方向配筋',
    description: 'As = M1 / (0.9·fy·h0)，M1(kN·m)→N·mm 乘以 1e6',
    formula: 'A_s = M₁ / (0.9·f_y·h_0)',
    substitutedFormula: `As = ${Math.round(M1 * 100) / 100}×1e6 / (0.9×${steel.fy}×${h0})`,
    result: Math.round(AsLReq * 100) / 100,
    unit: 'mm²',
    evidence: [evFlex],
  });
  steps.push({
    name: '短边方向配筋',
    description: 'As = M2 / (0.9·fy·h0)',
    formula: 'A_s = M₂ / (0.9·f_y·h_0)',
    substitutedFormula: `As = ${Math.round(M2 * 100) / 100}×1e6 / (0.9×${steel.fy}×${h0})`,
    result: Math.round(AsBReq * 100) / 100,
    unit: 'mm²',
    evidence: [evFlex],
  });

  result.steps = steps;

  result.results = [
    { label: '基础底面面积 A', value: Math.round(A * 100) / 100, unit: 'm²' },
    { label: '基础及覆土自重 Gk', value: Math.round(Gk * 10) / 10, unit: 'kN' },
    { label: '基底平均压力 p_k', value: Math.round(pk * 100) / 100, unit: 'kPa' },
    { label: '地基净反力 p_j', value: Math.round(pj * 100) / 100, unit: 'kPa' },
    { label: '长边方向弯矩 M1', value: Math.round(M1 * 100) / 100, unit: 'kN·m' },
    { label: '短边方向弯矩 M2', value: Math.round(M2 * 100) / 100, unit: 'kN·m' },
    { label: '有效高度 h0', value: Math.round(h0 * 100) / 100, unit: 'mm' },
    { label: '冲切力 F_l', value: Math.round(Fl * 100) / 100, unit: 'kN' },
    { label: '受冲切承载力', value: Math.round(punchCapacity * 100) / 100, unit: 'kN' },
    { label: '柱边剪力 V', value: Math.round(Vs * 100) / 100, unit: 'kN' },
    { label: '斜截面受剪承载力', value: Math.round(shearCapacity * 100) / 100, unit: 'kN' },
    { label: '长向所需钢筋 As,req', value: Math.round(AsLReq * 100) / 100, unit: 'mm²' },
    { label: '短向所需钢筋 As,req', value: Math.round(AsBReq * 100) / 100, unit: 'mm²' },
    { label: '长向实配钢筋 As,prov', value: Math.round(AsLProv * 100) / 100, unit: 'mm²' },
    { label: '短向实配钢筋 As,prov', value: Math.round(AsBProv * 100) / 100, unit: 'mm²' },
  ];

  const checks: CheckItem[] = [
    {
      name: '地基承载力验算', calculatedValue: Math.round(pk * 100) / 100,
      limitValue: input.fa, comparison: '<=', passed: pk <= input.fa, unit: 'kPa', evidence: [evBearing],
    },
    {
      name: '冲切验算', calculatedValue: Math.round(Fl * 100) / 100,
      limitValue: Math.round(punchCapacity * 100) / 100, comparison: '<=', passed: Fl <= punchCapacity, unit: 'kN', evidence: [evPunch],
    },
    {
      name: '斜截面受剪验算', calculatedValue: Math.round(Vs * 100) / 100,
      limitValue: Math.round(shearCapacity * 100) / 100, comparison: '<=', passed: Vs <= shearCapacity, unit: 'kN', evidence: [evShear],
    },
    {
      name: '长向配筋验算', calculatedValue: Math.round(AsLProv * 100) / 100,
      limitValue: Math.round(AsLReq * 100) / 100, comparison: '>=', passed: AsLProv >= AsLReq, unit: 'mm²', evidence: [evFlex],
    },
    {
      name: '短向配筋验算', calculatedValue: Math.round(AsBProv * 100) / 100,
      limitValue: Math.round(AsBReq * 100) / 100, comparison: '>=', passed: AsBProv >= AsBReq, unit: 'mm²', evidence: [evFlex],
    },
    {
      name: '长向最小配筋率', calculatedValue: Math.round(AsLProv * 100) / 100,
      limitValue: Math.round(AsLMin * 100) / 100, comparison: '>=', passed: AsLProv >= AsLMin, unit: 'mm²', evidence: [evReinf],
    },
    {
      name: '短向最小配筋率', calculatedValue: Math.round(AsBProv * 100) / 100,
      limitValue: Math.round(AsBMin * 100) / 100, comparison: '>=', passed: AsBProv >= AsBMin, unit: 'mm²', evidence: [evReinf],
    },
  ];
  result.checks = checks;

  const allPassed = checks.every(c => c.passed);
  result.conclusion = {
    passed: allPassed,
    summary: allPassed
      ? '所列验算项均满足（地基承载力、冲切、受剪、配筋）。材料参数与受弯公式已按 GB 50010 校核；GB 50007-2011 各条待规范原文复核。'
      : '存在不满足的验算项，请调整基础尺寸、高度、钢筋或埋深。',
    evidence: [],
  };
  result.advisories.push({
    severity: 'warning',
    code: 'NORM_REVIEW_REQUIRED',
    message: 'GB 50007-2011（5.2.2、8.2.7、8.2.8、8.2.9、8.2.1/8.2.12）无仓库 PDF 页码，全部保持 REVIEW_REQUIRED，待规范 Agent 核验。',
  });
  result.advisories.push({
    severity: 'warning',
    code: 'AXIAL_ONLY_MODEL',
    message: '本模块按轴心受压独立基础建模，未计入弯矩与水平剪力的偏心作用；存在偏心时宜按偏心受压公式另行验算。',
  });

  result.allEvidence = allEvidence;
  result.overallStatus = 'REVIEW_REQUIRED';
  return result;
}
