import { describe, it, expect } from 'vitest';
import { CalculationResult, createEmptyResult, CalculationStep, CheckItem } from '../../src/types/calculation';

describe('CalculationResult 数据结构', () => {
  it('createEmptyResult 应返回正确的基本结构', () => {
    const result = createEmptyResult('test-calculator');
    expect(result.calculatorType).toBe('test-calculator');
    expect(result.overallStatus).toBe('REVIEW_REQUIRED');
    expect(result.inputs).toEqual([]);
    expect(result.steps).toEqual([]);
    expect(result.checks).toEqual([]);
    expect(result.conclusion.passed).toBe(false);
  });

  it('CalculationStep 应包含必需字段', () => {
    const step: CalculationStep = {
      name: '测试步骤',
      description: '描述',
      formula: 'a = b + c',
      result: 42,
      unit: 'mm',
      evidence: [],
    };
    expect(step.name).toBeTruthy();
    expect(step.formula).toBeTruthy();
    expect(typeof step.result).toBe('number');
  });

  it('CheckItem 应包含必需字段', () => {
    const check: CheckItem = {
      name: '验算',
      calculatedValue: 100,
      limitValue: 120,
      comparison: '<=',
      passed: true,
      unit: 'kN',
      evidence: [],
    };
    expect(check.passed).toBe(true);
    expect(check.comparison).toBe('<=');
  });
});
