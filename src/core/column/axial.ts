export interface AxialColumnInput {
  width: number;
  depth: number;
  effectiveLength: number;
  reinforcementArea: number;
  axialForce: number;
  concreteStrength: number;
  steelCompressionStrength: number;
}

export interface AxialColumnResult {
  grossArea: number;
  reinforcementRatio: number;
  slendernessRatio: number;
  tableRatio: number;
  stabilityFactor: number;
  concreteArea: number;
  capacity: number;
  passed: boolean;
}

// GB 50010-2010 (2015), table 6.2.15, rectangular section l0/b (b is the shorter side).
const stabilityTable = [
  [8, 1], [10, 0.98], [12, 0.95], [14, 0.92], [16, 0.87],
  [18, 0.81], [20, 0.75], [22, 0.70], [24, 0.65], [26, 0.60],
  [28, 0.56], [30, 0.52], [32, 0.48], [34, 0.44], [36, 0.40],
  [38, 0.36], [40, 0.32], [42, 0.29], [44, 0.26], [46, 0.23],
  [48, 0.21], [50, 0.19],
] as const;

export function calculateAxialColumn(input: AxialColumnInput): AxialColumnResult {
  const values = Object.values(input);
  if (values.some(value => !Number.isFinite(value))) {
    throw new Error('所有输入必须是有限数值');
  }
  const { width, depth, effectiveLength, reinforcementArea, axialForce,
    concreteStrength, steelCompressionStrength } = input;
  const grossArea = width * depth;
  if (!Number.isFinite(grossArea) || width <= 0 || depth <= 0 || effectiveLength <= 0 || reinforcementArea <= 0 ||
    reinforcementArea >= grossArea || axialForce < 0 || concreteStrength <= 0 ||
    steelCompressionStrength <= 0) {
    throw new Error('截面、作用或材料参数超出本计算器适用范围');
  }

  const slendernessRatio = effectiveLength / Math.min(width, depth);
  const tableEntry = stabilityTable.find(([ratio]) => slendernessRatio <= ratio);
  if (!tableEntry) {
    throw new Error('计算长度与短边之比超过表 6.2.15 的范围（50）');
  }

  const [tableRatio, stabilityFactor] = tableEntry;
  const reinforcementRatio = reinforcementArea / grossArea;
  const concreteArea = reinforcementRatio > 0.03 ? grossArea - reinforcementArea : grossArea;
  const capacity = 0.9 * stabilityFactor *
    (concreteStrength * concreteArea + steelCompressionStrength * reinforcementArea) / 1000;
  if (!Number.isFinite(capacity)) {
    throw new Error('计算结果超出数值范围');
  }

  return {
    grossArea, reinforcementRatio, slendernessRatio, tableRatio, stabilityFactor,
    concreteArea, capacity, passed: axialForce <= capacity,
  };
}
