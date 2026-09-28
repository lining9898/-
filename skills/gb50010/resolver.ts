import {
  NormativeAnswer,
  NormativeQuery,
  NormativeSkill,
  SkillEvidenceCatalog,
  SkillEvidenceRecord,
  SkillManifest,
  SkillPackage,
} from '../../src/agent/skill-types';

import manifest from './skill.json';
import schema from './schema.json';
import evidence from './evidence.json';
import tests from './tests.json';

const package_: SkillPackage = {
  manifest: manifest as SkillManifest,
  schema: schema as SkillPackage['schema'],
  evidence: evidence as SkillEvidenceCatalog,
  tests: tests as SkillPackage['tests'],
};

const normalizeCode = (code: string): string =>
  code.replace(/[\s-]/g, '').toUpperCase();

/**
 * GB 50010 normative resolver.
 * 只返回规范条文的元信息（名称、版本、章节、页码、适用范围）。
 * 禁止返回任何工程量、配筋面积、承载力数值。
 */
export function resolveGb50010(query: NormativeQuery): NormativeAnswer {
  const normalizedCode = normalizeCode(query.code);
  const records = (evidence as SkillEvidenceCatalog).records;

  // 在 evidence catalog 中查找匹配条文
  const match: SkillEvidenceRecord | undefined = records.find(
    r => normalizeCode(r.codeNumber) === normalizedCode && r.clause === query.clause
  );

  const base: NormativeAnswer = {
    query,
    codeName: match?.codeName ?? '混凝土结构设计规范',
    codeNumber: match?.codeNumber ?? 'GB 50010',
    edition: match?.edition ?? '2010（2015年版）',
    chapter: match?.chapter ?? '',
    clause: query.clause,
    text: '', // 原文未导入，不编造
    page: match?.pdfPage ?? null,
    source: match?.sourceFile ?? null,
    verificationStatus: match?.verificationStatus ?? 'UNVERIFIED',
    applicability: match?.applicability ?? '未收录条文',
    warnings: [],
  };

  if (!match) {
    base.warnings.push('未收录该条文，请人工查阅规范原文。');
  } else if (match.verificationStatus === 'REVIEW_REQUIRED') {
    base.warnings.push('条文原文未导入，暂不提供条文引用。');
  }

  return base;
}

export const gb50010Skill: NormativeSkill = {
  package: package_,
  resolve: resolveGb50010,
};
