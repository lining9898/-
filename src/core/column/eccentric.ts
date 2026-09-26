export interface EccentricColumnInput {
  width: number;
  depth: number;
  coverToSteelCentroid: number;
  reinforcementAreaEachFace: number;
  axialForce: number;
  firstOrderMoment: number;
  concreteGrade: 'C20' | 'C25' | 'C30' | 'C35' | 'C40' | 'C45' | 'C50';
  steelGrade: 'HPB300' | 'HRB400' | 'HRB500';
}

export interface EccentricColumnResult {
  fc: number;
  fy: number;
  alpha1: number;
  beta1: number;
  effectiveDepth: number;
  additionalEccentricity: number;
  additionalMoment: number;
  designMoment: number;
  neutralAxisDepth: number;
  topSteelStress: number;
  bottomSteelStress: number;
  axialCapacityAtLimit: number;
  momentCapacity: number;
  forceResidual: number;
  passed: boolean;
}

const concrete: Record<EccentricColumnInput['concreteGrade'], { fc: number; alpha1: number; beta1: number }> = {
  C20: { fc: 9.6, alpha1: 1, beta1: 0.8 },
  C25: { fc: 11.9, alpha1: 1, beta1: 0.8 },
  C30: { fc: 14.3, alpha1: 1, beta1: 0.8 },
  C35: { fc: 16.7, alpha1: 1, beta1: 0.8 },
  C40: { fc: 19.1, alpha1: 1, beta1: 0.8 },
  C45: { fc: 21.1, alpha1: 1, beta1: 0.8 },
  C50: { fc: 23.1, alpha1: 1, beta1: 0.8 },
};

const steel: Record<EccentricColumnInput['steelGrade'], number> = {
  HPB300: 270,
  HRB400: 360,
  HRB500: 435,
};

const ES = 200000;
const EPSILON_CU = 0.0033;

function clampSteelStress(stress: number, fy: number): number {
  return Math.max(-fy, Math.min(fy, stress));
}

export function calculateEccentricColumn(input: EccentricColumnInput): EccentricColumnResult {
  const values = [input.width, input.depth, input.coverToSteelCentroid,
    input.reinforcementAreaEachFace, input.axialForce, input.firstOrderMoment];
  if (values.some(value => !Number.isFinite(value)) || input.width <= 0 || input.depth <= 0 ||
    input.coverToSteelCentroid <= 0 || input.coverToSteelCentroid * 2 >= input.depth ||
    input.reinforcementAreaEachFace <= 0 || input.axialForce <= 0 || input.firstOrderMoment < 0) {
    throw new Error('请输入适用于单轴偏心受压截面验算的有限正值；钢筋合力点须位于截面内');
  }
  const material = concrete[input.concreteGrade];
  const fy = steel[input.steelGrade];
  if (!material || !fy) throw new Error('不支持的材料等级');

  const { width, depth, coverToSteelCentroid: cover, reinforcementAreaEachFace: As,
    axialForce, firstOrderMoment } = input;
  const requiredAxial = axialForce * 1000;
  const effectiveDepth = depth - cover;
  const additionalEccentricity = Math.max(20, depth / 30);
  const additionalMoment = axialForce * additionalEccentricity / 1000;
  const designMoment = firstOrderMoment + additionalMoment;

  const steelStressAt = (x: number, distanceFromCompressionFace: number) =>
    clampSteelStress(ES * EPSILON_CU * (1 - material.beta1 * distanceFromCompressionFace / x), fy);
  const axialResistanceAt = (x: number) =>
    material.alpha1 * material.fc * width * x
    + steelStressAt(x, cover) * As
    + steelStressAt(x, effectiveDepth) * As;

  const axialCapacityAtLimit = axialResistanceAt(depth) / 1000;
  if (axialResistanceAt(depth) < requiredAxial) {
    throw new Error('轴向压力超过本简化截面模型在 x = h 时的承载范围');
  }

  let lower = 0.001;
  let upper = depth;
  for (let index = 0; index < 80; index += 1) {
    const middle = (lower + upper) / 2;
    if (axialResistanceAt(middle) < requiredAxial) lower = middle;
    else upper = middle;
  }
  const neutralAxisDepth = (lower + upper) / 2;
  const concreteForce = material.alpha1 * material.fc * width * neutralAxisDepth;
  const topSteelStress = steelStressAt(neutralAxisDepth, cover);
  const bottomSteelStress = steelStressAt(neutralAxisDepth, effectiveDepth);
  const topSteelForce = topSteelStress * As;
  const bottomSteelForce = bottomSteelStress * As;
  const momentAboutSectionCentroid = concreteForce * (depth / 2 - neutralAxisDepth / 2)
    + topSteelForce * (depth / 2 - cover)
    + bottomSteelForce * (depth / 2 - effectiveDepth);
  const momentCapacity = Math.abs(momentAboutSectionCentroid) / 1_000_000;
  const forceResidual = (concreteForce + topSteelForce + bottomSteelForce - requiredAxial) / 1000;

  return {
    fc: material.fc,
    fy,
    alpha1: material.alpha1,
    beta1: material.beta1,
    effectiveDepth,
    additionalEccentricity,
    additionalMoment,
    designMoment,
    neutralAxisDepth,
    topSteelStress,
    bottomSteelStress,
    axialCapacityAtLimit,
    momentCapacity,
    forceResidual,
    passed: designMoment <= momentCapacity,
  };
}
