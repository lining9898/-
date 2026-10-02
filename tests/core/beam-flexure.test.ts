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

    it('配筋率 ρ 按全截面 b·h 计算（与 ρmin 对比口径一致）', () => {
      const result = calculateBeamFlexure(defaultInput);
      const As = 4 * Math.PI * 20 ** 2 / 4;
      expect(result.results.find(item => item.label === '配筋率 ρ（按全截面 b·h，同 8.5.1 口径）')?.value)
        .toBe(Math.round(As / (250 * 500) * 10000) / 100);
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

    it('所有规范依据应标记为 REVIEW_REQUIRED（B14 修复 BUG-01 后）', () => {
      const result = calculateBeamFlexure(defaultInput);
      expect(result.overallStatus).toBe('REVIEW_REQUIRED');
      result.allEvidence.forEach(e => {
        expect(e.verificationStatus).toBe('REVIEW_REQUIRED');
      });
    });

    it('材料表证据同时指向旧版准确页和 2024 修订原页', () => {
      const evidence = calculateBeamFlexure(defaultInput).allEvidence;
      expect(evidence).toEqual(expect.arrayContaining([
        expect.objectContaining({ clause: '4.1.4', pdfPage: 35, sourceFile: 'GB50010-2010_2015_.pdf' }),
        expect.objectContaining({ clause: '4.2.3', pdfPage: 39, sourceFile: 'GB50010-2010_2015_.pdf' }),
        expect.objectContaining({ clause: '表 4.1.4-1', pdfPage: 6, sourceFile: 'GBT50010-2010_2024_amendment.pdf' }),
        expect.objectContaining({ clause: '表 4.1.4-2', pdfPage: 7, sourceFile: 'GBT50010-2010_2024_amendment.pdf' }),
        expect.objectContaining({ clause: '表 4.2.3-1', pdfPage: 9, sourceFile: 'GBT50010-2010_2024_amendment.pdf' }),
        expect.objectContaining({ clause: '表 4.2.5', pdfPage: 11, sourceFile: 'GBT50010-2010_2024_amendment.pdf' }),
        expect.objectContaining({ clause: '局部修订说明（6.2 节）', pdfPage: 2,
          sourceFile: 'GBT50010-2010_2024_amendment.pdf' }),
        expect.objectContaining({ codeNumber: 'GB 55008', clause: '4.4.2', pdfPage: 14 }),
      ]));
    });

    it('应包含现行规范尚待融合的警告', () => {
      const result = calculateBeamFlexure(defaultInput);
      expect(result.advisories.some(a => a.code === 'NORM_UPDATE_REQUIRED')).toBe(true);
    });

    it('框架梁未填抗震等级时保留缺项与单项计算范围提示', () => {
      const result = calculateBeamFlexure({ ...defaultInput, beamType: 'frameBeam' });
      expect(result.advisories.map(item => item.code)).toEqual(expect.arrayContaining([
        'SEISMIC_GRADE_UNKNOWN', 'FLEXURE_ONLY_SCOPE',
      ]));
      expect(result.inputs).toEqual(expect.arrayContaining([
        expect.objectContaining({ label: '抗震等级', value: '未声明' }),
      ]));
      expect(result.overallStatus).toBe('REVIEW_REQUIRED');
    });

    it('已声明等级只记录条件，不会自动给出抗震构造通过结论', () => {
      const result = calculateBeamFlexure({ ...defaultInput, beamType: 'frameBeam', seismicGrade: '2' });
      expect(result.advisories.some(item => item.code === 'SEISMIC_GRADE_UNKNOWN')).toBe(false);
      expect(result.advisories.some(item => item.code === 'SEISMIC_LOCATION_UNKNOWN')).toBe(true);
      expect(result.advisories.some(item => item.code === 'FLEXURE_ONLY_SCOPE')).toBe(true);
      expect(result.overallStatus).toBe('REVIEW_REQUIRED');
    });

    it('按 GB 55008 表 4.4.8-1 提高一级框架梁梁端和跨中最小配筋率', () => {
      const support = calculateBeamFlexure({ ...defaultInput, beamType: 'frameBeam', seismicGrade: '1', sectionLocation: 'support' });
      const span = calculateBeamFlexure({ ...defaultInput, beamType: 'frameBeam', seismicGrade: '1', sectionLocation: 'span' });
      const minimum = (result: CalculationResult) => result.results.find(item => item.label === '最小配筋面积 As,min')?.value;
      expect(minimum(support)).toBe(500);
      expect(minimum(span)).toBe(375);
      expect(support.checks.find(item => item.name === '最小配筋率验算')?.evidence)
        .toEqual(expect.arrayContaining([expect.objectContaining({ codeNumber: 'GB 55008', clause: '4.4.8', pdfPage: 17 })]));
      expect(support.overallStatus).toBe('REVIEW_REQUIRED');
    });

    it('GB 55001 安全等级改变 γ₀M 承载力判定，并附条文页码', () => {
      const ordinary = calculateBeamFlexure({ ...defaultInput, moment: 170, structuralSafetyGrade: '2' });
      const important = calculateBeamFlexure({ ...defaultInput, moment: 170, structuralSafetyGrade: '1' });
      expect(ordinary.checks.find(item => item.name === '承载力验算')?.passed).toBe(true);
      expect(important.checks.find(item => item.name === '承载力验算')?.passed).toBe(false);
      expect(important.results.find(item => item.label === '承载力设计弯矩 γ₀M')?.value).toBe(187);
      expect(important.checks.find(item => item.name === '承载力验算')?.evidence)
        .toEqual(expect.arrayContaining([
          expect.objectContaining({ codeNumber: 'GB 55001', clause: '3.1.10', pdfPage: 13 }),
          expect.objectContaining({ codeNumber: 'GB 55001', clause: '3.1.12', pdfPage: 13 }),
        ]));
      expect(important.overallStatus).toBe('REVIEW_REQUIRED');
    });

    it('一级抗震等级不等于地震组合；持久状况三级安全等级仍按 γ₀=0.9', () => {
      const result = calculateBeamFlexure({ ...defaultInput,
        beamType: 'frameBeam', seismicGrade: '1', sectionLocation: 'span',
        structuralSafetyGrade: '3', designSituation: 'persistent',
      });
      expect(result.results.find(item => item.label === '重要性系数 γ₀')?.value).toBe(0.9);
      expect(result.results.find(item => item.label === '承载力抗震调整系数 γRE')?.value).toBe(1);
      expect(result.results.find(item => item.label === '最小配筋面积 As,min')?.value).toBe(375);
      expect(result.allEvidence.some(item => item.codeNumber === 'GB 55002')).toBe(false);
    });

    it('一般地震组合按 GB 55002 表 4.3.1 取 γRE=0.75，γ₀=1.0', () => {
      const result = calculateBeamFlexure({ ...defaultInput,
        beamType: 'frameBeam', seismicGrade: '1', sectionLocation: 'span',
        structuralSafetyGrade: '3', designSituation: 'seismic', seismicAction: 'general',
      });
      expect(result.results.find(item => item.label === '重要性系数 γ₀')?.value).toBe(1);
      expect(result.results.find(item => item.label === '承载力抗震调整系数 γRE')?.value).toBe(0.75);
      expect(result.results.find(item => item.label === '调整后受弯承载力 Mu/γRE')?.value).toBe(242.32);
      expect(result.checks.find(item => item.name === '承载力验算')).toMatchObject({
        passed: true, limitValue: 120,
      });
      expect(result.allEvidence).toEqual(expect.arrayContaining([
        expect.objectContaining({ codeNumber: 'GB 55002', clause: '4.3.1', pdfPage: 18,
          verificationStatus: 'REVIEW_REQUIRED' }),
      ]));
      expect(result.overallStatus).toBe('REVIEW_REQUIRED');
    });

    it('竖向地震为主时 γRE=1.0，不可把三级安全等级的 γ₀=0.9 用于地震', () => {
      const result = calculateBeamFlexure({ ...defaultInput, moment: 190,
        beamType: 'frameBeam', seismicGrade: '1', sectionLocation: 'span',
        structuralSafetyGrade: '3', designSituation: 'seismic', seismicAction: 'verticalDominant',
      });
      expect(result.results.find(item => item.label === '重要性系数 γ₀')?.value).toBe(1);
      expect(result.results.find(item => item.label === '承载力抗震调整系数 γRE')?.value).toBe(1);
      expect(result.checks.find(item => item.name === '承载力验算')?.passed).toBe(false);
      expect(result.conclusion.passed).toBe(false);
    });

    it('设计状况或地震类别未声明时显示保守数值并给出待核警告', () => {
      const unknown = calculateBeamFlexure({ ...defaultInput, structuralSafetyGrade: '3' });
      expect(unknown.results.find(item => item.label === '重要性系数 γ₀')?.value).toBe(1);
      expect(unknown.advisories.some(item => item.code === 'DESIGN_SITUATION_UNKNOWN')).toBe(true);
      const seismic = calculateBeamFlexure({ ...defaultInput, designSituation: 'seismic' });
      expect(seismic.results.find(item => item.label === '承载力抗震调整系数 γRE')?.value).toBe(1);
      expect(seismic.advisories.some(item => item.code === 'SEISMIC_ACTION_UNKNOWN')).toBe(true);
    });

    it('外部弯矩缺少荷载组合来源时明确待核，并登记两个规范的原页', () => {
      const missing = calculateBeamFlexure(defaultInput);
      expect(missing.advisories.some(item => item.code === 'MOMENT_BASIS_MISSING')).toBe(true);
      const traced = calculateBeamFlexure({ ...defaultInput, momentBasis: 'LOAD-07 基本组合控制工况' });
      expect(traced.advisories.some(item => item.code === 'MOMENT_BASIS_MISSING')).toBe(false);
      expect(traced.inputs).toEqual(expect.arrayContaining([
        expect.objectContaining({ label: '弯矩荷载组合与内力来源', value: 'LOAD-07 基本组合控制工况' }),
      ]));
      expect(traced.allEvidence).toEqual(expect.arrayContaining([
        expect.objectContaining({ codeNumber: 'GB 55001', clause: '3.1.7', pdfPage: 12 }),
        expect.objectContaining({ codeNumber: 'GB 50009', clause: '3.2.3', pdfPage: 20 }),
      ]));
      expect(traced.overallStatus).toBe('REVIEW_REQUIRED');
    });

    it('受弯公式证据应指向 6.2.10（REVIEW_REQUIRED，等待人工核验）', () => {
      const result = calculateBeamFlexure(defaultInput);
      const capacityStep = result.steps.find(step => step.name === '计算正截面受弯承载力');
      expect(capacityStep?.evidence[0]).toMatchObject({
        clause: '6.2.10',
        verificationStatus: 'REVIEW_REQUIRED',
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

  describe('IG-001 最低强度等级 C20→C25 硬限制', () => {
    it('C20 应被 BLOCKED（CONCRETE_GRADE_BELOW_MINIMUM，不进入计算）', () => {
      const result = calculateBeamFlexure({ ...defaultInput, concreteGrade: 'C20' });
      expect(result.advisories.some(a => a.code === 'CONCRETE_GRADE_BELOW_MINIMUM')).toBe(true);
      // 不进入正式计算：steps/results 为空
      expect(result.steps.length).toBe(0);
      expect(result.results.length).toBe(0);
    });

    it('C25 应通过硬限制', () => {
      const result = calculateBeamFlexure({ ...defaultInput, concreteGrade: 'C25' });
      expect(result.advisories.some(a => a.code === 'CONCRETE_GRADE_BELOW_MINIMUM')).toBe(false);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('C30 应通过硬限制', () => {
      const result = calculateBeamFlexure({ ...defaultInput, concreteGrade: 'C30' });
      expect(result.advisories.some(a => a.code === 'CONCRETE_GRADE_BELOW_MINIMUM')).toBe(false);
      expect(result.steps.length).toBeGreaterThan(0);
    });
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
