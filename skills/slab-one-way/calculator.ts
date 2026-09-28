import { createEmptyResult, CalculationResult } from '../../src/types/calculation';
import { calculateOneWaySlab, OneWaySlabInput } from '../../src/core/slab/one-way';

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function isOneWaySlabInput(input: unknown): input is OneWaySlabInput {
  if (!input || typeof input !== 'object') return false;
  const value = input as Record<string, unknown>;
  const numericFields = ['h', 'span', 'cover', 'barDiameter', 'barSpacing', 'gkExtra', 'qk', 'gammaG', 'gammaQ'];
  if (!numericFields.every(field => isFiniteNumber(value[field]))) return false;
  if (value.width !== undefined && !isFiniteNumber(value.width)) return false;
  return typeof value.concreteGrade === 'string' && typeof value.steelGrade === 'string';
}

export function invokeOneWaySlab(input: unknown): CalculationResult {
  if (!isOneWaySlabInput(input)) {
    const result = createEmptyResult('slab-one-way');
    result.advisories.push({
      severity: 'error',
      code: 'SKILL_INPUT_INVALID',
      message: 'Agent 输入不符合 slab-one-way/schema.json；请检查单位、必填字段和数据类型。',
    });
    return result;
  }
  return calculateOneWaySlab(input);
}
