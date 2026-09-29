import type { ClauseEvidence, CodeDocument, EvidenceSet, ClauseRelation, ConflictFinding } from './registry';

/**
 * 冲突检测器
 * 不自动决定哪个规范优先，只报告问题
 */
export function detectConflicts(
  clauses: ClauseEvidence[],
  documents: CodeDocument[],
  evidenceSets: EvidenceSet[],
  relations: ClauseRelation[]
): ConflictFinding[] {
  const findings: ConflictFinding[] = [];
  const docMap = new Map(documents.map(d => [d.id, d]));

  // 1. SUPERSEDED 规范被引用
  for (const c of clauses) {
    const doc = documents.find(d => d.id === c.editionId);
    if (doc?.status === 'SUPERSEDED') {
      findings.push({
        type: 'SUPERSEDED_CITED',
        severity: 'HIGH',
        message: `条文 ${c.clause} 来自已废止规范 ${doc.codeNumber}`,
        evidenceId: c.evidenceId,
      });
    }
  }

  // 2. EvidenceSet 同时包含新旧版本
  for (const set of evidenceSets) {
    const setDocs = new Set<string>();
    for (const eid of set.evidenceIds) {
      const c = clauses.find(x => x.evidenceId === eid);
      if (c) setDocs.add(c.editionId);
    }
    if (setDocs.size > 1) {
      findings.push({
        type: 'NEW_OLD_MIXED',
        severity: 'HIGH',
        message: `证据集合 ${set.name} 同时引用了 ${setDocs.size} 个不同版本的规范`,
      });
    }
  }

  // 3. CONFLICTS_WITH 关系
  for (const rel of relations) {
    if (rel.relationType === 'CONFLICTS_WITH') {
      findings.push({
        type: 'CONFLICT_RELATION',
        severity: 'MEDIUM',
        message: `条文关系声明冲突: ${rel.sourceEvidenceId} ↔ ${rel.targetEvidenceId}`,
      });
    }
  }

  // 4. 引用条文不存在
  for (const set of evidenceSets) {
    for (const eid of set.evidenceIds) {
      if (!clauses.find(c => c.evidenceId === eid)) {
        findings.push({
          type: 'MISSING_CLAUSE',
          severity: 'BLOCKER',
          message: `证据集合 ${set.name} 引用了不存在的条文 ${eid}`,
        });
      }
    }
  }

  // 5. VERIFIED Evidence 但没有 sourceFile
  for (const c of clauses) {
    if (c.verificationStatus === 'VERIFIED' && !c.sourceHash) {
      findings.push({
        type: 'MISSING_PDF',
        severity: 'BLOCKER',
        message: `VERIFIED 条文 ${c.clause} 缺少 PDF 来源哈希`,
        evidenceId: c.evidenceId,
      });
    }
  }

  // 6. 同一条文 quotedText 不一致
  const textMap = new Map<string, string[]>();
  for (const c of clauses) {
    const key = `${c.codeNumber}|${c.clause}|${c.editionId}`;
    if (!textMap.has(key)) textMap.set(key, []);
    textMap.get(key)!.push(c.originalText);
  }
  for (const [key, texts] of textMap) {
    if (new Set(texts).size > 1) {
      findings.push({
        type: 'DUPLICATE_TEXT',
        severity: 'MEDIUM',
        message: `条文 ${key} 存在不同原文记录`,
      });
    }
  }

  return findings;
}
