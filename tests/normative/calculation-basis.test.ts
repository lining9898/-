import { describe, expect, it } from 'vitest';
import { calculateBeamFlexure } from '../../src/core/beam/flexure';
import { resolveCalculationNormativeBasis } from '../../src/normative/calculationBasis';
import { buildReviewPackage, generateReviewPrompt } from '../../src/ai-review';

const input = {
  b: 250, h: 500, cover: 25, barDiameter: 20, barCount: 4,
  moment: 120, concreteGrade: 'C30', steelGrade: 'HRB400',
};

describe('计算项跟随现行规范融合依据', () => {
  it('同时列出通用规范、2024 配套标准及 2015 历史公式证据', () => {
    const result = calculateBeamFlexure(input);
    const basis = resolveCalculationNormativeBasis(result.calculatorType, result.allEvidence);
    expect(basis.status).toBe('REVIEW_REQUIRED');
    expect(basis.standards.map(item => item.codeNumber)).toEqual([
      'GB 55001', 'GB 55008', 'GB 50009', 'GB 50010',
    ]);
    const concrete = basis.standards.find(item => item.codeNumber === 'GB 50010')!;
    expect(concrete.currentClauses).toContain('4.1.2');
    expect(concrete.historicalClauses.some(clause => clause.includes('6.2.10'))).toBe(true);
    expect(basis.changeSetIds).toContain('gb50010-2015-to-2024');

    const pkg = buildReviewPackage(result);
    expect(pkg.normativeBasis.fingerprint).toBe(basis.fingerprint);
    expect(pkg.normativeVersions.map(v => v.codeNumber)).toContain('GB 55001');
    expect(pkg.normativeChanges?.some(change => change.toEdition.includes('2024'))).toBe(true);
    expect(generateReviewPrompt(pkg)).toContain('强制性通用规范: GB 55008-2021');
  });

  it('依据原文或页码变动会改变快照，旧复核包须重新生成', () => {
    const result = calculateBeamFlexure(input);
    const before = resolveCalculationNormativeBasis(result.calculatorType, result.allEvidence);
    const changed = result.allEvidence.map(ev => ev.clause === '4.1.2' && ev.edition.includes('2024')
      ? { ...ev, originalText: `${ev.originalText}（模拟修订）`, pdfPage: 7 }
      : ev);
    const after = resolveCalculationNormativeBasis(result.calculatorType, changed);
    expect(after.fingerprint).not.toBe(before.fingerprint);
    expect(after.status).toBe('REVIEW_REQUIRED');
  });
});
