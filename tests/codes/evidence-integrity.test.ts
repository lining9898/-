import { describe, it, expect } from 'vitest';
import { computeEvidenceHash, isEvidenceStale } from '../../src/codes/registry';
import type { ClauseEvidence } from '../../src/codes/registry';

describe('Evidence Integrity - BATCH 1.1', () => {
  it('B: 修改 quotedText 导致 hash 变化', () => {
    const hash1 = computeEvidenceHash('filehash123', '6.2.10', '原文内容', 100);
    const hash2 = computeEvidenceHash('filehash123', '6.2.10', '原文内容改了一个字', 100);
    expect(hash1).not.toBe(hash2);
  });

  it('C: 更换 PDF 文件导致 hash 变化', () => {
    const hash1 = computeEvidenceHash('filehash_OLD', '6.2.10', '原文', 100);
    const hash2 = computeEvidenceHash('filehash_NEW', '6.2.10', '原文', 100);
    expect(hash1).not.toBe(hash2);
  });

  it('D: 修改 pdfPage 导致 hash 变化', () => {
    const hash1 = computeEvidenceHash('filehash123', '6.2.10', '原文', 100);
    const hash2 = computeEvidenceHash('filehash123', '6.2.10', '原文', 101);
    expect(hash1).not.toBe(hash2);
  });

  it('H: 修改证据后 VERIFIED 失效', () => {
    const stale = isEvidenceStale(
      { sourceHash: 'old_hash', clause: '6.2.10', originalText: 'new text', pdfPage: 100 } as ClauseEvidence,
      'ev_oldhash'
    );
    expect(stale).toBe(true);
  });
});
