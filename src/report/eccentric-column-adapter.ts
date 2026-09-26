import { EccentricColumnInput, EccentricColumnResult } from '../core/column/eccentric';
import { CalculationResult, createEmptyResult } from '../types/calculation';
import { Evidence } from '../types/evidence';

const number = (value: number) => Number(value.toFixed(4));

const evidence = (clause: string, pdfPage: number, printedPage: number, summary: string): Evidence => ({
  codeName: '混凝土结构设计规范',
  codeNumber: 'GB 50010',
  edition: '2010（2015年版）',
  chapter: '第 6 章',
  clause,
  originalText: summary,
  pdfPage,
  status: 'superseded',
  verificationStatus: 'REVIEW_REQUIRED',
  sourceFile: `GB50010-2010_2015_.pdf（原书第 ${printedPage} 页）`,
});

export function eccentricColumnReport(input: EccentricColumnInput, result: EccentricColumnResult): CalculationResult {
  const sectionAssumption = evidence('6.2.1', 49, 34, '按平截面等基本假定进行正截面承载力计算。');
  const geometry = evidence('6.2.2', 51, 36, '本计算器仅适用于弯矩作用平面内截面对称、单轴作用的情况。');
  const additionalEccentricity = evidence('6.2.5', 52, 37, '偏心受压构件正截面计算应计入附加偏心距；取 20mm 与偏心方向截面最大尺寸的 1/30 中较大值。');
  const stressBlock = evidence('6.2.6', 52, 37, '受弯构件、偏心受力构件正截面承载力计算时，受压区混凝土应采用等效矩形应力图。');
  const secondOrder = evidence('6.2.3、6.2.4', 51, 36, '偏心受压构件应按条文条件判断是否考虑挠曲杆件附加弯矩。');
  const report = createEmptyResult('偏心受压柱');
  report.inputs = [
    { label: '截面宽度 b', value: input.width, unit: 'mm' },
    { label: '截面高度 h', value: input.depth, unit: 'mm' },
    { label: '钢筋合力点距边 a = a′', value: input.coverToSteelCentroid, unit: 'mm' },
    { label: '每侧纵筋面积 As = A′s', value: input.reinforcementAreaEachFace, unit: 'mm²' },
    { label: '轴向压力设计值 N', value: input.axialForce, unit: 'kN' },
    { label: '一阶弯矩设计值 M0', value: input.firstOrderMoment, unit: 'kN·m' },
  ];
  report.materials = [
    { label: '混凝土轴心抗压强度设计值 fc', value: result.fc, unit: 'N/mm²', evidence: [stressBlock] },
    { label: '钢筋强度设计值 fy', value: result.fy, unit: 'N/mm²', evidence: [sectionAssumption] },
    { label: '等效矩形应力图系数 α1', value: result.alpha1, unit: '', evidence: [stressBlock] },
    { label: '等效矩形应力图系数 β1', value: result.beta1, unit: '', evidence: [stressBlock] },
  ];
  report.geometry = [
    { label: '有效高度 h0', value: result.effectiveDepth, unit: 'mm' },
    { label: '中性轴深度 x', value: number(result.neutralAxisDepth), unit: 'mm' },
  ];
  report.steps = [
    {
      name: '附加偏心距',
      description: '本页的 M0 不含附加偏心影响，按偏心方向截面最大尺寸 h 计算。',
      formula: 'ea = max(20, h / 30)',
      substitutedFormula: `max(20, ${input.depth} / 30)`,
      result: number(result.additionalEccentricity), unit: 'mm', evidence: [additionalEccentricity],
    },
    {
      name: '控制截面弯矩',
      description: '仅叠加附加偏心距；未包含二阶效应附加弯矩。',
      formula: 'M = M0 + N · ea',
      substitutedFormula: `${input.firstOrderMoment} + ${input.axialForce} × ${number(result.additionalEccentricity)} / 1000`,
      result: number(result.designMoment), unit: 'kN·m', evidence: [additionalEccentricity],
    },
    {
      name: '轴力平衡求中性轴',
      description: '按等效矩形混凝土受压区与双层纵筋应力平衡，以二分法求解 x。',
      formula: 'N = α1fc·b·x + σ′s·A′s + σs·As',
      result: number(result.neutralAxisDepth), unit: 'mm', evidence: [sectionAssumption, geometry, stressBlock],
    },
    {
      name: '截面抗弯承载力',
      description: '对截面形心取矩，钢筋应力按应变协调并限制在设计强度范围内。',
      formula: 'Mu = |ΣFi · (h/2 − yi)|',
      result: number(result.momentCapacity), unit: 'kN·m', evidence: [sectionAssumption, stressBlock],
    },
  ];
  report.results = [
    { label: '附加偏心距 ea', value: number(result.additionalEccentricity), unit: 'mm' },
    { label: '控制弯矩 M', value: number(result.designMoment), unit: 'kN·m' },
    { label: '中性轴深度 x', value: number(result.neutralAxisDepth), unit: 'mm' },
    { label: '受压侧钢筋应力 σ′s', value: number(result.topSteelStress), unit: 'N/mm²' },
    { label: '受拉侧钢筋应力 σs', value: number(result.bottomSteelStress), unit: 'N/mm²' },
    { label: '同轴力下截面抗弯承载力 Mu', value: number(result.momentCapacity), unit: 'kN·m' },
  ];
  report.checks = [
    { name: '轴力平衡残差', calculatedValue: Math.abs(number(result.forceResidual)), limitValue: 0.001,
      comparison: '<=', passed: Math.abs(result.forceResidual) <= 0.001, unit: 'kN', evidence: [sectionAssumption, stressBlock] },
    { name: '正截面单轴偏心受压承载力', calculatedValue: number(result.designMoment), limitValue: number(result.momentCapacity),
      comparison: '<=', passed: result.passed, unit: 'kN·m', evidence: [sectionAssumption, geometry, additionalEccentricity, stressBlock] },
  ];
  report.conclusion = {
    passed: result.passed,
    summary: result.passed
      ? '所给轴力下的单轴正截面承载力验算满足；仍须完成二阶效应和构造等复核。'
      : '所给轴力下控制弯矩超过本简化截面模型的抗弯承载力。',
    evidence: [sectionAssumption, geometry, additionalEccentricity, stressBlock, secondOrder],
  };
  report.advisories = [{
    severity: 'warning', code: 'SECOND_ORDER_NOT_CHECKED',
    message: '未验算 6.2.3、6.2.4 的二阶效应条件及挠曲附加弯矩；也未验算双向偏心、最小配筋、箍筋构造、抗震与现行通用规范要求。',
  }];
  report.allEvidence = [sectionAssumption, geometry, additionalEccentricity, stressBlock, secondOrder];
  return report;
}
