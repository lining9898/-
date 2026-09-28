/**
 * 版本感知的 Normative Skill 工厂（Agent 3）
 *
 * 由 SkillRegistry 路由到对应规范编号的 Skill 后，resolve() 内部：
 * 1. 通过规范版本注册表解析目标版本（指定版本 / 按实施日期 / 默认现行）。
 * 2. 仅在解析到的版本与 Skill 所绑定 edition 一致时才返回该版 evidence；
 *    其他版本（未收录 evidence）一律 UNVERIFIED + 警告，绝不凭记忆作答。
 * 3. NormativeAnswer 只回答规范问题，绝不包含 Mu/Vu/Nu/As/承载力/配筋/工程量字段。
 */

import {
  NormativeAnswer,
  NormativeQuery,
  NormativeSkill,
  SkillEvidenceCatalog,
  SkillEvidenceRecord,
  SkillManifest,
  SkillPackage,
} from '../agent/skill-types';
import { normativeVersionRegistry, normalizeCode } from './registry';

export interface NormativeSkillFactoryOptions {
  /** 该 Skill 的 evidence 所绑定的版本（edition 标识） */
  primaryEdition: string;
  /** 兜底规范名称（未命中 evidence 时使用） */
  fallbackCodeName: string;
  /** 兜底规范编号 */
  fallbackCodeNumber: string;
}

export function createNormativeSkill(
  pkg: SkillPackage,
  opts: NormativeSkillFactoryOptions
): NormativeSkill {
  const { primaryEdition, fallbackCodeName, fallbackCodeNumber } = opts;
  const records = (pkg.evidence as SkillEvidenceCatalog).records;
  const registry = normativeVersionRegistry;

  function resolve(query: NormativeQuery): NormativeAnswer {
    const normalizedCode = normalizeCode(query.code);
    const codeMatches =
      normalizeCode(fallbackCodeNumber) === normalizedCode ||
      records.some(r => normalizeCode(r.codeNumber) === normalizedCode);

    if (!codeMatches) {
      return {
        query,
        codeName: '未知规范',
        codeNumber: query.code,
        edition: '',
        codeStatus: 'REVIEW_REQUIRED',
        chapter: '',
        clause: query.clause,
        text: '',
        page: null,
        source: null,
        verificationStatus: 'UNVERIFIED',
        applicability: '未收录规范',
        warnings: ['该规范编号未接入本 Normative Skill。'],
      };
    }

    // 1) 解析目标版本
    const versionResult = registry.resolve(fallbackCodeNumber, {
      edition: query.edition,
      effectiveDate: query.effectiveDate,
    });
    const warnings: string[] = [...versionResult.warnings];
    const resolvedEdition = versionResult.version?.edition ?? primaryEdition;

    // 2) 仅当解析版本 == primaryEdition 才使用本 Skill 的 evidence
    if (query.edition && query.edition !== primaryEdition) {
      // 明确指定了其他版本
      const rec: SkillEvidenceRecord | undefined = records.find(
        r => normalizeCode(r.codeNumber) === normalizedCode && r.clause === query.clause
      );
      return buildAnswer(query, rec, resolvedEdition, {
        warnings: [
          `本 Skill 仅收录“${primaryEdition}”版本的 evidence，无法核验“${query.edition}”版本条文。`,
          ...warnings,
        ],
        status: 'UNVERIFIED',
      });
    }

    if (resolvedEdition !== primaryEdition) {
      // 未指定版本，但默认/按日期解析到的版本不是本 Skill 绑定的版本
      const rec: SkillEvidenceRecord | undefined = records.find(
        r => normalizeCode(r.codeNumber) === normalizedCode && r.clause === query.clause
      );
      return buildAnswer(query, rec, resolvedEdition, {
        warnings: [
          `当前解析版本“${resolvedEdition}”未收录 evidence；本 Skill 仅提供“${primaryEdition}”版本条文，请按项目实施日期/版本核验。`,
          ...warnings,
        ],
        status: 'UNVERIFIED',
      });
    }

    // 3) 在 primaryEdition 的 evidence 中查找条文
    const match: SkillEvidenceRecord | undefined = records.find(
      r => normalizeCode(r.codeNumber) === normalizedCode && r.clause === query.clause
    );
    return buildAnswer(query, match, resolvedEdition, {
      warnings,
      status: match?.verificationStatus ?? 'UNVERIFIED',
    });
  }

  function buildAnswer(
    query: NormativeQuery,
    rec: SkillEvidenceRecord | undefined,
    edition: string,
    extra: { warnings: string[]; status: NormativeAnswer['verificationStatus'] }
  ): NormativeAnswer {
    const version = registry.getVersion(fallbackCodeNumber, edition);
    const answer: NormativeAnswer = {
      query,
      codeName: rec?.codeName ?? fallbackCodeName,
      codeNumber: rec?.codeNumber ?? fallbackCodeNumber,
      edition: rec?.edition ?? edition,
      codeStatus: version?.status ?? 'REVIEW_REQUIRED',
      effectiveDate: version?.effectiveDate,
      replacedBy: version?.replacedBy,
      chapter: rec?.chapter ?? '',
      clause: query.clause,
      text: rec?.text ?? '',
      page: rec?.pdfPage ?? null,
      source: rec?.sourceFile ?? null,
      verificationStatus: extra.status,
      applicability: rec?.applicability ?? '未收录条文',
      warnings: extra.warnings,
    };
    if (!rec) {
      answer.warnings.push('未收录该条文，请人工查阅规范原文。');
    } else if (rec.verificationStatus === 'REVIEW_REQUIRED') {
      answer.warnings.push('条文原文未导入/未核验，暂不提供条文引用。');
    } else if (rec.verificationStatus === 'VERIFIED' && !rec.text) {
      answer.warnings.push('该条文已核验但未登记原文 text，请补录原文片段。');
    }
    return answer;
  }

  return { package: pkg, resolve };
}

/** 便捷：从 manifest/schema/evidence/tests 构建 SkillPackage */
export function buildPackage(
  manifest: SkillManifest,
  schema: SkillPackage['schema'],
  evidence: SkillEvidenceCatalog,
  tests: SkillPackage['tests']
): SkillPackage {
  return { manifest, schema, evidence, tests };
}
