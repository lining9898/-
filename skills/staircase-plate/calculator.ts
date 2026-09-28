import { createEmptyResult, CalculationResult } from '../../src/types/calculation';
import { calculatePlateStair, PlateStairInput } from '../../src/core/stair/plate';

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function isPlateStairInput(input: unknown): input is PlateStairInput {
  if (!input || typeof input !== 'object') return false;
  const value = input as Record<string, unknown>;
  const numericFields = ['span', 'stepRise', 'stepRun', 't', 'cover', 'barDiameter', 'barSpacing', 'gkExtra', 'qk', 'gammaG', 'gammaQ'];
  if (!numericFields.every(field => isFiniteNumber(value[field]))) return false;
  if (value.width !== undefined && !isFiniteNumber(value.width)) return false;
  return typeof value.concreteGrade === 'string' && typeof value.steelGrade === 'string';
}

export function invokePlateStair(input: unknown): CalculationResult {
  if (!isPlateStairInput(input)) {
    const result = createEmptyResult('staircase-plate');
    result.advisories.push({
      severity: 'error',
      code: 'SKILL_INPUT_INVALID',
      message: 'Agent 输入不符合 staircase-plate/schema.json；请检查单位、必填字段和数据类型。',
    });
    return result;
  }
  return calculatePlateStair(input);
}
