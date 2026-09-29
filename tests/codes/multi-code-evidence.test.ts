import { describe, it, expect } from 'vitest';
import { INITIAL_CLAUSES, INITIAL_EVIDENCE_SETS, INITIAL_CLAUSE_RELATIONS, CLAUSE_TOPIC_MAP } from '../../src/codes/initialData';
import { detectConflicts } from '../../src/codes/conflictDetector';
import type { ClauseEvidence, ConflictFinding } from '../../src/codes/registry';

describe('BATCH 1.2: 多规范关联证据中心', () => {
  it('保护已有 4 条 VERIFIED Evidence', () => {
    const verified = INITIAL_CLAUSES.filter((c: ClauseEvidence) => c.verificationStatus === 'VERIFIED');
    expect(verified.length).toBe(4);
    const ids = verified.map((c: ClauseEvidence) => c.evidenceId).sort();
    expect(ids).toEqual(['GB50010-4.1.4', 'GB50010-4.2.3', 'GB50010-6.2.10', 'GB50010-6.2.11']);
  });

  it('每条 VERIFIED Evidence 都有 sourceHash 和 pdfPage', () => {
    for (const c of INITIAL_CLAUSES.filter((x: ClauseEvidence) => x.verificationStatus === 'VERIFIED')) {
      expect(c.sourceHash).toBeTruthy();
      expect(c.pdfPage).not.toBeNull();
      expect(c.printedPage).toBeTruthy();
      expect(c.originalText).not.toBe('待规范原文导入');
    }
  });

  it('EvidenceSet 存在且引用了真实 Evidence', () => {
    expect(INITIAL_EVIDENCE_SETS.length).toBeGreaterThan(0);
    for (const set of INITIAL_EVIDENCE_SETS) {
      for (const eid of set.evidenceIds) {
        expect(INITIAL_CLAUSES.find((c: ClauseEvidence) => c.evidenceId === eid)).toBeTruthy();
      }
    }
  });

  it('DesignTopic 映射存在', () => {
    expect(CLAUSE_TOPIC_MAP['GB50010-6.2.10']).toContain('FLEXURE');
    expect(CLAUSE_TOPIC_MAP['GB50010-4.1.4']).toContain('MATERIAL');
  });

  it('ClauseRelation 默认为 REVIEW_REQUIRED（AI 不能 VERIFIED）', () => {
    for (const rel of INITIAL_CLAUSE_RELATIONS) {
      expect(rel.verificationStatus).not.toBe('VERIFIED');
    }
  });

  it('冲突检测器：无冲突时返回空或低级别', () => {
    const findings = detectConflicts(
      INITIAL_CLAUSES,
      [
        { id: 'GB50010-2010-2015', codeNumber: 'GB 50010', codeName: '混凝土结构设计规范', edition: '2010', status: 'CURRENT', documentType: 'GB', metadataVerificationStatus: 'VERIFIED' },
      ],
      INITIAL_EVIDENCE_SETS,
      INITIAL_CLAUSE_RELATIONS
    );
    // 不应有 BLOCKER
    expect(findings.filter((f: ConflictFinding) => f.severity === 'BLOCKER').length).toBe(0);
  });

  it('冲突检测器：SUPERSEDED 规范被引用时报警', () => {
    const findings = detectConflicts(
      INITIAL_CLAUSES,
      [
        { id: 'GB50010-2010-2015', codeNumber: 'GB 50010', codeName: '混凝土结构设计规范', edition: '2010', status: 'SUPERSEDED', documentType: 'GB', metadataVerificationStatus: 'VERIFIED' },
      ],
      [],
      []
    );
    expect(findings.some((f: ConflictFinding) => f.type === 'SUPERSEDED_CITED')).toBe(true);
  });

  it('冲突检测器：EvidenceSet 引用不存在条文时报错', () => {
    const findings = detectConflicts(
      INITIAL_CLAUSES,
      [],
      [{ id: 'bad', name: 'bad', topic: 'FLEXURE', calculationModuleId: 'x', evidenceIds: ['FAKE-ID'], completeness: 'MISSING', conflictStatus: 'REVIEW_REQUIRED', verificationStatus: 'UNVERIFIED' }],
      []
    );
    expect(findings.some((f: ConflictFinding) => f.type === 'MISSING_CLAUSE')).toBe(true);
  });
});
