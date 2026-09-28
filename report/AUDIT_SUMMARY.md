# 全仓工程审计报告（Agent 4 / Calculation Auditor）

分支：`agent/audit`｜基准：`7d5683a5`｜审计日期：2026-09-28

## 审计范围

`src/core`、`src/agent`、`skills`、`tests`、`report`；重点：`/1000`、`*1000`、`1e3`、`1e6`、单位隐式转换、重复公式、magic number、Evidence 缺失/不对应、计算书与 `CalculationResult` 一致性。

## 一、单位专项结论（Part 2）

逐一独立复算并验证了以下换算，**未发现真实的 10³/10⁶/10⁹ 数量级错误**：

| 位置 | 换算 | 结论 |
|------|------|------|
| 梁受弯 `Mu`（flexure/t-flexure） | N·mm → kN·m，`/1e6` | 正确 |
| 梁受剪 `Vc/Vs/Vcs/Vmax`（shear） | N → kN，`/1e3` | 正确 |
| 柱轴压 `Nu`（axial） | N → kN，`/1e3` | 正确 |
| 柱偏心 `M`、`Mu`（eccentric） | kN·mm → kN·m `/1e3`；N·mm → kN·m `/1e6` | 正确 |
| 钢筋面积 `areaPerMetre`（rebar-area） | mm²/m，`×1000/s` | 正确 |
| 钢梁应力（steel/beam） | kN·m→N·mm `×1e6`；kN→N `×1e3` | 正确 |

新增 `tests/regression/unit-conversion.test.ts`（12 个用例）把这些量级固定为回归基准。

## 二、Golden Cases（Part 3）

为 5 个主要计算器建立 Golden Case 目录（输入/预期/单位/允许误差/参考来源/Evidence 状态）：

- `skills/beam-flexure/golden-cases.json` — Mu/As/x/xi/xiB/AsMin/rho 基准
- `skills/beam-shear/golden-cases.json` — Vc/Vs/Vcs/Vmax/配箍率 + 集中荷载剪跨比边界
- `skills/column/golden-cases.json` — 轴压 Nu、偏心 ea/设计弯矩
- `skills/rebar-area/golden-cases.json` — 单根/总量/每米面积
- `skills/steel-beam/golden-cases.json` — 弯/剪/稳定应力

规则：**没有可靠外部来源一律不得伪造**。凡依赖仓库内独立复算、尚无教材/规范原文标准算例外部确认的，`evidenceStatus` 标 `REVIEW_REQUIRED` 并在 `note` 注明 `REFERENCE_CASE_REQUIRED`；只有纯几何换算（rebar-area）标 `VERIFIED`。

新增运行器 `tests/regression/golden-cases.test.ts`，逐条按容差校验并在验算项/步骤/几何中定位数值。同时把 golden-case 与版本固定用例登记进 `skills/{beam-flexure,beam-shear,column}/tests.json`。

## 三、Calculation Auditor 改进（Part 4）

`src/agent/calculation-auditor.ts` 增强，且**不执行任何结构计算公式**：

1. **新增 `auditCalculationResult(result, {expectedEdition})`**：检查
   - `NON_FINITE_RESULT`（NaN / Infinity / 非有限值）
   - `STEP_UNIT_MISSING` / `STEP_UNIT_AMBIGUOUS` / `RESULT_UNIT_MISSING`
   - `STEP_EVIDENCE_MISSING`
   - `EDITION_MISMATCH`（结果证据版本 vs 指定设计依据）
   - `RESULT_EDITION_MIXED`（结果内部版本混杂）
   - `EVIDENCE_EDITION_EMPTY` / `UNVERIFIED_EVIDENCE`
2. **`auditSkillPackage` 增加 `EDITION_INCONSISTENT`**：同一 Skill 规范证据版本不一致即报错（内部 `INTERNAL-*`/`platform` 记录除外）。
3. **scope 修正（BUG-06）**：单位声明与六类测试登记检查仅对 `kind==='calculation'` 生效，不再误伤 normative/auditor。

新增 `tests/agent/audit-calculation-result.test.ts`（6 用例）覆盖上述检查。

## 四、Skill 契约（Part 5）

`tests/agent/skill-contract.test.ts` 强制以下边界：

- Calculation → `CalculationResult`；Normative → `NormativeAnswer`；Auditor → `CalculationAuditResult`
- `calculate('gb50010')` 抛错（calculation 不调 normative）；`resolve(计算Skill)` 兜底 `UNVERIFIED`
- `NormativeAnswer` 不含 `Mu/Vu/Nu/As/capacity/moment/shear` 等工程字段
- **重复 Skill ID 拒绝**（`registerCalculation`/`registerNormative`/`registerAuditor`）
- **kind 不符拒绝**（把 normative 注册为 calculation 等）
- schema/calculator 形状一致性覆盖

## 五、规范版本风险（Part 6）

`tests/regression/spec-version-pinning.test.ts`：

- 每个 registered calculation Skill 的规范 Evidence 目录版本一致且非空，且声明为 `2010（2015年版）`
- 运行期 `CalculationResult` 证据版本单一、非空、与 2010 语义一致
- **数值基准冻结**：Mu=181.74、Vcs=177.55、Nu=3351.6、M=204 等不随默认版本漂移
- normative/auditor 不再被 unit 检查误伤

## 六、缺陷分级汇总

详见 `report/BUG_TRACKER.md`：BLOCKER 0 / HIGH 2 / MEDIUM 2 / LOW 2，合计 6。

## 七、质量门禁（Part 7）

- `npm ci`：PASS
- `npm run test:run`：PASS（见最终报告总测试数）
- `npm run build`：PASS（仅 vite 分块>500KB 警告，非阻断）
