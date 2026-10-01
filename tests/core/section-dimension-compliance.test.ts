import { describe, it, expect } from 'vitest';
import { sectionDimensionCompliance } from '../../src/core/shared/construction';

describe('sectionDimensionCompliance GB 55008-2021 §4.4.4', () => {
  // 框架梁
  it('框架梁 199mm → BLOCKED', () => {
    const r = sectionDimensionCompliance({ componentType: 'frameBeam', dimension: 199 });
    expect(r.passed).toBe(false);
    expect(r.code).toBe('SECTION_DIMENSION_BELOW_MINIMUM');
  });
  it('框架梁 200mm → PASS', () => {
    const r = sectionDimensionCompliance({ componentType: 'frameBeam', dimension: 200 });
    expect(r.passed).toBe(true);
  });
  it('框架梁 201mm → PASS', () => {
    const r = sectionDimensionCompliance({ componentType: 'frameBeam', dimension: 201 });
    expect(r.passed).toBe(true);
  });
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
  it('实心板 81mm → PASS', () => {
    const r = sectionDimensionCompliance({ componentType: 'solidSlab', dimension: 81 });
    expect(r.passed).toBe(true);
  });
  // 非框架梁不得被误 BLOCKED
  it('非框架梁（unknown）→ 不阻断', () => {
    const r = sectionDimensionCompliance({ componentType: 'unknown', dimension: 150 });
    expect(r.passed).toBe(true);
    expect(r.applicable).toBe('unknown');
  });
  // 构件类型 UNKNOWN 不得伪判 PASS
  it('构件类型 unknown → applicable=unknown', () => {
    const r = sectionDimensionCompliance({ componentType: 'unknown', dimension: 100 });
    expect(r.applicable).toBe('unknown');
  });
});
