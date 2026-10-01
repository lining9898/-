import { describe, it, expect } from 'vitest';
import { sectionDimensionCompliance } from '../../src/core/shared/construction';

describe('IG-005 boundary tests', () => {
  // 矩形柱
  it('矩形柱 299mm → BLOCKED', () => {
    const r = sectionDimensionCompliance({ componentType: 'frameRectColumn', dimension: 299 });
    expect(r.passed).toBe(false);
  });
  it('矩形柱 300mm → PASS', () => {
    const r = sectionDimensionCompliance({ componentType: 'frameRectColumn', dimension: 300 });
    expect(r.passed).toBe(true);
  });
  // 圆柱
  it('圆柱 349mm → BLOCKED', () => {
    const r = sectionDimensionCompliance({ componentType: 'frameCircColumn', dimension: 349 });
    expect(r.passed).toBe(false);
  });
  it('圆柱 350mm → PASS', () => {
    const r = sectionDimensionCompliance({ componentType: 'frameCircColumn', dimension: 350 });
    expect(r.passed).toBe(true);
  });
  // 实心板
  it('实心板 79mm → BLOCKED', () => {
    const r = sectionDimensionCompliance({ componentType: 'solidSlab', dimension: 79 });
    expect(r.passed).toBe(false);
  });
  it('实心板 80mm → PASS', () => {
    const r = sectionDimensionCompliance({ componentType: 'solidSlab', dimension: 80 });
    expect(r.passed).toBe(true);
  });
  // 未知类型不得误 BLOCK
  it('未知类型 → 不 BLOCK', () => {
    const r = sectionDimensionCompliance({ componentType: 'unknown', dimension: 100 });
    expect(r.passed).toBe(true);
    expect(r.applicable).toBe('unknown');
  });
});
