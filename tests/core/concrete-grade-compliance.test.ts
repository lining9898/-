import { describe, it, expect } from 'vitest';
import { concreteGradeCompliance } from '../../src/core/shared/materials';

describe('concreteGradeCompliance 共享硬限制规则', () => {
  it('required C25 + C20 → BLOCKED', () => {
    expect(concreteGradeCompliance('C20', 25).passed).toBe(false);
    expect(concreteGradeCompliance('C20', 25).code).toBe('CONCRETE_GRADE_BELOW_MINIMUM');
  });
  it('required C25 + C25 → PASS', () => {
    expect(concreteGradeCompliance('C25', 25).passed).toBe(true);
  });
  it('required C25 + C30 → PASS', () => {
    expect(concreteGradeCompliance('C30', 25).passed).toBe(true);
  });
  it('required C30 + C25 → BLOCKED', () => {
    expect(concreteGradeCompliance('C25', 30).passed).toBe(false);
  });
  it('required C30 + C30 → PASS', () => {
    expect(concreteGradeCompliance('C30', 30).passed).toBe(true);
  });
});
