export interface MaterialWeightPreset {
  id: string;
  name: string;
  min: number;
  max: number;
  pdfPage: number;
  printedPage: number;
}

// Values transcribed from GB 50009-2012 Appendix A, table A (local scanned copy).
export const materialWeightPresets: MaterialWeightPreset[] = [
  { id: 'plain-concrete', name: '素混凝土', min: 22, max: 24, pdfPage: 83, printedPage: 75 },
  { id: 'reinforced-concrete', name: '钢筋混凝土', min: 24, max: 25, pdfPage: 84, printedPage: 76 },
  { id: 'cement-mortar', name: '水泥砂浆', min: 20, max: 20, pdfPage: 83, printedPage: 75 },
  { id: 'ordinary-glass', name: '普通玻璃', min: 25.6, max: 25.6, pdfPage: 85, printedPage: 77 },
];

export interface MaterialWeightInput {
  unitWeight: number; // kN/m3
  volume: number; // m3
}

export function calculateMaterialWeight(input: MaterialWeightInput): number {
  if (!Number.isFinite(input.unitWeight) || input.unitWeight <= 0 ||
    !Number.isFinite(input.volume) || input.volume < 0) {
    throw new Error('材料重度须大于 0，体积须为非负有限数值');
  }
  const weight = input.unitWeight * input.volume;
  if (!Number.isFinite(weight)) throw new Error('计算结果超出数值范围');
  return weight;
}
