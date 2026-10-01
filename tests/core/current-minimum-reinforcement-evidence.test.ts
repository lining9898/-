import { describe, expect, it } from 'vitest';
import { currentMinimumReinforcementEvidence } from '../../src/core/shared/materials';
import { calculateBeamFlexure } from '../../src/core/beam/flexure';

describe('2024 版 8.5.1 与 GB 55008 4.4.6 最小配筋率证据', () => {
  it('记录两份规范的原页，保持模块独立复核状态', () => {
    expect(currentMinimumReinforcementEvidence()).toEqual(expect.arrayContaining([
      expect.objectContaining({ codeNumber: 'GB 50010', clause: '8.5.1', pdfPage: 14,
        verificationStatus: 'REVIEW_REQUIRED' }),
      expect.objectContaining({ codeNumber: 'GB 55008', clause: '4.4.6', pdfPage: 16,
        verificationStatus: 'REVIEW_REQUIRED' }),
    ]));
  });

  it('梁受弯的最小配筋率计算步骤和验算均引用现行强制证据', () => {
    const result = calculateBeamFlexure({
      b: 250, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400',
      cover: 25, barDiameter: 20, barCount: 4, moment: 120,
    });
    const step = result.steps.find(item => item.name === '计算最小配筋面积');
    const check = result.checks.find(item => item.name === '最小配筋率验算');
    for (const item of [step, check]) {
      expect(item?.evidence).toEqual(expect.arrayContaining([
        expect.objectContaining({ codeNumber: 'GB 50010', clause: '8.5.1', pdfPage: 14 }),
        expect.objectContaining({ codeNumber: 'GB 55008', clause: '4.4.6', pdfPage: 16 }),
      ]));
    }
    expect(result.overallStatus).toBe('REVIEW_REQUIRED');
  });
});
