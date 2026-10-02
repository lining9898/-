/**
 * 矩形梁正截面受弯计算内核
 * 
 * 状态：REVIEW_REQUIRED（2015 年版公式已核对，现行规范差异待复核）
 * 
 * 本模块的计算公式已根据 GB 50010-2010（2015年版）规范原文逐条校核。
 * 已核对的证据引用仓库内 PDF；整体结论仍需复核规范版本与构造要求。
 * 
 * 校核日期：2026-09-24
 * 校核依据：GB50010-2010_2015_.pdf（441页）
 */

import {
  CalculationResult,
  CalculationStep,
  CheckItem,
  createEmptyResult,
} from '../../types/calculation';
import { Evidence } from '../../types/evidence';
import { materialSelectionCompliance, attachCurrentMaterialSelectionEvidence, currentMinimumReinforcementEvidence, frameBeamSeismicReinforcementEvidence } from '../shared/materials';
import { sectionDimensionCompliance } from '../shared/construction';

/** 梁正截面受弯输入参数 */
export interface BeamFlexureInput {
  b: number;        // 截面宽度 (mm)
  h: number;        // 截面高度 (mm)
  concreteGrade: string;  // 混凝土强度等级，如 "C30"
  steelGrade: string;     // 钢筋等级，如 "HRB400"
  cover: number;    // 受拉纵筋外缘至受拉边的距离 (mm)
  barDiameter: number;    // 受拉钢筋直径 (mm)
  barCount: number;       // 受拉钢筋根数
  moment: number;   // 弯矩设计值 M (kN·m)
  beamType?: 'frameBeam' | 'nonFrameBeam' | 'unknown';  // IG-005 构件分类
  seismicGrade?: 'unknown' | 'none' | '1' | '2' | '3' | '4'; // 框架梁抗震等级
  sectionLocation?: 'unknown' | 'support' | 'span'; // 框架梁受拉区所在梁端/跨中
  structuralSafetyGrade?: 'unknown' | '1' | '2' | '3'; // GB 55001 表 3.1.12 结构安全等级
  designSituation?: 'unknown' | 'persistent' | 'transient' | 'accidental' | 'seismic'; // M 对应的设计状况
  seismicAction?: 'unknown' | 'general' | 'verticalDominant'; // 地震组合是否由竖向地震控制
  momentBasis?: string; // 上游荷载组合与内力计算的可追溯编号
}

/** 混凝土材料参数 */
interface ConcreteParams {
  fc: number;       // 轴心抗压强度设计值 (MPa)
  ft: number;       // 轴心抗拉强度设计值 (MPa)
  Ec: number;       // 弹性模量 (MPa)
  alpha1: number;   // 等效矩形应力图系数
  beta1: number;    // 等效矩形应力图系数
}

/** 钢筋材料参数 */
interface SteelParams {
  fy: number;       // 抗拉强度设计值 (MPa)
  Es: number;       // 弹性模量 (MPa)
}

/** 常用混凝土等级参数（已根据 GB 50010-2010(2015年版) 表 4.1.4-1、4.1.4-2、4.1.5 校核） */
const CONCRETE_PARAMS: Record<string, ConcreteParams> = {
  C20: { fc: 9.6, ft: 1.10, Ec: 25500, alpha1: 1.0, beta1: 0.80 },
  C25: { fc: 11.9, ft: 1.27, Ec: 28000, alpha1: 1.0, beta1: 0.80 },
  C30: { fc: 14.3, ft: 1.43, Ec: 30000, alpha1: 1.0, beta1: 0.80 },
  C35: { fc: 16.7, ft: 1.57, Ec: 31500, alpha1: 1.0, beta1: 0.80 },
  C40: { fc: 19.1, ft: 1.71, Ec: 32500, alpha1: 1.0, beta1: 0.80 },
  C45: { fc: 21.1, ft: 1.80, Ec: 33500, alpha1: 1.0, beta1: 0.80 },
  C50: { fc: 23.1, ft: 1.89, Ec: 34500, alpha1: 1.0, beta1: 0.80 },
};

/** 常用钢筋等级参数（已根据 GB 50010-2010(2015年版) 表 4.2.3-1、4.2.5 校核） */
const STEEL_PARAMS: Record<string, SteelParams> = {
  HPB300: { fy: 270, Es: 210000 },
  HRB335: { fy: 300, Es: 200000 },
  HRB400: { fy: 360, Es: 200000 },
  HRB500: { fy: 435, Es: 200000 },
};

/** 创建已校核的规范证据 */
function verifiedEvidence(
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
    status: 'superseded',
    verificationStatus: 'REVIEW_REQUIRED',
    sourceFile: 'GB50010-2010_2015_.pdf',
  };
}

/**
 * 矩形梁正截面受弯承载力计算
 * 
 * 注意：所有公式和限值均已根据 GB 50010-2010(2015年版) 规范原文校核。
 */
export function calculateBeamFlexure(input: BeamFlexureInput): CalculationResult {
  const result = createEmptyResult('beam-flexure');
  const allEvidence: Evidence[] = [];

  // 验证输入
  if (
    ![input.b, input.h, input.cover, input.barDiameter, input.barCount, input.moment].every(Number.isFinite) ||
    input.b <= 0 || input.h <= 0 || input.cover <= 0 ||
    input.barDiameter <= 0 || !Number.isInteger(input.barCount) || input.barCount <= 0 ||
    input.moment < 0 || input.cover + input.barDiameter / 2 >= input.h ||
    2 * input.cover + input.barDiameter > input.b
  ) {
    result.advisories.push({
      severity: 'error',
      code: 'INVALID_INPUT',
      message: '请输入有限且有效的截面、钢筋和弯矩参数，并确保钢筋位于截面内',
    });
    return result;
  }

  const concrete = CONCRETE_PARAMS[input.concreteGrade];
  const steel = STEEL_PARAMS[input.steelGrade];

  // IG-001 硬限制：GB/T 50010-2024 局部修订 4.1.2 条最低强度 C25
  const gradeCheck = materialSelectionCompliance(input.concreteGrade, input.steelGrade);
  if (!gradeCheck.passed) {
    result.advisories.push({
      severity: 'error',
      code: gradeCheck.code!,
      message: gradeCheck.message,
    });
    return result;
  }

  // IG-005 硬限制：GB 55008-2021 §4.4.4 框架梁最小宽度 200mm
  const beamType = input.beamType ?? 'unknown';
  if (beamType === 'frameBeam') {
    const dimCheck = sectionDimensionCompliance({ componentType: 'frameBeam', dimension: input.b });
    if (!dimCheck.passed) {
      result.advisories.push({
        severity: 'error',
        code: 'SECTION_DIMENSION_BELOW_MINIMUM',
        message: `${dimCheck.message} 实际值: ${dimCheck.actualValue}mm, 最低要求: ${dimCheck.requiredMinimum}mm。`,
      });
      return result;
    }
  } else if (beamType === 'unknown') {
    result.advisories.push({
      severity: 'warning',
      code: 'BEAM_TYPE_UNKNOWN',
      message: '构件类型未声明（框架梁/非框架梁），GB 55008-2021 §4.4.4 最小截面校核未执行，请补充。',
    });
  }
  if (beamType === 'frameBeam' && (!input.seismicGrade || input.seismicGrade === 'unknown')) {
    result.advisories.push({
      severity: 'warning', code: 'SEISMIC_GRADE_UNKNOWN',
      message: '框架梁抗震等级未声明；抗震最小配筋率及相关构造验算未执行。',
    });
  }
  if (beamType === 'frameBeam' && input.seismicGrade && !['unknown', 'none'].includes(input.seismicGrade)
    && (!input.sectionLocation || input.sectionLocation === 'unknown')) {
    result.advisories.push({ severity: 'warning', code: 'SEISMIC_LOCATION_UNKNOWN',
      message: '框架梁已声明抗震等级，但未声明梁端或跨中位置；表 4.4.8-1 抗震最小配筋率未执行。' });
  }
  const designSituation = input.designSituation ?? 'unknown';
  const seismicAction = input.seismicAction ?? 'unknown';
  const persistentGamma0 = input.structuralSafetyGrade === '1' ? 1.1
    : input.structuralSafetyGrade === '3' ? 0.9 : 1.0;
  // 设计状况未声明时，取两类状况中较大的 γ₀ 展示保守数值，不作为项目收口依据。
  const gamma0 = designSituation === 'persistent' || designSituation === 'transient'
    ? persistentGamma0
    : designSituation === 'unknown' ? Math.max(persistentGamma0, 1.0) : 1.0;
  // GB 55002 表 4.3.1：混凝土梁受弯取 0.75；竖向地震为主时取 1.0。
  // 地震作用方向未声明时按 1.0 保守显示，并保留待核警告。
  const gammaRE = designSituation === 'seismic' && seismicAction === 'general' ? 0.75 : 1.0;
  if (designSituation === 'unknown') {
    result.advisories.push({ severity: 'warning', code: 'DESIGN_SITUATION_UNKNOWN',
      message: '弯矩 M 的设计状况未声明；γ₀ 暂按可能的较大值显示，地震组合的 γRE 无法确定，承载力结论不可正式收口。' });
  }
  if (designSituation === 'seismic' && seismicAction === 'unknown') {
    result.advisories.push({ severity: 'warning', code: 'SEISMIC_ACTION_UNKNOWN',
      message: '地震组合未声明是否由竖向地震控制；γRE 暂按 1.0 保守显示，需依据荷载组合计算书确认。' });
  }
  if (!input.structuralSafetyGrade || input.structuralSafetyGrade === 'unknown') {
    result.advisories.push({ severity: 'warning', code: 'SAFETY_GRADE_UNKNOWN',
      message: `结构安全等级未声明；暂按 γ₀=${gamma0.toFixed(1)} 显示单项数值，GB 55001 §3.1.10 / 表 3.1.12 的最终承载力判定未闭环。` });
  }
  if (!input.momentBasis?.trim()) {
    result.advisories.push({ severity: 'warning', code: 'MOMENT_BASIS_MISSING',
      message: '弯矩 M 为外部输入；尚未填写荷载组合及内力计算来源，GB 55001 §3.1.7 与 GB 50009 §3.2.2/3.2.3 的上游核验未闭环。' });
  }

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

  // 计算基本参数
  const As = input.barCount * Math.PI * Math.pow(input.barDiameter, 2) / 4;
  const h0 = input.h - input.cover - input.barDiameter / 2;

  // 记录输入参数
  result.inputs = [
    { label: '截面宽度 b', value: input.b, unit: 'mm' },
    { label: '截面高度 h', value: input.h, unit: 'mm' },
    { label: '受拉纵筋外缘距受拉边 c', value: input.cover, unit: 'mm' },
    { label: '受拉钢筋直径', value: input.barDiameter, unit: 'mm' },
    { label: '受拉钢筋根数', value: input.barCount, unit: '根' },
    { label: '作用组合弯矩设计值 M（未乘 γ₀）', value: input.moment, unit: 'kN·m' },
    { label: '弯矩荷载组合与内力来源', value: input.momentBasis?.trim() || '未提供', unit: '' },
    { label: '结构安全等级', value: input.structuralSafetyGrade && input.structuralSafetyGrade !== 'unknown' ? `${input.structuralSafetyGrade}级` : '未声明', unit: '' },
    { label: '设计状况', value: designSituation === 'persistent' ? '持久' : designSituation === 'transient' ? '短暂' : designSituation === 'accidental' ? '偶然' : designSituation === 'seismic' ? '地震' : '未声明', unit: '' },
    { label: '地震作用类别', value: designSituation !== 'seismic' ? '不适用' : seismicAction === 'general' ? '一般地震组合' : seismicAction === 'verticalDominant' ? '竖向地震为主' : '未声明', unit: '' },
    { label: '构件类型', value: beamType === 'frameBeam' ? '框架梁' : beamType === 'nonFrameBeam' ? '非框架梁' : '未声明', unit: '' },
    { label: '抗震等级', value: input.seismicGrade && input.seismicGrade !== 'unknown' ? input.seismicGrade : '未声明', unit: '' },
    { label: '验算位置', value: input.sectionLocation === 'support' ? '梁端' : input.sectionLocation === 'span' ? '跨中' : '未声明', unit: '' },
  ];

  // 记录材料参数
  const concreteEvidence = [
    verifiedEvidence('4.1.4', '第4章', '混凝土轴心抗压强度的设计值 fc 应按表 4.1.4-1 采用；轴心抗拉强度的设计值 ft 应按表 4.1.4-2 采用。', 35),
    { codeName: '混凝土结构设计标准', codeNumber: 'GB 50010',
      edition: '2010（2024年版，GB/T 50010-2010）', chapter: '第4章 材料', clause: '表 4.1.4-1',
      originalText: '2024 修订表 4.1.4-1 中，本模块 C25—C50 的混凝土抗压强度设计值 fc 与旧版相同；C30 为 14.3 N/mm²。',
      pdfPage: 6, status: 'current', verificationStatus: 'REVIEW_REQUIRED', sourceFile: 'GBT50010-2010_2024_amendment.pdf' },
    { codeName: '混凝土结构设计标准', codeNumber: 'GB 50010',
      edition: '2010（2024年版，GB/T 50010-2010）', chapter: '第4章 材料', clause: '表 4.1.4-2',
      originalText: '2024 修订表 4.1.4-2 中，本模块 C25—C50 的混凝土抗拉强度设计值 ft 与旧版相同；C30 为 1.43 N/mm²。',
      pdfPage: 7, status: 'current', verificationStatus: 'REVIEW_REQUIRED', sourceFile: 'GBT50010-2010_2024_amendment.pdf' },
    verifiedEvidence('4.1.5', '第4章', '混凝土受压和受拉的弹性模量 Ec 宜按表 4.1.5 采用。', 35),
    { codeName: '混凝土结构设计标准', codeNumber: 'GB 50010',
      edition: '2010（2024年版，GB/T 50010-2010）', chapter: '第4章 材料', clause: '表 4.1.5',
      originalText: '2024 修订表 4.1.5 中，本模块 C25—C50 的混凝土弹性模量 Ec 与旧版相同；C30 为 3.00×10⁴ N/mm²。',
      pdfPage: 7, status: 'current', verificationStatus: 'REVIEW_REQUIRED', sourceFile: 'GBT50010-2010_2024_amendment.pdf' },
  ] satisfies Evidence[];
  const steelEvidence = [
    verifiedEvidence('4.2.3', '第4章', '普通钢筋的抗拉强度设计值 fy、抗压强度设计值 fy\' 应按表 4.2.3-1 采用。', 39),
    { codeName: '混凝土结构设计标准', codeNumber: 'GB 50010',
      edition: '2010（2024年版，GB/T 50010-2010）', chapter: '第4章 材料', clause: '表 4.2.3-1',
      originalText: '2024 修订表 4.2.3-1 中，HPB300、HRB400、HRB500 的抗拉强度设计值 fy 分别为 270、360、435 N/mm²；已删除 HRB335。',
      pdfPage: 9, status: 'current', verificationStatus: 'REVIEW_REQUIRED', sourceFile: 'GBT50010-2010_2024_amendment.pdf' },
    verifiedEvidence('4.2.5', '第4章', '普通钢筋和预应力筋的弹性模量 Es 可按表 4.2.5 采用。', 40),
    { codeName: '混凝土结构设计标准', codeNumber: 'GB 50010',
      edition: '2010（2024年版，GB/T 50010-2010）', chapter: '第4章 材料', clause: '表 4.2.5',
      originalText: '2024 修订表 4.2.5 中，HPB300 的 Es 为 2.10×10⁵ N/mm²，HRB400、HRB500 为 2.00×10⁵ N/mm²，与旧版相同。',
      pdfPage: 11, status: 'current', verificationStatus: 'REVIEW_REQUIRED', sourceFile: 'GBT50010-2010_2024_amendment.pdf' },
  ] satisfies Evidence[];
  const alphaEvidence = [verifiedEvidence('6.2.6', '第6章', '当混凝土强度等级不超过 C50 时，α1 取为 1.0', 53)];
  const betaEvidence = [verifiedEvidence('6.2.6', '第6章', '当混凝土强度等级不超过 C50 时，β1 取为 0.80', 52)];
  allEvidence.push(...concreteEvidence, ...steelEvidence, ...alphaEvidence, ...betaEvidence);

  result.materials = [
    { label: '混凝土等级', value: input.concreteGrade, unit: '', evidence: concreteEvidence },
    { label: 'fc', value: concrete.fc, unit: 'MPa', evidence: concreteEvidence },
    { label: 'ft', value: concrete.ft, unit: 'MPa', evidence: concreteEvidence },
    { label: 'α1', value: concrete.alpha1, unit: '', evidence: alphaEvidence },
    { label: 'β1', value: concrete.beta1, unit: '', evidence: betaEvidence },
    { label: '钢筋等级', value: input.steelGrade, unit: '', evidence: steelEvidence },
    { label: 'fy', value: steel.fy, unit: 'MPa', evidence: steelEvidence },
    { label: 'Es', value: steel.Es, unit: 'MPa', evidence: steelEvidence },
  ];

  // 记录截面参数
  result.geometry = [
    { label: '有效高度 h₀', value: Math.round(h0 * 100) / 100, unit: 'mm' },
    { label: 'h₀ 构成', value: 'h − c − d/2；c 为受拉边至纵筋外缘实测距离，需按保护层和箍筋布置确认', unit: '' },
    { label: '受拉钢筋面积 As', value: Math.round(As * 100) / 100, unit: 'mm²' },
  ];

  // === 计算步骤 ===
  const steps: CalculationStep[] = [];

  // 步骤1：计算受压区高度 x
  const x = (steel.fy * As) / (concrete.alpha1 * concrete.fc * input.b);
  const xEvidence = [verifiedEvidence('6.2.10', '第6章', '混凝土受压区高度应按下列公式确定：', 55)];
  allEvidence.push(...xEvidence);
  steps.push({
    name: '计算受压区高度',
    description: '按公式（6.2.10-2）取无受压钢筋、无预应力筋的简化情形，由 α1·fc·b·x = fy·As 求解 x',
    formula: 'x = f_y · A_s / (α_1 · f_c · b)',
    symbolDefinitions: [
      { symbol: 'f_y', meaning: '钢筋抗拉强度设计值', unit: 'MPa' },
      { symbol: 'A_s', meaning: '受拉钢筋面积', unit: 'mm²' },
      { symbol: 'α_1', meaning: '等效矩形应力图系数', unit: '' },
      { symbol: 'f_c', meaning: '混凝土轴心抗压强度设计值', unit: 'MPa' },
      { symbol: 'b', meaning: '截面宽度', unit: 'mm' },
    ],
    substitutedFormula: `x = ${steel.fy} × ${Math.round(As * 100) / 100} / (${concrete.alpha1} × ${concrete.fc} × ${input.b})`,
    result: Math.round(x * 100) / 100,
    unit: 'mm',
    evidence: xEvidence,
  });

  // 步骤2：计算相对受压区高度 ξ
  const xi = x / h0;
  const xiEvidence = [verifiedEvidence('6.2.10', '第6章', 'x ≤ ξb h0', 55)];
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

  // 步骤3：界限相对受压区高度 ξb
  const xiB = concrete.beta1 / (1 + steel.fy / (steel.Es * 0.0033));
  const xiBEvidence = [verifiedEvidence('6.2.7', '第6章', 'ξb = β1 / (1 + fy / (Es εcu))', 53)];
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

  // 步骤4：计算受弯承载力 Mu
  const Mu = concrete.alpha1 * concrete.fc * input.b * x * (h0 - x / 2) / 1e6;
  const MuEvidence = [verifiedEvidence('6.2.10', '第6章', "M ≤ α1 fc b x (h0 - x/2) + f'y A's (h0 - a's) - (σ'p0 - f'py) A'p (h0 - a'p)", 55)];
  const currentFlexureEvidence: Evidence[] = [
    { codeName: '混凝土结构设计标准', codeNumber: 'GB 50010',
      edition: '2010（2024年版，GB/T 50010-2010）', chapter: '局部修订说明', clause: '局部修订说明（6.2 节）',
      originalText: '2024 局部修订说明列出全部 26 项修订条文，其中没有 6.2.1、6.2.6、6.2.7、6.2.10；这些正截面公式沿用 2015 年版正文，仍须满足现行强制规范。',
      pdfPage: 2, status: 'current', verificationStatus: 'REVIEW_REQUIRED', sourceFile: 'GBT50010-2010_2024_amendment.pdf' },
    { codeName: '混凝土结构通用规范', codeNumber: 'GB 55008', edition: '2021',
      chapter: '第4章 构件设计', clause: '4.4.2',
      originalText: '正截面承载力简化计算须满足平截面、混凝土不计抗拉、材料应力应变本构及纵向受拉钢筋应变和应力上限等条件。',
      pdfPage: 14, status: 'current', verificationStatus: 'REVIEW_REQUIRED', sourceFile: 'GB55008-2021.pdf' },
  ];
  allEvidence.push(...MuEvidence, ...currentFlexureEvidence);
  steps.push({
    name: '计算正截面受弯承载力',
    description: '按公式（6.2.10-1）取无受压钢筋、无预应力筋的简化情形，Mu = α1·fc·b·x·(h0 - x/2)',
    formula: 'M_u = α_1 · f_c · b · x · (h_0 - x/2)',
    substitutedFormula: `M_u = ${concrete.alpha1} × ${concrete.fc} × ${input.b} × ${Math.round(x * 100) / 100} × (${Math.round(h0 * 100) / 100} - ${Math.round(x * 100) / 100}/2) / 10⁶`,
    result: Math.round(Mu * 100) / 100,
    unit: 'kN·m',
    evidence: MuEvidence,
  });

  // 步骤5：最小配筋面积
  // 一般受弯构件按 8.5.1 / 4.4.6；框架梁再按 4.4.8 梁端/跨中表取较大值。
  // 矩形截面的最小配筋率面积按 b×h 计算。
  const generalRhoMinPercent = Math.max(0.20, 45 * concrete.ft / steel.fy);
  const seismicRow = beamType === 'frameBeam' && input.sectionLocation && input.sectionLocation !== 'unknown'
    && input.seismicGrade && ['1', '2', '3', '4'].includes(input.seismicGrade)
    ? ({
      '1': { support: [0.40, 80], span: [0.30, 65] },
      '2': { support: [0.30, 65], span: [0.25, 55] },
      '3': { support: [0.25, 55], span: [0.20, 45] },
      '4': { support: [0.25, 55], span: [0.20, 45] },
    } as const)[input.seismicGrade as '1' | '2' | '3' | '4'][input.sectionLocation]
    : null;
  const rhoMinPercent = seismicRow
    ? Math.max(generalRhoMinPercent, seismicRow[0], seismicRow[1] * concrete.ft / steel.fy)
    : generalRhoMinPercent;
  const rhoMin = rhoMinPercent / 100;
  const AsMin = rhoMin * input.b * input.h;
  const AsMinEvidence = [
    verifiedEvidence('8.5.1', '第8章', '钢筋混凝土结构构件中纵向受力钢筋的配筋百分率 ρmin 不应小于表 8.5.1 规定的数值。', 124),
    ...currentMinimumReinforcementEvidence(),
    ...(seismicRow ? [frameBeamSeismicReinforcementEvidence()] : []),
  ];
  allEvidence.push(...AsMinEvidence);
  steps.push({
    name: '计算最小配筋面积',
    description: seismicRow
      ? '按 GB 55008 表 4.4.8-1 梁端/跨中抗震下限与一般受弯下限取较大值，再乘 b·h。'
      : '一般受弯构件 As,min = max(0.2%, 45ft/fy%) · b · h；框架梁抗震下限须另核。',
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
    { label: '受拉钢筋面积 As', value: Math.round(As * 100) / 100, unit: 'mm²' },
    { label: '最小配筋面积 As,min', value: Math.round(AsMin * 100) / 100, unit: 'mm²' },
    { label: '配筋率 ρ（按全截面 b·h，同 8.5.1 口径）', value: Math.round(As / (input.b * input.h) * 10000) / 100, unit: '%', evidence: AsMinEvidence },
    { label: '受弯承载力 Mu', value: Math.round(Mu * 100) / 100, unit: 'kN·m' },
    { label: '重要性系数 γ₀', value: gamma0, unit: '' },
    { label: '承载力设计弯矩 γ₀M', value: Math.round(gamma0 * input.moment * 100) / 100, unit: 'kN·m' },
    { label: '承载力抗震调整系数 γRE', value: gammaRE, unit: '' },
    { label: '调整后受弯承载力 Mu/γRE', value: Math.round(Mu / gammaRE * 100) / 100, unit: 'kN·m' },
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
    evidence: [verifiedEvidence('6.2.10', '第6章', 'x ≤ ξb h0', 55)],
  });

  // 验算2：As ≥ As,min
  checks.push({
    name: '最小配筋率验算',
    calculatedValue: Math.round(As * 100) / 100,
    limitValue: Math.round(AsMin * 100) / 100,
    comparison: '>=',
    passed: As >= AsMin,
    unit: 'mm²',
    evidence: AsMinEvidence,
  });

  // 验算3：GB 55001 §3.1.10：Mu ≥ γ₀M
  const safetyEvidence: Evidence[] = [
    { codeName: '工程结构通用规范', codeNumber: 'GB 55001', edition: '2021',
      chapter: '第3章 结构设计', clause: '3.1.10',
      originalText: '承载能力极限状态设计时，作用组合的效应设计值与结构重要性系数的乘积不应超过结构或构件的抗力设计值。',
      pdfPage: 13, status: 'current', verificationStatus: 'REVIEW_REQUIRED', sourceFile: 'GB55001-2021.pdf' },
    { codeName: '工程结构通用规范', codeNumber: 'GB 55001', edition: '2021',
      chapter: '第3章 结构设计', clause: '3.1.12',
      originalText: '表 3.1.12：持久和短暂设计状况下安全等级一、二、三级的 γ₀ 分别为 1.1、1.0、0.9；偶然和地震设计状况为 1.0。',
      pdfPage: 13, status: 'current', verificationStatus: 'REVIEW_REQUIRED', sourceFile: 'GB55001-2021.pdf' },
  ];
  const seismicEvidence: Evidence[] = designSituation === 'seismic' ? [{
    codeName: '建筑与市政工程抗震通用规范', codeNumber: 'GB 55002', edition: '2021',
    chapter: '第4章 地震作用和结构抗震验算', clause: '4.3.1',
    originalText: '地震组合内力设计值 S 不应超过承载力设计值 R 除以承载力抗震调整系数 γRE；表 4.3.1 中混凝土梁受弯为 0.75，竖向地震为主的地震组合内力起控制作用时为 1.0。',
    pdfPage: 18, status: 'current', verificationStatus: 'REVIEW_REQUIRED', sourceFile: 'GB55002-2021.pdf',
  }] : [];
  const actionEvidence: Evidence[] = [
    { codeName: '工程结构通用规范', codeNumber: 'GB 55001', edition: '2021',
      chapter: '第3章 结构设计', clause: '3.1.7',
      originalText: '承载能力极限状态设计时的作用组合应按设计状况选取，并考虑可能同时出现的作用。',
      pdfPage: 12, status: 'current', verificationStatus: 'REVIEW_REQUIRED', sourceFile: 'GB55001-2021.pdf' },
    { codeName: '建筑结构荷载规范', codeNumber: 'GB 50009', edition: '2012',
      chapter: '第3章 荷载分类和荷载组合', clause: '3.2.2',
      originalText: '承载能力极限状态按荷载基本组合或偶然组合计算效应设计值，并采用 γ₀Sd ≤ Rd。',
      pdfPage: 20, status: 'current', verificationStatus: 'REVIEW_REQUIRED', sourceFile: 'GB50009-2012.pdf' },
    { codeName: '建筑结构荷载规范', codeNumber: 'GB 50009', edition: '2012',
      chapter: '第3章 荷载分类和荷载组合', clause: '3.2.3',
      originalText: '荷载基本组合效应设计值应取各组合中最不利的效应设计值。',
      pdfPage: 20, status: 'current', verificationStatus: 'REVIEW_REQUIRED', sourceFile: 'GB50009-2012.pdf' },
  ];
  allEvidence.push(...actionEvidence);
  allEvidence.push(...safetyEvidence);
  allEvidence.push(...seismicEvidence);
  checks.push({
    name: '承载力验算',
    calculatedValue: Math.round(Mu / gammaRE * 100) / 100,
    limitValue: gamma0 * input.moment,
    comparison: '>=',
    passed: Mu / gammaRE >= gamma0 * input.moment,
    unit: 'kN·m',
    evidence: [...MuEvidence, ...currentFlexureEvidence, ...safetyEvidence, ...seismicEvidence],
  });

  result.checks = checks;

  // === 结论 ===
  const allPassed = checks.every(c => c.passed);
  result.conclusion = {
    passed: allPassed,
    summary: allPassed
      ? '所列正截面受弯验算数值满足；构造、其他验算及现行规范融合待复核'
      : '存在不满足的验算项，请调整参数（计算公式已根据 GB 50010-2010(2015年版) 原文校核）',
    evidence: [],
  };

  // 现行规范融合尚未完成，不得仅凭摘要把历史公式升级为已核查。
  result.advisories.push({
    severity: 'warning',
    code: 'NORM_UPDATE_REQUIRED',
    message: '已接入现行材料表、最小配筋、重要性系数及地震承载力调整的对应条文；受弯公式和其余适用条件的现行版核验、项目荷载与图纸来源及独立项目算例尚未闭环，结果保持 REVIEW_REQUIRED。',
  });
  result.advisories.push({
    severity: 'warning', code: 'FLEXURE_ONLY_SCOPE',
    message: '本模块仅计算矩形梁正截面受弯；受剪、裂缝、挠度和其他抗震构造需另行验算。',
  });

  // IG-002：GB 55008-2021 §4.4.2 已人工核对（HUMAN_VERIFIED 2026-10-01），
  // 正截面承载力基本假定与 GB 50010-2010 6.2.1/6.2.6/6.2.7/6.2.10 一致。
  // 本咨询仅作 Evidence 链补充，不改变 α1/β1/ξb 数值。

  result.allEvidence = allEvidence;
  attachCurrentMaterialSelectionEvidence(result);
  result.overallStatus = 'REVIEW_REQUIRED';

  return result;
}
