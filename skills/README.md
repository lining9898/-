# Calculation Skills

每个目录是一个可被 Agent 发现的 Skill 包：

- `skill.json`：身份、入口、适用条件和公式映射；
- `schema.json`：输入字段、类型、单位和条件字段；
- `calculator.ts`：对现有 `calc-core` 的兼容调用入口；
- `evidence.json`：规范证据目录，不替代原 PDF 复核；
- `tests.json`：Vitest 测试覆盖登记。

运行时通过 `src/agent/skill-registry.ts` 查找和调用。Registry 不调用网络、OCR 或语言模型；`CalculationResult` 仍由现有计算内核产生。

`calculation-auditor` 是确定性元数据审查 Skill。它可以发现登记层的缺失和矛盾，但不能证明代码公式已经符合规范，也不能把 `REVIEW_REQUIRED` 自动升级为 `VERIFIED`。
