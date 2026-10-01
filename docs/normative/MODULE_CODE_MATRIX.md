# MODULE CODE MATRIX — 模块规范引用矩阵

## 状态说明

- Document Status: DOCUMENT_VERIFIED_BY_USER（文件真实性已确认）
- Clause Status: REVIEW_REQUIRED / CLAUSE_LOCATED / HUMAN_VERIFIED
- Evidence Wired: YES / NO

## 模块-规范引用矩阵

### beam-flexure（src/core/beam/flexure.ts）

| Code | Version | Clause | Purpose | PDF Present | Document Status | Clause Status | Evidence Wired |
|---|---|---|---|---|---|---|---|
| GB 50010-2010 | 2015 | 6.2.1/6.2.6/6.2.7/6.2.10 | 正截面受弯承载力 | YES | DOCUMENT_VERIFIED_BY_USER | HUMAN_VERIFIED | YES |
| GB/T 50010-2010 | 2024修订 | 4.1.2 | 最低强度 C25 | YES | DOCUMENT_VERIFIED_BY_USER | HUMAN_VERIFIED | YES |
| GB 55008-2021 | 2021 | 4.4.2 | 正截面基本假定 | YES | DOCUMENT_VERIFIED_BY_USER | HUMAN_VERIFIED | YES |

### beam-shear（src/core/beam/shear.ts）

| Code | Version | Clause | Purpose | PDF Present | Document Status | Clause Status | Evidence Wired |
|---|---|---|---|---|---|---|---|
| GB 50010-2010 | 2015 | 6.3.1/6.3.4 | 斜截面受剪承载力 | YES | DOCUMENT_VERIFIED_BY_USER | REVIEW_REQUIRED | PARTIAL |
| GB/T 50010-2010 | 2024修订 | 4.1.2 | 最低强度 C25 | YES | DOCUMENT_VERIFIED_BY_USER | HUMAN_VERIFIED | YES |

### beam-double-flexure（src/core/beam/double-flexure.ts）

| Code | Version | Clause | Purpose | PDF Present | Document Status | Clause Status | Evidence Wired |
|---|---|---|---|---|---|---|---|
| GB 50010-2010 | 2015 | 6.2.10 | 双筋梁受弯 | YES | DOCUMENT_VERIFIED_BY_USER | REVIEW_REQUIRED | NO |

### beam-t-flexure（src/core/beam/t-flexure.ts）

| Code | Version | Clause | Purpose | PDF Present | Document Status | Clause Status | Evidence Wired |
|---|---|---|---|---|---|---|---|
| GB 50010-2010 | 2015 | 6.2.11 | T形梁受弯 | YES | DOCUMENT_VERIFIED_BY_USER | REVIEW_REQUIRED | NO |

### column-eccentric（src/core/column/eccentric.ts）

| Code | Version | Clause | Purpose | PDF Present | Document Status | Clause Status | Evidence Wired |
|---|---|---|---|---|---|---|---|
| GB 50010-2010 | 2015 | 6.2.17 | 偏心受压 | YES | DOCUMENT_VERIFIED_BY_USER | REVIEW_REQUIRED | NO |
| GB/T 50010-2010 | 2024修订 | 4.1.2 | 最低强度 C25 | YES | DOCUMENT_VERIFIED_BY_USER | HUMAN_VERIFIED | YES |
| GB 55002-2021 | 2021 | 4.4.9 | 抗震柱配筋 | YES | DOCUMENT_VERIFIED_BY_USER | REVIEW_REQUIRED | NO |

### slab-one-way（src/core/slab/one-way.ts）

| Code | Version | Clause | Purpose | PDF Present | Document Status | Clause Status | Evidence Wired |
|---|---|---|---|---|---|---|---|
| GB 50010-2010 | 2015 | 8.5.1 | 最小配筋率 | YES | DOCUMENT_VERIFIED_BY_USER | REVIEW_REQUIRED | PARTIAL |
| GB 50009-2012 | 2012 | UNKNOWN | 荷载组合 | YES | DOCUMENT_VERIFIED_BY_USER | REVIEW_REQUIRED | NO |
| GB 55008-2021 | 2021 | 4.4.6 | 最小配筋率表 | YES | DOCUMENT_VERIFIED_BY_USER | HUMAN_VERIFIED | YES |

### slab-two-way（src/core/slab/two-way.ts）

| Code | Version | Clause | Purpose | PDF Present | Document Status | Clause Status | Evidence Wired |
|---|---|---|---|---|---|---|---|
| GB 50010-2010 | 2015 | UNKNOWN | 双向板弯矩系数 | YES | DOCUMENT_VERIFIED_BY_USER | REVIEW_REQUIRED | NO |
| GB 50009-2012 | 2012 | UNKNOWN | 荷载组合 | YES | DOCUMENT_VERIFIED_BY_USER | REVIEW_REQUIRED | NO |

### foundation-independent（src/core/foundation/independent.ts）

| Code | Version | Clause | Purpose | PDF Present | Document Status | Clause Status | Evidence Wired |
|---|---|---|---|---|---|---|---|
| GB 50007-2011 | 2011 | 5.2.1/5.2.2 | 地基承载力 | YES | DOCUMENT_VERIFIED_BY_USER | REVIEW_REQUIRED | NO |
| GB 55003-2021 | 2021 | 6.2.4 | 扩展基础构造 | YES | DOCUMENT_VERIFIED_BY_USER | HUMAN_VERIFIED | YES |

### stair-plate（src/core/stair/plate.ts）

| Code | Version | Clause | Purpose | PDF Present | Document Status | Clause Status | Evidence Wired |
|---|---|---|---|---|---|---|---|
| GB 50010-2010 | 2015 | UNKNOWN | 楼梯板受弯 | YES | DOCUMENT_VERIFIED_BY_USER | REVIEW_REQUIRED | NO |
| GB 50009-2012 | 2012 | UNKNOWN | 荷载组合 | YES | DOCUMENT_VERIFIED_BY_USER | REVIEW_REQUIRED | NO |

## 优先级分类

| 优先级 | 规范 | 说明 |
|---|---|---|
| P0 | GB 50007-2011、GB 50009-2012 | 正式模块在用，条文 Evidence 不完整 |
| P1 | GB 55008、GB 55003、GB 55002 | 部分 Evidence 已接入，需进一步核验 |
| P2 | GB 50010-2015+2024 | 核心规范，已 HUMAN_VERIFIED 主要条文 |
| P3 | GB 50017、55004、55005、55007、55031 | 当前无对应正式模块 |

## 统计

- Code Library: 14 本
- DOCUMENT_VERIFIED_BY_USER: 14 本
- Modules Scanned: 9 个正式模块
- Module-Code Relations: 20+ 条
- Clause Known: 12 条
- Clause Unknown: 8 条
- Evidence Wired: 8 条
- Evidence Missing: 12+ 条
