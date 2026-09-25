import { describe, it, expect } from 'vitest';
import { calculateBeamTFlexure, BeamTFlexureInput } from '../../src/core/beam/t-flexure';

describe('T形梁正截面受弯承载力计算', () => {
  // 中和轴在翼缘内的算例
  const flangeCase: BeamTFlexureInput = {
    b: 200,
    h: 500,
    hf: 100,
    bf: 600,
    concreteGrade: 'C30',
    steelGrade: 'HRB400',
    cover: 25,
    barDiameter: 20,
    barCount: 4,
    moment: 120,
  };

  // 中和轴在腹板内的算例
  const webCase: BeamTFlexureInput = {
    b: 200,
    h: 600,
    hf: 120,
    bf: 800,
    concreteGrade: 'C30',
    steelGrade: 'HRB400',
    cover: 30,
    barDiameter: 28,
    barCount: 10,
    moment: 500,
  };

  describe('输入校验', () => {
    it('应拒绝零腹板宽度', () => {
      const result = calculateBeamTFlexure({ ...flangeCase, b: 0 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝负高度', () => {
      const result = calculateBeamTFlexure({ ...flangeCase, h: -100 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝零翼缘厚度', () => {
      const result = calculateBeamTFlexure({ ...flangeCase, hf: 0 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝零翼缘宽度', () => {
      const result = calculateBeamTFlexure({ ...flangeCase, bf: 0 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝 bf < b', () => {
      const result = calculateBeamTFlexure({ ...flangeCase, bf: 150 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝 hf >= h', () => {
      const result = calculateBeamTFlexure({ ...flangeCase, hf: 500 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝零保护层', () => {
      const result = calculateBeamTFlexure({ ...flangeCase, cover: 0 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝零钢筋直径', () => {
      const result = calculateBeamTFlexure({ ...flangeCase, barDiameter: 0 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝零钢筋根数', () => {
      const result = calculateBeamTFlexure({ ...flangeCase, barCount: 0 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝零弯矩', () => {
      const result = calculateBeamTFlexure({ ...flangeCase, moment: 0 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝未知混凝土等级', () => {
      const result = calculateBeamTFlexure({ ...flangeCase, concreteGrade: 'C99' });
      expect(result.advisories.some(a => a.code === 'UNKNOWN_CONCRETE')).toBe(true);
    });

    it('应拒绝未知钢筋等级', () => {
      const result = calculateBeamTFlexure({ ...flangeCase, steelGrade: 'HRB999' });
      expect(result.advisories.some(a => a.code === 'UNKNOWN_STEEL')).toBe(true);
    });
  });

  describe('中和轴在翼缘内', () => {
    it('应返回完整的 CalculationResult 结构', () => {
      const result = calculateBeamTFlexure(flangeCase);
      expect(result.calculatorType).toBe('beam-t-flexure');
      expect(result.inputs.length).toBeGreaterThan(0);
      expect(result.materials.length).toBeGreaterThan(0);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.conclusion).toBeDefined();
      expect(result.advisories.length).toBeGreaterThan(0);
    });

    it('中和轴位置应判断为翼缘内', () => {
      const result = calculateBeamTFlexure(flangeCase);
      const naStep = result.steps.find(s => s.name === '判断中和轴位置');
      expect(naStep).toBeDefined();
      expect(naStep!.result).toBe(1);
      expect(naStep!.unit).toBe('中和轴在翼缘内');
    });

    it('应按宽度 bf 的矩形截面计算受压区高度', () => {
      const result = calculateBeamTFlexure(flangeCase);
      const xStep = result.steps.find(s => s.name === '计算受压区高度（按矩形截面）');
      expect(xStep).toBeDefined();
    });

    it('不应出现腹板内受压区高度步骤', () => {
      const result = calculateBeamTFlexure(flangeCase);
      const xStep = result.steps.find(s => s.name === '计算受压区高度');
      expect(xStep).toBeUndefined();
    });
  });

  describe('中和轴在腹板内', () => {
    it('中和轴位置应判断为腹板内', () => {
      const result = calculateBeamTFlexure(webCase);
      const naStep = result.steps.find(s => s.name === '判断中和轴位置');
      expect(naStep).toBeDefined();
      expect(naStep!.result).toBe(0);
      expect(naStep!.unit).toBe('中和轴在腹板内');
    });

    it('应按T形截面计算受压区高度', () => {
      const result = calculateBeamTFlexure(webCase);
      const xStep = result.steps.find(s => s.name === '计算受压区高度');
      expect(xStep).toBeDefined();
    });

    it('不应出现矩形截面受压区高度步骤', () => {
      const result = calculateBeamTFlexure(webCase);
      const xStep = result.steps.find(s => s.name === '计算受压区高度（按矩形截面）');
      expect(xStep).toBeUndefined();
    });
  });

  describe('验算项', () => {
    it('应包含相对受压区高度验算', () => {
      const result = calculateBeamTFlexure(flangeCase);
      const xiCheck = result.checks.find(c => c.name === '相对受压区高度验算');
      expect(xiCheck).toBeDefined();
      expect(xiCheck!.comparison).toBe('<=');
    });

    it('应包含最小配筋率验算', () => {
      const result = calculateBeamTFlexure(flangeCase);
      const minCheck = result.checks.find(c => c.name === '最小配筋率验算');
      expect(minCheck).toBeDefined();
      expect(minCheck!.comparison).toBe('>=');
    });

    it('应包含承载力验算', () => {
      const result = calculateBeamTFlexure(flangeCase);
      const muCheck = result.checks.find(c => c.name === '承载力验算');
      expect(muCheck).toBeDefined();
      expect(muCheck!.comparison).toBe('>=');
    });

    it('所有验算项必须有 comparison 和 passed', () => {
      const result = calculateBeamTFlexure(flangeCase);
      result.checks.forEach(check => {
        expect(['<=', '>=', '==', 'range']).toContain(check.comparison);
        expect(typeof check.passed).toBe('boolean');
      });
    });
  });

  describe('规范依据', () => {
    it('所有规范依据应标记为 REVIEW_REQUIRED', () => {
      const result = calculateBeamTFlexure(flangeCase);
      expect(result.overallStatus).toBe('REVIEW_REQUIRED');
      result.allEvidence.forEach(e => {
        expect(e.verificationStatus).toBe('REVIEW_REQUIRED');
      });
    });

    it('应包含 REVIEW_REQUIRED 警告', () => {
      const result = calculateBeamTFlexure(flangeCase);
      expect(result.advisories.some(a => a.code === 'REVIEW_REQUIRED')).toBe(true);
    });

    it('应包含 6.2.11 条文依据', () => {
      const result = calculateBeamTFlexure(flangeCase);
      expect(result.allEvidence.some(e => e.clause === '6.2.11')).toBe(true);
    });
  });

  describe('CalculationResult Schema 验证', () => {
    it('所有步骤必须有 formula 和 result', () => {
      const result = calculateBeamTFlexure(flangeCase);
      result.steps.forEach(step => {
        expect(step.formula).toBeTruthy();
        expect(step.result).toBeDefined();
        expect(step.unit).toBeDefined();
      });
    });

    it('conclusion 必须包含 passed 和 summary', () => {
      const result = calculateBeamTFlexure(flangeCase);
      expect(typeof result.conclusion.passed).toBe('boolean');
      expect(result.conclusion.summary).toBeTruthy();
    });
  });

  // REFERENCE_CASE_REQUIRED
  it.todo('真实算例验证（待规范原文）');
});
