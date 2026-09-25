import { describe, expect, it } from 'vitest';
import { auditRule } from '../../src/audit/function-audit';
import { calculateBeamShear } from '../../src/core/beam/shear';
import { calculateBeamFlexure } from '../../src/core/beam/flexure';
import { calculateBeamTFlexure } from '../../src/core/beam/t-flexure';
import { calculateAxialColumn } from '../../src/core/column/axial';

describe('retrieval-backed function audit', () => {
  it('matches independent boundary probes for implemented rules', () => {
    for (const clause of ['6.2.10', '6.3.1', '6.3.4', '6.2.11', '6.2.15', '8.5.1']) {
      const probes = auditRule(clause);
      expect(probes.length).toBeGreaterThan(0);
      expect(probes.every(probe => probe.status === 'matched')).toBe(true);
    }
    expect(auditRule('6.3.1').find(probe => probe.name === 'h₀/b = 6.5')?.expected).toBe(743.6);
    expect(auditRule('8.5.1')[0].actual).toBe(200);
    expect(auditRule('6.2.15')[1].expected).toBe(4961.78);
  });

  it('detects the former fixed-0.25 implementation as a mismatch', () => {
    const probes = auditRule('6.3.1', {
      shear: input => {
        const result = calculateBeamShear(input);
        const oldLimit = Math.round(0.25 * 14.3 * input.b * input.h0 / 10) / 100;
        result.results = result.results.map(item => item.label === '截面限制值 Vmax' ? { ...item, value: oldLimit } : item);
        result.checks = result.checks.map(check => check.name === '截面限制条件验算' ? { ...check, passed: input.V <= oldLimit } : check);
        return result;
      },
      flexure: calculateBeamFlexure,
      tFlexure: calculateBeamTFlexure,
    });
    expect(probes.find(probe => probe.name === 'h₀/b = 6.5')?.status).toBe('mismatch');
  });

  it('marks wing-width validation as not covered instead of passing it', () => {
    expect(auditRule('6.2.12')[0].status).toBe('not-covered');
  });

  it('audits all three steel beam equations while retaining coefficient caveat', () => {
    for (const clause of ['6.1.1', '6.1.3', '6.2.2']) {
      expect(auditRule(`GB50017:${clause}`)[0].status).toBe('matched');
    }
    expect(auditRule('GB50017:6.2.2')[0].note).toContain('尚未自动审计');
  });

  it('detects the old effective-height denominator in rectangular reinforcement ratio', () => {
    const probes = auditRule('8.5.1', {
      shear: calculateBeamShear,
      flexure: input => {
        const result = calculateBeamFlexure(input);
        result.results = result.results.map(item => item.label === '配筋率 ρ' ? { ...item, value: 1.08 } : item);
        return result;
      },
      tFlexure: calculateBeamTFlexure,
    });
    expect(probes.find(probe => probe.name === '矩形梁受拉钢筋配筋率')?.status).toBe('mismatch');
  });

  it('detects missing concrete-area deduction for densely reinforced axial columns', () => {
    const probes = auditRule('6.2.15', {
      shear: calculateBeamShear,
      flexure: calculateBeamFlexure,
      tFlexure: calculateBeamTFlexure,
      axialColumn: input => {
        const result = calculateAxialColumn(input);
        if (result.reinforcementRatio > 0.03) {
          result.capacity = 0.9 * result.stabilityFactor *
            (input.concreteStrength * result.grossArea +
              input.steelCompressionStrength * input.reinforcementArea) / 1000;
        }
        return result;
      },
    });
    expect(probes[0].status).toBe('matched');
    expect(probes[1].status).toBe('mismatch');
  });
});
