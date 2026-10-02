import type { Evidence, VerificationStatus } from '../types/evidence';
import { resolveCurrentStandardFusion, type StructuralDomain } from './fusion';
import { normalizeCode, normativeVersionRegistry } from './registry';
import type { NormativeAuthorityLevel } from './types';

export interface FusedBasisStandard {
  codeNumber: string;
  designation: string;
  edition: string;
  role: string;
  authorityLevel: NormativeAuthorityLevel;
  versionSource: string | null;
  clauseEvidenceStatus: VerificationStatus;
  currentClauses: string[];
  historicalClauses: string[];
}

export interface FusedCalculationBasis {
  moduleId: string;
  domain: StructuralDomain;
  status: 'VERIFIED' | 'REVIEW_REQUIRED' | 'INCOMPLETE';
  fingerprint: string;
  standards: FusedBasisStandard[];
  changeSetIds: string[];
  warnings: string[];
}

export function domainForCalculation(moduleId: string): StructuralDomain {
  if (moduleId.includes('foundation')) return 'FOUNDATION';
  if (moduleId.includes('steel')) return 'STEEL';
  if (/beam|column|slab|stair/.test(moduleId) && moduleId !== 'beam-continuous') return 'CONCRETE';
  return 'GENERAL';
}

const effectiveSkill = (moduleId: string): string =>
  moduleId.startsWith('column-') ? 'column' : moduleId;

/** 从当前版本注册表、强制性规范融合关系和本次计算 Evidence 生成同一份依据快照。 */
export function resolveCalculationNormativeBasis(
  moduleId: string,
  evidence: Evidence[]
): FusedCalculationBasis {
  const domain = domainForCalculation(moduleId);
  const fusion = resolveCurrentStandardFusion(domain);
  // 模块的附加规范（例如地震组合才适用的 GB 55002）由本次 Evidence 接入依据快照。
  const conditionalStandards = [...new Set(evidence.map(ev => ev.codeNumber))]
    .filter(codeNumber => !fusion.standards.some(item => normalizeCode(item.codeNumber) === normalizeCode(codeNumber)))
    .map(codeNumber => {
      const resolved = normativeVersionRegistry.resolve(codeNumber);
      return { codeNumber, role: '本次计算条件触发的补充规范',
        authorityLevel: resolved.version?.authorityLevel ?? 'SUPPORTING_STANDARD' as NormativeAuthorityLevel,
        version: resolved.version, clauseEvidenceStatus: 'REVIEW_REQUIRED' as VerificationStatus,
        warnings: resolved.warnings };
    });
  const standards: FusedBasisStandard[] = [...fusion.standards, ...conditionalStandards].map(item => {
    const matching = evidence.filter(ev => normalizeCode(ev.codeNumber) === normalizeCode(item.codeNumber));
    const current = matching.filter(ev =>
      item.version && (ev.edition === item.version.edition || ev.edition === item.version.designation)
    );
    const historical = matching.filter(ev => !current.includes(ev));
    return {
      codeNumber: item.codeNumber,
      designation: item.version?.designation ?? item.codeNumber,
      edition: item.version?.edition ?? '',
      role: item.role,
      authorityLevel: item.authorityLevel,
      versionSource: item.version?.source ?? null,
      clauseEvidenceStatus: item.clauseEvidenceStatus,
      currentClauses: [...new Set(current.map(ev => ev.clause))],
      historicalClauses: [...new Set(historical.map(ev => `${ev.edition} §${ev.clause}`))],
    };
  });
  const changeSets = normativeVersionRegistry.listChangeSets().filter(change =>
    change.affectedSkills.includes(effectiveSkill(moduleId)) &&
    standards.some(standard =>
      normalizeCode(standard.codeNumber) === normalizeCode(change.codeNumber) &&
      standard.edition === change.toEdition
    )
  );
  const warnings = [...fusion.warnings];
  for (const standard of standards) {
    if (standard.clauseEvidenceStatus !== 'VERIFIED') {
      warnings.push(`${standard.designation} 的逐条融合证据仍待核验。`);
    }
    if (standard.historicalClauses.length) {
      warnings.push(`${standard.designation} 仍引用历史版计算证据：${standard.historicalClauses.join('、')}。`);
    }
  }
  for (const change of changeSets) {
    if (change.verificationStatus !== 'VERIFIED') {
      warnings.push(`${change.toEdition} 的差异记录及受影响计算项仍待独立复核。`);
    }
  }

  // 指纹只用于识别依据快照变化，不作为规范原文真实性证明。
  const snapshot = JSON.stringify({
    standards,
    changes: changeSets.map(change => ({
      id: change.id, changedClauses: change.changedClauses,
      changedFormulas: change.changedFormulas, changedParameters: change.changedParameters,
      changedApplicability: change.changedApplicability, source: change.source,
      verificationStatus: change.verificationStatus,
    })),
    evidence: evidence.map(ev => [ev.codeNumber, ev.edition, ev.clause, ev.sourceFile,
      ev.pdfPage, ev.originalText, ev.verificationStatus]),
  });
  let hash = 2166136261;
  for (let index = 0; index < snapshot.length; index += 1) {
    hash ^= snapshot.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const status = fusion.status === 'INCOMPLETE' || conditionalStandards.some(item => !item.version || item.version.status !== 'CURRENT')
    ? 'INCOMPLETE'
    : fusion.status === 'REVIEW_REQUIRED' || changeSets.some(change => change.verificationStatus !== 'VERIFIED')
      ? 'REVIEW_REQUIRED'
      : 'VERIFIED';
  return { moduleId, domain, status, fingerprint: `basis_${(hash >>> 0).toString(16)}`,
    standards, changeSetIds: changeSets.map(change => change.id), warnings };
}
