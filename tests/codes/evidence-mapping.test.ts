import { describe, it, expect } from 'vitest';
import { INITIAL_CLAUSES } from '../../src/codes/initialData';

describe('Evidence mapping: beta1/xi_b clause attribution', () => {
  it('6.2.6 和 6.2.7 在系统 ClauseEvidence 中不存在或未 VERIFIED', () => {
    const c626 = INITIAL_CLAUSES.find(c => c.clause === '6.2.6');
    const c627 = INITIAL_CLAUSES.find(c => c.clause === '6.2.7');
    if (c626) expect(['REVIEW_REQUIRED', 'UNVERIFIED']).toContain(c626.verificationStatus);
    if (c627) expect(['REVIEW_REQUIRED', 'UNVERIFIED']).toContain(c627.verificationStatus);
  });

  it('系统 VERIFIED Evidence 只有 4 条 GB50010 条文', () => {
    const verified = INITIAL_CLAUSES.filter(c => c.verificationStatus === 'VERIFIED');
    expect(verified.map(c => c.clause).sort()).toEqual(['4.1.4', '4.2.3', '6.2.10', '6.2.11']);
  });
});
