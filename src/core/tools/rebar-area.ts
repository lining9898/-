export interface RebarAreaInput {
  diameter: number;
  count: number;
  spacing: number;
}

export interface RebarAreaResult {
  singleArea: number;
  totalArea: number;
  areaPerMetre: number;
}

export function calculateRebarArea(input: RebarAreaInput): RebarAreaResult {
  const { diameter, count, spacing } = input;
  if (![diameter, count, spacing].every(Number.isFinite) || diameter <= 0 ||
    count <= 0 || !Number.isInteger(count) || spacing <= 0) {
    throw new Error('直径和间距须为正数，根数须为正整数');
  }
  const singleArea = Math.PI * diameter ** 2 / 4;
  return {
    singleArea,
    totalArea: singleArea * count,
    areaPerMetre: singleArea * 1000 / spacing,
  };
}
