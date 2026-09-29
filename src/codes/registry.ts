/**
 * 规范管理数据模型
 * 用于条文级证据体系和规范确认工作台
 */

import type { VerificationStatus } from '../types/evidence';

/** 规范有效性状态 */
export type CodeValidityStatus = 'CURRENT' | 'SUPERSEDED' | 'DRAFT' | 'REVIEW_REQUIRED';

/** 规范版本 */
export interface CodeEdition {
  editionId: string;
  codeNumber: string;
  codeName: string;
  year: string;
  amendment?: string;
  publishDate?: string;
  implementDate?: string;
  validityStatus: CodeValidityStatus;
  validitySource?: string;
  scope?: string;
  sourcePdfFile?: string;
  sourcePdfHash?: string;
}

/** 条文级 Evidence 记录 */
export interface ClauseEvidence {
  evidenceId: string;
  editionId: string;
  codeNumber: string;
  clause: string;
  chapter: string;
  originalText: string;
  pdfPage: number | null;
  printedPage: string | null;
  sourceFile: string;
  sourceHash?: string;
  verificationStatus: VerificationStatus | 'CONFLICT';
  verifiedAt?: string;
  verifiedBy?: string;
  aiNotes?: string;
  linkedSkills?: string[];
}

/** 人工确认操作记录 */
export interface VerificationAuditLog {
  logId: string;
  evidenceId: string;
  action: 'VERIFY' | 'REJECT' | 'REQUEST_REVIEW' | 'FLAG_CONFLICT';
  fromStatus: string;
  toStatus: string;
  operator: string;
  timestamp: string;
  notes?: string;
}

/** AI 审查结果（规范级） */
export interface NormativeAuditResult {
  auditId: string;
  evidenceId: string;
  model: string;
  checkedAt: string;
  issues: {
    severity: 'BLOCKER' | 'HIGH' | 'MEDIUM' | 'LOW';
    category: 'FORMULA_MISMATCH' | 'MISSING_CLAUSE' | 'WRONG_VERSION' | 'UNIT_ERROR' | 'OTHER';
    description: string;
    location?: string;
  }[];
  suggestions: string[];
  attemptedUpgrade: boolean;
}

/** 规范 Registry */
export interface CodeRegistry {
  editions: CodeEdition[];
  clauses: ClauseEvidence[];
  auditLogs: VerificationAuditLog[];
}

/** 导入的 PDF 文件记录 */
export interface PdfFileRecord {
  fileId: string;
  fileName: string;
  sha256: string;
  fileSize: number;
  pageCount: number;
  importedAt: string;
  boundEditionId: string;
}

/** 计算证据指纹 */
export function computeEvidenceHash(
  sourceFileHash: string,
  clause: string,
  quotedText: string,
  pdfPage: number | null
): string {
  const str = `${sourceFileHash}|${clause}|${quotedText}|${pdfPage}`;
  // 简单 hash（FNV-1a），不需要加密级，只用于变化检测
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `ev_${hash.toString(16)}`;
}

/** 检查证据是否被修改（与保存的 evidenceHash 对比） */
export function isEvidenceStale(
  clause: ClauseEvidence,
  savedHash: string | undefined
): boolean {
  if (!savedHash) return true;
  const currentHash = computeEvidenceHash(
    clause.sourceHash || '',
    clause.clause,
    clause.originalText,
    clause.pdfPage
  );
  return currentHash !== savedHash;
}
