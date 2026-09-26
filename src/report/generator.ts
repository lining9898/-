/**
 * 计算书生成器
 * 将 CalculationResult 转换为结构化的计算书格式
 */

import { CalculationResult, CalculationStep, CheckItem } from '../types/calculation';
import { Evidence } from '../types/evidence';

export interface ReportSection {
  title: string;
  content: string;
  evidence: Evidence[];
}

/** 从 CalculationResult 生成计算书各节 */
export function generateReport(result: CalculationResult): ReportSection[] {
  const sections: ReportSection[] = [];

  // 1. 设计依据
  sections.push({
    title: '一、设计依据',
    content: result.allEvidence
      .filter((e, i, arr) => arr.findIndex(x => x.codeNumber === e.codeNumber) === i)
      .map(e => `${e.codeNumber}-${e.codeName}（${e.edition}版）${e.status === 'current' ? '现行' : e.status === 'superseded' ? '已废止' : '征求意见稿'}${e.verificationStatus === 'REVIEW_REQUIRED' ? '【待校核】' : ''}`)
      .join('\n') || '暂无',
    evidence: result.allEvidence,
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

  // 9. 规范依据汇总
  const evidenceSummary = result.allEvidence
    .filter((e, i, arr) => arr.findIndex(x => x.clause === e.clause && x.codeNumber === e.codeNumber) === i)
    .map(e => `${e.codeNumber} ${e.clause}：${e.originalText} [${e.verificationStatus}]`)
    .join('\n');
  sections.push({
    title: '九、规范依据',
    content: evidenceSummary || '暂无',
    evidence: result.allEvidence,
  });

  return sections;
}
