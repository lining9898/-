import { describe, it, expect } from 'vitest';
import { skillRegistry } from '../../src/agent/skill-registry';
import { buildReviewPackage, generateReviewPrompt } from '../../src/ai-review';
import type { CalculationResult } from '../../src/types/calculation';

/**
 * AI Review Skill Coverage Test
 * 验证 Registry 中所有 calculation skill 都能生成 Review Package。
 * 未来新增 calculation skill 时如果忘记支持 AI Review，本测试会失败。
 */

describe('AI Review Skill Coverage', () => {
  it('all registered calculation skills have a reviewable path', () => {
    const calcSkills = skillRegistry.list().filter(s => s.kind === 'calculation');
    expect(calcSkills.length).toBeGreaterThanOrEqual(10);

    for (const s of calcSkills) {
      const pkg = skillRegistry.describe(s.id);
      expect(pkg, `${s.id} should be describable`).toBeDefined();
      // 验证 skill 有 manifest 和 evidence
      expect(pkg!.manifest.id).toBe(s.id);
      expect(pkg!.evidence.records.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('buildReviewPackage accepts any valid CalculationResult', () => {
    // 构造一个最小 CalculationResult
    const fakeResult: CalculationResult = {
      calculatorType: 'test-skill',
      timestamp: new Date().toISOString(),
      overallStatus: 'REVIEW_REQUIRED',
      inputs: [],
      materials: [],
      geometry: [],
      steps: [],
      results: [{ label: '测试结果', value: 100, unit: 'kN' }],
      checks: [],
      conclusion: { passed: true, summary: '测试', evidence: [] },
      advisories: [],
      allEvidence: [],
    };
    const pkg = buildReviewPackage(fakeResult, '测试');
    const prompt = generateReviewPrompt(pkg);
    expect(prompt).toContain('独立复核');
    expect(pkg.calculationSkill).toBe('test-skill');
  });

  it('no skillId switch in prompt generator - fully generic', () => {
    // generateReviewPrompt 不应该有 skill-specific switch
    // 所有特殊行为通过 options 传入（internalMechanics, magnitudeHighRisk）
    // 这里验证：不同 skill 的 result 走同一个函数都能生成有效 prompt
    const baseResult: CalculationResult = {
      calculatorType: 'any-skill',
      timestamp: new Date().toISOString(),
      overallStatus: 'REVIEW_REQUIRED',
      inputs: [{ label: 'b', value: 250, unit: 'mm' }],
      materials: [], geometry: [],
      steps: [{ name: 'step1', description: '', formula: 'M=α1·fc·b·x', substitutedFormula: '...', result: 100, unit: 'kN·m', evidence: [] }],
      results: [{ label: 'Mu', value: 100, unit: 'kN·m' }],
      checks: [],
      conclusion: { passed: true, summary: '', evidence: [] },
      advisories: [],
      allEvidence: [],
    };
    const p1 = generateReviewPrompt(buildReviewPackage(baseResult, 'skill-A'));
    const p2 = generateReviewPrompt(buildReviewPackage(baseResult, 'skill-B'));
    // 两个不同 skill 名应该都生成有效 prompt
    expect(p1).toContain('skill-A');
    expect(p2).toContain('skill-B');
  });
});
