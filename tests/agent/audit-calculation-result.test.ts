import { describe, expect, it } from 'vitest';
import { auditCalculationResult } from '../../src/agent/calculation-auditor';
import { createEmptyResult } from '../../src/types/calculation';
import { Evidence } from '../../src/types/evidence';

const evidence = (edition: string): Evidence => ({
  codeName: '混凝土结构设计规范',
  codeNumber: 'GB 50010',
  edition,
  chapter: '第6章',
  clause: '6.2.10',
  originalText: '',
  pdfPage: 55,
  status: 'superseded',
  verificationStatus: 'VERIFIED',
  sourceFile: 'GB50010-2010_2015_.pdf',
});

describe('CalculationResult Auditor（运行期结构审查，不执行工程公式）', () => {
  it('对一个健康结果返回 PASS', () => {
    const result = createEmptyResult('beam-flexure');
    result.results = [{ label: '受弯承载力 Mu', value: 181.74, unit: 'kN·m' }];
    result.steps = [{
      name: '计算正截面受弯承载力', description: '', formula: 'M_u = ...',
      result: 181.74, unit: 'kN·m', evidence: [evidence('2010（2015年版）')],
    }];
    result.checks = [{
      name: '承载力验算', calculatedValue: 120, limitValue: 181.74,
      comparison: '<=', passed: true, unit: 'kN·m', evidence: [],
    }];
    result.allEvidence = [evidence('2010（2015年版）')];
    const audit = auditCalculationResult(result, { expectedEdition: '2010（2015年版）' });
    expect(audit.passed).toBe(true);
  });

  it('检测 NaN / Infinity / 非有限数值结果', () => {
    const result = createEmptyResult('beam-flexure');
    result.results = [
      { label: '受弯承载力 Mu', value: Number.NaN, unit: 'kN·m' },
      { label: '受压区高度 x', value: Number.POSITIVE_INFINITY, unit: 'mm' },
    ];
    const audit = auditCalculationResult(result);
    expect(audit.passed).toBe(false);
    const codes = audit.issues.map(i => i.code);
    expect(codes).toContain('NON_FINITE_RESULT');
    expect(codes.filter(c => c === 'NON_FINITE_RESULT').length).toBeGreaterThanOrEqual(2);
  });

  it('检测缺少单位的数值结果', () => {
    const result = createEmptyResult('beam-flexure');
    result.results = [{ label: '受弯承载力 Mu', value: 181.74, unit: '' }];
    const audit = auditCalculationResult(result);
    expect(audit.issues.some(i => i.code === 'RESULT_UNIT_MISSING')).toBe(true);
  });

  it('检测证据版本与指定设计依据不一致（规范版本风险）', () => {
    const result = createEmptyResult('beam-flexure');
    result.allEvidence = [evidence('2010（2015年版）')];
    const audit = auditCalculationResult(result, { expectedEdition: '2024版' });
    expect(audit.issues.some(i => i.code === 'EDITION_MISMATCH')).toBe(true);
    expect(audit.passed).toBe(false);
  });

  it('检测结果内部 Evidence 版本混杂', () => {
    const result = createEmptyResult('column');
    result.allEvidence = [
      evidence('2010（2015年版）'),
      { ...evidence('2010（2015年版）'), clause: '6.2.15', edition: '2010(2015)' },
    ];
    const audit = auditCalculationResult(result);
    expect(audit.issues.some(i => i.code === 'RESULT_EDITION_MIXED')).toBe(true);
  });

  it('允许不同规范各自使用对应版本', () => {
    const result = createEmptyResult('beam-flexure');
    result.allEvidence = [
      evidence('2010（2024年版）'),
      {
        ...evidence('2012'),
        codeName: '建筑结构荷载规范',
        codeNumber: 'GB 50009',
        chapter: '第3章',
        clause: '3.2.3',
      },
      {
        ...evidence('2021'),
        codeName: '混凝土结构通用规范',
        codeNumber: 'GB 55008',
        chapter: '第4章',
        clause: '4.1.1',
      },
    ];

    const audit = auditCalculationResult(result);
    expect(audit.issues.some(i => i.code === 'RESULT_EDITION_MIXED')).toBe(false);
    expect(audit.passed).toBe(true);
  });

  it('阻止无 Evidence 的材料或设计参数进入计算书', () => {
    const result = createEmptyResult('steel-beam');
    result.materials = [{ label: '抗弯强度设计值 f（用户输入）', value: 215, unit: 'N/mm²' }];

    const audit = auditCalculationResult(result);
    expect(audit.passed).toBe(false);
    expect(audit.issues.some(i => i.code === 'MATERIAL_EVIDENCE_MISSING')).toBe(true);
  });

  it('检测未校核（UNVERIFIED/REVIEW_REQUIRED）证据', () => {
    const result = createEmptyResult('beam-flexure');
    result.allEvidence = [{
      ...evidence('2010（2015年版）'), verificationStatus: 'REVIEW_REQUIRED', clause: '6.3.4',
    }];
    const audit = auditCalculationResult(result);
    expect(audit.issues.some(i => i.code === 'UNVERIFIED_EVIDENCE')).toBe(true);
  });
});
