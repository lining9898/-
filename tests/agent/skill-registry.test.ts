import { describe, expect, it } from 'vitest';
import { calculateBeamShear, BeamShearInput } from '../../src/core/beam/shear';
import { skillRegistry } from '../../src/agent/skill-registry';

const input: BeamShearInput = {
  b: 250, h: 500, h0: 460, concreteGrade: 'C30', stirrupGrade: 'HPB300', V: 120,
  stirrupLegs: 2, stirrupSpacing: 200, stirrupDiameter: 8, loadType: 'uniform',
};

describe('Skill Registry', () => {
  it('lists the first calculation Skill with machine-readable metadata', () => {
    const skill = skillRegistry.list().find(item => item.id === 'beam-shear');
    expect(skill?.component).toBe('beam');
    expect(skill?.inputSchema).toBe('./schema.json');
    expect(skillRegistry.list().some(item => item.id === 'calculation-auditor' && item.kind === 'auditor')).toBe(true);
  });

  it('calls the legacy beam-shear entry without changing calculation output', () => {
    const legacy = calculateBeamShear(input);
    const throughRegistry = skillRegistry.calculate('beam-shear', input);
    expect(throughRegistry.calculatorType).toBe(legacy.calculatorType);
    expect(throughRegistry.results).toEqual(legacy.results);
    expect(throughRegistry.checks).toEqual(legacy.checks);
    expect(throughRegistry.conclusion).toEqual(legacy.conclusion);
  });

  it('returns a structured error result for invalid Agent input', () => {
    const result = skillRegistry.calculate('beam-shear', { ...input, h0: '460' });
    expect(result.advisories.some(advisory => advisory.code === 'SKILL_INPUT_INVALID')).toBe(true);
    expect(result.overallStatus).toBe('REVIEW_REQUIRED');
  });

  it('audits the registered Skill package', () => {
    const audit = skillRegistry.audit('beam-shear');
    expect(audit.passed).toBe(true);
    expect(audit.issues.some(issue => issue.code === 'EVIDENCE_REVIEW_REQUIRED')).toBe(true);
    expect(skillRegistry.audit('calculation-auditor').passed).toBe(true);
  });
});
