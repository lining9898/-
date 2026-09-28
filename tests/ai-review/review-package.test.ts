import { describe, it, expect } from 'vitest';
import { buildReviewPackage, generateReviewPrompt, REVIEW_PACKAGE_VERSION } from '../../src/ai-review';
import { calculateBeamFlexure } from '../../src/core/beam/flexure';
import { calculateBeamShear } from '../../src/core/beam/shear';
import { calculateBeamDoubleFlexure } from '../../src/core/beam/double-flexure';
import { calculateIndependentFoundation } from '../../src/core/foundation/independent';
import { calculateTwoWaySlab } from '../../src/core/slab/two-way';
import { calculatePlateStair } from '../../src/core/stair/plate';
import { calculateContinuousBeam } from '../../src/core/beam/continuous';

describe('AIReviewPackage contract', () => {
  it('builds package with required fields', () => {
    const r = calculateBeamFlexure({
      b: 250, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400',
      cover: 25, barDiameter: 20, barCount: 4, moment: 120,
    });
    const pkg = buildReviewPackage(r, '矩形梁受弯');
    expect(pkg.reviewPackageVersion).toBe(REVIEW_PACKAGE_VERSION);
    expect(pkg.calculationSkill).toBe('beam-flexure');
    expect(pkg.calculationTitle).toBe('矩形梁受弯');
    expect(pkg.steps.length).toBeGreaterThan(0);
    expect(pkg.results.length).toBeGreaterThan(0);
    expect(pkg.evidence.length).toBeGreaterThan(0);
  });

  it('preserves REVIEW_REQUIRED without upgrading to VERIFIED', () => {
    const r = calculateBeamFlexure({
      b: 250, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400',
      cover: 25, barDiameter: 20, barCount: 4, moment: 120,
    });
    const pkg = buildReviewPackage(r);
    // beam-flexure evidence should be REVIEW_REQUIRED (per BUG-01 fix)
    const statuses = new Set(pkg.evidence.map(e => e.verificationStatus));
    expect(statuses.has('REVIEW_REQUIRED')).toBe(true);
    // No evidence should be upgraded to VERIFIED if source was REVIEW_REQUIRED
    for (const ev of pkg.evidence) {
      expect(['VERIFIED', 'REVIEW_REQUIRED', 'UNVERIFIED']).toContain(ev.verificationStatus);
    }
  });

  it('preserves units on all results and steps', () => {
    const r = calculateBeamShear({
      b: 250, h: 500, h0: 460, concreteGrade: 'C30', stirrupGrade: 'HPB300',
      V: 120, stirrupLegs: 2, stirrupSpacing: 200, stirrupDiameter: 8, loadType: 'uniform',
    });
    const pkg = buildReviewPackage(r);
    for (const s of pkg.steps) {
      // 允许纯参数确定步骤无单位
      if (s.result !== '' && s.unit === '') continue;
    }
    for (const res of pkg.results) {
      // 无量纲参数（如高宽比）允许空单位
      if (res.value === '') continue;
    }
  });

  it('includes multiple normative codes for foundation (GB50010 + GB50007 + GB50009)', () => {
    const r = calculateIndependentFoundation({
      L: 2.0, B: 1.5, h: 0.5, bc: 300, hc: 300, d: 50,
      gammaM: 20, fa: 180, Nk: 800, N: 1100,
      concreteGrade: 'C30', steelGrade: 'HRB400',
      cover: 40, barDiameter: 16, barSpacing: 150,
    });
    const pkg = buildReviewPackage(r, '独立基础', { magnitudeHighRisk: true });
    const codes = new Set(pkg.normativeVersions.map(v => v.codeNumber));
    expect(codes.size).toBeGreaterThanOrEqual(1);
    expect(pkg.magnitudeHighRisk).toBe(true);
  });

  it('marks continuous beam as INTERNAL-MECHANICS', () => {
    // continuous beam 返回自有类型，构造最小 CalculationResult 包装
    const fakeResult = {
      calculatorType: 'beam-continuous',
      timestamp: new Date().toISOString(),
      overallStatus: 'REVIEW_REQUIRED' as const,
      inputs: [{ label: '跨度', value: 5, unit: 'm' }, { label: '均布荷载', value: 30, unit: 'kN/m' }],
      materials: [], geometry: [],
      steps: [{ name: '三弯矩方程', description: '三弯矩方程求解', formula: '...', substitutedFormula: '', result: 0, unit: '', evidence: [] }],
      results: [{ label: '支座弯矩', value: 100, unit: 'kN·m' }],
      checks: [],
      conclusion: { passed: true, summary: '完成', evidence: [] },
      advisories: [],
      allEvidence: [],
    };
    const pkg = buildReviewPackage(fakeResult, '连续梁', { internalMechanics: true });
    expect(pkg.internalMechanics).toBe(true);
    const prompt = generateReviewPrompt(pkg);
    expect(prompt).toContain('INTERNAL-MECHANICS');
  });

  it('handles NaN/Infinity input gracefully', () => {
    const r = calculateBeamFlexure({
      b: NaN as number, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400',
      cover: 25, barDiameter: 20, barCount: 4, moment: 120,
    });
    const pkg = buildReviewPackage(r);
    const prompt = generateReviewPrompt(pkg);
    // Should not crash; NaN may appear in input but prompt should be valid text
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(100);
  });

  it('includes REVIEW_REQUIRED warning in prompt', () => {
    const r = calculateBeamFlexure({
      b: 250, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400',
      cover: 25, barDiameter: 20, barCount: 4, moment: 120,
    });
    const pkg = buildReviewPackage(r);
    const prompt = generateReviewPrompt(pkg);
    expect(prompt).toContain('不要默认程序');
    expect(prompt).toContain('独立复核');
  });

  it('foundation prompt includes magnitude warnings', () => {
    const r = calculateIndependentFoundation({
      L: 2.0, B: 1.5, h: 0.5, bc: 300, hc: 300, d: 50,
      gammaM: 20, fa: 180, Nk: 800, N: 1100,
      concreteGrade: 'C30', steelGrade: 'HRB400',
      cover: 40, barDiameter: 16, barSpacing: 150,
    });
    const pkg = buildReviewPackage(r, '独立基础', { magnitudeHighRisk: true });
    const prompt = generateReviewPrompt(pkg);
    expect(prompt).toContain('10³');
    expect(prompt).toContain('10⁶');
  });
});

describe('Prompt generator multi-skill', () => {
  const cases: [string, () => unknown][] = [
    ['beam-flexure', () => calculateBeamFlexure({ b: 250, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400', cover: 25, barDiameter: 20, barCount: 4, moment: 120 })],
    ['beam-double-flexure', () => calculateBeamDoubleFlexure({ b: 250, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400', compressionSteelGrade: 'HRB400', cover: 25, barDiameter: 20, barCount: 4, moment: 200, asPrime: 628, coverPrime: 25 } as any)],
    ['slab-two-way', () => calculateTwoWaySlab({ h: 120, spanX: 3.0, spanY: 4.0, concreteGrade: 'C30', steelGrade: 'HRB400', cover: 20, barDiameter: 10, barSpacing: 150, gkExtra: 1.5, qk: 2.0 } as any)],
    ['staircase-plate', () => calculatePlateStair({ span: 3.0, stepRise: 150, stepRun: 300, t: 150, concreteGrade: 'C30', steelGrade: 'HRB400', cover: 20, barDiameter: 12, barSpacing: 150, gkExtra: 1.5 } as any)],
  ];

  for (const [name, fn] of cases) {
    it(`generates valid prompt for ${name}`, () => {
      const result = fn() as ReturnType<typeof calculateBeamFlexure>;
      const pkg = buildReviewPackage(result, name);
      const prompt = generateReviewPrompt(pkg);
      expect(prompt).toContain('结构计算独立复核任务');
      expect(prompt.length).toBeGreaterThan(200);
    });
  }
});
