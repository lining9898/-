import { createEmptyResult, CalculationResult } from '../../src/types/calculation';
import { calculateBeamShear, BeamShearInput } from '../../src/core/beam/shear';

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function isBeamShearInput(input: unknown): input is BeamShearInput {
  if (!input || typeof input !== 'object') return false;
  const value = input as Record<string, unknown>;
  const numericFields = ['b', 'h', 'h0', 'V', 'stirrupLegs', 'stirrupSpacing', 'stirrupDiameter'];
  if (numericFields.some(field => !isFiniteNumber(value[field]))) return false;
  if (typeof value.concreteGrade !== 'string' || typeof value.stirrupGrade !== 'string') return false;
  if (value.loadType !== 'uniform' && value.loadType !== 'concentrated') return false;
  return value.loadType === 'uniform' || isFiniteNumber(value.shearSpan);
}

export function invokeBeamShear(input: unknown): CalculationResult {
  if (!isBeamShearInput(input)) {
    const result = createEmptyResult('beam-shear');
    result.advisories.push({
      severity: 'error',
      code: 'SKILL_INPUT_INVALID',
      message: 'Agent 输入不符合 beam-shear/schema.json；请检查单位、必填字段和集中荷载的剪跨 a。',
    });
    return result;
  }
  return calculateBeamShear(input);
}
