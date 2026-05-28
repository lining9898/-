import { describe, it, expect } from 'vitest';
import { Evidence, createReviewRequiredEvidence, VerificationStatus } from '../../src/types/evidence';

describe('Evidence 数据结构', () => {
  it('createReviewRequiredEvidence 应返回正确的待校核证据', () => {
    const e = createReviewRequiredEvidence('混凝土结构设计规范', 'GB 50010', '6.2.10', '测试描述');
    expect(e.codeName).toBe('混凝土结构设计规范');
    expect(e.codeNumber).toBe('GB 50010');
    expect(e.clause).toBe('6.2.10');
    expect(e.verificationStatus).toBe('REVIEW_REQUIRED');
    expect(e.pdfPage).toBeNull();
    expect(e.sourceFile).toBeNull();
  });

  it('VerificationStatus 应支持三种状态', () => {
    const statuses: VerificationStatus[] = ['VERIFIED', 'REVIEW_REQUIRED', 'UNVERIFIED'];
    expect(statuses.length).toBe(3);
  });

  it('Evidence 对象应包含所有必需字段', () => {
    const e: Evidence = {
      codeName: 'test',
      codeNumber: 'test',
      edition: '2010',
      chapter: '第6章',
      clause: '6.2.10',
      originalText: 'test',
      pdfPage: 100,
      status: 'current',
      verificationStatus: 'VERIFIED',
      sourceFile: 'GB50010-2010.pdf',
    };
    expect(e.codeName).toBeTruthy();
    expect(e.pdfPage).toBe(100);
    expect(e.sourceFile).toBeTruthy();
  });
});
