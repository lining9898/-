/**
 * 规范版本模型（Agent 3 — 规范版本管理）
 *
 * 设计原则：
 * 1. 同一规范编号可以同时存在多个 edition，绝不覆盖旧版。
 * 2. 判断"哪个版本现行"不得凭模型记忆，必须基于可靠、可追溯来源（source）。
 * 3. 版本状态（status）与证据（Evidence）分开核验：
 *    - 版本 status 有可靠来源 => verificationStatus = VERIFIED；
 *    - 无法确认来源 => status 置为 REVIEW_REQUIRED，verificationStatus = REVIEW_REQUIRED。
 */

/** 规范版本生命周期状态 */
export type CodeStatus = 'CURRENT' | 'UPCOMING' | 'SUPERSEDED' | 'REVIEW_REQUIRED';

/** 证据核验状态（与 src/types/evidence.ts 对齐） */
export type VerificationStatus = 'VERIFIED' | 'REVIEW_REQUIRED' | 'UNVERIFIED';

/** 规范在融合计算中的约束层级。强制性通用规范不得被配套标准覆盖。 */
export type NormativeAuthorityLevel = 'MANDATORY_GENERAL_CODE' | 'SUPPORTING_STANDARD';

/**
 * 统一规范版本条目。
 * 以 (codeNumber, edition) 为唯一键，同一 codeNumber 下可共存多个 edition。
 */
export interface NormativeVersion {
  /** 规范名称，如 "混凝土结构设计规范" */
  codeName: string;
  /** 规范编号（家族号，不含年号），如 "GB 50010" */
  codeNumber: string;
  /** 现行编号/名称（含年号），如 "GB 50010-2010"、"GB/T 50010-2010" */
  designation: string;
  /** 版本标识，如 "2010（2015年版）"、"2010（2024年版，GB/T 50010-2010）" */
  edition: string;
  /** 发布日期（ISO yyyy-mm-dd） */
  publishDate: string;
  /** 实施日期（ISO yyyy-mm-dd） */
  effectiveDate: string;
  /** 版本状态：CURRENT / UPCOMING / SUPERSEDED / REVIEW_REQUIRED */
  status: CodeStatus;
  /** 被哪个版本取代（edition 标识） */
  replacedBy?: string;
  /** 版本状态来源（可靠、可追溯的 URL / 文件），禁止为空后仍标记 VERIFIED */
  source: string;
  /** 版本状态核验状态：有可靠来源 => VERIFIED；否则 REVIEW_REQUIRED */
  verificationStatus: VerificationStatus;
  /** 强制性通用规范或配套设计标准；旧数据未声明时按配套标准处理 */
  authorityLevel?: NormativeAuthorityLevel;
  /** 补充说明（如"局部修订"、"名称/编号变更"等） */
  note?: string;
}

/**
 * 规范版本差异（Change Set）。
 * 用于回答："新规范发布后，我哪些计算模块需要重新验证？"
 */
export interface NormativeChangeSet {
  /** 变更集 ID，如 "gb50010-2015-to-2024" */
  id: string;
  /** 规范编号 */
  codeNumber: string;
  /** 变更前版本（edition） */
  fromEdition: string;
  /** 变更后版本（edition） */
  toEdition: string;
  /** 变更的条文号列表 */
  changedClauses: string[];
  /** 变更的公式号/公式描述列表 */
  changedFormulas: string[];
  /** 变更的参数/材料/限值列表 */
  changedParameters: string[];
  /** 变更的适用范围说明 */
  changedApplicability: string[];
  /** 受影响的 Calculation Skill（标记其进入 REVIEW_REQUIRED） */
  affectedSkills: string[];
  /** 复核日期 */
  reviewDate: string;
  /** 变更依据来源（可靠、可追溯 URL / 文件） */
  source: string;
  /** 变更集核验状态：仅有可靠依据且已完成差异核查 => VERIFIED；否则 REVIEW_REQUIRED */
  verificationStatus: VerificationStatus;
  /** 补充说明 */
  note?: string;
}
