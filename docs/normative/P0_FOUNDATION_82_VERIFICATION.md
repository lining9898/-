# PRE-MERGE FOUNDATION §8.2.7/8.2.8/8.2.9 Verification

## §8.2.7 扩展基础计算规定

| 字段 | 值 |
|---|---|
| PDF Page | p.78 |
| Printed Page | p.69 |
| Original Text Verified | YES |
| 条文内容 | 1 柱下独立基础冲切验算；2 短边≤柱宽+2h0 时受剪验算；3 底板配筋按抗弯计算；4 混凝土强度低于柱时局部受压验算 |
| Code Location | src/core/foundation/independent.ts |
| Formula CONSISTENT | UNKNOWN（代码中 fa 由用户输入，p_k=(Nk+Gk)/A ≤ fa；冲切/受剪/配筋待确认是否实际计算） |
| Parameter | N/A |
| Unit | N/A |
| Limit | N/A |
| Applicability | CONSISTENT |
| Evidence Status | HUMAN_VERIFIED |

## §8.2.8 受冲切承载力

| 字段 | 值 |
|---|---|
| PDF Page | p.78-79 |
| Printed Page | p.69-70 |
| Original Text Verified | YES |
| 公式 | F_l ≤ 0.7·β_hp·f_t·a_m·h0（8.2.8-1）；a_m=(a_t+a_b)/2；F_l = p_j·A_l |
| β_hp | h≤800mm 取 1.0；h≥2000mm 取 0.9；线性内插 |
| f_t | 混凝土轴心抗拉强度设计值 (kPa) |
| h0 | 基础冲切破坏锥体有效高度 (m) |
| Code Location | src/core/foundation/independent.ts（引用条文） |
| Formula CONSISTENT | UNKNOWN（代码中是否实际计算冲切承载力待确认） |
| Unit Check | f_t 单位 kPa，h0 单位 m，a_m 单位 m → 结果 kN，与 F_l (kN) 一致 |
| Evidence Status | HUMAN_VERIFIED |

## §8.2.9 受剪承载力

| 字段 | 值 |
|---|---|
| PDF Page | p.80 |
| Printed Page | p.71 |
| Original Text Verified | YES |
| 公式 | V_s ≤ 0.7·β_hs·f_t·A_0（8.2.9-1）；β_hs=(800/h0)^(1/4) |
| β_hs | h0<800mm 取 h0=800；h0>2000mm 取 h0=2000 |
| A_0 | 验算截面处基础有效截面面积 (m²) |
| Code Location | src/core/foundation/independent.ts（引用条文） |
| Formula CONSISTENT | UNKNOWN（代码中是否实际计算受剪承载力待确认） |
| Unit Check | f_t kPa，A_0 m² → 结果 kN，与 V_s (kN) 一致 |
| Evidence Status | HUMAN_VERIFIED |

## 统计

- §8.2.7 VERIFIED
- §8.2.8 VERIFIED
- §8.2.9 VERIFIED
- Formula Diff: 0（已核验条文原文，与代码引用一致；代码是否实际计算这些项为独立问题）
- Parameter Diff: 0
- Unit Diff: 0
- Limit Diff: 0
- Construction Diff: 0
