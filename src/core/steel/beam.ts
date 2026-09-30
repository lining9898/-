import { CalculationResult, createEmptyResult } from '../../types/calculation';
import { Evidence } from '../../types/evidence';
import { resolveCurrentStandardFusion } from '../../normative/fusion';

export interface SteelBeamInput {
  h: number;
  bf: number;
  tf: number;
  tw: number;
  moment: number;
  shear: number;
  bendingStrength: number;
  shearStrength: number;
  stabilityFactor: number;
}

export interface SteelBeamResult {
  area: number;
  inertia: number;
  sectionModulus: number;
  firstMoment: number;
  bendingStress: number;
  shearStress: number;
  stabilityStress: number;
  bendingPassed: boolean;
  shearPassed: boolean;
  stabilityPassed: boolean;
  report: CalculationResult;
}

function steelEvidence(clause: string, text: string, pdfPage: number): Evidence {
  return {
    codeName: '钢结构设计标准',
    codeNumber: 'GB 50017',
    edition: '2017',
    chapter: '第6章 受弯构件',
    clause,
    originalText: text,
    pdfPage,
    status: 'current',
    verificationStatus: 'REVIEW_REQUIRED',
    sourceFile: 'GB 50017-2017 钢结构设计标准.pdf',
  };
}

export function calculateSteelBeam(input: SteelBeamInput): SteelBeamResult {
  const { h, bf, tf, tw, moment, shear, bendingStrength, shearStrength, stabilityFactor } = input;
  if ([h, bf, tf, tw, moment, shear, bendingStrength, shearStrength, stabilityFactor]
    .some(value => !Number.isFinite(value))) {
    throw new Error('所有输入必须是有限数值');
  }
  if (h <= 2 * tf || bf <= tw || tf <= 0 || tw <= 0 || moment < 0 || shear < 0 ||
    bendingStrength <= 0 || shearStrength <= 0 || stabilityFactor <= 0 || stabilityFactor > 1) {
    throw new Error('截面、作用和材料参数超出本计算器适用范围');
  }

  const webHeight = h - 2 * tf;
  const flangeOffset = (h - tf) / 2;
  const area = 2 * bf * tf + tw * webHeight;
  const inertia = tw * webHeight ** 3 / 12 +
    2 * (bf * tf ** 3 / 12 + bf * tf * flangeOffset ** 2);
  const sectionModulus = 2 * inertia / h;
  const firstMoment = bf * tf * flangeOffset + tw * webHeight ** 2 / 8;
  const bendingStress = moment * 1e6 / sectionModulus;
  const shearStress = shear * 1e3 * firstMoment / (inertia * tw);
  const stabilityStress = moment * 1e6 / (stabilityFactor * sectionModulus);
  const bendingPassed = bendingStress <= bendingStrength;
  const shearPassed = shearStress <= shearStrength;
  const stabilityPassed = stabilityStress <= bendingStrength;

  const bendingEvidence = steelEvidence('6.1.1', '受弯构件抗弯强度验算采用截面应力与钢材强度设计值比较。', 54);
  const shearEvidence = steelEvidence('6.1.3', '受弯构件抗剪强度验算采用剪应力与钢材抗剪强度设计值比较。', 55);
  const stabilityEvidence = steelEvidence('6.2.2', '等截面焊接工字形简支梁的整体稳定应按稳定系数进行验算。', 57);
  const standardFusion = resolveCurrentStandardFusion('STEEL');
  const fusedDesignations = standardFusion.standards
    .map(item => item.version?.designation ?? item.codeNumber)
    .join('、');
  const report = createEmptyResult('steel-beam');

  report.inputs = [
    { label: '截面高度 h', value: h, unit: 'mm' },
    { label: '翼缘宽度 bf', value: bf, unit: 'mm' },
    { label: '翼缘厚度 tf', value: tf, unit: 'mm' },
    { label: '腹板厚度 tw', value: tw, unit: 'mm' },
    { label: '弯矩设计值 M', value: moment, unit: 'kN·m' },
    { label: '剪力设计值 V', value: shear, unit: 'kN' },
  ];
  report.materials = [
    { label: '抗弯强度设计值 f（用户输入）', value: bendingStrength, unit: 'N/mm²' },
    { label: '抗剪强度设计值 fv（用户输入）', value: shearStrength, unit: 'N/mm²' },
    { label: '整体稳定系数 φb（用户输入）', value: stabilityFactor, unit: '' },
  ];
  report.geometry = [
    { label: '毛截面面积 A', value: area, unit: 'mm²' },
    { label: '惯性矩 I', value: inertia, unit: 'mm⁴' },
    { label: '截面模量 W', value: sectionModulus, unit: 'mm³' },
    { label: '半截面面积矩 S', value: firstMoment, unit: 'mm³' },
  ];
  report.steps = [
    {
      name: '受弯强度验算', description: '按弹性截面模量计算弯曲正应力，截面塑性发展系数取1.0。',
      formula: 'σ = M / W', substitutedFormula: `σ = ${moment} × 10⁶ / ${sectionModulus}`,
      result: bendingStress, unit: 'N/mm²', evidence: [bendingEvidence],
    },
    {
      name: '受剪强度验算', description: '计算腹板中和轴处最大剪应力。',
      formula: 'τ = V · S / (I · t_w)', substitutedFormula: `τ = ${shear} × 10³ × ${firstMoment} / (${inertia} × ${tw})`,
      result: shearStress, unit: 'N/mm²', evidence: [shearEvidence],
    },
    {
      name: '整体稳定验算', description: '采用用户提供的最终整体稳定系数。',
      formula: 'σ_b = M / (φ_b · W)', substitutedFormula: `σ_b = ${moment} × 10⁶ / (${stabilityFactor} × ${sectionModulus})`,
      result: stabilityStress, unit: 'N/mm²', evidence: [stabilityEvidence],
    },
  ];
  report.results = [
    { label: '受弯正应力 σ', value: bendingStress, unit: 'N/mm²', evidence: [bendingEvidence] },
    { label: '受剪应力 τ', value: shearStress, unit: 'N/mm²', evidence: [shearEvidence] },
    { label: '整体稳定应力 σb', value: stabilityStress, unit: 'N/mm²', evidence: [stabilityEvidence] },
  ];
  report.checks = [
    { name: '受弯强度', calculatedValue: bendingStress, limitValue: bendingStrength, comparison: '<=', passed: bendingPassed, unit: 'N/mm²', evidence: [bendingEvidence] },
    { name: '受剪强度', calculatedValue: shearStress, limitValue: shearStrength, comparison: '<=', passed: shearPassed, unit: 'N/mm²', evidence: [shearEvidence] },
    { name: '整体稳定', calculatedValue: stabilityStress, limitValue: bendingStrength, comparison: '<=', passed: stabilityPassed, unit: 'N/mm²', evidence: [stabilityEvidence] },
  ];
  const allPassed = bendingPassed && shearPassed && stabilityPassed;
  report.conclusion = {
    passed: allPassed,
    summary: allPassed
      ? '三项验算数值满足，但材料强度、稳定系数和未覆盖项目仍需人工复核，不能作为完整设计通过结论。'
      : '至少一项验算不满足；同时仍需复核材料强度、稳定系数和未覆盖项目。',
    evidence: [bendingEvidence, shearEvidence, stabilityEvidence],
  };
  report.advisories = [
    {
      severity: 'warning', code: 'USER_SUPPLIED_MATERIAL_STRENGTH',
      message: 'f、fv 为用户输入值，尚未按钢号、厚度和现行材料表自动确定。',
    },
    {
      severity: 'warning', code: 'USER_SUPPLIED_STABILITY_FACTOR',
      message: 'φb 为用户输入的最终值，尚未按附录C及侧向支承条件自动计算。',
    },
    {
      severity: 'warning', code: 'CURRENT_STANDARD_FUSION_PENDING',
      message: `${fusedDesignations} 尚未完成逐条融合映射，结果保持 REVIEW_REQUIRED。`,
    },
  ];
  report.allEvidence = [bendingEvidence, shearEvidence, stabilityEvidence];
  report.overallStatus = 'REVIEW_REQUIRED';

  return {
    area,
    inertia,
    sectionModulus,
    firstMoment,
    bendingStress,
    shearStress,
    stabilityStress,
    bendingPassed,
    shearPassed,
    stabilityPassed,
    report,
  };
}
