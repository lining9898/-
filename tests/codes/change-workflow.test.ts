import { describe, it, expect } from 'vitest';
import {
  canCreateChangeTask, checkScope, canMerge, classifyComparison,
  type GateContext
} from '../../src/codes/changeWorkflow';

describe('BATCH 2.6: 人工批准后规范变更驱动', () => {
  const base: GateContext = {
    ruleVerified: true, evidenceVerified: true,
    proposalApprovedForImpl: true,
    filesModified: ['src/skills/beam-flexure/calculator.ts'],
    allowedFiles: ['src/skills/beam-flexure/calculator.ts'],
    targetedTestsPass: true, regressionTestsPass: true, buildPass: true,
    proposalApprovedForMerge: true,
  };

  it('Evidence 未 VERIFIED → BLOCK', () => {
    const r = canCreateChangeTask({ ...base, evidenceVerified: false });
    expect(r.allowed).toBe(false);
  });

  it('Rule 未 VERIFIED → BLOCK', () => {
    const r = canCreateChangeTask({ ...base, ruleVerified: false });
    expect(r.allowed).toBe(false);
  });

  it('未第一次人工批准 → BLOCK', () => {
    const r = canCreateChangeTask({ ...base, proposalApprovedForImpl: false });
    expect(r.allowed).toBe(false);
  });

  it('范围外修改 → BLOCK', () => {
    const r = checkScope({ ...base, filesModified: ['src/core/engine.ts'] });
    expect(r.allowed).toBe(false);
  });

  it('范围内修改 → 允许', () => {
    const r = checkScope(base);
    expect(r.allowed).toBe(true);
  });

  it('未第二次人工批准 → 不可 Merge', () => {
    const r = canMerge({ ...base, proposalApprovedForMerge: false });
    expect(r.allowed).toBe(false);
  });

  it('Regression 失败 → 不可 Merge', () => {
    const r = canMerge({ ...base, regressionTestsPass: false });
    expect(r.allowed).toBe(false);
  });

  it('全部满足 → 可 Merge', () => {
    const r = canMerge(base);
    expect(r.allowed).toBe(true);
  });

  it('Before/After 分类', () => {
    expect(classifyComparison(100, 100)).toBe('NO_CHANGE');
    expect(classifyComparison(100, 105, 5)).toBe('EXPECTED_CHANGE');
    expect(classifyComparison(100, 200)).toBe('LARGE_NUMERICAL_CHANGE');
  });
});
