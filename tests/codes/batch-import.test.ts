import { describe, it, expect } from 'vitest';
import { extractClausesFromText, checkEvidenceConflict } from '../../src/codes/importPipeline';
import { INITIAL_CLAUSES } from '../../src/codes/initialData';
import type { ClauseEvidence } from '../../src/codes/registry';

describe('BATCH 1.3: 批量 PDF 导入管线', () => {
  it('条文切分：能识别 6.2.10 等条文号', () => {
    const text = `
6.2.10 矩形截面受弯构件承载力计算。
M ≤ α₁f_c·b·x·(h₀ - x/2)
6.2.11 T形截面受弯构件计算。
`;
    const clauses = extractClausesFromText(text, 'testhash123', 54, 56);
    expect(clauses.length).toBe(2);
    expect(clauses[0].clauseNumber).toBe('6.2.10');
    expect(clauses[1].clauseNumber).toBe('6.2.11');
  });

  it('条文切分：公式被识别为 FORMULA block', () => {
    const text = `
6.2.10 矩形截面受弯承载力。
M ≤ α₁f_c·b·x·(h₀ - x/2)
普通文本说明。
`;
    const clauses = extractClausesFromText(text, 'h', 1, 2);
    const formulaBlocks = clauses[0].contentBlocks.filter(b => b.blockType === 'FORMULA');
    expect(formulaBlocks.length).toBeGreaterThan(0);
  });

  it('条文切分：初始状态为 UNVERIFIED', () => {
    const text = `6.2.10 测试条文内容。`;
    const clauses = extractClausesFromText(text, 'h', 1, 1);
    expect(clauses[0].verificationStatus).toBe('UNVERIFIED');
  });

  it('DesignTopic 候选：受弯条文推荐 FLEXURE', () => {
    const text = `6.2.10 矩形截面受弯构件正截面受弯承载力计算。M ≤ f_c·b·x`;
    const clauses = extractClausesFromText(text, 'h', 1, 1);
    expect(clauses[0].topicCandidates.some(t => t.topic === 'FLEXURE')).toBe(true);
  });

  it('DesignTopic 候选：冲切条文推荐 PUNCHING', () => {
    const text = `8.2.8 板柱节点受冲切承载力计算。`;
    const clauses = extractClausesFromText(text, 'h', 1, 1);
    expect(clauses[0].topicCandidates.some(t => t.topic === 'PUNCHING')).toBe(true);
  });

  it('防覆盖：已 VERIFIED 条文原文一致时不报警', () => {
    const existing = INITIAL_CLAUSES.filter((c: ClauseEvidence) => c.verificationStatus === 'VERIFIED');
    const candidates = existing.map(c => ({
      candidateId: 'x',
      sourceFileHash: c.sourceHash!,
      clauseNumber: c.clause,
      quotedText: c.originalText,
      contentBlocks: [],
      pdfPageStart: c.pdfPage || 1,
      pdfPageEnd: c.pdfPage || 1,
      extractionMethod: 'MANUAL' as const,
      extractionConfidence: 1,
      topicCandidates: [],
      moduleCandidates: [],
      verificationStatus: 'UNVERIFIED' as const,
    }));
    const { conflicts } = checkEvidenceConflict(existing, candidates);
    expect(conflicts.length).toBe(0);
  });

  it('防覆盖：已 VERIFIED 条文原文被篡改时报冲突', () => {
    const existing = INITIAL_CLAUSES.filter((c: ClauseEvidence) => c.verificationStatus === 'VERIFIED');
    const candidates = existing.map(c => ({
      candidateId: 'x',
      sourceFileHash: c.sourceHash!,
      clauseNumber: c.clause,
      quotedText: '这是被篡改的完全不同的原文内容ABCDEFG',
      contentBlocks: [],
      pdfPageStart: 1,
      pdfPageEnd: 1,
      extractionMethod: 'REGEX' as const,
      extractionConfidence: 0.5,
      topicCandidates: [],
      moduleCandidates: [],
      verificationStatus: 'UNVERIFIED' as const,
    }));
    const { conflicts } = checkEvidenceConflict(existing, candidates);
    expect(conflicts.length).toBeGreaterThan(0);
  });

  it('已有 4 条 VERIFIED Evidence 仍存在', () => {
    const verified = INITIAL_CLAUSES.filter((c: ClauseEvidence) => c.verificationStatus === 'VERIFIED');
    expect(verified.length).toBe(6);
  });
});
