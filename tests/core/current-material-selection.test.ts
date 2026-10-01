import { describe, expect, it } from 'vitest';
import { materialSelectionCompliance, STEEL_GRADES } from '../../src/core/shared/materials';
import { calculateBeamFlexure } from '../../src/core/beam/flexure';
import { calculateBeamDoubleFlexure } from '../../src/core/beam/double-flexure';

const beamInput = {
  b: 250, h: 500, cover: 25, barDiameter: 20, barCount: 4, moment: 120,
  concreteGrade: 'C30', steelGrade: 'HRB400',
};

describe('GB/T 50010-2010（2024 局部修订）材料选用', () => {
  it('4.1.2：500MPa 钢筋要求至少 C30，C30 边界通过', () => {
    expect(materialSelectionCompliance('C25', 'HRB500')).toMatchObject({
      passed: false, code: 'CONCRETE_GRADE_BELOW_MINIMUM',
    });
    expect(materialSelectionCompliance('C30', 'HRB500').passed).toBe(true);
    expect(materialSelectionCompliance('C25', 'HRB400').passed).toBe(true);
  });

  it('4.2.1：HRB335 不在现行选材中，历史材料表仍可追溯', () => {
    expect(STEEL_GRADES).not.toContain('HRB335');
    expect(materialSelectionCompliance('C30', 'HRB335')).toMatchObject({
      passed: false, code: 'STEEL_GRADE_RETIRED',
    });
  });

  it('计算函数执行新材料门槛，并在结果中附带现行条文来源', () => {
    const blocked = calculateBeamFlexure({ ...beamInput, concreteGrade: 'C25', steelGrade: 'HRB500' });
    expect(blocked.advisories[0].code).toBe('CONCRETE_GRADE_BELOW_MINIMUM');
    expect(blocked.steps).toHaveLength(0);

    const allowed = calculateBeamFlexure({ ...beamInput, steelGrade: 'HRB500' });
    expect(allowed.steps.length).toBeGreaterThan(0);
    expect(allowed.allEvidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ clause: '4.1.2', pdfPage: 6,
        edition: '2010（2024年版，GB/T 50010-2010）', verificationStatus: 'REVIEW_REQUIRED' }),
    ]));
  });

  it('双筋梁的受压侧 HRB500 同样触发 C30 门槛', () => {
    const input = {
      b: 300, h: 600, cover: 35, barDiameter: 25, barCount: 5,
      coverToCompressionCentroid: 40, compressionBarDiameter: 20, compressionBarCount: 2,
      moment: 300, steelGrade: 'HRB400', compressionSteelGrade: 'HRB500',
    };
    const blocked = calculateBeamDoubleFlexure({ ...input, concreteGrade: 'C25' });
    expect(blocked.advisories[0].code).toBe('CONCRETE_GRADE_BELOW_MINIMUM');
    const allowed = calculateBeamDoubleFlexure({ ...input, concreteGrade: 'C30' });
    expect(allowed.steps.length).toBeGreaterThan(0);
  });
});
