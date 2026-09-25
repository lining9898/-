import { describe, it, expect } from 'vitest';
import { calculateBeamFlexure, BeamFlexureInput } from '../../src/core/beam/flexure';
import { CalculationResult } from '../../src/types/calculation';

describe('矩形梁正截面受弯计算', () => {
  const defaultInput: BeamFlexureInput = {
    b: 250,
    h: 500,
    concreteGrade: 'C30',
    steelGrade: 'HRB400',
    cover: 25,
    barDiameter: 20,
    barCount: 4,
    moment: 120,
  };

  describe('输入校验', () => {
    it('应拒绝零宽度', () => {
      const result = calculateBeamFlexure({ ...defaultInput, b: 0 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝负高度', () => {
      const result = calculateBeamFlexure({ ...defaultInput, h: -100 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝未知混凝土等级', () => {
      const result = calculateBeamFlexure({ ...defaultInput, concreteGrade: 'C99' });
      expect(result.advisories.some(a => a.code === 'UNKNOWN_CONCRETE')).toBe(true);
    });

    it('应拒绝未知钢筋等级', () => {
      const result = calculateBeamFlexure({ ...defaultInput, steelGrade: 'HRB999' });
      expect(result.advisories.some(a => a.code === 'UNKNOWN_STEEL')).toBe(true);
    });
  });

  describe('正常算例框架', () => {
    it('应返回完整的 CalculationResult 结构', () => {
      const result = calculateBeamFlexure(defaultInput);
      expect(result.calculatorType).toBe('beam-flexure');
      expect(result.inputs.length).toBeGreaterThan(0);
      expect(result.materials.length).toBeGreaterThan(0);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.conclusion).toBeDefined();
      expect(result.advisories.length).toBeGreaterThan(0);
    });

    it('所有规范依据应标记为 VERIFIED', () => {
      const result = calculateBeamFlexure(defaultInput);
      expect(result.overallStatus).toBe('VERIFIED');
      result.allEvidence.forEach(e => {
        expect(e.verificationStatus).toBe('VERIFIED');
      });
    });

    it('应包含 VERIFIED 警告', () => {
      const result = calculateBeamFlexure(defaultInput);
      expect(result.advisories.some(a => a.code === 'VERIFIED')).toBe(true);
    });

    // REFERENCE_CASE_REQUIRED
    // 待提供 GB 50010 规范原文或教材标准算例后，在此添加真实算例验证
    it.todo('真实算例验证（待规范原文）');
  });

  describe('边界值测试框架', () => {
    it('极小截面应能计算', () => {
      const result = calculateBeamFlexure({
        ...defaultInput,
        b: 150,
        h: 200,
        barCount: 2,
        barDiameter: 12,
      });
      expect(result.calculatorType).toBe('beam-flexure');
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('极大截面应能计算', () => {
      const result = calculateBeamFlexure({
        ...defaultInput,
        b: 600,
        h: 1200,
        barCount: 10,
        barDiameter: 32,
      });
      expect(result.calculatorType).toBe('beam-flexure');
      expect(result.steps.length).toBeGreaterThan(0);
    });

    // REFERENCE_CASE_REQUIRED
    it.todo('边界值真实算例验证（待规范原文）');
  });

  describe('CalculationResult Schema 验证', () => {
    it('所有步骤必须有 formula 和 result', () => {
      const result = calculateBeamFlexure(defaultInput);
      result.steps.forEach(step => {
        expect(step.formula).toBeTruthy();
        expect(step.result).toBeDefined();
        expect(step.unit).toBeDefined();
      });
    });

    it('所有验算项必须有 comparison 和 passed', () => {
      const result = calculateBeamFlexure(defaultInput);
      result.checks.forEach(check => {
        expect(['<=', '>=', '==', 'range']).toContain(check.comparison);
        expect(typeof check.passed).toBe('boolean');
      });
    });

    it('conclusion 必须包含 passed 和 summary', () => {
      const result = calculateBeamFlexure(defaultInput);
      expect(typeof result.conclusion.passed).toBe('boolean');
      expect(result.conclusion.summary).toBeTruthy();
    });
  });
});
