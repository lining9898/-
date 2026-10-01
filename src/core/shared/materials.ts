/**
 * 共享材料参数与规范证据辅助
 *
 * 供板（单向/双向）、独立基础、板式楼梯等模块复用，避免各模块重复维护
 * 混凝土/钢筋材料参数与证据记录。
 *
 * 材料参数与 GB 50010-2010（2015年版）已校核证据页码：
 *   - 4.1.4 混凝土 fc/ft（表 4.1.4-1/4.1.4-2），PDF 第 34 页
 *   - 4.1.5 混凝土弹性模量（表 4.1.5），PDF 第 35 页
 *   - 4.2.3 钢筋强度设计值（表 4.2.3-1），PDF 第 38 页
 *   - 4.2.5 钢筋弹性模量（表 4.2.5），PDF 第 40 页
 *   - 6.2.6 等效矩形应力图系数 α1/β1，PDF 第 52/53 页
 */

import { Evidence } from '../../types/evidence';

/** 混凝土材料参数 */
export interface ConcreteParams {
  fc: number;       // 轴心抗压强度设计值 (MPa)
  ft: number;       // 轴心抗拉强度设计值 (MPa)
  Ec: number;       // 弹性模量 (MPa)
  alpha1: number;   // 等效矩形应力图系数
  beta1: number;    // 等效矩形应力图系数
}

/** 钢筋材料参数 */
export interface SteelParams {
  fy: number;       // 抗拉强度设计值 (MPa)
  Es: number;       // 弹性模量 (MPa)
}

/** 常用混凝土等级参数（GB 50010-2010(2015年版) 表 4.1.4-1/4.1.4-2、4.1.5） */
export const CONCRETE_PARAMS: Record<string, ConcreteParams> = {
  C20: { fc: 9.6, ft: 1.10, Ec: 25500, alpha1: 1.0, beta1: 0.80 },
  C25: { fc: 11.9, ft: 1.27, Ec: 28000, alpha1: 1.0, beta1: 0.80 },
  C30: { fc: 14.3, ft: 1.43, Ec: 30000, alpha1: 1.0, beta1: 0.80 },
  C35: { fc: 16.7, ft: 1.57, Ec: 31500, alpha1: 1.0, beta1: 0.80 },
  C40: { fc: 19.1, ft: 1.71, Ec: 32500, alpha1: 1.0, beta1: 0.80 },
  C45: { fc: 21.1, ft: 1.80, Ec: 33500, alpha1: 1.0, beta1: 0.80 },
  C50: { fc: 23.1, ft: 1.89, Ec: 34500, alpha1: 1.0, beta1: 0.80 },
};

/** 常用钢筋等级参数（GB 50010-2010(2015年版) 表 4.2.3-1、4.2.5） */
export const STEEL_PARAMS: Record<string, SteelParams> = {
  HPB300: { fy: 270, Es: 210000 },
  HRB335: { fy: 300, Es: 200000 },
  HRB400: { fy: 360, Es: 200000 },
  HRB500: { fy: 435, Es: 200000 },
};

/** 混凝土强度等级清单（供 schema/UI 使用） */
export const CONCRETE_GRADES = Object.keys(CONCRETE_PARAMS);

/** 现行钢筋等级清单；历史 HRB335 参数仅供旧版项目追溯。 */
export const STEEL_GRADES = Object.keys(STEEL_PARAMS).filter(grade => grade !== 'HRB335');

/**
 * IG-001：GB/T 50010-2010（2024 局部修订）4.1.2 条——
 * 钢筋混凝土结构最低混凝土强度等级由 C20 提高至 C25。
 * 已定位修订原页；模块公式、强制规范映射及独立算例仍待复核。
 *
 * 硬限制：actualGrade < requiredMinimumGrade → BLOCKED，禁止进入正式计算。
 * requiredMinimumGrade 作为参数入口，未来调整为 C30 时无需改各模块。
 */
export function concreteGradeCompliance(
  actualGrade: string,
  requiredMinimumGrade: number = 25
): {
  passed: boolean;
  code: 'CONCRETE_GRADE_BELOW_MINIMUM' | null;
  message: string;
} {
  const m = /^C(\d+)$/i.exec(actualGrade);
  if (!m) {
    return { passed: false, code: 'CONCRETE_GRADE_BELOW_MINIMUM', message: `无法解析混凝土等级: ${actualGrade}` };
  }
  const gradeNum = parseInt(m[1], 10);
  if (gradeNum < requiredMinimumGrade) {
    return {
      passed: false,
      code: 'CONCRETE_GRADE_BELOW_MINIMUM',
      message: `GB/T 50010-2010（2024 局部修订）4.1.2 条：钢筋混凝土结构最低混凝土强度等级为 C${requiredMinimumGrade}；当前输入 ${actualGrade} 低于该要求，计算已被阻断。`,
    };
  }
  return { passed: true, code: null, message: '' };
}

/**
 * 2024 局部修订的材料选用入口。
 * GB/T 50010-2010 第 4.1.2 条跨修订 PDF 第 5—6 页；第 4.2.1 条位于第 7 页。
 * 保留历史参数表供旧版项目追溯，现行计算在此统一拦截已删除的钢筋牌号。
 */
export function materialSelectionCompliance(
  concreteGrade: string,
  steelGrades: string | string[],
  requiredMinimumGrade = 25
): { passed: boolean; code: 'CONCRETE_GRADE_BELOW_MINIMUM' | 'STEEL_GRADE_RETIRED' | null; message: string } {
  const grades = (Array.isArray(steelGrades) ? steelGrades : [steelGrades]).map(g => g.toUpperCase());
  if (grades.includes('HRB335')) {
    return {
      passed: false,
      code: 'STEEL_GRADE_RETIRED',
      message: 'GB/T 50010-2010（2024 局部修订）4.2.1 条已删除 HRB335；当前材料选用不适用于现行标准。',
    };
  }
  const minimum = grades.some(g => /500$/.test(g))
    ? Math.max(requiredMinimumGrade, 30)
    : requiredMinimumGrade;
  return concreteGradeCompliance(concreteGrade, minimum);
}

/** 现行材料输入规则的条文证据；计算模块整体仍需独立复核。 */
export function currentMaterialSelectionEvidence(): Evidence[] {
  const edition = '2010（2024年版，GB/T 50010-2010）';
  const sourceFile = 'GBT50010-2010_2024_amendment.pdf';
  const basis = (clause: string, originalText: string, pdfPage: number): Evidence => ({
    codeName: '混凝土结构设计标准', codeNumber: 'GB 50010', edition,
    chapter: '第4章 材料', clause, originalText, pdfPage,
    status: 'current', verificationStatus: 'REVIEW_REQUIRED', sourceFile,
  });
  return [
    basis('4.1.2', '钢筋混凝土结构最低混凝土强度等级为 C25；采用 500MPa 及以上钢筋时不低于 C30。', 6),
    basis('4.2.1', '2024 局部修订从普通钢筋与箍筋的选用清单删除 HRB335。', 7),
  ];
}

/** 2024 版 8.5.1 对强制规范的引用及 GB 55008 表 4.4.6；原页已定位，模块复核未闭环。 */
export function currentMinimumReinforcementEvidence(): Evidence[] {
  return [
    {
      codeName: '混凝土结构设计标准', codeNumber: 'GB 50010',
      edition: '2010（2024年版，GB/T 50010-2010）', chapter: '第8章 纵向受力钢筋的最小配筋率',
      clause: '8.5.1',
      originalText: '纵向受力钢筋最小配筋百分率应按 GB 55008 执行，且不小于表 8.5.1 的数值；受弯、偏心受拉及轴心受拉构件一侧受拉钢筋取 0.20% 与 45ft/fy% 的较大值。',
      pdfPage: 14, status: 'current', verificationStatus: 'REVIEW_REQUIRED',
      sourceFile: 'GBT50010-2010_2024_amendment.pdf',
    },
    {
      codeName: '混凝土结构通用规范', codeNumber: 'GB 55008', edition: '2021',
      chapter: '第4章 构件设计', clause: '4.4.6',
      originalText: '表 4.4.6 规定受弯构件、偏心受拉及轴心受拉构件一侧受拉钢筋的最小配筋率为 0.20% 与 45ft/fy% 的较大值；框架梁抗震构造另需核对 4.4.8。',
      pdfPage: 16, status: 'current', verificationStatus: 'REVIEW_REQUIRED',
      sourceFile: 'GB55008-2021.pdf',
    },
  ];
}

/** 将现行材料规则接入计算结果的材料项和规范证据汇总。 */
export function attachCurrentMaterialSelectionEvidence<T extends { allEvidence: Evidence[]; materials: { label: string; value: number | string; unit: string; evidence?: Evidence[] }[] }>(result: T): T {
  const currentEvidence = currentMaterialSelectionEvidence();
  result.allEvidence = [...result.allEvidence, ...currentEvidence];
  result.materials = result.materials.map(item => {
    const matching = /混凝土|\bfc\b|\bft\b/i.test(item.label)
      ? currentEvidence.filter(ev => ev.clause === '4.1.2')
      : /钢筋|钢材|^fy|^Es$/i.test(item.label)
        ? currentEvidence.filter(ev => ev.clause === '4.2.1')
        : [];
    return matching.length
      ? { ...item, evidence: [...(item.evidence ?? []), ...matching] }
      : item;
  });
  return result;
}

/**
 * 已校核的 GB 50010-2010(2015年版) 证据。
 * 仅当条文页码来自仓库内 PDF 校核记录时才可标记 VERIFIED，否则用 reviewRequiredEvidence。
 */
export function verifiedEvidence(
  clause: string,
  chapter: string,
  originalText: string,
  pdfPage: number
): Evidence {
  return {
    codeName: '混凝土结构设计规范',
    codeNumber: 'GB 50010',
    edition: '2010(2015)',
    chapter,
    clause,
    originalText,
    pdfPage,
    status: 'superseded',
    verificationStatus: 'VERIFIED',
    sourceFile: 'GB50010-2010_2015_.pdf',
  };
}

/**
 * 待校核证据。
 * 当可靠来源（规范原文 PDF、已校核页码）不足时使用，绝不虚构页码。
 */
export function reviewRequiredEvidence(
  clause: string,
  chapter: string,
  originalText: string,
  codeNumber = 'GB 50010',
  codeName = '混凝土结构设计规范',
  edition = '2010（2015年版）'
): Evidence {
  return {
    codeName,
    codeNumber,
    edition,
    chapter,
    clause,
    originalText,
    pdfPage: null,
    status: 'current',
    verificationStatus: 'REVIEW_REQUIRED',
    sourceFile: null,
  };
}
