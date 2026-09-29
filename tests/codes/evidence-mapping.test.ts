import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Evidence mapping: beta1/xi_b clause attribution', () => {
  const flexureSrc = readFileSync(
    resolve(__dirname, '../../src/core/beam/flexure.ts'), 'utf-8'
  );

  it('β1 应引用 6.2.6（矩形应力图系数），不应仅引 6.2.7', () => {
    // β1 evidence 行必须引用 6.2.6
    const betaLine = flexureSrc.split('\n').find((l: string) => l.includes('betaEvidence'));
    expect(betaLine).toBeDefined();
    expect(betaLine).toContain('6.2.6');
    expect(betaLine).not.toContain('6.2.7');
  });

  it('ξb 应引用 6.2.7（相对界限受压区高度）', () => {
    const xiBLine = flexureSrc.split('\n').find((l: string) => l.includes('xiBEvidence'));
    expect(xiBLine).toBeDefined();
    expect(xiBLine).toContain('6.2.7');
  });

  it('6.2.6 和 6.2.7 在系统 ClauseEvidence 中尚未 VERIFIED', async () => {
    const { INITIAL_CLAUSES } = await import('../../src/codes/initialData');
    const c626 = INITIAL_CLAUSES.find(c => c.clause === '6.2.6');
    const c627 = INITIAL_CLAUSES.find(c => c.clause === '6.2.7');
    // 不强制要求存在，但如果存在必须是 REVIEW_REQUIRED/UNVERIFIED，不能是 VERIFIED
    if (c626) expect(['REVIEW_REQUIRED', 'UNVERIFIED']).toContain(c626.verificationStatus);
    if (c627) expect(['REVIEW_REQUIRED', 'UNVERIFIED']).toContain(c627.verificationStatus);
  });
});
