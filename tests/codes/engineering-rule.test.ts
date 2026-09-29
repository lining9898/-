import { describe, it, expect } from 'vitest';
import {
  compareRuleToSnapshot,
  type EngineeringRule, type RuleBinding, type EngineRuleSnapshot
} from '../../src/codes/engineeringRule';
import { INITIAL_CLAUSES } from '../../src/codes/initialData';

describe('BATCH 2.5: Engineering Rule → Engine 映射', () => {
  // 矩形梁正截面试点数据
  const flexureRule: EngineeringRule = {
    id: 'rule-6.2.10-flexure',
    name: '矩形截面受弯承载力',
    ruleType: 'FORMULA',
    designTopic: 'FLEXURE',
    sourceEvidenceIds: ['GB50010-6.2.10'],
    description: 'M ≤ α₁f_c·b·x·(h₀ - x/2) + f_y\'·A_s\'·(h₀ - a_s\')',
    applicability: { sectionType: 'RECTANGLE', memberType: 'BEAM', codeEdition: 'GB50010-2010-2015' },
    variables: [
      { symbol: 'M', semanticName: '弯矩设计值', unit: 'kN·m', required: true },
      { symbol: 'fc', semanticName: '混凝土抗压强度设计值', unit: 'N/mm²', required: true },
      { symbol: 'b', semanticName: '截面宽度', unit: 'mm', required: true },
      { symbol: 'x', semanticName: '受压区高度', unit: 'mm', required: true },
      { symbol: 'h0', semanticName: '有效高度', unit: 'mm', required: true },
    ],
    expression: {
      humanReadable: 'M ≤ α1·fc·b·x·(h0 - x/2)',
    },
    verificationStatus: 'VERIFIED',
    createdBy: 'human',
    createdAt: '2026-09-29',
    ruleHash: 'hash123',
  };

  const binding: RuleBinding = {
    id: 'binding-flexure-1',
    ruleId: 'rule-6.2.10-flexure',
    moduleId: 'beam-flexure',
    calculationStepId: 'flexure-capacity',
    codeReference: { file: 'src/skills/beam-flexure/calculator.ts', symbol: 'calculateFlexure', function: 'calculateFlexure' },
    implementationType: 'FORMULA',
    bindingStatus: 'VERIFIED',
  };

  it('VERIFIED Evidence 存在', () => {
    const verified = INITIAL_CLAUSES.filter(c => c.verificationStatus === 'VERIFIED');
    expect(verified.length).toBe(4);
  });

  it('规则绑定到真实 Evidence', () => {
    expect(flexureRule.sourceEvidenceIds).toContain('GB50010-6.2.10');
  });

  it('公式匹配时返回 FORMULA_MATCH', () => {
    const snapshot: EngineRuleSnapshot = {
      moduleId: 'beam-flexure',
      calculationStepId: 'flexure-capacity',
      formula: 'M ≤ α1·fc·b·x·(h0 - x/2)',
      constants: {},
      limits: {},
      units: {},
      sourceCodeReference: 'src/skills/beam-flexure/calculator.ts',
      engineVersion: '1.0',
      snapshotHash: 'snap1',
    };
    const diffs = compareRuleToSnapshot(flexureRule, binding, snapshot);
    expect(diffs.some(d => d.differenceType === 'FORMULA_MATCH')).toBe(true);
  });

  it('公式不匹配时返回 FORMULA_MISMATCH', () => {
    const snapshot: EngineRuleSnapshot = {
      moduleId: 'beam-flexure',
      calculationStepId: 'flexure-capacity',
      formula: 'M ≤ fc·b·x·(h0 - x/2)', // 少了 α1
      constants: {},
      limits: {},
      units: {},
      sourceCodeReference: 'src/skills/beam-flexure/calculator.ts',
      engineVersion: '1.0',
      snapshotHash: 'snap2',
    };
    const diffs = compareRuleToSnapshot(flexureRule, binding, snapshot);
    expect(diffs.some(d => d.differenceType === 'FORMULA_MISMATCH')).toBe(true);
  });

  it('常数不匹配检测', () => {
    const ruleWithLimit: EngineeringRule = {
      ...flexureRule,
      id: 'rule-xi-b',
      name: '相对界限受压区高度',
      ruleType: 'LIMIT',
      expression: { humanReadable: 'x ≤ ξb·h0' },
      limitValues: { xi_b_HRB400: 0.518 },
    };
    const snapshot: EngineRuleSnapshot = {
      moduleId: 'beam-flexure',
      calculationStepId: 'check-xi',
      formula: 'x <= xi_b*h0',
      constants: { xi_b_HRB400: 0.55 }, // 故意错
      limits: {},
      units: {},
      sourceCodeReference: 'calculator.ts',
      engineVersion: '1.0',
      snapshotHash: 'snap3',
    };
    const diffs = compareRuleToSnapshot(ruleWithLimit, binding, snapshot);
    expect(diffs.some(d => d.differenceType === 'CONSTANT_MISMATCH')).toBe(true);
  });

  it('缺失实现检测', () => {
    const ruleWithLimit: EngineeringRule = {
      ...flexureRule,
      id: 'rule-missing',
      limitValues: { some_const: 100 },
    };
    const snapshot: EngineRuleSnapshot = {
      moduleId: 'beam-flexure',
      calculationStepId: 'flexure',
      formula: 'M <= fc*b*x',
      constants: {}, // 没有 some_const
      limits: {},
      units: {},
      sourceCodeReference: 'calc.ts',
      engineVersion: '1.0',
      snapshotHash: 'snap4',
    };
    const diffs = compareRuleToSnapshot(ruleWithLimit, binding, snapshot);
    expect(diffs.some(d => d.differenceType === 'MISSING_IMPLEMENTATION')).toBe(true);
  });
});
