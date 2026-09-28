/**
 * 规范版本注册表（Agent 3）
 *
 * - 同一 codeNumber 下多个 edition 共存，绝不覆盖旧版。
 * - 判断"哪个版本现行"只依据注册数据中带来源的 status 字段，绝不凭模型记忆。
 * - resolve() 提供三种选择路径：指定版本 / 按实施日期 / 未指定（默认取已核验的 CURRENT）。
 */

import { NORMATIVE_CHANGE_SETS, NORMATIVE_VERSIONS } from './data';
import { CodeStatus, NormativeChangeSet, NormativeVersion, VerificationStatus } from './types';

/** 去除编号中的空格与连字符并大写，用于匹配 */
export function normalizeCode(code: string): string {
  return code.replace(/[\s-]/g, '').toUpperCase();
}

export interface VersionResolveOptions {
  /** 指定版本（edition 标识） */
  edition?: string;
  /** 按实施日期选择（ISO yyyy-mm-dd，取该日期已生效的最新版本） */
  effectiveDate?: string;
}

export interface VersionResolveResult {
  /** 解析出的版本；无法解析时为空 */
  version: NormativeVersion | undefined;
  /** 版本状态：解析失败/存在冲突时置为 REVIEW_REQUIRED */
  status: CodeStatus;
  /** 提示信息（版本冲突、被取代、未收录等） */
  warnings: string[];
}

export class NormativeVersionRegistry {
  private readonly versions: NormativeVersion[] = [];
  private readonly changeSets: NormativeChangeSet[] = [];

  constructor(initial?: NormativeVersion[], changeSets?: NormativeChangeSet[]) {
    for (const v of initial ?? NORMATIVE_VERSIONS) this.registerVersion(v);
    for (const c of changeSets ?? NORMATIVE_CHANGE_SETS) this.registerChangeSet(c);
  }

  /** 注册一个版本；同一 (codeNumber, edition) 重复注册抛错（防止静默覆盖旧版） */
  registerVersion(v: NormativeVersion): void {
    if (this.versions.some(x => normalizeCode(x.codeNumber) === normalizeCode(v.codeNumber) && x.edition === v.edition)) {
      throw new Error(`版本已存在，禁止覆盖旧版：${v.codeNumber} / ${v.edition}`);
    }
    this.versions.push({ ...v });
  }

  registerChangeSet(c: NormativeChangeSet): void {
    if (this.changeSets.some(x => x.id === c.id)) {
      throw new Error(`变更集已存在：${c.id}`);
    }
    this.changeSets.push({ ...c });
  }

  /** 某规范编号下的全部版本（按实施日期排序），用于展示多版本共存 */
  getVersions(codeNumber: string): NormativeVersion[] {
    return this.versions
      .filter(v => normalizeCode(v.codeNumber) === normalizeCode(codeNumber))
      .sort((a, b) => (a.effectiveDate < b.effectiveDate ? -1 : 1));
  }

  getVersion(codeNumber: string, edition: string): NormativeVersion | undefined {
    return this.versions.find(
      v => normalizeCode(v.codeNumber) === normalizeCode(codeNumber) && v.edition === edition
    );
  }

  listAll(): NormativeVersion[] {
    return [...this.versions];
  }

  /** 版本解析：指定版本 / 按实施日期 / 默认取已核验 CURRENT */
  resolve(codeNumber: string, opts: VersionResolveOptions = {}): VersionResolveResult {
    const code = normalizeCode(codeNumber);
    const versions = this.versions.filter(v => normalizeCode(v.codeNumber) === code);
    const warnings: string[] = [];

    if (versions.length === 0) {
      return { version: undefined, status: 'REVIEW_REQUIRED', warnings: ['未收录该规范编号的任何版本。'] };
    }

    // 1) 指定版本
    if (opts.edition) {
      const hit = versions.find(v => v.edition === opts.edition);
      if (!hit) {
        warnings.push(`未找到版本“${opts.edition}”，当前收录：${versions.map(v => v.edition).join(' / ')}。`);
        return { version: undefined, status: 'REVIEW_REQUIRED', warnings };
      }
      return this.withStatusWarnings(hit, warnings);
    }

    // 2) 按实施日期（取该日期已生效的最新版本）
    if (opts.effectiveDate) {
      const inForce = versions
        .filter(v => v.effectiveDate <= opts.effectiveDate!)
        .sort((a, b) => (a.effectiveDate < b.effectiveDate ? -1 : 1));
      const candidate = inForce.length ? inForce[inForce.length - 1] : undefined;
      if (!candidate) {
        warnings.push(`实施日期 ${opts.effectiveDate} 早于任何版本生效日，无法确定适用版本。`);
        return { version: undefined, status: 'REVIEW_REQUIRED', warnings };
      }
      return this.withStatusWarnings(candidate, warnings);
    }

    // 3) 未指定：取已核验的 CURRENT（有且仅有一个时才判定现行）
    const currentVerified = versions.filter(v => v.status === 'CURRENT' && v.verificationStatus === 'VERIFIED');
    if (currentVerified.length === 1) {
      return this.withStatusWarnings(currentVerified[0], warnings);
    }
    if (currentVerified.length > 1) {
      warnings.push('存在多个已核验 CURRENT 版本，无法据此判定现行，需人工确认。');
      return { version: undefined, status: 'REVIEW_REQUIRED', warnings };
    }
    const currentUnverified = versions.filter(v => v.status === 'CURRENT');
    if (currentUnverified.length > 0) {
      warnings.push('CURRENT 版本缺少可靠来源核验，暂无法确认现行版本。');
      return { version: currentUnverified[0], status: 'REVIEW_REQUIRED', warnings };
    }
    // 无 CURRENT：返回最新 SUPERSEDED/UPCOMING 作为提示，但标记 REVIEW_REQUIRED
    const latest = [...versions].sort((a, b) => (a.effectiveDate < b.effectiveDate ? -1 : 1)).pop();
    if (latest) {
      warnings.push(`无已核验 CURRENT 版本，最新版本为“${latest.edition}”（${latest.status}）。`);
      return { version: latest, status: 'REVIEW_REQUIRED', warnings };
    }
    return { version: undefined, status: 'REVIEW_REQUIRED', warnings };
  }

  /** 变更集 */
  getChangeSet(codeNumber: string, fromEdition: string, toEdition: string): NormativeChangeSet | undefined {
    return this.changeSets.find(
      c =>
        normalizeCode(c.codeNumber) === normalizeCode(codeNumber) &&
        c.fromEdition === fromEdition &&
        c.toEdition === toEdition
    );
  }

  listChangeSets(codeNumber?: string): NormativeChangeSet[] {
    if (!codeNumber) return [...this.changeSets];
    return this.changeSets.filter(c => normalizeCode(c.codeNumber) === normalizeCode(codeNumber));
  }

  /** 某版本被谁取代（返回取代它的 edition） */
  getReplacedBy(codeNumber: string, edition: string): string | undefined {
    return this.getVersion(codeNumber, edition)?.replacedBy;
  }

  private withStatusWarnings(v: NormativeVersion, warnings: string[]): VersionResolveResult {
    if (v.status === 'SUPERSEDED') {
      warnings.push(`版本“${v.edition}”已被“${v.replacedBy ?? '新版本'}”取代，仅供旧版项目复核，需按现行版本重新核验。`);
    } else if (v.status === 'UPCOMING') {
      warnings.push(`版本“${v.edition}”为 UPCOMING，尚未到实施日期。`);
    } else if (v.verificationStatus !== 'VERIFIED') {
      warnings.push(`版本“${v.edition}”状态缺少可靠来源核验（REVIEW_REQUIRED）。`);
    }
    return { version: v, status: v.status, warnings };
  }
}

export const normativeVersionRegistry = new NormativeVersionRegistry();
