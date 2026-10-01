import { describe, it, expect } from 'vitest';
import { sectionDimensionCompliance } from '../../src/core/shared/construction';

describe('IG-005 backward compatibility', () => {
  it('旧输入无 beamType 字段 → unknown，不 BLOCK', () => {
    const r = sectionDimensionCompliance({ componentType: 'unknown', dimension: 199 });
    expect(r.passed).toBe(true);
    expect(r.applicable).toBe('unknown');
  });
  it('非框架梁 199mm → 不得被框架梁规则误 BLOCK', () => {
    const r = sectionDimensionCompliance({ componentType: 'unknown', dimension: 199 });
    expect(r.passed).toBe(true);
  });
  it('构件类型 unknown → 不得伪判 PASS 为已核验', () => {
    const r = sectionDimensionCompliance({ componentType: 'unknown', dimension: 100 });
    expect(r.applicable).toBe('unknown');
  });
});
