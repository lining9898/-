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

  return {
    area,
    inertia,
    sectionModulus,
    firstMoment,
    bendingStress,
    shearStress,
    stabilityStress,
    bendingPassed: bendingStress <= bendingStrength,
    shearPassed: shearStress <= shearStrength,
    stabilityPassed: stabilityStress <= bendingStrength,
  };
}
