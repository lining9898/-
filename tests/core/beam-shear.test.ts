import { describe, it, expect } from 'vitest';
import { calculateBeamShear, BeamShearInput } from '../../src/core/beam/shear';

describe('矩形梁斜截面受剪承载力计算', () => {
  const defaultInput: BeamShearInput = {
    b: 250,
    h: 500,
    h0: 460,
    stirrupDiameter: 8,
    concreteGrade: 'C30',
    stirrupGrade: 'HPB300',
    V: 120,
    stirrupLegs: 2,
    stirrupSpacing: 200,
    loadType: 'uniform',
  };

  describe('输入校验', () => {
    it('应拒绝零宽度', () => {
      const result = calculateBeamShear({ ...defaultInput, b: 0 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝负高度', () => {
      const result = calculateBeamShear({ ...defaultInput, h: -100 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝零有效高度', () => {
      const result = calculateBeamShear({ ...defaultInput, h0: 0 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝 h0 >= h', () => {
      const result = calculateBeamShear({ ...defaultInput, h0: 500 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝零剪力', () => {
      const result = calculateBeamShear({ ...defaultInput, V: 0 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝零箍筋间距', () => {
      const result = calculateBeamShear({ ...defaultInput, stirrupSpacing: 0 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝零箍筋肢数', () => {
      const result = calculateBeamShear({ ...defaultInput, stirrupLegs: 0 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝零箍筋直径', () => {
      const result = calculateBeamShear({ ...defaultInput, stirrupDiameter: 0 });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('集中荷载应拒绝缺少剪跨', () => {
      const result = calculateBeamShear({
        ...defaultInput,
        loadType: 'concentrated',
        shearSpan: undefined,
      });
      expect(result.advisories.some(a => a.code === 'INVALID_INPUT')).toBe(true);
    });

    it('应拒绝未知混凝土等级', () => {
      const result = calculateBeamShear({ ...defaultInput, concreteGrade: 'C99' });
      expect(result.advisories.some(a => a.code === 'UNKNOWN_CONCRETE')).toBe(true);
    });

    it('应拒绝未知箍筋等级', () => {
      const result = calculateBeamShear({ ...defaultInput, stirrupGrade: 'HRB999' });
      expect(result.advisories.some(a => a.code === 'UNKNOWN_STEEL')).toBe(true);
    });
  });

  describe('正常算例', () => {
    it('应返回完整的 CalculationResult 结构', () => {
      const result = calculateBeamShear(defaultInput);
      expect(result.calculatorType).toBe('beam-shear');
      expect(result.inputs.length).toBeGreaterThan(0);
      expect(result.materials.length).toBeGreaterThan(0);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.conclusion).toBeDefined();
      expect(result.advisories.length).toBeGreaterThan(0);
    });

    it('所有规范依据应标记为 REVIEW_REQUIRED', () => {
      const result = calculateBeamShear(defaultInput);
      expect(result.overallStatus).toBe('REVIEW_REQUIRED');
      result.allEvidence.forEach(e => {
        expect(e.verificationStatus).toBe('REVIEW_REQUIRED');
      });
    });

    it('应包含 REVIEW_REQUIRED 警告', () => {
      const result = calculateBeamShear(defaultInput);
      expect(result.advisories.some(a => a.code === 'REVIEW_REQUIRED')).toBe(true);
    });

    it('均布荷载不应计算剪跨比步骤', () => {
      const result = calculateBeamShear(defaultInput);
      const lambdaStep = result.steps.find(s => s.name === '计算剪跨比');
      expect(lambdaStep).toBeUndefined();
    });

    it('集中荷载应计算剪跨比步骤', () => {
      const result = calculateBeamShear({
        ...defaultInput,
        loadType: 'concentrated',
        shearSpan: 1500,
      });
      const lambdaStep = result.steps.find(s => s.name === '计算剪跨比');
      expect(lambdaStep).toBeDefined();
    });

    it('应包含截面限制条件验算步骤', () => {
      const result = calculateBeamShear(defaultInput);
      const sectionLimitStep = result.steps.find(s => s.name === '截面限制条件验算');
      expect(sectionLimitStep).toBeDefined();
    });

    it('应包含混凝土受剪承载力计算步骤', () => {
      const result = calculateBeamShear(defaultInput);
      const vcStep = result.steps.find(s => s.name === '计算混凝土受剪承载力');
      expect(vcStep).toBeDefined();
    });

    it('应包含箍筋受剪承载力计算步骤', () => {
      const result = calculateBeamShear(defaultInput);
      const vsStep = result.steps.find(s => s.name === '计算箍筋受剪承载力');
      expect(vsStep).toBeDefined();
    });

    it('应包含斜截面受剪承载力计算步骤', () => {
      const result = calculateBeamShear(defaultInput);
      const vcsStep = result.steps.find(s => s.name === '计算斜截面受剪承载力');
      expect(vcsStep).toBeDefined();
    });

    it('应包含最小配箍率计算步骤', () => {
      const result = calculateBeamShear(defaultInput);
      const minStirrupStep = result.steps.find(s => s.name === '计算最小配箍率');
      expect(minStirrupStep).toBeDefined();
    });
  });

  describe('验算项', () => {
    it('应包含截面限制条件验算', () => {
      const result = calculateBeamShear(defaultInput);
      const sectionLimitCheck = result.checks.find(c => c.name === '截面限制条件验算');
      expect(sectionLimitCheck).toBeDefined();
      expect(sectionLimitCheck!.comparison).toBe('<=');
    });

    it('应包含斜截面受剪承载力验算', () => {
      const result = calculateBeamShear(defaultInput);
      const shearCapacityCheck = result.checks.find(c => c.name === '斜截面受剪承载力验算');
      expect(shearCapacityCheck).toBeDefined();
      expect(shearCapacityCheck!.comparison).toBe('<=');
    });

    it('应包含最小配箍率验算', () => {
      const result = calculateBeamShear(defaultInput);
      const minStirrupCheck = result.checks.find(c => c.name === '最小配箍率验算');
      expect(minStirrupCheck).toBeDefined();
      expect(minStirrupCheck!.comparison).toBe('>=');
    });

    it('所有验算项必须有 comparison 和 passed', () => {
      const result = calculateBeamShear(defaultInput);
      result.checks.forEach(check => {
        expect(['<=', '>=', '==', 'range']).toContain(check.comparison);
        expect(typeof check.passed).toBe('boolean');
      });
    });
  });

  describe('边界值测试', () => {
    it('极小截面应能计算', () => {
      const result = calculateBeamShear({
        ...defaultInput,
        b: 150,
        h: 200,
        h0: 170,
        stirrupDiameter: 6,
        stirrupLegs: 2,
        stirrupSpacing: 150,
        V: 30,
      });
      expect(result.calculatorType).toBe('beam-shear');
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('极大截面应能计算', () => {
      const result = calculateBeamShear({
        ...defaultInput,
        b: 600,
        h: 1200,
        h0: 1140,
        stirrupDiameter: 12,
        stirrupLegs: 4,
        stirrupSpacing: 100,
        V: 800,
      });
      expect(result.calculatorType).toBe('beam-shear');
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('集中荷载小剪跨比应限制为 1.5', () => {
      const result = calculateBeamShear({
        ...defaultInput,
        loadType: 'concentrated',
        shearSpan: 100, // 很小的剪跨
      });
      const lambdaStep = result.steps.find(s => s.name === '计算剪跨比');
      expect(lambdaStep).toBeDefined();
      expect(lambdaStep!.result).toBe(1.5);
    });

    it('集中荷载大剪跨比应限制为 3', () => {
      const result = calculateBeamShear({
        ...defaultInput,
        loadType: 'concentrated',
        shearSpan: 10000, // 很大的剪跨
      });
      const lambdaStep = result.steps.find(s => s.name === '计算剪跨比');
      expect(lambdaStep).toBeDefined();
      expect(lambdaStep!.result).toBe(3);
    });

    it('h > 800mm 应触发大截面警告', () => {
      const result = calculateBeamShear({
        ...defaultInput,
        h: 900,
        h0: 850,
      });
      expect(result.advisories.some(a => a.code === 'LARGE_SECTION')).toBe(true);
    });
  });

  describe('CalculationResult Schema 验证', () => {
    it('所有步骤必须有 formula 和 result', () => {
      const result = calculateBeamShear(defaultInput);
      result.steps.forEach(step => {
        expect(step.formula).toBeTruthy();
        expect(step.result).toBeDefined();
        expect(step.unit).toBeDefined();
      });
    });

    it('所有验算项必须有 comparison 和 passed', () => {
      const result = calculateBeamShear(defaultInput);
      result.checks.forEach(check => {
        expect(['<=', '>=', '==', 'range']).toContain(check.comparison);
        expect(typeof check.passed).toBe('boolean');
      });
    });

    it('conclusion 必须包含 passed 和 summary', () => {
      const result = calculateBeamShear(defaultInput);
      expect(typeof result.conclusion.passed).toBe('boolean');
      expect(result.conclusion.summary).toBeTruthy();
    });
  });

  // REFERENCE_CASE_REQUIRED
  // 待提供 GB 50010 规范原文或教材标准算例后，在此添加真实算例验证
  it.todo('真实算例验证（待规范原文）');
  it.todo('边界值真实算例验证（待规范原文）');
});
