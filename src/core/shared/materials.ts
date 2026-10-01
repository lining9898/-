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

/** 钢筋等级清单 */
export const STEEL_GRADES = Object.keys(STEEL_PARAMS);

/**
 * IG-001：GB/T 50010-2010（2024 局部修订）4.1.2 条——
 * 钢筋混凝土结构最低混凝土强度等级由 C20 提高至 C25。
 * 人工核对完成（2026-10-01），升级为 HUMAN_VERIFIED。
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
