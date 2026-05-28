import { describe, it, expect } from 'vitest';
import { generateReport, ReportSection } from '../../src/report/generator';
import { createEmptyResult } from '../../src/types/calculation';
import { createReviewRequiredEvidence } from '../../src/types/evidence';

describe('计算书生成器', () => {
  it('应生成包含所有必需章节的计算书', () => {
    const result = createEmptyResult('test');
    result.inputs = [{ label: 'b', value: 250, unit: 'mm' }];
    result.materials = [{ label: 'fc', value: 14.3, unit: 'MPa' }];
    result.geometry = [{ label: 'h0', value: 465, unit: 'mm' }];
    result.steps = [{
      name: '测试步骤',
      description: '描述',
      formula: 'x = 100',
      result: 100,
      unit: 'mm',
      evidence: [createReviewRequiredEvidence('混凝土结构设计规范', 'GB 50010', '6.2.10', 'test')],
    }];
    result.results = [{ label: 'Mu', value: 150, unit: 'kN·m' }];
    result.checks = [{
      name: '承载力验算',
      calculatedValue: 150,
      limitValue: 120,
      comparison: '>=',
      passed: true,
      unit: 'kN·m',
      evidence: [],
    }];
    result.conclusion = { passed: true, summary: '通过', evidence: [] };

    const report = generateReport(result);

    expect(report.length).toBeGreaterThanOrEqual(8);
    expect(report.some(s => s.title.includes('设计依据'))).toBe(true);
    expect(report.some(s => s.title.includes('已知条件'))).toBe(true);
    expect(report.some(s => s.title.includes('材料参数'))).toBe(true);
    expect(report.some(s => s.title.includes('计算过程'))).toBe(true);
    expect(report.some(s => s.title.includes('验算'))).toBe(true);
    expect(report.some(s => s.title.includes('结论'))).toBe(true);
    expect(report.some(s => s.title.includes('规范依据'))).toBe(true);
  });

  it('空计算结果应能生成基本计算书', () => {
    const result = createEmptyResult('test');
    const report = generateReport(result);
    expect(report.length).toBeGreaterThan(0);
  });
});
