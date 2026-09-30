import { describe, expect, it } from 'vitest';
import { auditCalculationResult } from '../../src/agent/calculation-auditor';
import { skillRegistry } from '../../src/agent/skill-registry';
import { SteelBeamInput } from '../../src/core/steel/beam';

const input: SteelBeamInput = {
  h: 400,
  bf: 200,
  tf: 12,
  tw: 8,
  moment: 120,
  shear: 80,
  bendingStrength: 215,
  shearStrength: 125,
  stabilityFactor: 0.8,
};

describe('steel-beam Skill Registry integration', () => {
  it('registers steel-beam as a calculation Skill', () => {
    expect(skillRegistry.list()).toContainEqual(expect.objectContaining({
      id: 'steel-beam',
      kind: 'calculation',
      status: 'REVIEW_REQUIRED',
    }));
  });

  it('returns a CalculationResult with formula evidence', () => {
    const result = skillRegistry.calculate('steel-beam', input);
    expect(result.calculatorType).toBe('steel-beam');
    expect(result.overallStatus).toBe('REVIEW_REQUIRED');
    expect(result.steps.map(step => step.evidence[0]?.clause)).toEqual(['6.1.1', '6.1.3', '6.2.2']);
    expect(result.advisories.some(item => item.code === 'CURRENT_STANDARD_FUSION_PENDING')).toBe(true);
  });

  it('passes package structure audit while retaining review warnings', () => {
    const audit = skillRegistry.audit('steel-beam');
    expect(audit.passed, audit.issues.map(item => item.message).join('; ')).toBe(true);
    expect(audit.issues.some(item => item.code === 'EVIDENCE_REVIEW_REQUIRED')).toBe(true);
  });

  it('is visible to the CalculationResult auditor', () => {
    const result = skillRegistry.calculate('steel-beam', input);
    const audit = auditCalculationResult(result, { expectedEdition: '2017' });
    expect(audit.passed).toBe(false);
    expect(audit.issues.some(item => item.code === 'STEP_EVIDENCE_MISSING')).toBe(false);
    expect(audit.issues.some(item => item.code === 'UNVERIFIED_EVIDENCE')).toBe(true);
    expect(audit.issues.filter(item => item.code === 'MATERIAL_EVIDENCE_MISSING')).toHaveLength(3);
  });

  it('returns structured errors for invalid Agent input', () => {
    const result = skillRegistry.calculate('steel-beam', { ...input, h: '400' });
    expect(result.advisories.some(item => item.code === 'SKILL_INPUT_INVALID')).toBe(true);
  });
});
