import { createEmptyResult, CalculationResult } from '../../src/types/calculation';
import { calculateTwoWaySlab, TwoWaySlabInput } from '../../src/core/slab/two-way';

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function isTwoWaySlabInput(input: unknown): input is TwoWaySlabInput {
  if (!input || typeof input !== 'object') return false;
  const value = input as Record<string, unknown>;
  const numericFields = ['h', 'spanX', 'spanY', 'cover', 'barDiameter', 'barSpacing', 'gkExtra', 'qk', 'gammaG', 'gammaQ'];
  if (!numericFields.every(field => isFiniteNumber(value[field]))) return false;
  if (value.width !== undefined && !isFiniteNumber(value.width)) return false;
  return typeof value.concreteGrade === 'string' && typeof value.steelGrade === 'string';
}

export function invokeTwoWaySlab(input: unknown): CalculationResult {
  if (!isTwoWaySlabInput(input)) {
    const result = createEmptyResult('slab-two-way');
    result.advisories.push({
      severity: 'error',
      code: 'SKILL_INPUT_INVALID',
      message: 'Agent 输入不符合 slab-two-way/schema.json；请检查单位、必填字段和数据类型。',
    });
    return result;
  }
  return calculateTwoWaySlab(input);
}
