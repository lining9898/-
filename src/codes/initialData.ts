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
    validityStatus: 'CURRENT',
    validitySource: '住建部第1405号公告（2012-05-28发布，2012-10-01实施）',
    scope: '建筑结构荷载取值、荷载组合',
    sourcePdfFile: 'GB50009-2012建筑结构荷载规范.pdf',
    sourcePdfHash: '2b81bcdc887d6afe81a577b6480b281d41db64a9437f146551dc3672b64a9b72',
  },
  {
    editionId: 'GB50068-2018',
    codeNumber: 'GB 50068',
    codeName: '建筑结构可靠性设计统一标准',
    year: '2018',
    validityStatus: 'CURRENT',
    scope: '建筑结构可靠性、极限状态设计、分项系数',
    sourcePdfFile: 'GB50068-2018建筑结构可靠性设计统一标准.pdf',
    sourcePdfHash: 'd34092a6fb60cfcedc63475e575a198d53140f38d382d113c21126c87ecc5097',
  },
  {
    editionId: 'GB55008-2021',
    codeNumber: 'GB 55008',
    codeName: '混凝土结构通用规范',
    year: '2021',
    amendment: '2021版',
    validityStatus: 'CURRENT',
    validitySource: '住建部第167号公告（2021-09-08发布，2022-04-01实施，全文强制）',
    scope: '混凝土结构基本规定、材料、设计、施工验收通用要求（全文强制性）',
    sourcePdfFile: 'GB 55008-2021 混凝土结构通用规范.pdf',
    sourcePdfHash: '8c59c206d482efe8667e42629f37fe3a304ca31ec8d5625436a53b82c81a4bf4',
  },
  {
    editionId: 'GB50011-2010-2016',
    codeNumber: 'GB 50011',
    codeName: '建筑抗震设计规范',
    year: '2010',
    amendment: '2016年版',
    validityStatus: 'CURRENT',
    validitySource: '住建部第1199号公告（2016年局部修订，2016-08-01实施）',
    scope: '建筑抗震设防、地震作用、抗震构造措施',
    sourcePdfFile: 'GB50011-2010(2016年版)建筑抗震设计规范.pdf',
    sourcePdfHash: 'feb4fa0173b852fda75c80ea66206621bd1b07cb85c110600551a7b1fa1cb8a6',
  },
  {
    editionId: 'GB55001-2021',
    codeNumber: 'GB 55001',
    codeName: '工程结构通用规范',
    year: '2021',
    validityStatus: 'CURRENT',
    validitySource: '住建部2021年第70号公告（2021-04-09发布，2022-01-01实施，全文强制）',
    scope: '工程结构基本规定、作用、材料、设计、检测维护通用要求（全文强制性）',
    sourcePdfFile: 'GB 55001-2021 工程结构通用规范.pdf',
    sourcePdfHash: 'e7d7bb9f88911482cc9ceb82fed70603c9e75b4d6490472bbf141f5441b42b4c',
  },
  {
    editionId: 'GB50017-2017',
    codeNumber: 'GB 50017',
    codeName: '钢结构设计标准',
    year: '2017',
    validityStatus: 'CURRENT',
    validitySource: '住建部2017-12-12发布，2018-07-01实施',
    scope: '钢结构构件与连接设计',
    sourcePdfFile: 'GB 50017-2017 钢结构设计标准.pdf',
    sourcePdfHash: '6f96de68b65a0912a8fb8d71f2e52a1482cd5720976bf07b2e18385d2c1ee32a',
  },
  {
    editionId: 'GB55002-2021',
    codeNumber: 'GB 55002',
    codeName: '建筑与市政工程抗震通用规范',
    year: '2021',
    validityStatus: 'CURRENT',
    validitySource: '住建部2021年第70号公告（2022-01-01实施，全文强制）',
    scope: '建筑与市政工程抗震设防、地震作用、抗震措施（全文强制性）',
    sourcePdfFile: 'GB 55002-2021 建筑与市政工程抗震通用规范.pdf',
    sourcePdfHash: 'ec2455e61ee1327edbc71aff87e65f218000d48239f552ac28c985bc3e437ee4',
  },
  {
    editionId: 'GB55003-2021',
    codeNumber: 'GB 55003',
    codeName: '建筑与市政地基基础通用规范',
    year: '2021',
    validityStatus: 'CURRENT',
    validitySource: '住建部2021年第70号公告（2022-01-01实施，全文强制）',
    scope: '建筑与市政地基基础设计与施工（全文强制性）',
    sourcePdfFile: 'GB 55003-2021 建筑与市政地基基础通用规范.pdf',
    sourcePdfHash: '6eda058e0075e57e96d9fb7b2bc0c392b703e4b9d9031292eaefce7c0ddb4361',
  },
  {
    editionId: 'GB50010-2010-2024',
    codeNumber: 'GB 50010',
    codeName: '混凝土结构设计规范（2024年局部修订）',
    year: '2010',
    amendment: '2024年局部修订',
    validityStatus: 'UPCOMING',
    validitySource: '住建部2019年工程建设规范标准编制计划，26条局部修订',
    scope: 'GB50010-2010(2015版) 局部修订条文（2.2.1/3.4.2/3.5.3/4.1.2~4.1.5/4.2.1~4.2.6/4.2.8/8.3.1/8.5.1/8.5.3/9.1.2/9.4.5/9.5.2/10.1.2/11.2.1/11.4.12/11.7.14/G.0.7/G.0.12）',
    sourcePdfFile: 'GB∕T 50010-2010 混凝土结构设计标准.pdf',
    sourcePdfHash: 'f0d360c050af2e6f2b7a839146e4c6a292efc94ecc2dd34d5babdff08adf6b86',
  },
  {
    editionId: 'GB50011-2010-2024',
    codeNumber: 'GB 50011',
    codeName: '建筑抗震设计规范（2024年局部修订）',
    year: '2010',
    amendment: '2024年局部修订',
    validityStatus: 'UPCOMING',
    validitySource: '住建部2021-36号函，9条局部修订',
    scope: 'GB50011-2010(2016版) 局部修订条文（3.1.3/3.9.2/3.10.1.2/3.10.3/3.10.4/3.10.5/5.4.1/12.1.6）',
    sourcePdfFile: 'GB∕T 50011-2010 建筑抗震设计标准.pdf',
    sourcePdfHash: '62eabe1c0d82b1759c369507e8e3b94664eac94bf4c6a781ab281fd2f5a80617',
  },
  {
    editionId: 'GB50204-2015',
    codeNumber: 'GB 50204',
    codeName: '混凝土结构工程施工质量验收规范',
    year: '2015',
    validityStatus: 'CURRENT',
    validitySource: '住建部2014-12-31发布，2015-09-01实施',
    scope: '混凝土结构工程施工质量验收',
    sourcePdfFile: 'GB50204-2015混凝土结构工程施工质量验收规范.pdf',
    sourcePdfHash: 'c8c51d57617027cd0375a36dbf5aaa95f23ce416a4405494cd6859869ab25337',
  },
  {
    editionId: 'JGJ1-2014',
    codeNumber: 'JGJ 1',
    codeName: '装配式混凝土结构技术规程',
    year: '2014',
    validityStatus: 'CURRENT',
    validitySource: '住建部2014-02-10发布，2014-10-01实施',
    scope: '装配式混凝土结构设计、制作、施工与验收',
    sourcePdfFile: 'JGJ1-2014装配式混凝土结构技术规程.pdf',
    sourcePdfHash: '1775753f1f371e6105d75bf29d25bf4cbccc6d323c656b0c42d8d580abf8c0fa',
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
  // GB 55008-2021 条文（全部 UNVERIFIED，等待人工逐条核验）
  {
    evidenceId: 'GB55008-3.2.1',
    editionId: 'GB55008-2021',
    codeNumber: 'GB 55008',
    clause: '3.2.1',
    chapter: '第3.2节 钢筋',
    originalText: '普通钢筋的材料分项系数取值不应小于表3.2.1的规定。表3.2.1：光圆钢筋300MPa→1.10，热轧钢筋400MPa→1.10，热轧钢筋500MPa→1.15，冷轧带肋→1.25。',
    pdfPage: 21,
    printedPage: '7',
    sourceFile: 'GB 55008-2021 混凝土结构通用规范.pdf',
    sourceHash: '8c59c206d482efe8667e42629f37fe3a304ca31ec8d5625436a53b82c81a4bf4',
    verificationStatus: 'UNVERIFIED',
    linkedSkills: ['beam-flexure', 'column'],
  },
  {
    evidenceId: 'GB55008-4.4.2',
    editionId: 'GB55008-2021',
    codeNumber: 'GB 55008',
    clause: '4.4.2',
    chapter: '第4.4节 构件设计',
    originalText: '正截面承载力计算应采用符合工程需求的混凝土应力-应变本构关系，并应满足变形协调和静力平衡条件。正截面承载力简化计算时，应符合下列假定：1 截面应变保持平面；2 不考虑混凝土的抗拉作用；3 应确定混凝土的应力-应变本构关系；4 纵向受拉钢筋的极限拉应变取为0.01；5 纵向钢筋的应力取钢筋应变与其弹性模量的乘积，且钢筋应力不应超过钢筋抗拉、抗压强度设计值；对于轴心受压构件，钢筋的抗压强度设计值取值不应超过400N/mm²。',
    pdfPage: 25,
    printedPage: '11',
    sourceFile: 'GB 55008-2021 混凝土结构通用规范.pdf',
    sourceHash: '8c59c206d482efe8667e42629f37fe3a304ca31ec8d5625436a53b82c81a4bf4',
    verificationStatus: 'UNVERIFIED',
    linkedSkills: ['beam-flexure', 'beam-double-flexure', 'column'],
  },
];

export const INITIAL_REGISTRY: CodeRegistry = {
  editions: INITIAL_EDITIONS,
  clauses: INITIAL_CLAUSES,
  auditLogs: [],
};

import type { EvidenceSet, ClauseRelation, DesignTopic } from './registry';

/** 条文 → DesignTopic 映射（扩展用） */
export const CLAUSE_TOPIC_MAP: Record<string, DesignTopic[]> = {
  'GB50010-6.2.10': ['FLEXURE'],
  'GB50010-6.2.11': ['FLEXURE'],
  'GB50010-4.1.4': ['MATERIAL'],
  'GB50010-4.2.3': ['MATERIAL'],
};

/** 初始 EvidenceSet：矩形梁正截面受弯 */
export const INITIAL_EVIDENCE_SETS: EvidenceSet[] = [
  {
    id: 'eset-beam-flexure-rect',
    name: '矩形梁正截面受弯证据集',
    topic: 'FLEXURE',
    calculationModuleId: 'beam-flexure',
    calculationStepId: 'flexure-capacity',
    evidenceIds: ['GB50010-6.2.10', 'GB50010-4.1.4', 'GB50010-4.2.3'],
    completeness: 'COMPLETE',
    conflictStatus: 'NONE',
    verificationStatus: 'VERIFIED',
  },
];

/** 初始 ClauseRelation */
export const INITIAL_CLAUSE_RELATIONS: ClauseRelation[] = [];

/** 扩展后的 Registry 数据 */
export const INITIAL_REGISTRY_V2 = {
  ...INITIAL_REGISTRY,
  evidenceSets: INITIAL_EVIDENCE_SETS,
  clauseRelations: INITIAL_CLAUSE_RELATIONS,
};
