import { normativeVersionRegistry } from './registry';
import type { NormativeAuthorityLevel, NormativeVersion, VerificationStatus } from './types';

export type StructuralDomain = 'GENERAL' | 'CONCRETE' | 'STEEL' | 'FOUNDATION';
export type FusionStatus = 'VERIFIED' | 'REVIEW_REQUIRED' | 'INCOMPLETE';

interface StandardRequirement {
  codeNumber: string;
  role: string;
  clauseEvidenceStatus: VerificationStatus;
}

export interface ResolvedFusionStandard {
  codeNumber: string;
  role: string;
  authorityLevel: NormativeAuthorityLevel;
  version?: NormativeVersion;
  clauseEvidenceStatus: VerificationStatus;
  warnings: string[];
}

export interface ResolvedStandardFusion {
  domain: StructuralDomain;
  status: FusionStatus;
  standards: ResolvedFusionStandard[];
  warnings: string[];
}

export const DOMAIN_LABELS: Record<StructuralDomain, string> = {
  GENERAL: '结构通用',
  CONCRETE: '混凝土结构',
  STEEL: '钢结构',
  FOUNDATION: '地基基础',
};

const GENERAL: StandardRequirement[] = [
  { codeNumber: 'GB 55001', role: '结构安全、作用与极限状态总则', clauseEvidenceStatus: 'REVIEW_REQUIRED' },
  { codeNumber: 'GB 50009', role: '荷载取值与组合配套标准', clauseEvidenceStatus: 'REVIEW_REQUIRED' },
];

const FUSION_PROFILES: Record<StructuralDomain, StandardRequirement[]> = {
  GENERAL,
  CONCRETE: [
    GENERAL[0],
    { codeNumber: 'GB 55008', role: '混凝土结构强制性要求', clauseEvidenceStatus: 'REVIEW_REQUIRED' },
    GENERAL[1],
    { codeNumber: 'GB 50010', role: '混凝土构件计算与构造配套标准', clauseEvidenceStatus: 'REVIEW_REQUIRED' },
  ],
  STEEL: [
    GENERAL[0],
    { codeNumber: 'GB 55006', role: '钢结构强制性要求', clauseEvidenceStatus: 'REVIEW_REQUIRED' },
    GENERAL[1],
  ],
  FOUNDATION: [
    GENERAL[0],
    { codeNumber: 'GB 55003', role: '地基基础强制性要求', clauseEvidenceStatus: 'REVIEW_REQUIRED' },
    GENERAL[1],
    { codeNumber: 'GB 50007', role: '地基基础计算与构造配套标准', clauseEvidenceStatus: 'REVIEW_REQUIRED' },
  ],
};

/**
 * 解析某专业当前必须共同执行的规范集合。
 * 这里只确认版本与适用关系；逐条 Evidence 未闭环前，绝不返回 VERIFIED。
 */
export function resolveCurrentStandardFusion(domain: StructuralDomain): ResolvedStandardFusion {
  const standards = FUSION_PROFILES[domain].map((requirement): ResolvedFusionStandard => {
    const resolved = normativeVersionRegistry.resolve(requirement.codeNumber);
    return {
      ...requirement,
      authorityLevel: resolved.version?.authorityLevel ?? 'SUPPORTING_STANDARD',
      version: resolved.version,
      warnings: resolved.warnings,
    };
  });

  const warnings = standards.flatMap(item => item.warnings);
  const missing = standards.some(item => !item.version || item.version.status !== 'CURRENT');
  const evidencePending = standards.some(item => item.clauseEvidenceStatus !== 'VERIFIED');
  return {
    domain,
    status: missing ? 'INCOMPLETE' : evidencePending ? 'REVIEW_REQUIRED' : 'VERIFIED',
    standards,
    warnings,
  };
}
