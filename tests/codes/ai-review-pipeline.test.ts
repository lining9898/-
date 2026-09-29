import { describe, it, expect } from 'vitest';
import {
  runDeterministicChecks, mergeReviews, isReviewStale,
  type AIReviewResult
} from '../../src/codes/aiReviewPipeline';

describe('BATCH 3.0: AI 工程审查闭环', () => {
  it('NaN 检测', () => {
    const r = runDeterministicChecks({
      moduleId: 'beam-flexure',
      values: { M: NaN, fc: 14.3 },
    });
    expect(r.hasCritical).toBe(true);
  });

  it('Infinity 检测', () => {
    const r = runDeterministicChecks({
      moduleId: 'beam-flexure',
      values: { M: Infinity },
    });
    expect(r.hasCritical).toBe(true);
  });

  it('负尺寸检测', () => {
    const r = runDeterministicChecks({
      moduleId: 'beam-flexure',
      values: { b: -100 },
    });
    expect(r.issues.some(i => i.title.includes('负几何'))).toBe(true);
  });

  it('Evidence REVIEW_REQUIRED 警告', () => {
    const r = runDeterministicChecks({
      moduleId: 'beam-flexure',
      values: { M: 100 },
      evidenceStatus: { ev1: 'REVIEW_REQUIRED' },
    });
    expect(r.issues.some(i => i.scope === 'EVIDENCE_REVIEW')).toBe(true);
  });

  it('RuleDiff MISMATCH → ERROR', () => {
    const r = runDeterministicChecks({
      moduleId: 'beam-flexure',
      values: { M: 100 },
      ruleDiffStatus: 'MISMATCH',
    });
    expect(r.hasError).toBe(true);
  });

  it('Merger: Deterministic ERROR 不被 AI 覆盖', () => {
    const det = runDeterministicChecks({
      moduleId: 'beam-flexure',
      values: { M: NaN },
    });
    const ai: AIReviewResult = { issues: [] };
    const merged = mergeReviews(det, ai);
    expect(merged.critical).toBe(1);
  });

  it('Merger: 相同问题 source=BOTH', () => {
    const det = runDeterministicChecks({
      moduleId: 'beam-flexure',
      values: { b: -100 },
    });
    const ai: AIReviewResult = {
      issues: [{
        id: 'det-neg-b', scope: 'INPUT_REVIEW', severity: 'ERROR',
        moduleId: 'beam-flexure', title: '负尺寸',
        description: 'AI 也发现了', source: 'AI', status: 'OPEN',
      }],
    };
    const merged = mergeReviews(det, ai);
    expect(merged.issues[0].source).toBe('BOTH');
  });

  it('STALE: 计算变化', () => {
    expect(isReviewStale(
      { calculationHash: 'old', evidenceHash: 'e1', ruleHash: 'r1' },
      { calculationHash: 'new', evidenceHash: 'e1', ruleHash: 'r1' }
    )).toBe(true);
  });

  it('STALE: 未变化', () => {
    expect(isReviewStale(
      { calculationHash: 'same', evidenceHash: 'e1', ruleHash: 'r1' },
      { calculationHash: 'same', evidenceHash: 'e1', ruleHash: 'r1' }
    )).toBe(false);
  });
});
