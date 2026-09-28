import { createEmptyResult, CalculationResult } from '../../src/types/calculation';
import { Evidence, createReviewRequiredEvidence } from '../../src/types/evidence';
import { calculateContinuousBeam, ContinuousSpanInput } from '../../src/core/beam/continuous';
import { continuousBeamReport } from '../../src/report/analysis-adapters';

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** 校验连续梁输入：spans 为 1–4 个 { length, load } 对象 */
export function isContinuousBeamInput(input: unknown): input is ContinuousSpanInput[] {
  if (!Array.isArray(input)) return false;
  if (input.length < 1 || input.length > 4) return false;
  return input.every(span =>
    span && typeof span === 'object'
      && isFiniteNumber((span as Record<string, unknown>).length)
      && isFiniteNumber((span as Record<string, unknown>).load));
}

/**
 * 结构力学方法证据（非 GB 规范公式）。
 * 连续梁内力由线弹性结构力学（有限元/三弯矩方程）求解，不强行挂 GB 50010 条文。
 */
function mechanicsEvidence(applicability: string, formula: string): Evidence {
  const record = createReviewRequiredEvidence('结构力学方法', 'INTERNAL-MECHANICS', 'N/A', applicability);
  record.edition = 'platform';
  record.chapter = '线弹性结构内力';
  record.status = 'current';
  record.sourceFile = null;
  return record;
}

export function invokeContinuousBeam(input: unknown): CalculationResult {
  if (!isContinuousBeamInput(input)) {
    const result = createEmptyResult('beam-continuous');
    result.advisories.push({
      severity: 'error',
      code: 'SKILL_INPUT_INVALID',
      message: 'Agent 输入不符合 beam-continuous/schema.json；spans 应为 1–4 个 { length, load } 对象。',
    });
    return result;
  }
  try {
    const core = calculateContinuousBeam(input);
    const report = continuousBeamReport(input, core);

    // 挂接结构力学（非 GB）证据
    const loadEvidence = mechanicsEvidence('全跨均布荷载的竖向合力 Q = q·L（静力平衡，非 GB 规范公式）', 'Q = q · L');
    const solverEvidence = mechanicsEvidence(
      '支座弯矩与杆端内力由线弹性有限元求解器（FERS）/ 三弯矩方程计算（结构力学方法，非 GB 规范公式）', 'FERS 线弹性求解');
    const sectionForceEvidence = mechanicsEvidence(
      '跨内剪力与弯矩：V(x) = V左 − qx；M(x) = M左 + V左·x − qx²/2（静力平衡导出，非 GB 规范公式）',
      'V(x) = V左 − qx；M(x) = M左 + V左·x − qx²/2');
    const equilibriumEvidence = mechanicsEvidence(
      '整体竖向力平衡 ΣR − Σ(q·L) = 0（结构力学静力平衡，非 GB 规范公式）', 'ΣR − Σ(q·L) = 0');
    report.allEvidence = [loadEvidence, solverEvidence, sectionForceEvidence, equilibriumEvidence];

    report.steps = report.steps.map(step => {
      if (step.name === '整体竖向力平衡') return { ...step, evidence: [equilibriumEvidence] };
      if (step.name.includes('均布荷载合力')) return { ...step, evidence: [loadEvidence] };
      if (step.name.includes('截面内力')) return { ...step, evidence: [solverEvidence, sectionForceEvidence] };
      return step;
    });

    report.results = report.results.map(item => {
      if (item.label.includes('支座') && item.label.includes('弯矩')) return { ...item, evidence: [solverEvidence] };
      if (item.label.includes('支座') && item.label.includes('反力')) return { ...item, evidence: [solverEvidence, equilibriumEvidence] };
      if (item.label.includes('最大正弯矩')) return { ...item, evidence: [solverEvidence, sectionForceEvidence] };
      return item;
    });

    report.advisories.push({
      severity: 'info',
      code: 'NON_GB_METHOD',
      message: '连续梁内力采用结构力学（线弹性有限元/三弯矩方程）方法，不属于 GB 规范公式，未挂接 GB 条文。',
    });
    report.overallStatus = 'REVIEW_REQUIRED';
    return report;
  } catch (error) {
    const result = createEmptyResult('连续梁内力计算');
    result.advisories.push({
      severity: 'error',
      code: 'CALCULATION_INPUT_INVALID',
      message: error instanceof Error ? error.message : '连续梁输入不在当前 Skill 适用范围内',
    });
    return result;
  }
}
