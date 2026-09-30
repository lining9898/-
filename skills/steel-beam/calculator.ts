import { CalculationResult, createEmptyResult } from '../../src/types/calculation';
import { calculateSteelBeam, SteelBeamInput } from '../../src/core/steel/beam';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export function isSteelBeamInput(input: unknown): input is SteelBeamInput {
  if (!input || typeof input !== 'object') return false;
  const value = input as Record<string, unknown>;
  return [
    'h', 'bf', 'tf', 'tw', 'moment', 'shear',
    'bendingStrength', 'shearStrength', 'stabilityFactor',
  ].every(field => isFiniteNumber(value[field]));
}

export function invokeSteelBeam(input: unknown): CalculationResult {
  if (!isSteelBeamInput(input)) {
    const result = createEmptyResult('steel-beam');
    result.advisories.push({
      severity: 'error',
      code: 'SKILL_INPUT_INVALID',
      message: 'Agent 输入不符合 steel-beam/schema.json；请检查单位、必填字段和数据类型。',
    });
    return result;
  }
  try {
    return calculateSteelBeam(input).report;
  } catch (error) {
    const result = createEmptyResult('steel-beam');
    result.advisories.push({
      severity: 'error',
      code: 'INVALID_INPUT',
      message: error instanceof Error ? error.message : '钢梁输入无效',
    });
    return result;
  }
}
