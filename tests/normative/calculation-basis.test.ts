import { describe, expect, it } from 'vitest';
import { calculateBeamFlexure } from '../../src/core/beam/flexure';
import { resolveCalculationNormativeBasis } from '../../src/normative/calculationBasis';
import { buildReviewPackage, generateReviewPrompt } from '../../src/ai-review';

const input = {
  b: 250, h: 500, cover: 25, barDiameter: 20, barCount: 4,
  moment: 120, concreteGrade: 'C30', steelGrade: 'HRB400',
};

describe('计算项跟随现行规范融合依据', () => {
  it('完整地震跨中算例接入逐条映射，但保留项目待复核状态', () => {
    const result = calculateBeamFlexure({ ...input, beamType: 'frameBeam', seismicGrade: '1',
      sectionLocation: 'span', designSituation: 'seismic', seismicAction: 'verticalDominant',
      structuralSafetyGrade: '3' });
    const basis = resolveCalculationNormativeBasis(result.calculatorType, result.allEvidence);
    expect(basis.moduleClauseMap?.status).toBe('MAPPED');
    expect(basis.moduleClauseMap?.missing).toEqual([]);
    expect(basis.moduleClauseMap?.entries.every(item => item.attached)).toBe(true);
    expect(basis.status).toBe('REVIEW_REQUIRED');
    expect(result.overallStatus).toBe('REVIEW_REQUIRED');
    expect(basis.warnings.some(message => message.includes('逐条融合证据仍待核验'))).toBe(false);
    const prompt = generateReviewPrompt(buildReviewPackage(result));
    expect(prompt).toContain('本模块逐条映射: MAPPED');
    expect(prompt).toContain('GB50010-2010_2015_.pdf#page=50');
    expect(prompt).toContain('映射不等于项目签核');
  });

  it('删除原公式条文附件会恢复缺项提示并改变依据快照', () => {
    const result = calculateBeamFlexure(input);
    const before = resolveCalculationNormativeBasis(result.calculatorType, result.allEvidence);
    const evidence = result.allEvidence.filter(item => item.clause !== '6.2.1');
    const after = resolveCalculationNormativeBasis(result.calculatorType, evidence);
    expect(before.moduleClauseMap?.status).toBe('MAPPED');
    expect(after.moduleClauseMap?.status).toBe('INCOMPLETE');
    expect(after.moduleClauseMap?.missing).toContain('GB 50010 §6.2.1');
    expect(after.fingerprint).not.toBe(before.fingerprint);
    expect(after.warnings.some(message => message.includes('仍缺条文证据'))).toBe(true);
  });

  it.each(['wrong-page', 'wrong-edition'])('不接受页码或版次不匹配的现行依据：%s', mismatch => {
    const result = calculateBeamFlexure(input);
    const evidence = result.allEvidence.map(item => item.clause === '4.1.2'
      ? { ...item, ...(mismatch === 'wrong-page' ? { pdfPage: 7 } : { edition: '2010' }) }
      : item);
    const basis = resolveCalculationNormativeBasis(result.calculatorType, evidence);
    expect(basis.moduleClauseMap?.status).toBe('INCOMPLETE');
    expect(basis.moduleClauseMap?.missing).toContain('GB 50010 §4.1.2');
    expect(basis.status).toBe('REVIEW_REQUIRED');
  });

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
    expect(generateReviewPrompt(pkg)).toContain('GB55008-2021.pdf#page=16');
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

  it('地震组合将 GB 55002 纳入同一份计算和独立复核依据', () => {
    const result = calculateBeamFlexure({ ...input, designSituation: 'seismic',
      seismicAction: 'verticalDominant', structuralSafetyGrade: '3' });
    const basis = resolveCalculationNormativeBasis(result.calculatorType, result.allEvidence);
    const seismic = basis.standards.find(item => item.codeNumber === 'GB 55002');
    expect(seismic?.currentClauses).toContain('4.3.1');
    expect(seismic?.authorityLevel).toBe('MANDATORY_GENERAL_CODE');
    const pkg = buildReviewPackage(result);
    expect(pkg.normativeBasis.standards).toEqual(expect.arrayContaining([
      expect.objectContaining({ codeNumber: 'GB 55002' }),
    ]));
    expect(pkg.normativeVersions).toEqual(expect.arrayContaining([
      expect.objectContaining({ codeNumber: 'GB 55002', status: 'CURRENT' }),
    ]));
    expect(generateReviewPrompt(pkg)).toContain('GB55002-2021.pdf#page=18');
  });
});
