import { describe, expect, it } from 'vitest';
import manifest from '../../references/codes/code-manifest.json';
import { findClauseLocator } from '../../src/codes/clause-index';
import { ruleCorpus } from '../../src/codes/rule-corpus';
import { retrieveRules } from '../../src/codes/retrieve-rules';

describe('source-backed rule retrieval', () => {
  it('keeps provenance and review status on each curated rule', () => {
    expect(new Set(ruleCorpus.map(rule => rule.clause)).size).toBe(ruleCorpus.length);
    for (const rule of ruleCorpus) {
      expect(rule.contentStatus).toBe('REVIEW_REQUIRED');
      expect(rule.pdfPages[0]).toBe(findClauseLocator(rule.clause)?.pdfPage);
      expect(rule.pdfPages.every(page => page >= 1 && page <= manifest.totalPages)).toBe(true);
    }
  });

  it('retrieves Chinese engineering questions and exact clauses', () => {
    expect(retrieveRules('细长梁受剪截面限制').map(item => item.rule.clause)).toEqual(['6.3.1']);
    expect(retrieveRules('T形梁最小配筋')[0].rule.clause).toBe('8.5.1');
    expect(retrieveRules('GB 50010 第6.2.12条')[0].rule.clause).toBe('6.2.12');
    expect(retrieveRules('完全不存在的规则')).toEqual([]);
  });
});
