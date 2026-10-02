import type { Evidence } from '../types/evidence';
import { normalizeCode, normativeVersionRegistry } from './registry';

/** 条文定位与项目签核是两个独立状态。此表只声明矩形梁正截面受弯模块的条文—代码关系。 */
export interface BeamFlexureClauseLink {
  codeNumber: string;
  edition: 'current' | '2015';
  clause: string;
  sourceFile: string;
  pdfPage: number;
  implementation: string;
  appliesWhen: 'always' | 'frameBeam' | 'seismicFrameBeam' | 'seismic';
}

export const BEAM_FLEXURE_CLAUSE_MAP: BeamFlexureClauseLink[] = [
  { codeNumber: 'GB 50010', edition: 'current', clause: '4.1.2', sourceFile: 'GBT50010-2010_2024_amendment.pdf', pdfPage: 6, implementation: 'materials.ts materialSelectionCompliance：C25/C30 最低等级', appliesWhen: 'always' },
  { codeNumber: 'GB 50010', edition: 'current', clause: '4.2.1', sourceFile: 'GBT50010-2010_2024_amendment.pdf', pdfPage: 7, implementation: 'materials.ts materialSelectionCompliance：剔除 HRB335', appliesWhen: 'always' },
  { codeNumber: 'GB 50010', edition: 'current', clause: '表 4.1.4-1', sourceFile: 'GBT50010-2010_2024_amendment.pdf', pdfPage: 6, implementation: 'flexure.ts CONCRETE_PARAMS.fc', appliesWhen: 'always' },
  { codeNumber: 'GB 50010', edition: 'current', clause: '表 4.1.4-2', sourceFile: 'GBT50010-2010_2024_amendment.pdf', pdfPage: 7, implementation: 'flexure.ts CONCRETE_PARAMS.ft', appliesWhen: 'always' },
  { codeNumber: 'GB 50010', edition: 'current', clause: '表 4.2.3-1', sourceFile: 'GBT50010-2010_2024_amendment.pdf', pdfPage: 9, implementation: 'flexure.ts STEEL_PARAMS.fy', appliesWhen: 'always' },
  { codeNumber: 'GB 50010', edition: 'current', clause: '表 4.2.5', sourceFile: 'GBT50010-2010_2024_amendment.pdf', pdfPage: 11, implementation: 'flexure.ts STEEL_PARAMS.Es', appliesWhen: 'always' },
  { codeNumber: 'GB 50010', edition: 'current', clause: '8.5.1', sourceFile: 'GBT50010-2010_2024_amendment.pdf', pdfPage: 14, implementation: 'flexure.ts AsMin：调用 GB 55008 4.4.6/4.4.8 下限', appliesWhen: 'always' },
  { codeNumber: 'GB 50010', edition: 'current', clause: '局部修订说明（6.2 节）', sourceFile: 'GBT50010-2010_2024_amendment.pdf', pdfPage: 2, implementation: 'flexure.ts 6.2.1/6.2.6/6.2.7/6.2.10 沿用 2015 版公式；现行强制规范另校', appliesWhen: 'always' },
  { codeNumber: 'GB 50010', edition: '2015', clause: '6.2.1', sourceFile: 'GB50010-2010_2015_.pdf', pdfPage: 50, implementation: 'flexure.ts ξb：C50 及以下 εcu=0.0033', appliesWhen: 'always' },
  { codeNumber: 'GB 50010', edition: '2015', clause: '6.2.6', sourceFile: 'GB50010-2010_2015_.pdf', pdfPage: 53, implementation: 'flexure.ts α1=1、β1=0.8', appliesWhen: 'always' },
  { codeNumber: 'GB 50010', edition: '2015', clause: '6.2.7', sourceFile: 'GB50010-2010_2015_.pdf', pdfPage: 53, implementation: 'flexure.ts ξb 界限相对受压区高度', appliesWhen: 'always' },
  { codeNumber: 'GB 50010', edition: '2015', clause: '6.2.10', sourceFile: 'GB50010-2010_2015_.pdf', pdfPage: 55, implementation: 'flexure.ts x、ξ、Mu 及 ξ≤ξb；单筋矩形简化模型', appliesWhen: 'always' },
  { codeNumber: 'GB 50010', edition: '2015', clause: '8.5.1', sourceFile: 'GB50010-2010_2015_.pdf', pdfPage: 124, implementation: 'flexure.ts AsMin 历史表值对照', appliesWhen: 'always' },
  { codeNumber: 'GB 55008', edition: 'current', clause: '4.4.2', sourceFile: 'GB55008-2021.pdf', pdfPage: 14, implementation: 'flexure.ts 正截面受弯简化模型适用前提', appliesWhen: 'always' },
  { codeNumber: 'GB 55008', edition: 'current', clause: '4.4.6', sourceFile: 'GB55008-2021.pdf', pdfPage: 16, implementation: 'flexure.ts 一般受弯最小配筋率', appliesWhen: 'always' },
  { codeNumber: 'GB 55008', edition: 'current', clause: '4.4.4', sourceFile: 'GB55008-2021.pdf', pdfPage: 15, implementation: 'flexure.ts / construction.ts 框架梁 b≥200 mm', appliesWhen: 'frameBeam' },
  { codeNumber: 'GB 55008', edition: 'current', clause: '4.4.8', sourceFile: 'GB55008-2021.pdf', pdfPage: 17, implementation: 'flexure.ts 框架梁抗震最小配筋率；梁端其他构造另验', appliesWhen: 'seismicFrameBeam' },
  { codeNumber: 'GB 55001', edition: 'current', clause: '3.1.7', sourceFile: 'GB55001-2021.pdf', pdfPage: 12, implementation: 'flexure.ts momentBasis：记录外部作用组合来源', appliesWhen: 'always' },
  { codeNumber: 'GB 55001', edition: 'current', clause: '3.1.10', sourceFile: 'GB55001-2021.pdf', pdfPage: 13, implementation: 'flexure.ts γ0M≤Mu/γRE', appliesWhen: 'always' },
  { codeNumber: 'GB 55001', edition: 'current', clause: '3.1.12', sourceFile: 'GB55001-2021.pdf', pdfPage: 13, implementation: 'flexure.ts 按设计状况/安全等级选择 γ0', appliesWhen: 'always' },
  { codeNumber: 'GB 50009', edition: 'current', clause: '3.2.2', sourceFile: 'GB50009-2012.pdf', pdfPage: 20, implementation: 'flexure.ts momentBasis：上游组合责任边界', appliesWhen: 'always' },
  { codeNumber: 'GB 50009', edition: 'current', clause: '3.2.3', sourceFile: 'GB50009-2012.pdf', pdfPage: 20, implementation: 'flexure.ts momentBasis：最不利效应来源待项目复核', appliesWhen: 'always' },
  { codeNumber: 'GB 55002', edition: 'current', clause: '4.3.1', sourceFile: 'GB55002-2021.pdf', pdfPage: 18, implementation: 'flexure.ts 地震组合 γRE=.75；竖向地震控制取 1.0', appliesWhen: 'seismic' },
];

export function resolveBeamFlexureClauseMap(evidence: Evidence[]) {
  const entries = BEAM_FLEXURE_CLAUSE_MAP.map(link => {
    const currentVersion = link.edition === 'current'
      ? normativeVersionRegistry.resolve(link.codeNumber).version : undefined;
    const attached = evidence.some(item =>
      normalizeCode(item.codeNumber) === normalizeCode(link.codeNumber)
      && item.clause === link.clause
      && item.sourceFile === link.sourceFile
      && item.pdfPage === link.pdfPage
      && (link.edition === '2015' ? item.edition.includes('2015')
        : Boolean(currentVersion && (item.edition === currentVersion.edition
          || item.edition === currentVersion.designation)))
    );
    return { ...link, attached };
  });
  const missing = entries.filter(item => item.appliesWhen === 'always' && !item.attached);
  return {
    status: missing.length ? 'INCOMPLETE' as const : 'MAPPED' as const,
    entries,
    missing: missing.map(item => `${item.codeNumber} §${item.clause}`),
  };
}
