import { createEmptyResult, CalculationResult } from '../../src/types/calculation';
import { calculateBeamTFlexure, BeamTFlexureInput } from '../../src/core/beam/t-flexure';

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function isBeamTFlexureInput(input: unknown): input is BeamTFlexureInput {
  if (!input || typeof input !== 'object') return false;
  const value = input as Record<string, unknown>;
  const numericFields = ['b', 'h', 'hf', 'bf', 'cover', 'barDiameter', 'barCount', 'moment'];
  return numericFields.every(field => isFiniteNumber(value[field]))
    && Number.isInteger(value.barCount)
    && typeof value.concreteGrade === 'string'
    && typeof value.steelGrade === 'string';
}

export function invokeBeamTFlexure(input: unknown): CalculationResult {
  if (!isBeamTFlexureInput(input)) {
    const result = createEmptyResult('beam-t-flexure');
    result.advisories.push({
      severity: 'error',
      code: 'SKILL_INPUT_INVALID',
      message: 'Agent 输入不符合 beam-t-flexure/schema.json；请检查单位、必填字段（b/h/hf/bf）和钢筋根数。',
    });
    return result;
  }
  return calculateBeamTFlexure(input);
}
