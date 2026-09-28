import { createEmptyResult, CalculationResult } from '../../src/types/calculation';
import { calculateIndependentFoundation, IndependentFoundationInput } from '../../src/core/foundation/independent';

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function isIndependentFoundationInput(input: unknown): input is IndependentFoundationInput {
  if (!input || typeof input !== 'object') return false;
  const value = input as Record<string, unknown>;
  const numericFields = ['L', 'B', 'h', 'bc', 'hc', 'd', 'gammaM', 'fa', 'Nk', 'N', 'cover', 'barDiameter', 'barSpacing'];
  return numericFields.every(field => isFiniteNumber(value[field]))
    && typeof value.concreteGrade === 'string'
    && typeof value.steelGrade === 'string';
}

export function invokeIndependentFoundation(input: unknown): CalculationResult {
  if (!isIndependentFoundationInput(input)) {
    const result = createEmptyResult('foundation-independent');
    result.advisories.push({
      severity: 'error',
      code: 'SKILL_INPUT_INVALID',
      message: 'Agent 输入不符合 foundation-independent/schema.json；请检查单位、必填字段和数据类型。',
    });
    return result;
  }
  return calculateIndependentFoundation(input);
}
