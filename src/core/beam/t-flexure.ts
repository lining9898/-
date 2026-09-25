/**
 * T形梁正截面受弯承载力计算内核
 *
 * 状态：REVIEW_REQUIRED
 *
 * 公式依据：GB 50010-2010(2015年版) 第6.2.11条
 * 翼缘计算宽度：第6.2.12条，按表5.2.4取值
 *
 * 适用范围：翼缘位于受压区的T形、I形截面受弯构件，仅配置受拉钢筋
 * 不适用于：双筋截面、预应力梁、倒L形截面
 */

import {
  CalculationResult,
  CalculationStep,
  CheckItem,
  createEmptyResult,
} from '../../types/calculation';
import { Evidence } from '../../types/evidence';

/** 梁正截面受弯输入参数 */
export interface BeamTFlexureInput {
  // 截面参数
  b: number;          // 腹板宽度 (mm)
  h: number;          // 截面高度 (mm)
  hf: number;         // 翼缘厚度 (mm)
  bf: number;         // 翼缘计算宽度 (mm)

  // 材料
  concreteGrade: string;
  steelGrade: string;

  // 配筋
  cover: number;      // 保护层厚度 (mm)
  barDiameter: number;  // 受拉钢筋直径 (mm)
  barCount: number;     // 受拉钢筋根数

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

/** 常用混凝土等级参数 */
const CONCRETE_PARAMS: Record<string, ConcreteParams> = {
  C20: { fc: 9.6, ft: 1.10, alpha1: 1.0, beta1: 0.80 },
  C25: { fc: 11.9, ft: 1.27, alpha1: 1.0, beta1: 0.80 },
  C30: { fc: 14.3, ft: 1.43, alpha1: 1.0, beta1: 0.80 },
  C35: { fc: 16.7, ft: 1.57, alpha1: 1.0, beta1: 0.80 },
  C40: { fc: 19.1, ft: 1.71, alpha1: 1.0, beta1: 0.80 },
  C45: { fc: 21.1, ft: 1.80, alpha1: 1.0, beta1: 0.80 },
  C50: { fc: 23.1, ft: 1.89, alpha1: 1.0, beta1: 0.80 },
};

/** 常用钢筋等级参数 */
const STEEL_PARAMS: Record<string, SteelParams> = {
  HPB300: { fy: 270, Es: 210000 },
  HRB335: { fy: 300, Es: 200000 },
  HRB400: { fy: 360, Es: 200000 },
  HRB500: { fy: 435, Es: 200000 },
};

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
    edition: '2010(2015)',
    chapter: chapter,
    clause: clause,
    originalText: originalText,
    pdfPage: pdfPage,
    status: 'current',
    verificationStatus: 'REVIEW_REQUIRED',
    sourceFile: 'GB50010-2010_2015_.pdf',
  };
}

/**
 * T形梁正截面受弯承载力计算
 *
 * 翼缘位于受压区，仅配置受拉钢筋
 */
export function calculateBeamTFlexure(input: BeamTFlexureInput): CalculationResult {
  const result = createEmptyResult('beam-t-flexure');
  const allEvidence: Evidence[] = [];

  // === 输入校验 ===
  if (![input.b, input.h, input.hf, input.bf, input.cover, input.barDiameter, input.barCount, input.moment].every(Number.isFinite)) {
    result.advisories.push({
      severity: 'error',
      code: 'INVALID_INPUT',
      message: '数值输入必须为有限数',
    });
    return result;
  }

  if (input.b <= 0 || input.h <= 0 || input.hf <= 0 || input.bf <= 0) {
    result.advisories.push({
      severity: 'error',
      code: 'INVALID_INPUT',
      message: '截面尺寸必须大于零',
    });
    return result;
  }

  if (input.bf < input.b) {
    result.advisories.push({
      severity: 'error',
      code: 'INVALID_INPUT',
      message: '翼缘宽度 bf 不应小于腹板宽度 b',
    });
    return result;
  }

  if (input.hf >= input.h) {
    result.advisories.push({
      severity: 'error',
      code: 'INVALID_INPUT',
      message: '翼缘厚度 hf 不应大于截面高度 h',
    });
    return result;
  }

  if (input.cover <= 0 || input.barDiameter <= 0 || input.barCount <= 0 || !Number.isInteger(input.barCount)) {
    result.advisories.push({
      severity: 'error',
      code: 'INVALID_INPUT',
      message: '保护层和钢筋直径必须大于零，钢筋根数必须为正整数',
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
      message: `未知钢筋等级: ${input.steelGrade}`,
    });
    return result;
  }

  // === 基本参数计算 ===
  const As = input.barCount * Math.PI * Math.pow(input.barDiameter, 2) / 4;
  const h0 = input.h - input.cover - input.barDiameter / 2;
  if (h0 <= 0) {
    result.advisories.push({
      severity: 'error',
      code: 'INVALID_INPUT',
      message: '有效高度 h0 必须大于零',
    });
    return result;
  }

  // === 记录输入参数 ===
  result.inputs = [
    { label: '腹板宽度 b', value: input.b, unit: 'mm' },
    { label: '截面高度 h', value: input.h, unit: 'mm' },
    { label: '翼缘厚度 hf', value: input.hf, unit: 'mm' },
    { label: '翼缘计算宽度 bf', value: input.bf, unit: 'mm' },
    { label: '保护层厚度 c', value: input.cover, unit: 'mm' },
    { label: '受拉钢筋直径', value: input.barDiameter, unit: 'mm' },
    { label: '受拉钢筋根数', value: input.barCount, unit: '根' },
    { label: '弯矩设计值 M', value: input.moment, unit: 'kN·m' },
  ];

  // === 记录材料参数 ===
  const concreteEvidence = [
    reviewEvidence('4.1.4', '第4章', '混凝土轴心抗压强度的设计值 fc 应按表 4.1.4-1 采用；轴心抗拉强度的设计值 ft 应按表 4.1.4-2 采用。', 34),
  ];
  const steelEvidence = [
    reviewEvidence('4.2.3', '第4章', '普通钢筋的抗拉强度设计值 fy 应按表 4.2.3-1 采用。', 38),
  ];
  allEvidence.push(...concreteEvidence, ...steelEvidence);

  result.materials = [
    { label: '混凝土等级', value: input.concreteGrade, unit: '', evidence: concreteEvidence },
    { label: 'fc', value: concrete.fc, unit: 'MPa', evidence: concreteEvidence },
    { label: 'ft', value: concrete.ft, unit: 'MPa', evidence: concreteEvidence },
    { label: 'α1', value: concrete.alpha1, unit: '', evidence: [reviewEvidence('6.2.6', '第6章', '当混凝土强度等级不超过 C50 时，α1 取为 1.0。', 52)] },
    { label: 'β1', value: concrete.beta1, unit: '', evidence: [reviewEvidence('6.2.6', '第6章', '当混凝土强度等级不超过 C50 时，β1 取为 0.80。', 52)] },
    { label: '钢筋等级', value: input.steelGrade, unit: '', evidence: steelEvidence },
    { label: 'fy', value: steel.fy, unit: 'MPa', evidence: steelEvidence },
    { label: 'Es', value: steel.Es, unit: 'MPa', evidence: steelEvidence },
  ];

  // === 记录截面参数 ===
  result.geometry = [
    { label: '有效高度 h₀', value: Math.round(h0 * 100) / 100, unit: 'mm' },
    { label: '受拉钢筋面积 As', value: Math.round(As * 100) / 100, unit: 'mm²' },
    { label: '翼缘计算宽度 bf', value: input.bf, unit: 'mm' },
    { label: '翼缘厚度 hf', value: input.hf, unit: 'mm' },
  ];

  // === 计算步骤 ===
  const steps: CalculationStep[] = [];

  // 步骤1：判断中和轴位置
  // 若 fy·As ≤ α1·fc·bf·hf，中和轴在翼缘内，按宽度 bf 的矩形截面计算
  const flangeCapacity = concrete.alpha1 * concrete.fc * input.bf * input.hf; // N
  const steelForce = steel.fy * As; // N
  const neutralAxisInFlange = steelForce <= flangeCapacity;

  const naEvidence = [
    reviewEvidence('6.2.11', '第6章', '当满足 fy·As ≤ α1·fc·bf·hf 时，应按宽度为 bf 的矩形截面计算（公式6.2.11-1）。', 56),
  ];
  allEvidence.push(...naEvidence);
  steps.push({
    name: '判断中和轴位置',
    description: neutralAxisInFlange
      ? `fy·As = ${Math.round(steelForce)} N ≤ α1·fc·bf·hf = ${Math.round(flangeCapacity)} N，中和轴在翼缘内`
      : `fy·As = ${Math.round(steelForce)} N > α1·fc·bf·hf = ${Math.round(flangeCapacity)} N，中和轴在腹板内`,
    formula: neutralAxisInFlange
      ? 'f_y · A_s ≤ α_1 · f_c · b_f · h_f → 按宽度 b_f 的矩形截面计算'
      : 'f_y · A_s > α_1 · f_c · b_f · h_f → 中和轴进入腹板',
    substitutedFormula: neutralAxisInFlange
      ? `${steel.fy} × ${Math.round(As * 100) / 100} = ${Math.round(steelForce)} N ≤ ${concrete.alpha1} × ${concrete.fc} × ${input.bf} × ${input.hf} = ${Math.round(flangeCapacity)} N`
      : `${steel.fy} × ${Math.round(As * 100) / 100} = ${Math.round(steelForce)} N > ${concrete.alpha1} × ${concrete.fc} × ${input.bf} × ${input.hf} = ${Math.round(flangeCapacity)} N`,
    result: neutralAxisInFlange ? 1 : 0,
    unit: neutralAxisInFlange ? '中和轴在翼缘内' : '中和轴在腹板内',
    evidence: naEvidence,
  });

  let x: number;
  let Mu: number;

  if (neutralAxisInFlange) {
    // 按宽度 bf 的矩形截面计算
    x = (steel.fy * As) / (concrete.alpha1 * concrete.fc * input.bf);
    const xEvidence = [
      reviewEvidence('6.2.10', '第6章', '混凝土受压区高度：α1·fc·b·x = fy·As（公式6.2.10-2），此处 b 取 bf。', 55),
    ];
    allEvidence.push(...xEvidence);
    steps.push({
      name: '计算受压区高度（按矩形截面）',
      description: '中和轴在翼缘内，按宽度 bf 的矩形截面计算',
      formula: 'x = f_y · A_s / (α_1 · f_c · b_f)',
      substitutedFormula: `x = ${steel.fy} × ${Math.round(As * 100) / 100} / (${concrete.alpha1} × ${concrete.fc} × ${input.bf})`,
      result: Math.round(x * 100) / 100,
      unit: 'mm',
      evidence: xEvidence,
    });

    Mu = concrete.alpha1 * concrete.fc * input.bf * x * (h0 - x / 2) / 1e6;
    const MuEvidence = [
      reviewEvidence('6.2.10', '第6章', 'M ≤ α1·fc·b·x·(h0 - x/2)（公式6.2.10-1），此处 b 取 bf。', 55),
    ];
    allEvidence.push(...MuEvidence);
    steps.push({
      name: '计算正截面受弯承载力',
      description: '中和轴在翼缘内，按宽度 bf 的矩形截面计算 Mu',
      formula: 'M_u = α_1 · f_c · b_f · x · (h_0 - x/2)',
      substitutedFormula: `M_u = ${concrete.alpha1} × ${concrete.fc} × ${input.bf} × ${Math.round(x * 100) / 100} × (${Math.round(h0 * 100) / 100} - ${Math.round(x * 100) / 100}/2) / 10⁶`,
      result: Math.round(Mu * 100) / 100,
      unit: 'kN·m',
      evidence: MuEvidence,
    });
  } else {
    // 中和轴在腹板内
    // α1·fc·[b·x + (bf-b)·hf] = fy·As
    // x = [fy·As - α1·fc·(bf-b)·hf] / (α1·fc·b)
    const flangeForce = concrete.alpha1 * concrete.fc * (input.bf - input.b) * input.hf;
    x = (steel.fy * As - flangeForce) / (concrete.alpha1 * concrete.fc * input.b);

    const xEvidence = [
      reviewEvidence('6.2.11', '第6章', 'α1·fc·[b·x + (bf-b)·hf] = fy·As（公式6.2.11-3）', 56),
    ];
    allEvidence.push(...xEvidence);
    steps.push({
      name: '计算受压区高度',
      description: '中和轴在腹板内，按T形截面计算受压区高度',
      formula: 'x = [f_y · A_s - α_1 · f_c · (b_f - b) · h_f] / (α_1 · f_c · b)',
      substitutedFormula: `x = [${steel.fy} × ${Math.round(As * 100) / 100} - ${concrete.alpha1} × ${concrete.fc} × (${input.bf} - ${input.b}) × ${input.hf}] / (${concrete.alpha1} × ${concrete.fc} × ${input.b})`,
      result: Math.round(x * 100) / 100,
      unit: 'mm',
      evidence: xEvidence,
    });

    // Mu = α1·fc·[b·x·(h0-x/2) + (bf-b)·hf·(h0-hf/2)]
    const webMoment = concrete.alpha1 * concrete.fc * input.b * x * (h0 - x / 2);
    const flangeMoment = concrete.alpha1 * concrete.fc * (input.bf - input.b) * input.hf * (h0 - input.hf / 2);
    Mu = (webMoment + flangeMoment) / 1e6;

    const MuEvidence = [
      reviewEvidence('6.2.11', '第6章', 'M ≤ α1·fc·[b·x·(h0-x/2) + (bf-b)·hf·(h0-hf/2)]（公式6.2.11-2）', 56),
    ];
    allEvidence.push(...MuEvidence);
    steps.push({
      name: '计算正截面受弯承载力',
      description: '中和轴在腹板内，按T形截面计算 Mu',
      formula: 'M_u = α_1 · f_c · [b · x · (h_0 - x/2) + (b_f - b) · h_f · (h_0 - h_f/2)]',
      substitutedFormula: `M_u = ${concrete.alpha1} × ${concrete.fc} × [${input.b} × ${Math.round(x * 100) / 100} × (${Math.round(h0 * 100) / 100} - ${Math.round(x * 100) / 100}/2) + (${input.bf} - ${input.b}) × ${input.hf} × (${Math.round(h0 * 100) / 100} - ${input.hf}/2)] / 10⁶`,
      result: Math.round(Mu * 100) / 100,
      unit: 'kN·m',
      evidence: MuEvidence,
    });
  }

  // 步骤：相对受压区高度
  const xi = x / h0;
  const xiEvidence = [
    reviewEvidence('6.2.10', '第6章', '相对受压区高度 ξ = x / h0', 55),
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

  // 步骤：界限相对受压区高度
  const xiB = concrete.beta1 / (1 + steel.fy / (steel.Es * 0.0033));
  const xiBEvidence = [
    reviewEvidence('6.2.7', '第6章', '有屈服点普通钢筋：ξb = β1 / (1 + fy / (Es · εcu))，其中 εcu = 0.0033（公式6.2.7-1）', 53),
  ];
  allEvidence.push(...xiBEvidence);
  steps.push({
    name: '计算界限相对受压区高度',
    description: 'ξb = β1 / (1 + fy / (Es · εcu))，其中 εcu = 0.0033',
    formula: 'ξ_b = β_1 / (1 + f_y / (E_s · ε_cu))',
    substitutedFormula: `ξ_b = ${concrete.beta1} / (1 + ${steel.fy} / (${steel.Es} × 0.0033))`,
    result: Math.round(xiB * 10000) / 10000,
    unit: '',
    evidence: xiBEvidence,
  });

  // 步骤：最小配筋面积
  // 规范 8.5.1：受弯构件最小配筋率 ρmin = max(0.20%, 45ft/fy%)
  // 注5：配筋率按全截面面积扣除受压翼缘面积后的截面面积计算
  // 即 As,min = ρmin · b·h
  const rhoMinPercent = Math.max(0.20, 45 * concrete.ft / steel.fy);
  const rhoMin = rhoMinPercent / 100;
  const effectiveArea = input.b * input.h;
  const AsMin = rhoMin * effectiveArea;

  const AsMinEvidence = [
    reviewEvidence('8.5.1', '第8章', '受弯构件一侧受拉钢筋的最小配筋百分率：0.20和45ft/fy中的较大值。注5：T形截面受拉钢筋配筋率应按全截面面积扣除受压翼缘面积后的截面面积计算。', 124),
  ];
  allEvidence.push(...AsMinEvidence);
  steps.push({
    name: '计算最小配筋面积',
    description: 'As,min = max(0.2%, 45ft/fy%) · b·h',
    formula: 'A_s,min = ρ_min · b · h',
    substitutedFormula: `A_s,min = ${rhoMinPercent.toFixed(3)}% × ${input.b} × ${input.h} / 100`,
    result: Math.round(AsMin * 100) / 100,
    unit: 'mm²',
    evidence: AsMinEvidence,
  });

  result.steps = steps;

  // === 主要结果 ===
  result.results = [
    { label: '有效高度 h₀', value: Math.round(h0 * 100) / 100, unit: 'mm' },
    { label: '受压区高度 x', value: Math.round(x * 100) / 100, unit: 'mm' },
    { label: '相对受压区高度 ξ', value: Math.round(xi * 10000) / 10000, unit: '' },
    { label: '界限相对受压区高度 ξb', value: Math.round(xiB * 10000) / 10000, unit: '' },
    { label: '中和轴位置', value: neutralAxisInFlange ? '翼缘内' : '腹板内', unit: '' },
    { label: '受拉钢筋面积 As', value: Math.round(As * 100) / 100, unit: 'mm²' },
    { label: '最小配筋面积 As,min', value: Math.round(AsMin * 100) / 100, unit: 'mm²' },
    { label: '配筋率 ρ', value: Math.round(As / effectiveArea * 10000) / 100, unit: '%' },
    { label: '受弯承载力 Mu', value: Math.round(Mu * 100) / 100, unit: 'kN·m' },
  ];

  // === 验算项 ===
  const checks: CheckItem[] = [];

  // 验算1：ξ ≤ ξb
  checks.push({
    name: '相对受压区高度验算',
    calculatedValue: Math.round(xi * 10000) / 10000,
    limitValue: Math.round(xiB * 10000) / 10000,
    comparison: '<=',
    passed: xi <= xiB,
    unit: '',
    evidence: [reviewEvidence('6.2.10', '第6章', '混凝土受压区高度应符合：x ≤ ξb·h0（公式6.2.10-3）', 55)],
  });

  // 验算2：As ≥ As,min
  checks.push({
    name: '最小配筋率验算',
    calculatedValue: Math.round(As * 100) / 100,
    limitValue: Math.round(AsMin * 100) / 100,
    comparison: '>=',
    passed: As >= AsMin,
    unit: 'mm²',
    evidence: [reviewEvidence('8.5.1', '第8章', '纵向受力钢筋的配筋百分率不应小于表 8.5.1 规定的数值。', 124)],
  });

  // 验算3：Mu ≥ M
  checks.push({
    name: '承载力验算',
    calculatedValue: Math.round(Mu * 100) / 100,
    limitValue: input.moment,
    comparison: '>=',
    passed: Mu >= input.moment,
    unit: 'kN·m',
    evidence: [reviewEvidence('6.2.11', '第6章', 'T形截面受弯构件的正截面受弯承载力应符合本规范公式(6.2.11-2)的规定。', 56)],
  });

  result.checks = checks;

  // === 结论 ===
  const allPassed = checks.every(c => c.passed);
  result.conclusion = {
    passed: allPassed,
    summary: allPassed
      ? '各项验算通过，截面满足要求（计算公式待规范原文核验）'
      : '存在不满足的验算项，请调整参数（计算公式待规范原文核验）',
    evidence: [reviewEvidence('6.2.11', '第6章', '综合验算结论', 56)],
  };

  // 全局 advisory
  result.advisories.push({
    severity: 'warning',
    code: 'FLANGE_WIDTH_UNCHECKED',
    message: '翼缘计算宽度 bf 由用户输入；本工具未按第6.2.12条及表5.2.4验算其取值。',
  });
  result.advisories.push({
    severity: 'warning',
    code: 'REVIEW_REQUIRED',
    message: '本计算所有公式和限值尚未经过规范原文核验，状态为 REVIEW_REQUIRED。',
  });

  result.allEvidence = allEvidence;
  result.overallStatus = 'REVIEW_REQUIRED';

  return result;
}
