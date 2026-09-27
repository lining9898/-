import { createEmptyResult, CalculationResult } from '../../src/types/calculation';
import { calculateBeamFlexure, BeamFlexureInput } from '../../src/core/beam/flexure';

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function isBeamFlexureInput(input: unknown): input is BeamFlexureInput {
  if (!input || typeof input !== 'object') return false;
  const value = input as Record<string, unknown>;
  const numericFields = ['b', 'h', 'cover', 'barDiameter', 'barCount', 'moment'];
  return numericFields.every(field => isFiniteNumber(value[field]))
    && Number.isInteger(value.barCount)
    && typeof value.concreteGrade === 'string'
    && typeof value.steelGrade === 'string';
}

export function invokeBeamFlexure(input: unknown): CalculationResult {
  if (!isBeamFlexureInput(input)) {
    const result = createEmptyResult('beam-flexure');
    result.advisories.push({
      severity: 'error',
      code: 'SKILL_INPUT_INVALID',
      message: 'Agent 输入不符合 beam-flexure/schema.json；请检查单位、必填字段和钢筋根数。',
    });
    return result;
  }
  return calculateBeamFlexure(input);
}
