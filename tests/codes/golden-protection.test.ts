import { describe, it, expect } from 'vitest';
import { calculateBeamFlexure } from '../../src/core/beam/flexure';
import { INITIAL_CLAUSES } from '../../src/codes/initialData';

describe('Golden Case Protection: Rectangular Beam Flexure (HUMAN_VERIFIED)', () => {
  const input = {
    b: 250, h: 500, cover: 25,
    barDiameter: 20, barCount: 4,
    concreteGrade: 'C30', steelGrade: 'HRB400',
    moment: 120,
  } as any;

  const run = () => calculateBeamFlexure(input);
  const res = (r: any, kw: string) => parseFloat(r.results.find((x: any) => x.label && x.label.includes(kw))?.value || '0');

  it('Golden Case: Mu must be ~181.74 kN·m (±2%)', () => {
    const mu = res(run(), '受弯承载力 Mu');
    expect(mu).toBeGreaterThan(178);
    expect(mu).toBeLessThan(186);
  });

  it('Golden Case: x must be ~126.54 mm (±2%)', () => {
    expect(res(run(), '受压区高度 x')).toBeCloseTo(126.54, 1);
  });

  it('Golden Case: xi_b must be ~0.5176 (±2%)', () => {
    expect(res(run(), '界限相对受压区高度')).toBeCloseTo(0.5176, 2);
  });

  it('Evidence Chain: 6 clauses VERIFIED', () => {
    const verified = INITIAL_CLAUSES.filter(c => c.verificationStatus === 'VERIFIED');
    expect(verified.map(c => c.clause).sort()).toEqual(['4.1.4', '4.2.3', '6.2.10', '6.2.11', '6.2.6', '6.2.7']);
  });
});
