# 强制性规范模块影响矩阵（MANDATORY MODULE COVERAGE）

> 分支：`agent/normative-iteration`　｜　生成日期：2026-10-01
> 四态定义：
> - **NO_IMPACT_CONFIRMED**：原文已核、数值/规则一致，无影响
> - **IMPACT_FOUND**：原文已核、存在差异，已记录
> - **REVIEW_REQUIRED**：原文部分可得、待人工复核
> - **SOURCE_NOT_AVAILABLE**：原文不可得，无法判定

## 1. 模块 × 规范四态矩阵

| 模块 | GB 55001 | GB 55008 | GB 55003 | GB 55006 | GB 55002 | GB/T 50010-2010 | GB 50007 | GB 50017 | GB 50009 |
|---|---|---|---|---|---|---|---|---|---|
| beam-flexure（矩形梁正截面） | SOURCE_NOT_AVAILABLE | SOURCE_NOT_AVAILABLE | — | — | — | NO_IMPACT_CONFIRMED（2015↔2024 已核） | — | — | — |
| beam-shear（矩形梁斜截面） | SOURCE_NOT_AVAILABLE | SOURCE_NOT_AVAILABLE | — | — | — | NO_IMPACT_CONFIRMED（2015↔2024 已核） | — | — | — |
| beam-double-flexure（双筋梁） | SOURCE_NOT_AVAILABLE | SOURCE_NOT_AVAILABLE | — | — | — | NO_IMPACT_CONFIRMED | — | — | — |
| beam-t-flexure（T 形梁） | SOURCE_NOT_AVAILABLE | SOURCE_NOT_AVAILABLE | — | — | — | NO_IMPACT_CONFIRMED | — | — | — |
| column（柱） | SOURCE_NOT_AVAILABLE | SOURCE_NOT_AVAILABLE | — | — | — | SOURCE_NOT_AVAILABLE（未建 Evidence） | — | — | — |
| slab-one-way（单向板） | SOURCE_NOT_AVAILABLE | SOURCE_NOT_AVAILABLE | — | — | — | REVIEW_REQUIRED（9.1.2 未建 Evidence） | — | — | — |
| slab-two-way（双向板） | SOURCE_NOT_AVAILABLE | SOURCE_NOT_AVAILABLE | — | — | — | SOURCE_NOT_AVAILABLE | — | — | — |
| stair-plate（楼梯） | SOURCE_NOT_AVAILABLE | SOURCE_NOT_AVAILABLE | — | — | — | SOURCE_NOT_AVAILABLE | — | — | — |
| foundation-independent（独立基础） | SOURCE_NOT_AVAILABLE | — | SOURCE_NOT_AVAILABLE | — | — | — | SOURCE_NOT_AVAILABLE | — | — |
| steel-beam（钢梁） | SOURCE_NOT_AVAILABLE | — | — | SOURCE_NOT_AVAILABLE | — | — | — | SOURCE_NOT_AVAILABLE | — |
| continuous-beam-load（连续梁荷载） | SOURCE_NOT_AVAILABLE | — | — | — | — | — | — | — | SOURCE_NOT_AVAILABLE |
| seismic-*（抗震模块） | SOURCE_NOT_AVAILABLE | — | — | — | SOURCE_NOT_AVAILABLE | — | — | — | — |

## 2. 四态分布统计

| 状态 | 计数 | 占比 |
|---|---|---|
| NO_IMPACT_CONFIRMED | 4（beam-flexure/shear/double/t 对 GB/T 50010-2010） | 9% |
| IMPACT_FOUND | 0 | 0% |
| REVIEW_REQUIRED | 1（slab-one-way 9.1.2） | 2% |
| SOURCE_NOT_AVAILABLE | 38 | 89% |

## 3. 现有 Evidence 四态标记

| Evidence 条目 | 规范 | 四态 | 备注 |
|---|---|---|---|
| 6.3.1 p70（beam-shear） | GB 50010-2010(2015) | NO_IMPACT_CONFIRMED（2015↔2024 已核） | 6.3.1 不在 26 条修订清单内 |
| 6.3.4 p71（beam-shear） | GB 50010-2010(2015) | NO_IMPACT_CONFIRMED | 同上 |
| 9.2.9 p134（beam-shear） | GB 50010-2010(2015) | NO_IMPACT_CONFIRMED | 同上 |
| 4.1.4/4.2.3/8.5.1（beam-flexure） | GB/T 50010-2010 | NO_IMPACT_CONFIRMED | 2024 修订表值未变 |
| 8.5.1 → GB 55008 | GB 55008 | SOURCE_NOT_AVAILABLE | GB 55008 全文不可得 |
| 4.1.2 最低强度等级 | GB/T 50010-2010 | IMPACT_FOUND | C20→C25，代码未加输入校验 |
| 9.1.2 板厚跨厚比 | GB/T 50010-2010 | REVIEW_REQUIRED | 未建 Evidence |

## 4. 结论

- 唯一 NO_IMPACT_CONFIRMED 的比对是 GB/T 50010-2010 内部 2015↔2024。
- 5 本强制性通用规范全部 SOURCE_NOT_AVAILABLE；在正式全文入库前，不得宣称任何模块"符合现行强制性规范"。
- 所有模块整体仍 REVIEW_REQUIRED。
