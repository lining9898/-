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

    it.each([
      { barCount: 0 },
      { barCount: 1.5 },
      { barDiameter: 0 },
      { moment: -1 },
      { b: Number.NaN },
      { h: Number.POSITIVE_INFINITY },
      { cover: 490 },
      { b: 50, cover: 20, barDiameter: 20 },
    ])('应拒绝无效数值或放不下钢筋的截面：%o', override => {
      const result = calculateBeamFlexure({ ...defaultInput, ...override });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
      expect(result.steps).toHaveLength(0);
      expect(result.checks).toHaveLength(0);
      expect(result.conclusion.passed).toBe(false);
    });
  });

  describe('正常算例框架', () => {
    it('C30、HRB400 的独立数值基准应保持一致', () => {
      const result = calculateBeamFlexure(defaultInput);
      const value = (label: string) => result.results.find(item => item.label === label)?.value;

      expect(value('有效高度 h₀')).toBe(465);
      expect(value('受拉钢筋面积 As')).toBe(1256.64);
      expect(value('受压区高度 x')).toBe(126.54);
      expect(value('相对受压区高度 ξ')).toBe(0.2721);
      expect(value('界限相对受压区高度 ξb')).toBe(0.5176);
      expect(value('最小配筋面积 As,min')).toBe(250);
      expect(value('受弯承载力 Mu')).toBe(181.74);
      expect(result.checks.map(check => check.passed)).toEqual([true, true, true]);
      expect(result.overallStatus).toBe('REVIEW_REQUIRED');
    });

    it('8.5.1 配筋率显示按 b·h 而非 b·h0 计算', () => {
      const result = calculateBeamFlexure(defaultInput);
      const As = 4 * Math.PI * 20 ** 2 / 4;
      expect(result.results.find(item => item.label === '配筋率 ρ')?.value)
        .toBe(Math.round(As / (250 * 500) * 10000) / 100);
      expect(result.results.find(item => item.label === '配筋率 ρ')?.value).toBe(1.01);
    });

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
      expect(result.overallStatus).toBe('REVIEW_REQUIRED');
      result.allEvidence.forEach(e => {
        expect(e.verificationStatus).toBe('VERIFIED');
      });
    });

    it('应包含 VERIFIED 警告', () => {
      const result = calculateBeamFlexure(defaultInput);
      expect(result.advisories.some(a => a.code === 'NORM_UPDATE_REQUIRED')).toBe(true);
    });

    it('受弯公式证据应指向 PDF 第 55 页且不虚构结论条文', () => {
      const result = calculateBeamFlexure(defaultInput);
      const capacityStep = result.steps.find(step => step.name === '计算正截面受弯承载力');
      expect(capacityStep?.evidence[0]).toMatchObject({
        clause: '6.2.10',
        pdfPage: 55,
        verificationStatus: 'VERIFIED',
      });
      expect(result.conclusion.evidence).toEqual([]);
    });

    // REFERENCE_CASE_REQUIRED
    // 待提供 GB 50010 规范原文或教材标准算例后，在此添加真实算例验证
    it.todo('真实算例验证（待规范原文）');
  });

  describe('边界值测试框架', () => {
    it('跨越相对界限受压区高度时应改变验算结果', () => {
      const xiB = 0.8 / (1 + 360 / (200000 * 0.0033));
      const h0 = defaultInput.h - defaultInput.cover - defaultInput.barDiameter / 2;
      const boundaryAs = xiB * h0 * 14.3 * defaultInput.b / 360;
      const boundaryDiameter = Math.sqrt(4 * boundaryAs / Math.PI);
      const check = (factor: number) => calculateBeamFlexure({
        ...defaultInput,
        barCount: 1,
        barDiameter: boundaryDiameter * factor,
      }).checks.find(item => item.name === '相对受压区高度验算')?.passed;

      expect(check(0.9)).toBe(true);
      expect(check(1.1)).toBe(false);
    });

    it('弯矩需求超过承载力时不应通过', () => {
      const result = calculateBeamFlexure({ ...defaultInput, moment: 190 });
      expect(result.checks.find(check => check.name === '承载力验算')?.passed).toBe(false);
      expect(result.conclusion.passed).toBe(false);
    });

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
