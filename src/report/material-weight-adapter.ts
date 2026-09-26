import { MaterialWeightInput, MaterialWeightPreset } from '../core/tools/material-weight';
import { CalculationResult, createEmptyResult } from '../types/calculation';
import { Evidence } from '../types/evidence';

export function materialWeightReport(
  preset: MaterialWeightPreset, input: MaterialWeightInput, weight: number,
): CalculationResult {
  const evidence: Evidence = {
    codeName: '建筑结构荷载规范', codeNumber: 'GB 50009', edition: '2012',
    chapter: '附录 A', clause: '表 A',
    originalText: `${preset.name}：${preset.min.toFixed(1)}${preset.min === preset.max ? '' : `～${preset.max.toFixed(1)}`} kN/m³`,
    pdfPage: preset.pdfPage, status: 'current', verificationStatus: 'REVIEW_REQUIRED',
    sourceFile: '建筑结构荷载规范.pdf（本机核验）',
  };
  const report = createEmptyResult('材料重度与自重');
  report.inputs = [
    { label: '材料', value: preset.name, unit: '' },
    { label: '本次采用重度 γ', value: input.unitWeight, unit: 'kN/m³' },
    { label: '体积 V', value: input.volume, unit: 'm³' },
  ];
  report.materials = [{ label: '附录 A 参考重度', value: preset.min === preset.max
    ? preset.min : `${preset.min}～${preset.max}`, unit: 'kN/m³', evidence: [evidence] }];
  report.geometry = [{ label: '体积 V', value: input.volume, unit: 'm³' }];
  report.steps = [{ name: '体积自重', description: '按本次采用重度与输入体积相乘；未进行荷载分项系数或组合。',
    formula: 'Gk = γ · V', substitutedFormula: `${input.unitWeight} × ${input.volume}`,
    result: weight, unit: 'kN', evidence: [evidence] }];
  report.results = [{ label: '自重标准值 Gk', value: weight, unit: 'kN' }];
  const withinRange = input.unitWeight >= preset.min && input.unitWeight <= preset.max;
  report.conclusion = { passed: withinRange,
    summary: withinRange ? '采用重度处于所选材料的表列范围内；结果仅为体积自重。'
      : '采用重度不在所选材料的表列范围内，请核对材料及工程取值。', evidence: [evidence] };
  report.advisories = [{ severity: 'warning', code: 'NO_LOAD_COMBINATION',
    message: '仅计算自重标准值，未进行分项系数、荷载组合及现行通用规范差异复核。' }];
  report.allEvidence = [evidence];
  return report;
}
