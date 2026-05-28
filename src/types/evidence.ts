/**
 * 规范证据数据结构
 * 每个计算步骤都可以关联一条或多条 Evidence
 */

export type VerificationStatus = 'VERIFIED' | 'REVIEW_REQUIRED' | 'UNVERIFIED';

export interface Evidence {
  /** 规范名称，如 "混凝土结构设计规范" */
  codeName: string;
  /** 规范编号，如 "GB 50010" */
  codeNumber: string;
  /** 版本/年份，如 "2010" */
  edition: string;
  /** 章节，如 "第6章" */
  chapter: string;
  /** 条文号，如 "6.2.10" */
  clause: string;
  /** 条文原文（未校核时为空字符串） */
  originalText: string;
  /** PDF 页码（未校核时为 null） */
  pdfPage: number | null;
  /** 规范状态：现行/废止/征求意见稿 */
  status: 'current' | 'superseded' | 'draft';
  /** 校核状态 */
  verificationStatus: VerificationStatus;
  /** 来源文件（如规范 PDF 文件名） */
  sourceFile: string | null;
}

/** 创建一个待校核的规范证据占位符 */
export function createReviewRequiredEvidence(
  codeName: string,
  codeNumber: string,
  clause: string,
  description?: string
): Evidence {
  return {
    codeName,
    codeNumber,
    edition: '',
    chapter: '',
    clause,
    originalText: description || '待规范原文校核',
    pdfPage: null,
    status: 'current',
    verificationStatus: 'REVIEW_REQUIRED',
    sourceFile: null,
  };
}
