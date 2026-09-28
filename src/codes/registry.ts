/**
 * 规范注册表（兼容层）
 *
 * 状态一律委托给 `src/normative/registry.ts`（来源驱动、多版本共存）。
 * 禁止在此硬编码"哪个版本现行"——一律以可靠、可追溯来源为准。
 */

import { normativeVersionRegistry } from '../normative/registry';

export interface CodeEntry {
  codeNumber: string;
  codeName: string;
  edition: string;
  /** current | superseded | draft（兼容旧接口映射） */
  status: 'current' | 'superseded' | 'draft';
  description: string;
  sourceFile: string | null;
  importedAt: string | null;
  /** 版本状态核验来源 */
  source: string;
  /** 版本状态核验状态 */
  verificationStatus: string;
}

/** 将版本注册表条目映射为旧接口的 CodeEntry */
export function getRegisteredCodes(): CodeEntry[] {
  return normativeVersionRegistry.listAll().map(v => ({
    codeNumber: v.codeNumber,
    codeName: v.codeName,
    edition: v.edition,
    status: v.status === 'CURRENT' ? 'current' : v.status === 'SUPERSEDED' ? 'superseded' : 'draft',
    description: v.note ?? '',
    sourceFile: null,
    importedAt: null,
    source: v.source,
    verificationStatus: v.verificationStatus,
  }));
}

export function getCodeByNumber(codeNumber: string): CodeEntry | undefined {
  // 返回该编号下解析到的默认版本（未指定版本时取已核验 CURRENT）
  const res = normativeVersionRegistry.resolve(codeNumber);
  if (!res.version) return undefined;
  return getRegisteredCodes().find(c => c.codeNumber === res.version!.codeNumber && c.edition === res.version!.edition);
}

export function getCodeVersions(codeNumber: string): CodeEntry[] {
  return getRegisteredCodes().filter(c => c.codeNumber === codeNumber);
}
