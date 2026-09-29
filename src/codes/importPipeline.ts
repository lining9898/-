import type { ClauseEvidence, DesignTopic } from './registry';

// ============ BATCH 1.3: 批量 PDF 导入管线 ============

export type ParsingStatus = 'WAITING' | 'HASHING' | 'PARSING' | 'EXTRACTING' | 'INDEXING' | 'REVIEW_REQUIRED' | 'COMPLETED' | 'FAILED';

export interface SourceDocument {
  fileId: string;
  fileName: string;
  fileSize: number;
  sha256: string;
  pageCount: number;
  importedAt: string;
  parsingStatus: ParsingStatus;
  parsingVersion: string;
  parseError?: string;
}

export type MetadataSource = 'EXTRACTED' | 'AI_SUGGESTED' | 'HUMAN_VERIFIED';

export interface MetadataCandidate {
  codeNumber?: string;
  codeName?: string;
  edition?: string;
  revision?: string;
  publishDate?: string;
  effectiveDate?: string;
  documentType?: string;
  source: MetadataSource;
  confidence: number;
}

export type ContentBlockType = 'TEXT' | 'FORMULA' | 'TABLE' | 'FIGURE_REFERENCE' | 'NOTE';

export interface ContentBlock {
  blockType: ContentBlockType;
  text: string;
}

export interface ClauseCandidate {
  candidateId: string;
  sourceFileHash: string;
  clauseNumber: string;
  quotedText: string;
  contentBlocks: ContentBlock[];
  pdfPageStart: number;
  pdfPageEnd: number;
  printedPageStart?: string;
  printedPageEnd?: string;
  extractionMethod: 'REGEX' | 'AI_SUGGESTED' | 'MANUAL';
  extractionConfidence: number;
  topicCandidates: { topic: DesignTopic; confidence: number; reason: string }[];
  moduleCandidates: { moduleId: string; confidence: number }[];
  verificationStatus: 'UNVERIFIED';
}

export interface ClauseRelationCandidate {
  candidateId: string;
  sourceClauseNumber: string;
  sourceFileHash: string;
  targetClauseNumber: string;
  targetFileHash: string;
  relationType: string;
  reason: string;
  confidence: number;
  verificationStatus: 'REVIEW_REQUIRED';
}

export interface ImportJobResult {
  sourceDoc: SourceDocument;
  metadata: MetadataCandidate[];
  clauseCandidates: ClauseCandidate[];
  relationCandidates: ClauseRelationCandidate[];
  isDuplicate: boolean;
  duplicateOfFileId?: string;
}

/** 条文号正则：匹配 4.1.1, 6.2.10, 8.2.8 等 */
const CLAUSE_REGEX = /(?:^|\n)\s*(\d{1,2}\.\d{1,2}\.\d{1,2})\s+/;

/**
 * 从文本中切分条文
 */
export function extractClausesFromText(
  text: string,
  sourceFileHash: string,
  startPage: number,
  endPage: number
): ClauseCandidate[] {
  const clauses: ClauseCandidate[] = [];
  const matches = [...text.matchAll(new RegExp(CLAUSE_REGEX.source, 'g'))];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const clauseNumber = m[1];
    const startIdx = m.index!;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    let clauseText = text.slice(startIdx, endIdx).trim();

    // 保护公式块（简单识别含 = 和希腊字母的行）
    const contentBlocks: ContentBlock[] = [];
    const lines = clauseText.split('\n');
    let currentType: ContentBlockType = 'TEXT';
    let buffer: string[] = [];

    for (const line of lines) {
      const isFormula = /[≤≥αβξσ]|=.*[fAσ]/.test(line) && line.length < 100;
      if (isFormula && currentType !== 'FORMULA') {
        if (buffer.length) { contentBlocks.push({ blockType: currentType, text: buffer.join('\n').trim() }); buffer = []; }
        currentType = 'FORMULA';
      } else if (!isFormula && currentType === 'FORMULA') {
        contentBlocks.push({ blockType: 'FORMULA', text: buffer.join('\n').trim() });
        buffer = [];
        currentType = 'TEXT';
      }
      buffer.push(line);
    }
    if (buffer.length) contentBlocks.push({ blockType: currentType, text: buffer.join('\n').trim() });

    clauses.push({
      candidateId: `cc_${sourceFileHash.slice(0, 8)}_${clauseNumber}`,
      sourceFileHash,
      clauseNumber,
      quotedText: clauseText,
      contentBlocks,
      pdfPageStart: startPage,
      pdfPageEnd: endPage,
      extractionMethod: 'REGEX',
      extractionConfidence: clauseText.length > 20 ? 0.7 : 0.4,
      topicCandidates: guessTopics(clauseText),
      moduleCandidates: guessModules(clauseText, clauseNumber),
      verificationStatus: 'UNVERIFIED',
    });
  }
  return clauses;
}

/** 简单关键词猜测 DesignTopic */
function guessTopics(text: string): ClauseCandidate['topicCandidates'] {
  const result: ClauseCandidate['topicCandidates'] = [];
  if (/受弯|正截面|弯矩|M\s*≤/.test(text)) result.push({ topic: 'FLEXURE', confidence: 0.8, reason: '含受弯/正截面关键词' });
  if (/受剪|斜截面|剪力|V\s*≤/.test(text)) result.push({ topic: 'SHEAR', confidence: 0.8, reason: '含受剪/斜截面关键词' });
  if (/混凝土.*强度|f_c|f_t/.test(text)) result.push({ topic: 'MATERIAL', confidence: 0.7, reason: '含混凝土强度' });
  if (/钢筋.*强度|f_y/.test(text)) result.push({ topic: 'MATERIAL', confidence: 0.7, reason: '含钢筋强度' });
  if (/冲切/.test(text)) result.push({ topic: 'PUNCHING', confidence: 0.8, reason: '含冲切关键词' });
  if (/荷载/.test(text)) result.push({ topic: 'LOAD', confidence: 0.6, reason: '含荷载关键词' });
  if (/地基/.test(text)) result.push({ topic: 'FOUNDATION', confidence: 0.6, reason: '含地基关键词' });
  return result;
}

function guessModules(text: string, clauseNumber: string): ClauseCandidate['moduleCandidates'] {
  const result: ClauseCandidate['moduleCandidates'] = [];
  if (/受弯|正截面/.test(text)) {
    result.push({ moduleId: 'beam-flexure', confidence: 0.7 });
    result.push({ moduleId: 'beam-t-flexure', confidence: 0.6 });
  }
  if (/受剪|斜截面/.test(text)) result.push({ moduleId: 'beam-shear', confidence: 0.7 });
  if (/轴压|轴心受压/.test(text)) result.push({ moduleId: 'column', confidence: 0.7 });
  return result;
}

/**
 * 防覆盖检查：如果新提取的条文与已有 VERIFIED Evidence 冲突
 */
export function checkEvidenceConflict(
  existing: ClauseEvidence[],
  newCandidates: ClauseCandidate[]
): { conflicts: { existing: ClauseEvidence; candidate: ClauseCandidate }[] } {
  const conflicts: { existing: ClauseEvidence; candidate: ClauseCandidate }[] = [];
  for (const c of existing) {
    if (c.verificationStatus !== 'VERIFIED') continue;
    for (const nc of newCandidates) {
      if (c.clause === nc.clauseNumber && c.sourceHash === nc.sourceFileHash) {
        if (c.originalText.slice(0, 50) !== nc.quotedText.slice(0, 50)) {
          conflicts.push({ existing: c, candidate: nc });
        }
      }
    }
  }
  return { conflicts };
}

/** SHA-256 计算（浏览器端） */
export async function sha256File(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
