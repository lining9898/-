/**
 * 初始规范数据
 * 所有条文默认 UNVERIFIED，等待人工确认
 */

import type { CodeEdition, ClauseEvidence, CodeRegistry } from './registry';

export const INITIAL_EDITIONS: CodeEdition[] = [
  {
    editionId: 'GB50010-2010-2015',
    codeNumber: 'GB 50010',
    codeName: '混凝土结构设计规范',
    year: '2010',
    amendment: '2015年版',
    validityStatus: 'REVIEW_REQUIRED',
    scope: '混凝土结构设计基本规定、材料、承载能力极限状态计算等',
  },
  {
    editionId: 'GB50007-2011',
    codeNumber: 'GB 50007',
    codeName: '建筑地基基础设计规范',
    year: '2011',
    validityStatus: 'REVIEW_REQUIRED',
    scope: '地基基础设计',
  },
  {
    editionId: 'GB50009-2012',
    codeNumber: 'GB 50009',
    codeName: '建筑结构荷载规范',
    year: '2012',
    validityStatus: 'REVIEW_REQUIRED',
    scope: '建筑结构荷载取值',
  },
];

export const INITIAL_CLAUSES: ClauseEvidence[] = [
  // 矩形梁正截面受弯相关条文（全部 UNVERIFIED）
  {
    evidenceId: 'GB50010-6.2.10',
    editionId: 'GB50010-2010-2015',
    codeNumber: 'GB 50010',
    clause: '6.2.10',
    chapter: '第6.2节 正截面承载力计算',
    originalText: '待规范原文导入',
    pdfPage: null,
    printedPage: null,
    sourceFile: '',
    verificationStatus: 'UNVERIFIED',
    linkedSkills: ['beam-flexure', 'beam-double-flexure'],
  },
  {
    evidenceId: 'GB50010-6.2.11',
    editionId: 'GB50010-2010-2015',
    codeNumber: 'GB 50010',
    clause: '6.2.11',
    chapter: '第6.2节 正截面承载力计算',
    originalText: '待规范原文导入',
    pdfPage: null,
    printedPage: null,
    sourceFile: '',
    verificationStatus: 'UNVERIFIED',
    linkedSkills: ['beam-t-flexure'],
  },
  {
    evidenceId: 'GB50010-4.1.4',
    editionId: 'GB50010-2010-2015',
    codeNumber: 'GB 50010',
    clause: '4.1.4',
    chapter: '第4.1节 混凝土强度',
    originalText: '待规范原文导入',
    pdfPage: null,
    printedPage: null,
    sourceFile: '',
    verificationStatus: 'UNVERIFIED',
    linkedSkills: ['beam-flexure'],
  },
  {
    evidenceId: 'GB50010-4.2.3',
    editionId: 'GB50010-2010-2015',
    codeNumber: 'GB 50010',
    clause: '4.2.3',
    chapter: '第4.2节 钢筋强度',
    originalText: '待规范原文导入',
    pdfPage: null,
    printedPage: null,
    sourceFile: '',
    verificationStatus: 'UNVERIFIED',
    linkedSkills: ['beam-flexure'],
  },
];

export const INITIAL_REGISTRY: CodeRegistry = {
  editions: INITIAL_EDITIONS,
  clauses: INITIAL_CLAUSES,
  auditLogs: [],
};
