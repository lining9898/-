import { describe, expect, it } from 'vitest';
import manifest from '../../references/codes/code-manifest.json';
import { clauseLocators, findClauseLocator, searchClauses, sourceCode, sourcePdfUrl } from '../../src/codes/clause-index';

describe('GB 50010 clause locator index', () => {
  it('keeps unique, bounded PDF start pages and review-required content', () => {
    expect(clauseLocators).toHaveLength(11);
    expect(new Set(clauseLocators.map(item => item.clause)).size).toBe(clauseLocators.length);
    expect(sourceCode.fileHash).toBe(manifest.fileHash);
    expect(sourceCode.fileName).toBe(manifest.pdfFileName);
    expect(clauseLocators.every(item => item.pdfPage >= 1 && item.pdfPage <= manifest.totalPages)).toBe(true);
    expect(clauseLocators.every(item => item.verificationStatus === 'REVIEW_REQUIRED')).toBe(true);
  });

  it('finds exact clauses and targeted Chinese keywords without inventing matches', () => {
    expect(findClauseLocator('8.5.1')?.pdfPage).toBe(124);
    expect(findClauseLocator('6.2.15')?.pdfPage).toBe(57);
    expect(searchClauses('第 8.5.1 条').map(item => item.clause)).toEqual(['8.5.1']);
    expect(searchClauses('GB 50010 8.5.1').map(item => item.clause)).toEqual(['8.5.1']);
    expect(searchClauses('最小配筋').map(item => item.clause)).toEqual(['8.5.1']);
    expect(searchClauses('T形梁').map(item => item.clause)).toEqual(['6.2.10', '6.2.11', '6.2.12', '8.5.1']);
    expect(searchClauses('6.2.1')).toEqual([]);
    expect(searchClauses('不存在的条文')).toEqual([]);
    expect(searchClauses('')).toHaveLength(11);
  });

  it('links to the pinned source PDF and its page', () => {
    expect(sourcePdfUrl(124)).toContain('/blob/8a6b3a4f7c81a2cc1d0fe469789e8121ffd9d17f/');
    expect(sourcePdfUrl(124)).toContain(`/${manifest.pdfFileName}#page=124`);
  });
});
