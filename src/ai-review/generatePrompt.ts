import type { AIReviewPackage } from './types';

/**
 * 生成 AI 独立复核 Prompt。
 * 纯文本生成，不调用任何 LLM API。
 */
export function generateReviewPrompt(pkg: AIReviewPackage): string {
  const lines: string[] = [];

  lines.push('【结构计算独立复核任务】');
  lines.push('');
  lines.push('你现在作为独立结构工程计算复核人员。');
  lines.push('下面提供的是某结构计算程序产生的一份计算记录。');
  lines.push('');
  lines.push('重要：不要默认程序公式、计算过程、规范引用或最终结果正确。请进行独立复核。');
  lines.push('程序输出只是"待复核对象"，不是标准答案。');
  lines.push('');
  lines.push('='.repeat(60));
  lines.push('');

  // 1. 计算对象
  lines.push('【1. 计算对象】');
  lines.push(`Calculation Skill: ${pkg.calculationSkill}`);
  lines.push(`计算类型: ${pkg.calculationTitle}`);
  if (pkg.internalMechanics) {
    lines.push('');
    lines.push('⚠️ 注意：本计算的内力分析方法属于 INTERNAL-MECHANICS（结构力学方法，如三弯矩方程），');
    lines.push('不是 GB 规范条文公式。复核时请将其视为结构力学推导，而非规范强制条文。');
  }
  lines.push('');

  // 2. 输入条件
  lines.push('【2. 输入条件】');
  if (pkg.input.length === 0) {
    lines.push('（无）');
  } else {
    for (const inp of pkg.input) {
      lines.push(`  ${inp.label}: ${inp.value} ${inp.unit}`);
    }
  }
  lines.push('');

  // 3. 几何条件
  if (pkg.geometry.length > 0) {
    lines.push('【3. 几何条件】');
    for (const g of pkg.geometry) {
      lines.push(`  ${g.label}: ${g.value} ${g.unit}`);
    }
    lines.push('');
  }

  // 4. 材料
  if (pkg.materials.length > 0) {
    lines.push('【4. 材料】');
    for (const m of pkg.materials) {
      lines.push(`  ${m.label}: ${m.value} ${m.unit}`);
    }
    lines.push('');
  }

  // 5. 荷载/内力（在 input 和 results 中）
  lines.push('【5. 荷载 / 内力】');
  const loadItems = [
    ...pkg.input.filter(i => /荷载|弯矩|剪力|轴力|Nk|设计值/i.test(i.label)),
    ...pkg.results.filter(r => /荷载|弯矩|剪力|轴力|M|V|N\b/i.test(r.label)),
  ];
  if (loadItems.length === 0) {
    lines.push('（详见输入条件与结果）');
  } else {
    for (const l of loadItems) {
      lines.push(`  ${l.label}: ${l.value} ${l.unit}`);
    }
  }
  lines.push('');

  // 6. 计算过程
  lines.push('【6. 程序采用的计算过程】');
  if (pkg.steps.length === 0) {
    lines.push('（无步骤记录）');
  } else {
    for (const s of pkg.steps) {
      lines.push(`  Step ${s.index}: ${s.name}`);
      lines.push(`    说明: ${s.description}`);
      lines.push(`    公式: ${s.formula}`);
      if (s.substitutedFormula) lines.push(`    代入: ${s.substitutedFormula}`);
      lines.push(`    结果: ${s.result} ${s.unit}`);
      if (s.evidence.length > 0) {
        for (const ev of s.evidence) {
          lines.push(`    Evidence: ${ev.codeNumber} ${ev.clause} [${ev.verificationStatus}]`);
        }
      }
    }
  }
  lines.push('');

  // 7. 最终结果
  lines.push('【7. 程序最终结果】');
  for (const r of pkg.results) {
    lines.push(`  ${r.label}: ${r.value} ${r.unit}`);
  }
  if (pkg.checks.length > 0) {
    lines.push('');
    lines.push('验算项:');
    for (const c of pkg.checks) {
      const mark = c.passed ? '✓' : '✗';
      lines.push(`  ${mark} ${c.name}: ${c.calculated} ${c.unit} ${c.comparison} ${c.limit} ${c.unit}`);
    }
  }
  lines.push('');
  lines.push(`结论: ${pkg.conclusion.passed ? '通过' : '不通过'} — ${pkg.conclusion.summary}`);
  lines.push('');

  // 8. 规范依据
  lines.push('【8. 规范依据】');
  if (pkg.normativeVersions.length > 0) {
    lines.push('本计算采用的规范版本:');
    for (const v of pkg.normativeVersions) {
      lines.push(`  - ${v.codeName} ${v.codeNumber} ${v.edition} [${v.status}]`);
    }
  }
  lines.push('');
  if (pkg.evidence.length === 0) {
    lines.push('（无规范 Evidence）');
  } else {
    for (const ev of pkg.evidence) {
      lines.push(`  ${ev.codeNumber} ${ev.clause} (${ev.edition})`);
      if (ev.text) lines.push(`    原文: ${ev.text}`);
      if (ev.page !== null) lines.push(`    页码: p.${ev.page}`);
      lines.push(`    状态: ${ev.verificationStatus}`);
      if (ev.verificationStatus === 'REVIEW_REQUIRED') {
        lines.push('    ⚠️ 该规范依据尚未完成项目内部原文核验，请 AI 特别检查，不得视为已确认依据。');
      }
    }
  }
  lines.push('');

  // 9. 已知警告
  lines.push('【9. 已知警告】');
  if (pkg.warnings.length === 0) {
    lines.push('（无）');
  } else {
    for (const w of pkg.warnings) lines.push(`  - ${w}`);
  }
  lines.push('');

  // 独立基础专项提醒
  if (pkg.magnitudeHighRisk) {
    lines.push('⚠️ 本模块为数量级高风险模块（独立基础）。');
    lines.push('请重点独立检查单位换算:');
    lines.push('  - N ↔ kN (×10³)');
    lines.push('  - mm ↔ m (×10⁻³)');
    lines.push('  - kPa ↔ Pa (×10³)');
    lines.push('  - N·mm ↔ kN·m (×10⁶)');
    lines.push('  - mm² ↔ m² (×10⁻⁶)');
    lines.push('请重点独立复算: 基础面积、基底反力、弯矩、冲切、抗剪、配筋。');
    lines.push('');
  }

  // 10. 独立复核要求
  lines.push('【10. 独立复核要求】');
  lines.push('请完成以下检查:');
  lines.push('1. 判断计算模型是否适用于当前构件和输入条件。');
  lines.push('2. 不依赖程序结论，独立重新计算关键结果。');
  lines.push('3. 检查公式选择是否正确，公式适用条件是否满足。');
  lines.push('4. 检查输入参数是否遗漏或错误。');
  lines.push('5. 检查材料参数是否合理。');
  lines.push('6. 检查单位换算，重点关注 10³ / 10⁶ / 10⁹ 数量级错误。');
  lines.push('   - N / kN, mm / m, Pa / kPa / MPa, N·mm / kN·m, mm² / m²');
  lines.push('7. 检查规范条文是否真正支持所采用公式。');
  lines.push('8. 对 REVIEW_REQUIRED Evidence 重点提出核验要求。');
  lines.push('9. 检查是否遗漏必要验算。');
  lines.push('10. 检查中间计算是否存在逻辑跳步。');
  lines.push('11. 判断最终结果数量级是否具有工程合理性。');
  lines.push('12. 检查计算书展示公式是否与实际计算过程一致。');
  lines.push('13. 如发现错误，请指出: 错误位置、原计算、问题原因、建议正确方法、重新计算结果。');
  lines.push('');

  // 11. 输出格式
  lines.push('【11. 请按以下格式回答】');
  lines.push('A. 总体复核结论');
  lines.push('B. 输入检查');
  lines.push('C. 计算模型检查');
  lines.push('D. 公式检查');
  lines.push('E. 独立复算');
  lines.push('F. 单位与数量级检查');
  lines.push('G. 规范 Evidence 检查');
  lines.push('H. 遗漏验算');
  lines.push('I. 工程合理性');
  lines.push('J. 问题清单（每个问题标记 BLOCKER/HIGH/MEDIUM/LOW 和类别）');
  lines.push('');
  lines.push('最后输出复核状态: PASS / PASS_WITH_WARNINGS / REVIEW_REQUIRED / FAIL');
  lines.push('');
  lines.push('注意: AI 的 PASS 不能自动改变项目 Evidence 状态。');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push('【隐私提醒】复核内容可能包含项目尺寸、荷载、材料及计算数据。粘贴到第三方 AI 前，请确认符合所在单位的数据与保密要求。');

  return lines.join('\n');
}
