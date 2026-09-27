import { createEmptyResult, CalculationResult } from '../../src/types/calculation';
import { calculateAxialColumn, AxialColumnInput } from '../../src/core/column/axial';
import { calculateEccentricColumn, EccentricColumnInput } from '../../src/core/column/eccentric';
import { axialColumnReport } from '../../src/report/analysis-adapters';
import { eccentricColumnReport } from '../../src/report/eccentric-column-adapter';

export type ColumnSkillInput =
  | { mode: 'axial'; input: AxialColumnInput }
  | { mode: 'eccentric'; input: EccentricColumnInput };

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const axialInput = (input: unknown): input is AxialColumnInput => {
  if (!input || typeof input !== 'object') return false;
  const value = input as Record<string, unknown>;
  return ['width', 'depth', 'effectiveLength', 'reinforcementArea', 'axialForce', 'concreteStrength', 'steelCompressionStrength']
    .every(field => finite(value[field]));
};

const eccentricInput = (input: unknown): input is EccentricColumnInput => {
  if (!input || typeof input !== 'object') return false;
  const value = input as Record<string, unknown>;
  return ['width', 'depth', 'coverToSteelCentroid', 'reinforcementAreaEachFace', 'axialForce', 'firstOrderMoment']
    .every(field => finite(value[field]))
    && typeof value.concreteGrade === 'string'
    && typeof value.steelGrade === 'string';
};

export function isColumnSkillInput(input: unknown): input is ColumnSkillInput {
  if (!input || typeof input !== 'object') return false;
  const value = input as Record<string, unknown>;
  if (value.mode === 'axial') return axialInput(value.input);
  if (value.mode === 'eccentric') return eccentricInput(value.input);
  return false;
}

export function invokeColumn(input: unknown): CalculationResult {
  if (!isColumnSkillInput(input)) {
    const result = createEmptyResult('column');
    result.advisories.push({
      severity: 'error',
      code: 'SKILL_INPUT_INVALID',
      message: 'Agent 输入不符合 column/schema.json；请明确 mode=axial 或 mode=eccentric，并检查对应参数单位。',
    });
    return result;
  }

  try {
    if (input.mode === 'axial') {
      return axialColumnReport(input.input, calculateAxialColumn(input.input));
    }
    return eccentricColumnReport(input.input, calculateEccentricColumn(input.input));
  } catch (error) {
    const result = createEmptyResult('column');
    result.advisories.push({
      severity: 'error',
      code: 'CALCULATION_INPUT_INVALID',
      message: error instanceof Error ? error.message : '柱计算输入不在当前 Skill 适用范围内',
    });
    return result;
  }
}
