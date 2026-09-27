import { describe, expect, it } from 'vitest';
import { calculateBeamShear, BeamShearInput } from '../../src/core/beam/shear';
import { calculateBeamFlexure, BeamFlexureInput } from '../../src/core/beam/flexure';
import { calculateAxialColumn, AxialColumnInput } from '../../src/core/column/axial';
import { skillRegistry } from '../../src/agent/skill-registry';

const input: BeamShearInput = {
  b: 250, h: 500, h0: 460, concreteGrade: 'C30', stirrupGrade: 'HPB300', V: 120,
  stirrupLegs: 2, stirrupSpacing: 200, stirrupDiameter: 8, loadType: 'uniform',
};

const flexureInput: BeamFlexureInput = {
  b: 250, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400', cover: 25,
  barDiameter: 20, barCount: 4, moment: 120,
};

const axialInput: AxialColumnInput = {
  width: 400, depth: 500, effectiveLength: 3200, reinforcementArea: 2400,
  axialForce: 2200, concreteStrength: 14.3, steelCompressionStrength: 360,
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

  it('calls the legacy beam-flexure entry without changing calculation output', () => {
    const legacy = calculateBeamFlexure(flexureInput);
    const throughRegistry = skillRegistry.calculate('beam-flexure', flexureInput);
    expect(throughRegistry.calculatorType).toBe(legacy.calculatorType);
    expect(throughRegistry.results).toEqual(legacy.results);
    expect(throughRegistry.checks).toEqual(legacy.checks);
    expect(throughRegistry.conclusion).toEqual(legacy.conclusion);
  });

  it('dispatches the unified column Skill to the axial report adapter', () => {
    const legacy = calculateAxialColumn(axialInput);
    const throughRegistry = skillRegistry.calculate('column', { mode: 'axial', input: axialInput });
    expect(throughRegistry.calculatorType).toBe('轴心受压柱');
    expect(throughRegistry.results.find(item => item.label === '轴压承载力 Nu')?.value).toBe(legacy.capacity);
    expect(throughRegistry.checks[0].passed).toBe(legacy.passed);
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
    expect(skillRegistry.audit('beam-flexure').passed).toBe(true);
    const columnAudit = skillRegistry.audit('column');
    expect(columnAudit.passed).toBe(true);
    expect(columnAudit.issues.some(issue => issue.severity === 'error')).toBe(false);
  });
});
