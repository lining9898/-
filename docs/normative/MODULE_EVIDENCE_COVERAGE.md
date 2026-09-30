# 模块规范覆盖矩阵（MODULE EVIDENCE COVERAGE）

> 分支：`agent/normative-iteration`　｜　基线：`8170b17`　｜　生成日期：2026-10-01
> 原则：只映射现有模块真正会用到的条文，不做无边界全文录入。
> Evidence 状态取值：`VERIFIED`（条文原文+代码已一致且版本差异已核查）/ `REVIEW_REQUIRED`（条文已定位但版本差异或代码匹配未完成）/ `UNVERIFIED`（未定位条文原文）。
> **当前没有任何模块满足 VERIFIED 收口条件**（详见各模块结论）。

---

## 0. P4 已取得证据的处置（6.3.1 / 6.3.4 / 9.2.9）

P4 分支（`agent/normative-inventory`）已产出：
- `ae02d4f`：渲染 PDF p69/p70/p71 页图；将 6.3.1 页码引用由 69 更正为 70。
- `9635373`：渲染 PDF p134 页图；更正 9.2.9 条文措辞（补充 0.05Np0 项）。

**但必须区分以下五个层次：**

| 层次 | 6.3.1 | 6.3.4 | 9.2.9 |
|---|---|---|---|
| 条文本身已人工确认（页图可核） | 是（p69-70） | 是（p71） | 是（p134） |
| 规则是否完整覆盖代码 | 部分（hw/b 三段系数已补；βc 已补；Vp 项未实现） | 部分（Vcs 已实现；Vp=0.05Np0 未实现；集中荷载 αcv 已实现） | 部分（最小配箍率已实现；箍筋直径警告已实现；表 9.2.9 最大间距未实现） |
| 代码是否完整匹配 | 是（在 hw/b≤4 常见域） | 是（在非预应力、仅箍筋域） | 是（在 V>0.7ft·b·h0 触发域） |
| 现行版本差异是否完成 | **否**（2024 局部修订未比对） | **否** | **否** |
| 模块整体能否变为 VERIFIED | **否**（overallStatus 仍为 REVIEW_REQUIRED） | **否** | **否** |

**特别记录**：`src/core/beam/shear.ts` 文件头注释自称"状态：VERIFIED / 所有规范依据已标记为 VERIFIED"，但代码实际：
- `verifiedEvidence()` 工厂函数返回 `verificationStatus: 'REVIEW_REQUIRED'`（第 97 行）；
- `result.overallStatus = 'REVIEW_REQUIRED'`（第 476 行）。

文件头注释与代码状态不一致，属**文档与代码漂移**，本轮不改代码、不升级状态，仅在此记录。

---

## 1. 矩形梁正截面受弯（beam-flexure）

代码位置：`src/core/beam/flexure.ts`　｜　入口：`calculateBeamFlexure`

| 验算项 | 公式/参数/构造 | 所需规范 | 所需版本 | 条文号 | PDF 页码 | 原文状态 | Evidence 状态 | 适用条件 | 缺口与风险 |
|---|---|---|---|---|---|---|---|---|---|
| 混凝土 fc/ft | 表 4.1.4-1/2 | GB 50010 | 2015 年版 | 4.1.4 | 34-35 | 仓库 PDF 可核 | REVIEW_REQUIRED | C20-C50 | 2024 局部修订触及 4.1.4，未比对 |
| 钢筋 fy/Es | 表 4.2.3-1/4.2.5 | GB 50010 | 2015 年版 | 4.2.3 / 4.2.5 | 38-40 | 仓库 PDF 可核 | REVIEW_REQUIRED | HPB300/HRB400/HRB500 | HRB335 已被 2024 删除；当前代码未含 HRB335 |
| α1/β1 | C50 以下取 1.0/0.8 | GB 50010 | 2015 年版 | 6.2.6 | 52-53 | 仓库 PDF 可核 | REVIEW_REQUIRED | C≤50 | C55-C80 内插未实现 |
| εcu | C50 以下取 0.0033 | GB 50010 | 2015 年版 | 6.2.1 | 50 | 仓库 PDF 可核 | REVIEW_REQUIRED | C≤50 | 同上 |
| ξb | β1/(1+fy/(Es·εcu)) | GB 50010 | 2015 年版 | 6.2.7 | 53 | 仓库 PDF 可核 | REVIEW_REQUIRED | 有明显屈服点钢筋 | 无明显屈服点钢筋未实现 |
| x | fy·As/(α1·fc·b) | GB 50010 | 2015 年版 | 6.2.10 | 54-56 | 仓库 PDF 可核 | REVIEW_REQUIRED | 单筋矩形 | 双筋/T 形见下 |
| Mu | α1·fc·b·x·(h0-x/2) | GB 50010 | 2015 年版 | 6.2.10 | 54-56 | 仓库 PDF 可核 | REVIEW_REQUIRED | 单筋矩形 | 单位换算 N·mm→kN·m 已正确 |
| ξ≤ξb 验算 | x≤ξb·h0 | GB 50010 | 2015 年版 | 6.2.10 | 54-56 | 仓库 PDF 可核 | REVIEW_REQUIRED | 防超筋 | — |
| As,min | ρmin·b·h | GB 50010 | 2015 年版 | 8.5.1 | 124 | 仓库 PDF 可核 | REVIEW_REQUIRED | 受弯构件一侧受拉 | **BUG 已修**（FUNCTION_AUDIT.md 记录：基准面积由 b·h0 改为 b·h；百分数转换已修）；2024 局部修订触及 8.5.1，未比对 |
| Mu≥M 验算 | M≤Mu | GB 50010 | 2015 年版 | 6.2.10 | 54-56 | 仓库 PDF 可核 | REVIEW_REQUIRED | — | — |

**模块整体状态**：`REVIEW_REQUIRED`（`result.overallStatus = 'REVIEW_REQUIRED'`，第 332 行）。
**可进入 P4 收口？** 否。缺口：(a) 2024 局部修订 4.1.4/4.2.3/8.5.1 差异未比对；(b) GB 55008-2021 强制性条文未映射；(c) 1 个基线测试失败（"应包含现行规范尚待融合的警告"）。

---

## 2. 矩形梁斜截面受剪（beam-shear）

代码位置：`src/core/beam/shear.ts`　｜　入口：`calculateBeamShear`

| 验算项 | 公式/参数/构造 | 所需规范 | 所需版本 | 条文号 | PDF 页码 | 原文状态 | Evidence 状态 | 适用条件 | 缺口与风险 |
|---|---|---|---|---|---|---|---|---|---|
| 受剪截面限制 Vmax | 0.25/0.2·βc·fc·b·h0 | GB 50010 | 2015 年版 | 6.3.1 | 69-70 | 仓库 PDF 可核（P4 页图 p69-70） | REVIEW_REQUIRED | hw/b 分段；矩形 hw=h0 | hw/b 三段系数已补（FUNCTION_AUDIT.md）；βc 已补 |
| βc | C50 以下取 1.0 | GB 50010 | 2015 年版 | 6.3.1 | 70 | 仓库 PDF 可核 | REVIEW_REQUIRED | C≤50 | C80 内插未实现 |
| Vcs | αcv·ft·b·h0+fyv·(Asv/s)·h0 | GB 50010 | 2015 年版 | 6.3.4 | 71 | 仓库 PDF 可核（P4 页图 p71） | REVIEW_REQUIRED | 仅箍筋、非预应力 | Vp=0.05Np0 未实现 |
| αcv（均布） | 0.7 | GB 50010 | 2015 年版 | 6.3.4 | 71 | 仓库 PDF 可核 | REVIEW_REQUIRED | 一般受弯 | — |
| αcv（集中） | 1.75/(λ+1) | GB 50010 | 2015 年版 | 6.3.4 | 71 | 仓库 PDF 可核 | REVIEW_REQUIRED | 独立梁、集中荷载>75% | λ∈[1.5,3] 已限制 |
| 最小配箍率 ρsv,min | 0.24ft/fyv | GB 50010 | 2015 年版 | 9.2.9 | 134 | 仓库 PDF 可核（P4 页图 p134） | REVIEW_REQUIRED | V>0.7ft·b·h0 触发 | 表 9.2.9 最大间距未实现 |
| 箍筋直径警告 | h>800 不宜小于 8mm | GB 50010 | 2015 年版 | 9.2.9 | 134 | 仓库 PDF 可核 | REVIEW_REQUIRED | — | 仅警告，非验算 |

**模块整体状态**：`REVIEW_REQUIRED`（第 476 行）。
**可进入 P4 收口？** 否。缺口：(a) 2024 局部修订差异未比对；(b) GB 55008-2021 未映射；(c) 文件头注释与代码状态漂移（自称 VERIFIED 实为 REVIEW_REQUIRED）；(d) Vp、表 9.2.9 最大间距未实现。

---

## 3. 双筋梁 / T 形梁

### 3.1 双筋矩形梁（beam-double-flexure）

代码位置：`src/core/beam/double-flexure.ts`　｜　入口：`calculateDoubleFlexure`

| 验算项 | 条文号 | PDF 页码 | Evidence 状态 | 缺口 |
|---|---|---|---|---|
| α1·fc·b·x=fy·As−fy'·As' | 6.2.10 | 54-56 | REVIEW_REQUIRED | fy'=400（HRB500 抗压）未区分 |
| Mu=α1·fc·b·x·(h0-x/2)+fy'·As'·(h0-as') | 6.2.10 | 54-56 | REVIEW_REQUIRED | — |
| ξ≤ξb 且 x≥2as' | 6.2.10 | 54-56 | REVIEW_REQUIRED | x<2as' 情形未实现 |

**整体状态**：`REVIEW_REQUIRED`（第 491 行）。

### 3.2 T 形梁（beam-t-flexure）

代码位置：`src/core/beam/t-flexure.ts`　｜　入口：`calculateBeamTFlexure`

| 验算项 | 条文号 | PDF 页码 | Evidence 状态 | 缺口 |
|---|---|---|---|---|
| 中和轴在翼缘内 | 6.2.11 | 56 | REVIEW_REQUIRED | — |
| 中和轴在腹板内 | 6.2.11 | 56 | REVIEW_REQUIRED | — |
| 翼缘计算宽度 bf' | 6.2.12 / 表 5.2.4 | 57（条文）；表 5.2.4 页码未定位 | UNVERIFIED | FUNCTION_AUDIT.md 记录：缺少跨度/梁间距输入，bf' 无法自动核查 |

**整体状态**：`REVIEW_REQUIRED`（第 487 行）。

---

## 4. 柱（column）

代码位置：`src/core/column/axial.ts`、`eccentric.ts`　｜　入口：`calculateAxialColumn` / `calculateEccentricColumn`

| 验算项 | 所需规范 | 条文号 | PDF 页码 | Evidence 状态 | 缺口 |
|---|---|---|---|---|---|
| 轴心受压稳定系数 φ | GB 50010 | 6.2.15 / 表 6.2.15 | 未定位 | UNVERIFIED | `axial.ts` 仅注释提及 l0/b，无结构化 Evidence；l0 取值未实现 |
| 偏心受压 Nu | GB 50010 | 6.2.17 | 未定位 | UNVERIFIED | 无 PDF 页码引用 |
| 材料参数 fc/ft/fy | GB 50010 | 4.1.4/4.2.3 | 34-40 | REVIEW_REQUIRED | 与梁模块共用，但柱未独立建 Evidence |

**整体状态**：`REVIEW_REQUIRED`（无 `overallStatus` 字段，数值结果由 report adapter 组装；按 NORM_VERSION_GAP.md 整体保持 REVIEW_REQUIRED）。
**可进入 P4 收口？** 否。缺口：(a) 柱条文（6.2.15/6.2.17）未在仓库 PDF 逐页定位；(b) GB 55008-2021 未映射；(c) 偏心受压大/小偏心判别未建 Evidence。

---

## 5. 单向板 / 双向板 / 楼梯

### 5.1 单向板（slab-one-way）

代码位置：`src/core/slab/one-way.ts`

| 验算项 | 条文号 | PDF 页码 | Evidence 状态 | 缺口 |
|---|---|---|---|---|
| 材料 fc/ft/fy/Es | 4.1.4/4.2.3/4.2.5 | 34-40 | REVIEW_REQUIRED | — |
| α1/β1/εcu/ξb | 6.2.6/6.2.1/6.2.7 | 50-53 | REVIEW_REQUIRED | — |
| 正截面受弯 Mu | 6.2.10 | 54-56 | REVIEW_REQUIRED | — |
| 最小配筋率 ρmin | 8.5.1 | 124 | REVIEW_REQUIRED | 板类注 2：0.15 和 45ft/fy 较大值未区分 |
| 荷载取值 | GB 50009 | — | — | UNVERIFIED（GB 50009 PDF 本工作区不可见） |

**整体状态**：`REVIEW_REQUIRED`（第 301 行）。

### 5.2 双向板（slab-two-way）

代码位置：`src/core/slab/two-way.ts`

| 验算项 | 条文号 | PDF 页码 | Evidence 状态 | 缺口 |
|---|---|---|---|---|
| 跨中弯矩系数 | 《混凝土结构设计手册》四边简支板表 | 无规范 PDF 页码 | UNVERIFIED | 代码头注释明确：系数表无对应规范 PDF，整体保持 REVIEW_REQUIRED |
| 配筋计算 | 6.2.10 | 54-56 | REVIEW_REQUIRED | — |

**整体状态**：`REVIEW_REQUIRED`（第 323 行）。

### 5.3 板式楼梯（stair/plate）

代码位置：`src/core/stair/plate.ts`

| 验算项 | 条文号 | PDF 页码 | Evidence 状态 | 缺口 |
|---|---|---|---|---|
| 梯段自重折算 | — | — | UNVERIFIED | 无规范引用 |
| 荷载组合 | GB 50009 / GB 50068 | — | — | UNVERIFIED（PDF 不可见） |
| 配筋 | 6.2.10 | 54-56 | REVIEW_REQUIRED | — |

**整体状态**：`REVIEW_REQUIRED`（第 280 行）。

---

## 6. 独立基础（foundation-independent）

代码位置：`src/core/foundation/independent.ts`　｜　入口：`calculateIndependentFoundation`

| 验算项 | 所需规范 | 条文号 | PDF 页码 | Evidence 状态 | 缺口 |
|---|---|---|---|---|---|
| 地基承载力 | GB 50007-2011 | 5.2.x | — | UNVERIFIED | GB 50007 PDF 本工作区不可见 |
| 基础受弯配筋 | GB 50007-2011 | 8.2.x | — | UNVERIFIED | 同上 |
| 受冲切 | GB 50007-2011 | 8.2.8/8.2.9 | — | UNVERIFIED | 代码头注释记录：历史曾出现冲切单位数量级错误（N↔kN、mm↔m） |
| 受剪 | GB 50007-2011 | 8.2.9 | — | UNVERIFIED | — |
| 材料 fc/ft | GB 50010 | 4.1.4 | 34-35 | REVIEW_REQUIRED | 与梁模块共用 |

**整体状态**：`REVIEW_REQUIRED`（第 359 行）。代码头明确标注"高风险模块"。
**可进入 P4 收口？** 否。缺口：(a) GB 50007-2011 PDF 本工作区不可见；(b) GB 55003-2021 未映射；(c) 冲切单位历史错误未用真实算例复核。

---

## 7. 钢梁（steel/beam）

代码位置：`src/core/steel/beam.ts`　｜　入口：`calculateSteelBeam`

| 验算项 | 所需规范 | 条文号 | PDF 页码 | Evidence 状态 | 缺口 |
|---|---|---|---|---|---|
| 抗弯强度 | GB 50017-2017 | — | — | UNVERIFIED | GB 50017 PDF 本工作区不可见 |
| 抗剪 | GB 50017-2017 | — | — | UNVERIFIED | 同上 |
| 整体稳定 | GB 50017-2017 | — | — | UNVERIFIED | 同上 |

**整体状态**：`REVIEW_REQUIRED`（无 `overallStatus` 字段；按 STEEL_BEAM_SCOPE.md 保持 REVIEW_REQUIRED）。
**可进入 P4 收口？** 否。缺口：(a) GB 50017-2017 PDF 本工作区不可见；(b) GB 55006-2021 未映射；(c) 代码无任何规范条文引用。

---

## 8. 覆盖率汇总

| # | 模块 | 条文已定位且与 PDF 一致 | Evidence 状态 | 可进入 P4 收口 | 必须保持 REVIEW_REQUIRED |
|---|---|---|---|---|---|
| 1 | 矩形梁正截面 | 10 项（均 2015 年版 PDF 可核） | REVIEW_REQUIRED | 否 | **是** |
| 2 | 矩形梁斜截面 | 8 项（P4 页图 p69-71/p134） | REVIEW_REQUIRED | 否 | **是** |
| 3 | 双筋梁 | 3 项 | REVIEW_REQUIRED | 否 | **是** |
| 4 | T 形梁 | 2 项（bf' 未定位） | REVIEW_REQUIRED | 否 | **是** |
| 5 | 柱 | 0 项（条文未逐页定位） | UNVERIFIED | 否 | **是** |
| 6 | 单向板 | 5 项（荷载未定位） | REVIEW_REQUIRED | 否 | **是** |
| 7 | 双向板 | 1 项（弯矩系数无规范来源） | UNVERIFIED | 否 | **是** |
| 8 | 楼梯 | 1 项 | REVIEW_REQUIRED | 否 | **是** |
| 9 | 独立基础 | 1 项（仅材料参数） | UNVERIFIED | 否 | **是** |
| 10 | 钢梁 | 0 项 | UNVERIFIED | 否 | **是** |

**Evidence 覆盖率**（按"条文已定位且与仓库 PDF 一致"计）：
- 矩形梁正截面：10/10 项已定位，但 0/10 完成现行版本差异核查 → **0% VERIFIED**
- 矩形梁斜截面：8/8 项已定位，但 0/8 完成现行版本差异核查 → **0% VERIFIED**
- 其余模块：条文级 Evidence 覆盖率 < 30%。

**结论**：当前没有任何模块满足 P4 收口条件。所有 7 个优先级模块必须保持 REVIEW_REQUIRED。
