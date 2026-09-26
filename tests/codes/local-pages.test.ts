import { describe, expect, it } from 'vitest';
import { isUsableTextLayer, LocalCodePage, rankLocalPages } from '../../src/codes/local-pages';

const page: LocalCodePage = {
  id: 'hash:4', documentId: 'hash', fileName: '修订条文.pdf',
  codeNumber: 'GB/T 50010-2010', edition: '2024', page: 4, totalPages: 20,
  text: '第 8.5.1 条 纵向受拉钢筋的最小配筋率应按规定确定。',
  method: 'ocr', reviewStatus: 'REVIEW_REQUIRED',
};

describe('local OCR page index', () => {
  it('rejects garbled or empty PDF text layers', () => {
    expect(isUsableTextLayer('OOb?W\u0000\ufffdNa^ OOb?W\u0000\ufffdNa^')).toBe(false);
    expect(isUsableTextLayer('')).toBe(false);
    expect(isUsableTextLayer('第六章 钢筋混凝土结构轴心受压构件承载力计算方法与稳定系数取值说明。')).toBe(true);
  });

  it('retrieves exact clauses and Chinese terms without changing review status', () => {
    const unrelated = { ...page, id: 'hash:5', page: 5, text: '第 9.2.1 条 构造要求。' };
    expect(rankLocalPages('8.5.1', [page, unrelated]).map(hit => hit.page.page)).toEqual([4]);
    expect(rankLocalPages('GB 50010 第 8.5.1 条', [page, unrelated]).map(hit => hit.page.page)).toEqual([4]);
    expect(rankLocalPages('最小配筋率', [page, unrelated])[0].page.reviewStatus).toBe('REVIEW_REQUIRED');
    expect(rankLocalPages('完全不相关', [page])).toEqual([]);
    expect(rankLocalPages('', [page])).toEqual([]);
  });
});
