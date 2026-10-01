# Normative Release Audit

## 规范基线

当前计算基线：
- GB 50010-2010（2015年版）441 页正文 + GB/T 50010-2010（2024 局部修订）26 条
- 5 本强制性通用规范：GB 55001/55002/55003/55006/55008-2021

## 5 本强制规范 SHA-256

| 规范 | 页数 | SHA-256（前 16 位） |
|---|---|---|
| GB 55001-2021 | 30 | f0397f29c8a13785413c |
| GB 55002-2021 | 46 | 972d81c91c6e4e1b |
| GB 55003-2021 | 33 | b8414693333998ac |
| GB 55006-2021 | 24 | 1621e8c131e051ab |
| GB 55008-2021 | 26 | b7b77f940b8ad0ba |

## IG-001~014 状态

| 条目 | 分类 | 状态 |
|---|---|---|
| IG-001 | LIMIT_CHANGE（C25 硬限制） | CLOSED |
| IG-002 | EVIDENCE_ONLY | CLOSED |
| IG-003 | EVIDENCE_ONLY | CLOSED |
| IG-004 | EVIDENCE_ONLY | CLOSED |
| IG-005 | CONSTRUCTION_CHANGE（硬门+UI） | CLOSED |
| IG-006 | EVIDENCE_ONLY | 记录台账 |
| IG-007 | NO_CHANGE | 记录台账 |
| IG-008 | NO_CHANGE | 记录台账 |
| IG-009 | NO_CHANGE | 记录台账 |
| IG-010 | EVIDENCE_ONLY | 已由 IG-003 覆盖 |
| IG-011 | EVIDENCE_ONLY | 已由 IG-003 覆盖 |
| IG-012 | NO_CHANGE | 记录台账 |
| IG-013 | NO_CHANGE | 记录台账 |
| IG-014 | EVIDENCE_ONLY | 记录台账 |

## Platform Compliance Wiring

| 模块 | IG-001 C25 | IG-005 截面 | UI 选择器 |
|---|---|---|---|
| beam-flexure | ✅ | ✅ | ✅ |
| beam-shear | ✅ | ⏸ 待扩展 | ⏸ |
| beam-double-flexure | ✅ | ⏸ | ⏸ |
| beam-t-flexure | ✅ | ⏸ | ⏸ |
| column-eccentric | ✅ | ✅ | ✅ |
| slab-one-way | ✅ | ✅ | ✅ |
| slab-two-way | ✅ | ⏸ | ⏸ |
| foundation-independent | ✅ | ⏸ 不适用 | ⏸ |
| stair-plate | ✅ | ⏸ | ⏸ |

## 测试结果

- tsc --noEmit: exit 0
- vitest: 467 passed / 1 failed（既有 NORM_VERSION_CHECKED）/ 5 todo
- Golden Cases: 未改动
- NORM_VERSION_CHECKED: UNRESOLVED（既有失败，本批未修复）

## 已知限制

1. GB 50007-2011、GB 50009-2012、GB 50017-2017 原文不在工作区，相关条文仅标注 REVIEW_REQUIRED
2. IG-005 Platform Wiring 仅覆盖 3 个模块（beam-flexure / column / slab-one-way），其余模块待扩展
3. NORM_VERSION_CHECKED 既有失败未修复
4. 5 本 TODO 未逐项分类

## 风险

- 低风险：规范版本治理框架已建立
- 中风险：部分模块 Evidence 链仍为 REVIEW_REQUIRED
- 高风险：无

## Commit 链

最新 commit: 61af6d9（IG_LEDGER.md）
