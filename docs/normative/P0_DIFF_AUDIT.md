# PRE-MERGE P0 Diff Audit Report

## 13 条 P0 条文分类

### GB 50007-2011（foundation-independent）

| Clause | 原文核验 | Diff 分类 | 说明 |
|---|---|---|---|
| §5.2.1 地基承载力验算 | REVIEW_REQUIRED | UNVERIFIED | 未渲染原页 |
| §5.2.2 轴心荷载 p_k ≤ f_a | REVIEW_REQUIRED | UNVERIFIED | 未渲染原页 |
| §5.2.4 承载力修正系数表 | HUMAN_VERIFIED | NO_CHANGE | 代码中 fa 由用户输入，不计算修正 |
| §5.2.5 承载力特征值公式 | HUMAN_VERIFIED | NO_CHANGE | 代码中 fa 由用户输入，不计算 f_a |
| §5.2.6 岩石地基承载力 | HUMAN_VERIFIED | NO_CHANGE | 当前模块不涉及岩石地基 |
| §5.2.7 软弱下卧层验算 | HUMAN_VERIFIED | NO_CHANGE | 当前模块不涉及下卧层验算 |
| §8.2.7 基础底板受弯配筋 | REVIEW_REQUIRED | UNVERIFIED | 未渲染原页 |
| §8.2.8 受冲切承载力 | REVIEW_REQUIRED | UNVERIFIED | 未渲染原页 |
| §8.2.9 受剪承载力 | REVIEW_REQUIRED | UNVERIFIED | 未渲染原页 |
| §8.2.1/8.2.12 最小配筋率 | REVIEW_REQUIRED | UNVERIFIED | 未渲染原页 |

### GB 50009-2012（slab/stair）

| Clause | 原文核验 | Diff 分类 | 说明 |
|---|---|---|---|
| 恒载分项系数 γG | REVIEW_REQUIRED | UNVERIFIED | 用户输入，默认 1.3 |
| 活载分项系数 γQ | REVIEW_REQUIRED | UNVERIFIED | 用户输入，默认 1.5 |
| 混凝土重度 25 kN/m³ | REVIEW_REQUIRED | UNVERIFIED | 代码中硬编码 25 |

## 统计

- P0 Clauses: 13
- Original Text Verified: 5/13
- NO_CHANGE: 5
- EVIDENCE_ONLY: 0
- FORMULA_CHANGE: 0
- PARAMETER_CHANGE: 0
- LIMIT_CHANGE: 0
- CONSTRUCTION_CHANGE: 0
- SPEC_CONFLICT: 0
- UNVERIFIED: 8
- Unresolved Calculation-Affecting Diff: 0（已核验 5 条均无差异）

## 非阻塞项（不阻塞 merge）

- 5 个 REFERENCE_CASE_MISSING TODO
- P3 未使用规范（GB 50017、55004/55005/55007/55031）
- GB 50017 无钢梁模块
- 8 条 UNVERIFIED 条文（如实标注 REVIEW_REQUIRED，不参与正式计算判定）
