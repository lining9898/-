import { describe, expect, it } from 'vitest';
import { auditSkillPackage } from '../../src/agent/calculation-auditor';
import { beamShearSkillPackage } from '../../src/agent/skill-registry';
import { SkillPackage } from '../../src/agent/skill-types';

describe('Calculation Auditor', () => {
  it('passes the complete beam-shear package while preserving review warnings', () => {
    const result = auditSkillPackage(beamShearSkillPackage);
    expect(result.passed).toBe(true);
    expect(result.issues.some(issue => issue.code === 'EVIDENCE_REVIEW_REQUIRED')).toBe(true);
  });

  it('detects a missing input unit', () => {
    const packageWithMissingUnit: SkillPackage = {
      ...beamShearSkillPackage,
      schema: {
        ...beamShearSkillPackage.schema,
        properties: { ...beamShearSkillPackage.schema.properties, b: { type: 'number' } },
      },
    };
    const result = auditSkillPackage(packageWithMissingUnit);
    expect(result.passed).toBe(false);
    expect(result.issues.some(issue => issue.code === 'UNIT_MISSING')).toBe(true);
  });

  it('detects an unmapped formula and a missing boundary declaration', () => {
    const incomplete: SkillPackage = {
      ...beamShearSkillPackage,
      manifest: {
        ...beamShearSkillPackage.manifest,
        boundaryChecks: [],
        formulaMappings: [{ ...beamShearSkillPackage.manifest.formulaMappings[0], evidenceId: 'missing' }],
      },
    };
    const result = auditSkillPackage(incomplete);
    expect(result.passed).toBe(false);
    expect(result.issues.some(issue => issue.code === 'BOUNDARY_CHECKS_EMPTY')).toBe(true);
    expect(result.issues.some(issue => issue.code === 'FORMULA_EVIDENCE_MISSING')).toBe(true);
  });
});
