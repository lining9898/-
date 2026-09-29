/**
 * 计算书生成器
 * 将 CalculationResult 转换为结构化的计算书格式
 */

import { CalculationResult, CalculationStep, CheckItem } from '../types/calculation';
import { Evidence } from '../types/evidence';
import { resolveCurrentStandardFusion, type StructuralDomain } from '../normative/fusion';

export interface ReportSection {
  title: string;
  content: string;
  evidence: Evidence[];
}

const CALCULATOR_DOMAINS: Record<string, StructuralDomain[]> = {
  'beam-flexure': ['CONCRETE'],
  'beam-shear': ['CONCRETE'],
  'beam-t-flexure': ['CONCRETE'],
  'beam-double-flexure': ['CONCRETE'],
  'slab-one-way': ['CONCRETE'],
  'slab-two-way': ['CONCRETE'],
  'staircase-plate': ['CONCRETE'],
  '轴心受压柱': ['CONCRETE'],
  '偏心受压柱': ['CONCRETE'],
  'foundation-independent': ['FOUNDATION', 'CONCRETE'],
  '材料重度与自重': ['GENERAL'],
};

function uniqueEvidence(result: CalculationResult): Evidence[] {
  const evidence = [
    ...result.allEvidence,
    ...result.materials.flatMap(item => item.evidence ?? []),
    ...result.geometry.flatMap(item => item.evidence ?? []),
    ...result.steps.flatMap(item => item.evidence),
    ...result.results.flatMap(item => item.evidence ?? []),
    ...result.checks.flatMap(item => item.evidence),
    ...result.conclusion.evidence,
  ];
  return evidence.filter((item, index, all) => all.findIndex(candidate =>
    candidate.codeNumber === item.codeNumber && candidate.edition === item.edition && candidate.clause === item.clause
  ) === index);
}

function inferDomains(result: CalculationResult, evidence: Evidence[]): StructuralDomain[] {
  const configured = CALCULATOR_DOMAINS[result.calculatorType];
  if (configured) return configured;
  if (evidence.some(item => item.codeNumber.replace(/\s/g, '') === 'GB50010')) return ['CONCRETE'];
  if (evidence.some(item => item.codeNumber.replace(/\s/g, '') === 'GB50009')) return ['GENERAL'];
  return [];
}

function displayEdition(edition: string): string {
  if (!edition) return '版本待核验';
  if (/^2010\s*\(2015\)$/.test(edition)) return '2010（2015年版）';
  return edition;
}

function designBasisContent(result: CalculationResult, evidence: Evidence[]): string {
  const domains = inferDomains(result, evidence);
  if (domains.length === 0) {
    return '本模块未执行国家规范设计验算，仅提供结构力学分析或几何换算；不形成规范设计结论。';
  }

  const standards = domains
    .flatMap(domain => resolveCurrentStandardFusion(domain).standards)
    .filter((item, index, all) => all.findIndex(candidate => candidate.codeNumber === item.codeNumber) === index);
  const currentLines = standards.map(item => {
    const designation = item.version?.designation ?? item.codeNumber;
    const name = item.version?.codeName ?? '版本尚未登记';
    const authority = item.authorityLevel === 'MANDATORY_GENERAL_CODE' ? '强制性通用规范' : '配套设计标准';
    return `- ${designation}《${name}》：${item.role}（${authority}；条文融合 ${item.clauseEvidenceStatus}）`;
  });

  const baselines = evidence
    .filter((item, index, all) => all.findIndex(candidate =>
      candidate.codeNumber === item.codeNumber && displayEdition(candidate.edition) === displayEdition(item.edition)
    ) === index)
    .map(item => `- ${item.codeNumber}《${item.codeName}》${displayEdition(item.edition)}：计算公式/参数来源基线（${item.verificationStatus}）`);

  return [
    '现行设计依据（应共同执行）',
    ...currentLines,
    '',
    '本计算模块实际公式基线',
    ...(baselines.length ? baselines : ['- 尚未建立可追溯公式基线']),
    '',
    '适用边界：现行条文未完成逐条 Evidence 映射前，本计算书仅供复核，不能作为已完成现行规范校核的设计结论。',
  ].join('\n');
}

/** 从 CalculationResult 生成计算书各节 */
export function generateReport(result: CalculationResult): ReportSection[] {
  const sections: ReportSection[] = [];
  const reportEvidence = uniqueEvidence(result);

  // 1. 设计依据
  sections.push({
    title: '一、设计依据与适用边界',
    content: designBasisContent(result, reportEvidence),
    evidence: [],
  });

  // 2. 已知条件
  sections.push({
    title: '二、已知条件',
    content: result.inputs.map(i => `${i.label} = ${i.value} ${i.unit}`).join('\n'),
    evidence: [],
  });

  // 3. 材料参数
  sections.push({
    title: '三、材料参数',
    content: result.materials.map(m => `${m.label} = ${m.value} ${m.unit}`).join('\n'),
    evidence: result.materials.flatMap(m => m.evidence || []),
  });

  // 4. 截面参数
  sections.push({
    title: '四、截面参数',
    content: result.geometry.map(g => `${g.label} = ${g.value} ${g.unit}`).join('\n'),
    evidence: [],
  });

  // 5. 计算过程
  const stepContent = result.steps.map((s, i) => {
    let text = `步骤${i + 1}：${s.name}\n`;
    text += `${s.description}\n`;
    text += `公式：${s.formula}\n`;
    if (s.substitutedFormula) {
      text += `代入：${s.substitutedFormula}\n`;
    }
    text += `结果：${s.result} ${s.unit}`;
    return text;
  }).join('\n\n');
  sections.push({
    title: '五、计算过程',
    content: stepContent,
    evidence: result.steps.flatMap(s => s.evidence),
  });

  // 6. 计算结果汇总
  sections.push({
    title: '六、计算结果',
    content: result.results.map(r => `${r.label} = ${r.value} ${r.unit}`).join('\n'),
    evidence: [],
  });

  // 7. 验算
  const checkContent = result.checks.map(c => {
    const symbol = c.comparison === '<=' ? '≤' : c.comparison === '>=' ? '≥' : '=';
    const status = c.passed ? '✓ 通过' : '✗ 不通过';
    return `${c.name}\n  计算值: ${c.calculatedValue} ${c.unit}\n  限值: ${symbol} ${c.limitValue} ${c.unit}\n  ${status}`;
  }).join('\n\n');
  sections.push({
    title: '七、验算结果',
    content: checkContent || '未进行设计验算',
    evidence: result.checks.flatMap(c => c.evidence),
  });

  // 8. 结论
  sections.push({
    title: '八、结论',
    content: result.conclusion.summary,
    evidence: result.conclusion.evidence,
  });

  // 9. 公式证据与条文来源（可能是历史计算基线，不等同于现行设计依据）
  const evidenceSummary = reportEvidence
    .filter((e, i, arr) => arr.findIndex(x => x.clause === e.clause && x.codeNumber === e.codeNumber) === i)
    .map(e => `${e.codeNumber} ${displayEdition(e.edition)} 第 ${e.clause} 条：${e.originalText} [${e.verificationStatus}]`)
    .join('\n');
  sections.push({
    title: '九、公式证据与条文来源',
    content: evidenceSummary || '暂无',
    evidence: reportEvidence,
  });

  return sections;
}
