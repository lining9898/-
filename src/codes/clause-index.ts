import manifest from '../../references/codes/code-manifest.json';

export interface ClauseLocator {
  clause: string;
  pdfPage: number;
  keywords: readonly string[];
  verificationStatus: 'REVIEW_REQUIRED';
}

export const sourceCode = {
  name: manifest.codeName,
  number: manifest.codeNumber,
  edition: manifest.edition,
  fileName: manifest.pdfFileName,
  fileHash: manifest.fileHash,
  totalPages: manifest.totalPages,
} as const;

// These are manually checked PDF start pages, not verified clause transcriptions.
export const clauseLocators: readonly ClauseLocator[] = [
  { clause: '4.1.4', pdfPage: 34, keywords: ['混凝土', '强度'], verificationStatus: 'REVIEW_REQUIRED' },
  { clause: '4.2.3', pdfPage: 38, keywords: ['钢筋', '强度'], verificationStatus: 'REVIEW_REQUIRED' },
  { clause: '6.2.6', pdfPage: 52, keywords: ['梁', '受弯'], verificationStatus: 'REVIEW_REQUIRED' },
  { clause: '6.2.7', pdfPage: 53, keywords: ['梁', '受弯'], verificationStatus: 'REVIEW_REQUIRED' },
  { clause: '6.2.10', pdfPage: 54, keywords: ['T形梁', '受弯'], verificationStatus: 'REVIEW_REQUIRED' },
  { clause: '6.2.11', pdfPage: 56, keywords: ['T形梁', '受弯'], verificationStatus: 'REVIEW_REQUIRED' },
  { clause: '6.2.12', pdfPage: 57, keywords: ['T形梁', '受弯'], verificationStatus: 'REVIEW_REQUIRED' },
  { clause: '8.5.1', pdfPage: 124, keywords: ['最小配筋', '配筋率', 'T形梁'], verificationStatus: 'REVIEW_REQUIRED' },
];

export function findClauseLocator(clause: string): ClauseLocator | undefined {
  return clauseLocators.find(locator => locator.clause === clause);
}

export function searchClauses(query: string): ClauseLocator[] {
  const term = query.trim().toLowerCase()
    .replace(/gb\s*50010\s*[-—]?\s*(?:2010)?(?:\s*\(2015\))?/i, '')
    .replace(/^第/, '').replace(/条$/, '').replace(/\s+/g, '');
  if (!term) return [...clauseLocators];

  return clauseLocators.filter(locator =>
    locator.clause.includes(term) || locator.keywords.some(keyword => keyword.toLowerCase().includes(term))
  );
}

export function sourcePdfUrl(page: number): string {
  const revision = '8a6b3a4f7c81a2cc1d0fe469789e8121ffd9d17f';
  return `https://github.com/lining9898/-/blob/${revision}/references/codes/${sourceCode.fileName}#page=${page}`;
}
