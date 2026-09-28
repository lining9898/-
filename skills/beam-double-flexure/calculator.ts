import { createEmptyResult, CalculationResult } from '../../src/types/calculation';
import { calculateBeamDoubleFlexure, BeamDoubleFlexureInput } from '../../src/core/beam/double-flexure';

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function isBeamDoubleFlexureInput(input: unknown): input is BeamDoubleFlexureInput {
  if (!input || typeof input !== 'object') return false;
  const value = input as Record<string, unknown>;
  const numericFields = [
    'b', 'h', 'cover', 'barDiameter', 'barCount',
    'coverToCompressionCentroid', 'compressionBarDiameter', 'compressionBarCount', 'moment',
  ];
  return numericFields.every(field => isFiniteNumber(value[field]))
    && Number.isInteger(value.barCount)
    && Number.isInteger(value.compressionBarCount)
    && typeof value.concreteGrade === 'string'
    && typeof value.steelGrade === 'string'
    && typeof value.compressionSteelGrade === 'string';
}

export function invokeBeamDoubleFlexure(input: unknown): CalculationResult {
  if (!isBeamDoubleFlexureInput(input)) {
    const result = createEmptyResult('beam-double-flexure');
    result.advisories.push({
      severity: 'error',
      code: 'SKILL_INPUT_INVALID',
      message: 'Agent 输入不符合 beam-double-flexure/schema.json；请检查单位、必填字段和受拉/受压钢筋根数。',
    });
    return result;
  }
  return calculateBeamDoubleFlexure(input);
}
