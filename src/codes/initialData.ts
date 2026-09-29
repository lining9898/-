/**
 * 初始规范数据
 * GB50010-2010(2015年版) 已从真实 PDF 导入并人工核验
 * PDF SHA-256: 4ba21712ba65fb3b7e2a66142d1e2833a138d47cc4c3e1617764fa794018b906
 */

import type { CodeEdition, ClauseEvidence, CodeRegistry } from './registry';

export const PDF_SHA256 = '4ba21712ba65fb3b7e2a66142d1e2833a138d47cc4c3e1617764fa794018b906';
export const PDF_FILE_NAME = 'GB50010-2010(2015年版)混凝土结构设计规范.pdf';

export const INITIAL_EDITIONS: CodeEdition[] = [
  {
    editionId: 'GB50010-2010-2015',
    codeNumber: 'GB 50010',
    codeName: '混凝土结构设计规范',
    year: '2010',
    amendment: '2015年版',
    validityStatus: 'CURRENT',
    validitySource: '住建部第919号公告（2015年局部修订）',
    scope: '混凝土结构设计基本规定、材料、承载能力极限状态计算等',
    sourcePdfFile: PDF_FILE_NAME,
    sourcePdfHash: PDF_SHA256,
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
  // 6.2.10 矩形截面受弯承载力（印刷页 39-40，PDF 页 54-55）
  {
    evidenceId: 'GB50010-6.2.10',
    editionId: 'GB50010-2010-2015',
    codeNumber: 'GB 50010',
    clause: '6.2.10',
    chapter: '第6.2节 正截面承载力计算',
    originalText: `矩形截面或翼缘位于受拉边的倒T形截面受弯构件，其正截面受弯承载力应符合下列规定：M ≤ α₁f_c·b·x·(h₀ - x/2) + f_y'·A_s'·(h₀ - a_s') - (σ'_p0 - f'_py)·A'_p·(h₀ - a'_p)。混凝土受压区高度应按下列公式确定：α₁f_c·b·x = f_y·A_s - f'_y·A'_s + f_py·A_p + (σ'_p0 - f'_py)·A'_p。混凝土受压区高度尚应符合下列条件：x ≤ ξ_b·h₀；x ≥ 2a'。`,
    pdfPage: 54,
    printedPage: '39-40',
    sourceFile: PDF_FILE_NAME,
    sourceHash: PDF_SHA256,
    verificationStatus: 'VERIFIED',
    verifiedAt: '2026-09-29',
    verifiedBy: '人工核验（PDF原文对照）',
    linkedSkills: ['beam-flexure', 'beam-double-flexure'],
  },
  // 6.2.11 T形/I形截面受弯（印刷页 41，PDF 页 56）
  {
    evidenceId: 'GB50010-6.2.11',
    editionId: 'GB50010-2010-2015',
    codeNumber: 'GB 50010',
    clause: '6.2.11',
    chapter: '第6.2节 正截面承载力计算',
    originalText: `翼缘位于受压区的T形、I形截面受弯构件，其正截面受弯承载力计算应符合下列规定：1 当满足 f_y·A_s + f_py·A_p ≤ α₁f_c·b'_f·h'_f + f'_y·A'_s - (σ'_p0 - f'_py)·A'_p 时，应按宽度为b'_f的矩形截面计算；2 当不满足上述条件时，应按下列公式计算：M ≤ α₁f_c·b·x·(h₀ - x/2) + α₁f_c·(b'_f - b)·h'_f·(h₀ - h'_f/2) + f'_y·A'_s·(h₀ - a'_s) - (σ'_p0 - f'_py)·A'_p·(h₀ - a'_p)。`,
    pdfPage: 56,
    printedPage: '41',
    sourceFile: PDF_FILE_NAME,
    sourceHash: PDF_SHA256,
    verificationStatus: 'VERIFIED',
    verifiedAt: '2026-09-29',
    verifiedBy: '人工核验（PDF原文对照）',
    linkedSkills: ['beam-t-flexure'],
  },
  // 4.1.4 混凝土强度设计值（印刷页 19-20，PDF 页 34-35）
  {
    evidenceId: 'GB50010-4.1.4',
    editionId: 'GB50010-2010-2015',
    codeNumber: 'GB 50010',
    clause: '4.1.4',
    chapter: '第4.1节 混凝土强度',
    originalText: '混凝土轴心抗压强度设计值f_c应按表4.1.4-1采用；轴心抗拉强度设计值f_t应按表4.1.4-2采用。表4.1.4-1（N/mm²）：C15=7.2, C20=9.6, C25=11.9, C30=14.3, C35=16.7, C40=19.1, C45=21.1, C50=23.1, C55=25.3, C60=27.5, C65=29.7, C70=31.8, C75=33.8, C80=35.9。',
    pdfPage: 34,
    printedPage: '19-20',
    sourceFile: PDF_FILE_NAME,
    sourceHash: PDF_SHA256,
    verificationStatus: 'VERIFIED',
    verifiedAt: '2026-09-29',
    verifiedBy: '人工核验（PDF原文对照）',
    linkedSkills: ['beam-flexure'],
  },
  // 4.2.3 钢筋强度设计值（印刷页 23-24，PDF 页 38-39）
  {
    evidenceId: 'GB50010-4.2.3',
    editionId: 'GB50010-2010-2015',
    codeNumber: 'GB 50010',
    clause: '4.2.3',
    chapter: '第4.2节 钢筋强度',
    originalText: '普通钢筋的抗拉强度设计值f_y、抗压强度设计值f_y\'应按表4.2.3-1采用。表4.2.3-1（N/mm²）：HPB300=270, HRB335=300, HRB400/HRBF400/RRB400=360, HRB500/HRBF500=435。当构件中配有不同种类的钢筋时，每种钢筋应采用各自的强度设计值。',
    pdfPage: 38,
    printedPage: '23-24',
    sourceFile: PDF_FILE_NAME,
    sourceHash: PDF_SHA256,
    verificationStatus: 'VERIFIED',
    verifiedAt: '2026-09-29',
    verifiedBy: '人工核验（PDF原文对照）',
    linkedSkills: ['beam-flexure'],
  },
];

export const INITIAL_REGISTRY: CodeRegistry = {
  editions: INITIAL_EDITIONS,
  clauses: INITIAL_CLAUSES,
  auditLogs: [],
};
