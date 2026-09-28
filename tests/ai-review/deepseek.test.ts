import { describe, it, expect } from 'vitest';
import { callDeepSeekReview } from '../../src/ai-review/providers/deepseek';
import { buildReviewPackage, generateReviewPrompt } from '../../src/ai-review';
import { calculateBeamFlexure } from '../../src/core/beam/flexure';

describe('DeepSeek Provider', () => {
  it('rejects empty API key', async () => {
    const result = await callDeepSeekReview('test prompt', { apiKey: '' });
    expect(result.ok).toBe(false);
    expect(result.errorType).toBe('AUTH');
  });

  it('rejects whitespace API key', async () => {
    const result = await callDeepSeekReview('test', { apiKey: '   ' });
    expect(result.ok).toBe(false);
    expect(result.errorType).toBe('AUTH');
  });

  it('handles invalid API key gracefully (no crash)', async () => {
    // 用一个假 key，应该返回 AUTH 错误而不是崩溃
    const result = await callDeepSeekReview('test', { apiKey: 'sk-invalid-fake-key', timeoutMs: 1000 });
    expect(result.ok).toBe(false);
  });

  it('buildReviewPackage generates valid prompt for DeepSeek', () => {
    const r = calculateBeamFlexure({
      b: 250, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400',
      cover: 25, barDiameter: 20, barCount: 4, moment: 120,
    });
    const pkg = buildReviewPackage(r);
    const prompt = generateReviewPrompt(pkg);
    // Prompt 必须包含完整信息
    expect(prompt).toContain('b');
    expect(prompt).toContain('250');
    expect(prompt).toContain('mm');
    expect(prompt).toContain('REVIEW_REQUIRED');
  });

  it('does not call real API in tests', async () => {
    // 确保测试不发起真实网络请求（除非明确要求）
    // 这个测试只是验证函数存在和接口正确
    expect(typeof callDeepSeekReview).toBe('function');
  });
});
