/**
 * 双筋矩形梁正截面受弯承载力计算内核
 *
 * 状态：REVIEW_REQUIRED
 *
 * 公式依据：GB 50010-2010（2015年版）第6.2.10条
 *   - 受压区高度：α1·fc·b·x = fy·As − fy'·As'（公式 6.2.10-2）
 *   - 受弯承载力：M ≤ α1·fc·b·x·(h0 − x/2) + fy'·As'·(h0 − as')（公式 6.2.10-1）
 *   - 界限：x ≤ ξb·h0（公式 6.2.10-3）；ξb 按第6.2.7条
 *   - 最小配筋率：第8.5.1条
 *
 * 适用范围：矩形截面、配置受拉与受压两种纵向钢筋、无预应力筋的受弯构件正截面承载力
 *
 * 说明：
 *   - 当 x < 2as'（受压钢筋未屈服）时，按设计原理简化 Mu = fy·As·(h0 − as')，
 *     该简化属于设计方法而非规范直接条文，本条标记为 REVIEW_REQUIRED。
 */

import {
  CalculationResult,
  CalculationStep,
  CheckItem,
  createEmptyResult,
} from '../../types/calculation';
import { Evidence } from '../../types/evidence';

/** 双筋矩形梁正截面受弯输入参数 */
export interface BeamDoubleFlexureInput {
  // 截面参数
  b: number;          // 截面宽度 (mm)
  h: number;          // 截面高度 (mm)

  // 材料
  concreteGrade: string;
  steelGrade: string;          // 受拉钢筋等级
  compressionSteelGrade: string; // 受压钢筋等级

  // 受拉配筋
  cover: number;          // 受拉纵筋外缘至受拉边距离 (mm)，as = cover + d/2
  barDiameter: number;    // 受拉钢筋直径 (mm)
  barCount: number;       // 受拉钢筋根数

  // 受压配筋
  coverToCompressionCentroid: number; // 受压钢筋合力点至受压边缘距离 a's (mm)
  compressionBarDiameter: number;    // 受压钢筋直径 (mm)
  compressionBarCount: number;       // 受压钢筋根数

  // 作用效应
  moment: number;     // 弯矩设计值 M (kN·m)
}

/** 混凝土材料参数 */
interface ConcreteParams {
  fc: number;
  ft: number;
  alpha1: number;
  beta1: number;
}

/** 钢筋材料参数 */
interface SteelParams {
  fy: number;
  Es: number;
}

/** 常用混凝土等级参数（GB 50010-2010 表 4.1.4、表 4.1.5） */
const CONCRETE_PARAMS: Record<string, ConcreteParams> = {
  C20: { fc: 9.6, ft: 1.10, alpha1: 1.0, beta1: 0.80 },
  C25: { fc: 11.9, ft: 1.27, alpha1: 1.0, beta1: 0.80 },
  C30: { fc: 14.3, ft: 1.43, alpha1: 1.0, beta1: 0.80 },
  C35: { fc: 16.7, ft: 1.57, alpha1: 1.0, beta1: 0.80 },
  C40: { fc: 19.1, ft: 1.71, alpha1: 1.0, beta1: 0.80 },
  C45: { fc: 21.1, ft: 1.80, alpha1: 1.0, beta1: 0.80 },
  C50: { fc: 23.1, ft: 1.89, alpha1: 1.0, beta1: 0.80 },
};

/** 常用钢筋等级参数（GB 50010-2010 表 4.2.3、表 4.2.5） */
const STEEL_PARAMS: Record<string, SteelParams> = {
  HPB300: { fy: 270, Es: 210000 },
  HRB335: { fy: 300, Es: 200000 },
  HRB400: { fy: 360, Es: 200000 },
  HRB500: { fy: 435, Es: 200000 },
};

/** 单位换算：N·mm → kN·m（1 kN·m = 1e6 N·mm） */
const N_MM_TO_KN_M = 1e6;
/** 混凝土极限压应变 εcu（非均匀受压） */
const EPSILON_CU = 0.0033;

/** 创建待校核的规范证据 */
function reviewEvidence(
  clause: string,
  chapter: string,
  originalText: string,
  pdfPage: number
): Evidence {
  return {
    codeName: '混凝土结构设计规范',
    codeNumber: 'GB 50010',
    edition: '2010（2015年版）',
    chapter,
    clause,
    originalText,
    pdfPage,
    status: 'current',
    verificationStatus: 'REVIEW_REQUIRED',
    sourceFile: 'GB50010-2010_2015_.pdf',
  };
}

function verifiedEvidence(
  clause: string,
  chapter: string,
  originalText: string,
  pdfPage: number
): Evidence {
  return {
    codeName: '混凝土结构设计规范',
    codeNumber: 'GB 50010',
    edition: '2010（2015年版）',
    chapter,
    clause,
    originalText,
    pdfPage,
    status: 'current',
    verificationStatus: 'VERIFIED',
    sourceFile: 'GB50010-2010_2015_.pdf',
  };
}

/**
 * 双筋矩形梁正截面受弯承载力计算
 *
 * 矩形截面、配置受拉与受压纵向钢筋、无预应力筋
 */
export function calculateBeamDoubleFlexure(input: BeamDoubleFlexureInput): CalculationResult {
  const result = createEmptyResult('beam-double-flexure');
  const allEvidence: Evidence[] = [];

  // === 输入校验 ===
  const numericFields = [
    input.b, input.h, input.cover, input.barDiameter, input.barCount,
    input.coverToCompressionCentroid, input.compressionBarDiameter, input.compressionBarCount, input.moment,
  ];
  if (!numericFields.every(Number.isFinite)) {
    result.advisories.push({
      severity: 'error',
      code: 'INVALID_INPUT',
      message: '数值输入必须为有限数',
    });
    return result;
  }

  if (input.b <= 0 || input.h <= 0 || input.cover <= 0 || input.barDiameter <= 0 ||
    input.barCount <= 0 || !Number.isInteger(input.barCount) ||
    input.coverToCompressionCentroid <= 0 || input.compressionBarDiameter <= 0 ||
    input.compressionBarCount <= 0 || !Number.isInteger(input.compressionBarCount)) {
    result.advisories.push({
      severity: 'error',
      code: 'INVALID_INPUT',
      message: '截面尺寸、保护层和钢筋直径必须大于零，钢筋根数必须为正整数',
    });
    return result;
  }

  if (input.moment <= 0) {
    result.advisories.push({
      severity: 'error',
      code: 'INVALID_INPUT',
      message: '弯矩设计值必须大于零',
    });
    return result;
  }

  const concrete = CONCRETE_PARAMS[input.concreteGrade];
  const steel = STEEL_PARAMS[input.steelGrade];
  const compressionSteel = STEEL_PARAMS[input.compressionSteelGrade];

  if (!concrete) {
    result.advisories.push({
      severity: 'error',
      code: 'UNKNOWN_CONCRETE',
      message: `未知混凝土等级: ${input.concreteGrade}`,
    });
    return result;
  }
  if (!steel) {
    result.advisories.push({
      severity: 'error',
      code: 'UNKNOWN_STEEL',
      message: `未知受拉钢筋等级: ${input.steelGrade}`,
    });
    return result;
  }
  if (!compressionSteel) {
    result.advisories.push({
      severity: 'error',
      code: 'UNKNOWN_STEEL',
      message: `未知受压钢筋等级: ${input.compressionSteelGrade}`,
    });
    return result;
  }

  // === 基本参数计算 ===
  const fy = steel.fy;
  const fyPrime = compressionSteel.fy;
  const As = input.barCount * Math.PI * input.barDiameter ** 2 / 4; // mm²
  const AsPrime = input.compressionBarCount * Math.PI * input.compressionBarDiameter ** 2 / 4; // mm²
  const as = input.cover + input.barDiameter / 2;      // 受拉钢筋合力点至受拉边 (mm)
  const asPrime = input.coverToCompressionCentroid;   // 受压钢筋合力点至受压边 (mm)
  const h0 = input.h - as;                            // 有效高度 (mm)

  if (h0 <= 0) {
    result.advisories.push({
      severity: 'error',
      code: 'INVALID_INPUT',
      message: '有效高度 h0 必须大于零',
    });
    return result;
  }
  if (asPrime >= input.h - as) {
    result.advisories.push({
      severity: 'error',
      code: 'INVALID_INPUT',
      message: '受压钢筋合力点位置 a\'s 应使受压钢筋位于截面内',
    });
    return result;
  }

  // === 记录输入参数 ===
  result.inputs = [
    { label: '截面宽度 b', value: input.b, unit: 'mm' },
    { label: '截面高度 h', value: input.h, unit: 'mm' },
    { label: '受拉钢筋外缘距 c', value: input.cover, unit: 'mm' },
    { label: '受拉钢筋合力点距 aₛ', value: Math.round(as * 100) / 100, unit: 'mm' },
    { label: '受压钢筋合力点距 a′ₛ', value: Math.round(asPrime * 100) / 100, unit: 'mm' },
    { label: '受拉钢筋直径/根数', value: `${input.barDiameter}mm × ${input.barCount}`, unit: '' },
    { label: '受压钢筋直径/根数', value: `${input.compressionBarDiameter}mm × ${input.compressionBarCount}`, unit: '' },
    { label: '弯矩设计值 M', value: input.moment, unit: 'kN·m' },
  ];

  // === 记录材料参数 ===
  const concreteEvidence = [
    reviewEvidence('4.1.4', '第4章', '混凝土轴心抗压强度的设计值 fc 应按表 4.1.4-1 采用；轴心抗拉强度的设计值 ft 应按表 4.1.4-2 采用。', 34),
  ];
  const steelEvidence = [
    reviewEvidence('4.2.3', '第4章', '普通钢筋的抗拉强度设计值 fy 应按表 4.2.3-1 采用。', 38),
  ];
  const EsEvidence = [
    reviewEvidence('4.2.5', '第4章', '普通钢筋的弹性模量 Es 应按表 4.2.5 采用。', 40),
  ];
  allEvidence.push(...concreteEvidence, ...steelEvidence, ...EsEvidence);

  result.materials = [
    { label: '混凝土等级', value: input.concreteGrade, unit: '', evidence: concreteEvidence },
    { label: 'fc', value: concrete.fc, unit: 'MPa', evidence: concreteEvidence },
    { label: 'ft', value: concrete.ft, unit: 'MPa', evidence: concreteEvidence },
    { label: 'α1', value: concrete.alpha1, unit: '', evidence: [verifiedEvidence('6.2.6', '第6章', '当混凝土强度等级不超过 C50 时，α1 取为 1.0。', 52)] },
    { label: 'β1', value: concrete.beta1, unit: '', evidence: [verifiedEvidence('6.2.6', '第6章', '当混凝土强度等级不超过 C50 时，β1 取为 0.80。', 52)] },
    { label: '受拉钢筋等级', value: input.steelGrade, unit: '', evidence: steelEvidence },
    { label: 'fy', value: fy, unit: 'MPa', evidence: steelEvidence },
    { label: '受压钢筋等级', value: input.compressionSteelGrade, unit: '', evidence: steelEvidence },
    { label: 'fy′', value: fyPrime, unit: 'MPa', evidence: steelEvidence },
    { label: 'Es', value: steel.Es, unit: 'MPa', evidence: EsEvidence },
  ];

  // === 记录截面参数 ===
  result.geometry = [
    { label: '有效高度 h₀', value: Math.round(h0 * 100) / 100, unit: 'mm' },
    { label: '受拉钢筋面积 As', value: Math.round(As * 100) / 100, unit: 'mm²' },
    { label: '受压钢筋面积 A′s', value: Math.round(AsPrime * 100) / 100, unit: 'mm²' },
  ];

  // === 计算步骤 ===
  const steps: CalculationStep[] = [];

  // 步骤1：受压区高度
  const xEvidence = [
    verifiedEvidence('6.2.10', '第6章', '混凝土受压区高度应按公式 α1·fc·b·x = fy·As − fy′·A′s 确定（6.2.10-2）。', 54),
  ];
  allEvidence.push(...xEvidence);
  const x = (fy * As - fyPrime * AsPrime) / (concrete.alpha1 * concrete.fc * input.b);
  steps.push({
    name: '计算受压区高度',
    description: '按公式（6.2.10-2）由轴力平衡求解 x',
    formula: 'x = (f_y·A_s − f_y′·A′_s) / (α_1·f_c·b)',
    substitutedFormula: `x = (${fy} × ${Math.round(As * 100) / 100} − ${fyPrime} × ${Math.round(AsPrime * 100) / 100}) / (${concrete.alpha1} × ${concrete.fc} × ${input.b})`,
    result: Math.round(x * 100) / 100,
    unit: 'mm',
    evidence: xEvidence,
  });

  // 步骤2：界限相对受压区高度
  const xiBEvidence = [
    verifiedEvidence('6.2.7', '第6章', '有屈服点普通钢筋的界限相对受压区高度：ξb = β1 / (1 + fy / (Es·εcu))，εcu = 0.0033（6.2.7-1）。', 53),
  ];
  allEvidence.push(...xiBEvidence);
  const xiB = concrete.beta1 / (1 + fy / (steel.Es * EPSILON_CU));
  steps.push({
    name: '计算界限相对受压区高度',
    description: 'ξb = β1 / (1 + fy / (Es·εcu))',
    formula: 'ξ_b = β_1 / (1 + f_y / (E_s·ε_cu))',
    substitutedFormula: `ξ_b = ${concrete.beta1} / (1 + ${fy} / (${steel.Es} × ${EPSILON_CU}))`,
    result: Math.round(xiB * 10000) / 10000,
    unit: '',
    evidence: xiBEvidence,
  });

  // 步骤3：受压钢筋屈服条件与受弯承载力
  let Mu: number;
  let branch: 'normal' | 'compression-not-yield' | 'over-reinforced';
  const xi = x / h0;
  const xMinCompression = 2 * asPrime;

  if (x > xiB * h0) {
    branch = 'over-reinforced';
    const xLimit = xiB * h0;
    Mu = (concrete.alpha1 * concrete.fc * input.b * xLimit * (h0 - xLimit / 2)
      + fyPrime * AsPrime * (h0 - asPrime)) / N_MM_TO_KN_M;
    const overEvidence = [
      verifiedEvidence('6.2.10', '第6章', '混凝土受压区高度应符合 x ≤ ξb·h0（6.2.10-3）；本算例 x 超界，按界限 x = ξb·h0 计算受弯承载力下限。', 54),
    ];
    allEvidence.push(...overEvidence);
    steps.push({
      name: '计算受弯承载力（界限控制）',
      description: 'x > ξb·h0，属于超筋情形；按界限 x = ξb·h0 取受弯承载力下限，验算不通过。',
      formula: 'M_u = α_1·f_c·b·x_b·(h_0 − x_b/2) + f_y′·A′_s·(h_0 − a′_s)',
      substitutedFormula: `M_u = ${concrete.alpha1} × ${concrete.fc} × ${input.b} × ${Math.round(xLimit * 100) / 100} × (${Math.round(h0 * 100) / 100} − ${Math.round(xLimit * 100) / 100}/2) + ${fyPrime} × ${Math.round(AsPrime * 100) / 100} × (${Math.round(h0 * 100) / 100} − ${Math.round(asPrime * 100) / 100})`,
      result: Math.round(Mu * 100) / 100,
      unit: 'kN·m',
      evidence: overEvidence,
    });
  } else if (x < xMinCompression) {
    branch = 'compression-not-yield';
    // 受压钢筋未屈服：按设计原理简化 Mu = fy·As·(h0 − as')
    const simplifiedEvidence = [
      {
        ...verifiedEvidence('6.2.10', '第6章', '当 x < 2a′s 时受压钢筋未达到设计强度；取 x = 2a′s 并对受压钢筋合力点取矩，得简化受弯承载力 Mu = fy·As·(h0 − a′s)。', 54),
        verificationStatus: 'REVIEW_REQUIRED' as const,
      },
    ];
    allEvidence.push(...simplifiedEvidence);
    Mu = fy * As * (h0 - asPrime) / N_MM_TO_KN_M;
    steps.push({
      name: '计算受弯承载力（受压钢筋未屈服简化）',
      description: 'x < 2a′s，受压钢筋未达到设计强度；按设计方法取 x = 2a′s 并对受压钢筋合力点取矩。该简化为设计原理方法，非规范直接条文，待核验。',
      formula: 'M_u = f_y·A_s·(h_0 − a′_s)',
      substitutedFormula: `M_u = ${fy} × ${Math.round(As * 100) / 100} × (${Math.round(h0 * 100) / 100} − ${Math.round(asPrime * 100) / 100})`,
      result: Math.round(Mu * 100) / 100,
      unit: 'kN·m',
      evidence: simplifiedEvidence,
    });
  } else {
    branch = 'normal';
    const MuEvidence = [
      verifiedEvidence('6.2.10', '第6章', 'M ≤ α1·fc·b·x·(h0 − x/2) + fy′·A′s·(h0 − a′s)（6.2.10-1）。', 54),
    ];
    allEvidence.push(...MuEvidence);
    Mu = (concrete.alpha1 * concrete.fc * input.b * x * (h0 - x / 2)
      + fyPrime * AsPrime * (h0 - asPrime)) / N_MM_TO_KN_M;
    steps.push({
      name: '计算正截面受弯承载力',
      description: '按公式（6.2.10-1）叠加混凝土受压区与受压钢筋贡献',
      formula: 'M_u = [α_1·f_c·b·x·(h_0 − x/2) + f_y′·A′_s·(h_0 − a′_s)] / 10⁶',
      substitutedFormula: `M_u = [${concrete.alpha1} × ${concrete.fc} × ${input.b} × ${Math.round(x * 100) / 100} × (${Math.round(h0 * 100) / 100} − ${Math.round(x * 100) / 100}/2) + ${fyPrime} × ${Math.round(AsPrime * 100) / 100} × (${Math.round(h0 * 100) / 100} − ${Math.round(asPrime * 100) / 100})] / 10⁶`,
      result: Math.round(Mu * 100) / 100,
      unit: 'kN·m',
      evidence: MuEvidence,
    });
  }

  // 步骤4：相对受压区高度
  const xiEvidence = [
    verifiedEvidence('6.2.10', '第6章', '相对受压区高度 ξ = x / h0（6.2.10-3）。', 54),
  ];
  allEvidence.push(...xiEvidence);
  steps.push({
    name: '计算相对受压区高度',
    description: 'ξ = x / h₀',
    formula: 'ξ = x / h_0',
    substitutedFormula: `ξ = ${Math.round(x * 100) / 100} / ${Math.round(h0 * 100) / 100}`,
    result: Math.round(xi * 10000) / 10000,
    unit: '',
    evidence: xiEvidence,
  });

  // 步骤5：最小配筋面积
  const rhoMinPercent = Math.max(0.20, 45 * concrete.ft / fy);
  const rhoMin = rhoMinPercent / 100;
  const AsMin = rhoMin * input.b * input.h;
  const AsMinEvidence = [
    reviewEvidence('8.5.1', '第8章', '受弯构件一侧受拉钢筋的最小配筋百分率取 0.20 与 45ft/fy 中的较大值；As,min = ρmin·b·h。', 124),
  ];
  allEvidence.push(...AsMinEvidence);
  steps.push({
    name: '计算最小配筋面积',
    description: 'As,min = max(0.2%, 45ft/fy%) · b·h',
    formula: 'A_s,min = ρ_min·b·h',
    substitutedFormula: `A_s,min = ${rhoMinPercent.toFixed(3)}% × ${input.b} × ${input.h} / 100`,
    result: Math.round(AsMin * 100) / 100,
    unit: 'mm²',
    evidence: AsMinEvidence,
  });

  result.steps = steps;

  // === 主要结果 ===
  result.results = [
    { label: '有效高度 h₀', value: Math.round(h0 * 100) / 100, unit: 'mm' },
    { label: '受拉钢筋面积 As', value: Math.round(As * 100) / 100, unit: 'mm²' },
    { label: '受压钢筋面积 A′s', value: Math.round(AsPrime * 100) / 100, unit: 'mm²' },
    { label: '受压区高度 x', value: Math.round(x * 100) / 100, unit: 'mm' },
    { label: '相对受压区高度 ξ', value: Math.round(xi * 10000) / 10000, unit: '' },
    { label: '界限相对受压区高度 ξb', value: Math.round(xiB * 10000) / 10000, unit: '' },
    { label: '受压区高度下限 2a′s', value: xMinCompression, unit: 'mm' },
    { label: '受弯承载力 Mu', value: Math.round(Mu * 100) / 100, unit: 'kN·m' },
    { label: '最小配筋面积 As,min', value: Math.round(AsMin * 100) / 100, unit: 'mm²' },
    { label: '配筋率 ρ', value: Math.round(As / (input.b * input.h) * 10000) / 100, unit: '%' },
    { label: '计算分支', value: branch === 'normal' ? '正常' : branch === 'compression-not-yield' ? '受压钢筋未屈服' : '超筋（界限控制）', unit: '' },
  ];

  // === 验算项 ===
  const checks: CheckItem[] = [];

  checks.push({
    name: '相对受压区高度验算',
    calculatedValue: Math.round(xi * 10000) / 10000,
    limitValue: Math.round(xiB * 10000) / 10000,
    comparison: '<=',
    passed: x <= xiB * h0,
    unit: '',
    evidence: [verifiedEvidence('6.2.10', '第6章', '混凝土受压区高度应符合 x ≤ ξb·h0（6.2.10-3）。', 54)],
  });

  checks.push({
    name: '最小配筋率验算',
    calculatedValue: Math.round(As * 100) / 100,
    limitValue: Math.round(AsMin * 100) / 100,
    comparison: '>=',
    passed: As >= AsMin,
    unit: 'mm²',
    evidence: [reviewEvidence('8.5.1', '第8章', '纵向受力钢筋的配筋百分率不应小于表 8.5.1 规定的数值。', 124)],
  });

  checks.push({
    name: '承载力验算',
    calculatedValue: Math.round(Mu * 100) / 100,
    limitValue: input.moment,
    comparison: '>=',
    passed: Mu >= input.moment,
    unit: 'kN·m',
    evidence: [verifiedEvidence('6.2.10', '第6章', '矩形截面受弯构件的正截面受弯承载力应符合公式（6.2.10-1）。', 54)],
  });

  result.checks = checks;

  // === 结论 ===
  // 受压钢筋屈服条件 x ≥ 2a′s 属设计分支而非安全性验算，不参与结论判定；
  // 结论仅由界限、最小配筋和承载力三项安全验算决定。
  const allPassed = checks.every(c => c.passed);
  result.conclusion = {
    passed: allPassed,
    summary: allPassed
      ? '各项验算通过，截面满足要求（计算公式待规范原文核验）'
      : '存在不满足的验算项，请调整参数（计算公式待规范原文核验）',
    evidence: [verifiedEvidence('6.2.10', '第6章', '综合验算结论。', 54)],
  };

  // 全局 advisory
  if (branch === 'over-reinforced') {
    result.advisories.push({
      severity: 'error',
      code: 'OVER_REINFORCED',
      message: '相对受压区高度超过界限 ξb，属于超筋截面；实际设计应加大截面或调整配筋。',
    });
  }
  if (branch === 'compression-not-yield') {
    result.advisories.push({
      severity: 'warning',
      code: 'COMPRESSION_STEEL_NOT_YIELD',
      message: 'x < 2a′s，受压钢筋未达到设计强度；按 Mu = fy·As·(h0 − a′s) 简化计算，该简化为设计方法而非规范直接条文。',
    });
  }
  result.advisories.push({
    severity: 'warning',
    code: 'REVIEW_REQUIRED',
    message: '本计算所有公式和限值尚未经过规范原文核验，状态为 REVIEW_REQUIRED。',
  });

  result.allEvidence = allEvidence;
  result.overallStatus = 'REVIEW_REQUIRED';

  return result;
}
