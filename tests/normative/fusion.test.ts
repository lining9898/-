import { describe, expect, it } from 'vitest';
import { resolveCurrentStandardFusion } from '../../src/normative/fusion';

describe('现行国家规范融合', () => {
  it('混凝土结构同时应用总则、专业通用规范、荷载和设计标准', () => {
    const fusion = resolveCurrentStandardFusion('CONCRETE');
    expect(fusion.standards.map(item => item.version?.designation)).toEqual([
      'GB 55001-2021',
      'GB 55008-2021',
      'GB 50009-2012',
      'GB/T 50010-2010',
    ]);
    expect(fusion.standards.slice(0, 2).every(item => item.authorityLevel === 'MANDATORY_GENERAL_CODE')).toBe(true);
  });

  it('钢结构与地基基础使用各自的强制性通用规范', () => {
    expect(resolveCurrentStandardFusion('STEEL').standards.some(item => item.codeNumber === 'GB 55006')).toBe(true);
    expect(resolveCurrentStandardFusion('FOUNDATION').standards.some(item => item.codeNumber === 'GB 55003')).toBe(true);
  });

  it('条文 Evidence 未闭环前不得宣称融合完成', () => {
    for (const domain of ['GENERAL', 'CONCRETE', 'STEEL', 'FOUNDATION'] as const) {
      expect(resolveCurrentStandardFusion(domain).status).toBe('REVIEW_REQUIRED');
    }
  });
});
