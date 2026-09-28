# 工程审计 Bug 追踪表（Agent 4 / Engineering QA）

分支：`agent/audit`｜基准：`7d5683a5`｜审计日期：2026-09-28

> 本表只**记录与分级**缺陷，不代替各业务 Agent 修复。严重级别：BLOCKER / HIGH / MEDIUM / LOW。
> BLOCKER 与 HIGH 均在本表与最终报告中突出。

## 统计

| 级别 | 数量 |
|------|------|
| BLOCKER | 0 |
| HIGH | 2 |
| MEDIUM | 2 |
| LOW | 2 |
| **合计** | **6** |

---

## Bug 明细

### BUG-01 — HIGH — 运行期 CalculationResult 证据与 Evidence 目录状态不一致（追溯链断链）

- **文件**：`src/core/beam/flexure.ts`、`src/core/beam/shear.ts`（`verifiedEvidence()`）
- **输入**：任一矩形梁受弯/受剪计算
- **预期**：同一条文在目录（`skills/*/evidence.json`）与运行期结果（`CalculationResult.allEvidence / steps[].evidence`）中的校核状态一致。
- **实际**：`verifiedEvidence()` 返回 `verificationStatus:'VERIFIED'`、`status:'superseded'`；而 `skills/beam-flexure|beam-shear/evidence.json` 中同一条文均标记 `verificationStatus:'REVIEW_REQUIRED'`。运行期结果因此"看起来已校核"，目录却判定未校核。且 `steps[].evidence` 内嵌完整 Evidence 对象，无 `evidenceId` 回链目录，文档所述追溯链并未真正实现。
- **严重级别**：HIGH
- **最小复现**：`calculateBeamFlexure(...)` → `result.allEvidence[0].verificationStatus === 'VERIFIED'`，而 `auditSkillPackage(beamFlexurePackage)` 对同一 clause 报 `EVIDENCE_REVIEW_REQUIRED`。
- **建议责任 Agent**：Agent 2（Skills/Evidence 数据），并请 Agent 3 统一版本口径。

### BUG-02 — HIGH — column Skill 的 schema 与 calculator 输入形状不一致

- **文件**：`skills/column/schema.json`、`skills/column/calculator.ts`
- **输入**：`{ mode:'axial', input:{ width, depth, ... } }`（嵌套形状，registry 测试实际采用）
- **预期**：schema 能描述 calculator 真实接受的输入形状。
- **实际**：`schema.json` 是扁平结构（`mode` 与 `width/depth/...` 同级），`oneOf` 却要求 `input` 为对象且含若干必填字段；而 `isColumnSkillInput` 要求嵌套 `{ mode, input }`。schema 无法校验真实输入，JSON-schema 驱动的调用方会传入错误形状。
- **严重级别**：HIGH
- **最小复现**：`isColumnSkillInput({ mode:'axial', input:{...} })` 返回 true；同一对象无法被现有扁平 schema 的 `oneOf` 结构描述。
- **建议责任 Agent**：Agent 2（Skill 契约）。

### BUG-03 — MEDIUM — 规范版本字符串不一致（跨层 edition 口径漂移）

- **文件**：`src/core/beam/flexure.ts`（`edition:'2010(2015)'`）、`src/core/beam/shear.ts`（同）、`skills/*/evidence.json` 与 `src/report/analysis-adapters.ts`（`'2010（2015年版）'`）
- **预期**：同一设计依据在各层使用同一版本标识，便于多版本体系做精确匹配。
- **实际**：`'2010(2015)'` 与 `'2010（2015年版）'` 混用；`auditCalculationResult` 的 `EDITION_MISMATCH` 无法用字符串精确对拍。
- **严重级别**：MEDIUM
- **建议责任 Agent**：Agent 3（多版本规范体系）统一定义常量。

### BUG-04 — MEDIUM — 规范版本漂移风险：旧算例缺少版本冻结（本分支已加固）

- **文件**：`src/core/beam/flexure.ts|shear.ts|column/*`、`src/report/*`
- **预期**：未来出现新版规范时，旧算例不得因默认版本变化而悄悄改变数值。
- **实际**：此前无任何机制把"按 2015 年版生成"的数值固定下来；三个混凝土计算器整体标 `REVIEW_REQUIRED`、证据 `superseded`，一旦默认版本变化，旧算例数值会漂移且不可察觉。
- **严重级别**：MEDIUM（本分支已通过 Golden Cases + 版本固定回归测试缓解，见 `tests/regression/spec-version-pinning.test.ts`、`tests/regression/golden-cases.test.ts`）
- **建议责任 Agent**：Agent 3（多版本体系）持续；Agent 0 决定默认版本切换策略。

### BUG-05 — LOW — 受剪计算步骤单位字段混用歧义标签

- **文件**：`src/core/beam/shear.ts`（"计算最小配箍率"步骤）
- **输入**：均布荷载工况（`needsMinStirrupCheck=false`）
- **预期**：单个 `CalculationStep.unit` 表示一种单位。
- **实际**：`unit: needsMinStirrupCheck ? '%' : 'kN（阈值）'`——同一步骤在两种单位间切换；为 `false` 时结果为 `0` 却标 `'kN（阈值）'`，非真实 kN 值。
- **严重级别**：LOW
- **建议责任 Agent**：Agent 2 / 受剪计算负责人（拆分步骤或统一单位语义）。

### BUG-06 — LOW — Auditor 会误伤 normative Skill（本分支已修复）

- **文件**：`src/agent/calculation-auditor.ts`
- **输入**：`auditSkillPackage(gb50010Package)`
- **预期**：规范查询 Skill 不应因"无输入单位"被报 `UNIT_MISSING`。
- **实际**：改动前 `auditUnits` 对 normative/auditor 包也执行，`gb50010` 的 `code/clause` 无单位 → 误报 `UNIT_MISSING`；六类测试登记同理。
- **严重级别**：LOW（本分支已把单位/测试登记检查限定为 `kind==='calculation'`）
- **建议责任 Agent**：Agent 2（保持该 scope 修正）。

---

## 结论

- **单位/数量级**：对 `src/core`、`src/report`、`skills` 的 `10³/10⁶/10⁹` 换算逐一独立复算，**未发现真实的量级错误**（详见 `AUDIT_SUMMARY.md`）。
- **Evidence 风险**：目录与运行期状态不一致（BUG-01）、版本字符串口径不统一（BUG-03）是主要风险。
- **规范版本风险**：已用 Golden Cases + 版本固定回归加以冻结（BUG-04 缓解）。
