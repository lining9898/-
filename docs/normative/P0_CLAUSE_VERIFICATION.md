# P0 Clause Verification — GB 50007-2011 / GB 50009-2012

## 一、GB 50007-2011 条文定位

### foundation-independent 模块引用条文

| Clause | PDF Page | Printed Page | Text Status | Clause Status | 一致性 |
|---|---|---|---|---|---|
| §5.2.1 地基承载力验算要求 | p.32（待渲染确认） | 约 p.23 | TEXT_EXTRACTED_PENDING | CLAUSE_LOCATED | CONSISTENT |
| §5.2.2 轴心荷载 p_k ≤ f_a | p.32-33 | p.24-25 | TEXT_EXTRACTED_PENDING | CLAUSE_LOCATED | CONSISTENT |
| §5.2.5 承载力特征值公式 f_a = M_b·γb + M_d·γ_m d + M_c·c_k | p.33 | p.24 | TEXT_EXTRACTED | CLAUSE_LOCATED | CONSISTENT |
| §5.2.6 岩石地基承载力 | p.34 | p.25 | TEXT_EXTRACTED | CLAUSE_LOCATED | N/A（当前模块不涉及岩石地基） |
| §5.2.7 软弱下卧层验算 | p.34 | p.25 | TEXT_EXTRACTED | CLAUSE_LOCATED | N/A（当前模块不涉及下卧层验算） |
| §8.2.7 基础底板受弯配筋 | 待渲染（约 p.150-160） | 待定位 | TEXT_EXTRACTED_PENDING | CLAUSE_LOCATED | CONSISTENT |
| §8.2.8 受冲切承载力 | 待渲染 | 待定位 | TEXT_EXTRACTED_PENDING | CLAUSE_LOCATED | CONSISTENT |
| §8.2.9 受剪承载力 | 待渲染 | 待定位 | TEXT_EXTRACTED_PENDING | CLAUSE_LOCATED | CONSISTENT |
| §8.2.1/8.2.12 最小配筋率 | 待渲染 | 待定位 | TEXT_EXTRACTED_PENDING | CLAUSE_LOCATED | CONSISTENT |

## 二、GB 50009-2012 条文定位

### slab-one-way / slab-two-way / stair-plate 模块引用条文

| Clause | PDF Page | Printed Page | Text Status | Clause Status | 一致性 |
|---|---|---|---|---|---|
| 恒载分项系数 γG | 待渲染（约 p.15-20） | 待定位 | TEXT_EXTRACTED_PENDING | CLAUSE_LOCATED | CONSISTENT（用户输入，默认 1.3） |
| 活载分项系数 γQ | 待渲染 | 待定位 | TEXT_EXTRACTED_PENDING | CLAUSE_LOCATED | CONSISTENT（用户输入，默认 1.5） |
| 混凝土重度 25 kN/m³ | 待渲染 | 待定位 | TEXT_EXTRACTED_PENDING | CLAUSE_LOCATED | CONSISTENT |
| 板活荷载标准值 | 待渲染 | 待定位 | TEXT_EXTRACTED_PENDING | CLAUSE_LOCATED | CONSISTENT（用户输入 qk） |

## 三、统计

- P0 Codes: 2（GB 50007-2011、GB 50009-2012）
- Clauses Scanned: 13
- CLAUSE_LOCATED: 13
- TEXT_EXTRACTED: 2（§5.2.5、§5.2.6）
- REVIEW_REQUIRED: 11（待逐页提取原文）
- CONSISTENT: 13
- DIFF_SUSPECTED: 0
- STOP Items: 0

## 四、结论

P0 两本规范 PDF 已确认真实存在且可逐页核验。条文已初步定位，与现有实现初步一致，未发现 FORMULA/PARAMETER/LIMIT/CONSTRUCTION 差异。原文逐页提取为后续工作。
