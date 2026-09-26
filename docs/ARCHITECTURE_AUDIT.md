# 当前架构审计报告

审计范围：`src/`、`tests/`、`references/codes/`、`docs/`、`package.json`。

审计目标：在不重写现有计算逻辑的前提下，为结构计算 Agent 增加可发现、可校验、可调用的 Skill 层。

## 1. 当前分层

```text
React 页面（src/components）
        |
        +-- 直接调用部分 calc-core
        |
        +-- 读取 CalculationResult / ResultTabs
        |
src/core 计算函数
        |
        +-- 部分函数直接创建 CalculationResult
        +-- 部分函数只返回数值结果
        |
src/report 适配器与计算书生成器
        |
CalculationResult + Evidence
```

当前没有统一的 Skill Registry，也没有一个面向 Agent 的稳定调用入口。`src/codes/registry.ts` 目前是规范登记数据的占位层，不承担计算 Skill 注册。

## 2. 计算入口与输入模型

| 模块 | 入口 | 输入模型位置 | 当前输出方式 |
| --- | --- | --- | --- |
| 矩形梁正截面受弯 | `calculateBeamFlexure` | `src/core/beam/flexure.ts` | 直接返回 `CalculationResult` |
| 矩形梁斜截面受剪 | `calculateBeamShear` | `src/core/beam/shear.ts` | 直接返回 `CalculationResult` |
| T 形梁正截面受弯 | `calculateBeamTFlexure` | `src/core/beam/t-flexure.ts` | 直接返回 `CalculationResult` |
| 连续梁内力 | `calculateContinuousBeam` | `src/core/beam/continuous.ts` | 数值结果，由 `src/report/analysis-adapters.ts` 转换 |
| 轴心受压柱 | `calculateAxialColumn` | `src/core/column/axial.ts` | 数值结果，由 `src/report/analysis-adapters.ts` 转换 |
| 偏心受压柱 | `calculateEccentricColumn` | `src/core/column/eccentric.ts` | 数值结果，由 `src/report/eccentric-column-adapter.ts` 转换 |
| 钢梁 | `calculateSteelBeam` | `src/core/steel/beam.ts` | 数值结果，由页面直接组装显示 |
| 截面性质、钢筋面积、材料重度 | `calculateSectionProperties`、`calculateRebarArea`、`calculateMaterialWeight` | `src/core/section`、`src/core/tools` | 数值结果，分别由页面或 report adapter 展示 |

`beam-shear` 的输入模型已经包含截面、材料、剪力、箍筋和荷载类型，但其字段是宽松的 `string` 与可选数字；枚举和条件约束目前主要由页面与计算函数内部判断。

## 3. 输出模型与计算书

共享输出模型位于 `src/types/calculation.ts`，包含：

- `inputs`、`materials`、`geometry`、`steps`、`results`；
- `checks`、`conclusion`、`advisories`；
- `overallStatus` 和 `allEvidence`。

`src/report/generator.ts` 将 `CalculationResult` 生成计算书节；`src/components/report/ResultTabs.tsx` 负责结果、详细计算书和规范依据三个视图。这个模型可以直接作为 Agent 的稳定返回值，不需要重新设计。

## 4. Evidence 结构

`src/types/evidence.ts` 的 `Evidence` 已包含规范名称、编号、版本、章节、条文号、摘录、PDF 页码、来源文件、规范状态和校核状态。`verificationStatus` 支持 `VERIFIED`、`REVIEW_REQUIRED`、`UNVERIFIED`。

当前存在两种 Evidence 组织方式：

1. `beam-flexure`、`beam-shear`、`beam-t-flexure` 在计算核心内部创建 Evidence；
2. 连续梁、轴压柱、偏心柱和材料工具在 `src/report` 中创建 Evidence 或使用待核验占位。

这两种方式都要保持兼容。Skill 层只登记 Evidence 目录和入口，不把规范原文复制成第二套运行时公式来源。

## 5. 测试案例

测试按 `tests/core`、`tests/components`、`tests/report`、`tests/types` 分层。`beam-shear` 已有核心计算测试和组件测试，覆盖正常输入、均布/集中荷载、承载力不满足、最小配箍率和输入错误等场景。

Skill 元数据还需要把测试按 `normal`、`boundary`、`invalid`、`unit`、`formula`、`pass-fail` 分类登记，登记不会取代 Vitest 测试。

## 6. 主要风险

1. **Evidence 状态风险**：`beam-shear.ts` 文件头和局部 Evidence 使用 `VERIFIED`，但项目同时存在 2024 年局部修订文件，且全局页面提示新旧版本差异尚未完成核对。Skill 迁移不应扩大这个状态，也不应自动把 `REVIEW_REQUIRED` 改成 `VERIFIED`。
2. **入口不一致**：有的核心函数返回 `CalculationResult`，有的只返回数值结果；Skill 包装层必须提供统一的 Agent 入口，同时保留原函数。
3. **单位约束分散**：单位目前由字段注释、页面控件和结果对象共同表达，尚未有机器可读的 schema；这是单位审查 Skill 的首要检查对象。
4. **适用范围不完整**：`beam-shear` 已实现矩形梁、仅配置箍筋的范围，但深受弯构件、预应力、抗震专项和其他构造验算不应被 Agent 默认推断为已覆盖。
5. **连续梁依赖外部计算库**：连续梁使用本地安装的 `@ferscloud/fers-calculation-web` WASM；Skill Registry 需要把它登记为现有实现依赖，而不是在 Agent 层重复实现。
6. **规范证据不是 AI 生成物**：运行时只读取已登记的证据记录；OCR、网络检索和语言模型都不能直接改变 calc-core 公式或校核状态。

## 7. 迁移结论

第一批选择 `beam-shear` 是合适的：它已经有较完整的 `CalculationResult`、逐步计算书和测试，可用薄包装层验证 Skill manifest、schema、Evidence 清单、Registry 调用和 Calculation Auditor，而不改变现有数值路径。

迁移完成的判据：原 `calculateBeamShear` 的测试结果不变；页面仍调用原模块；Agent 通过 Registry 调用得到同一 `CalculationResult`；审查器能发现缺失单位、Evidence 和边界测试；所有规范状态仍按现有证据状态显示。
