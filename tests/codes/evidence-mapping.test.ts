import { describe, it, expect } from 'vitest';
import { INITIAL_CLAUSES } from '../../src/codes/initialData';

describe('Evidence mapping: beta1/xi_b clause attribution', () => {
  it('6.2.6 和 6.2.7 已人工 VERIFIED', () => {
    const c626 = INITIAL_CLAUSES.find(c => c.clause === '6.2.6');
    const c627 = INITIAL_CLAUSES.find(c => c.clause === '6.2.7');
    expect(c626?.verificationStatus).toBe('VERIFIED');
    expect(c627?.verificationStatus).toBe('VERIFIED');
  });

  it('系统 VERIFIED Evidence 为 GB50010 6 条核心条文', () => {
    const verified = INITIAL_CLAUSES.filter(c => c.verificationStatus === 'VERIFIED');
    expect(verified.map(c => c.clause).sort()).toEqual(['4.1.4', '4.2.3', '6.2.10', '6.2.11', '6.2.6', '6.2.7']);
  });
});
