# 强制性通用规范融合层（MANDATORY CODE FUSION）

> 分支：`agent/normative-iteration`　｜　生成日期：2026-10-01
> 基线：GB 50010-2010(2015) 441 页正文 + GB/T 50010-2010(2024) 26 条（已入库）
> 本文件只做资料/版本/影响分析；不改公式、不合并 master。

## 1. 规范优先级（固定）

```
强制性通用规范（GB 55xxx 全文强制）
        ▼ 冲突时优先
现行专业设计标准（GB/T 50010-2010、GB 50007、GB 50017、GB 50009、GB/T 50011…）
        ▼
历史正文/局部修订（GB 50010-2010(2015) 正文）
        ▼
计算模块 Evidence（src/ 代码逐条映射）
```

原则：原文不可得时，该条只能标记 **SOURCE_NOT_AVAILABLE**，不得凭名称或记忆推断冲突。

## 2. 5 本强制性通用规范官方来源核实

| 编号 | 名称 | 公告 URL | 发布日期 | 实施日期 | 全文 PDF 在工作区 |
|---|---|---|---|---|---|
| GB 55001-2021 | 工程结构通用规范 | https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2021/art_17339_761192.html | 2021-04-09 | 2022-01-01 | **否（SOURCE_NOT_AVAILABLE）** |
| GB 55002-2021 | 建筑与市政工程抗震通用规范 | https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2021/art_17339_761174.html | 2021-04-09 | 2022-01-01 | **否（SOURCE_NOT_AVAILABLE）** |
| GB 55003-2021 | 建筑与市政地基基础通用规范 | https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2021/art_17339_761185.html | 2021-04-09 | 2022-01-01 | **否（SOURCE_NOT_AVAILABLE）** |
| GB 55006-2021 | 钢结构通用规范 | https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2021/art_17339_761191.html | 2021-04-09 | 2022-01-01 | **否（SOURCE_NOT_AVAILABLE）** |
| GB 55008-2021 | 混凝土结构通用规范 | https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2021/art_17339_762454.html | 2021-09-08 | 2022-04-01 | **否（第三方 OCR 已降级为 UNRELIABLE_SOURCE）** |

说明：
- MOHURD 公告页本身可访问，但公告页未附全文 PDF；全文须向中国建筑工业出版社购买正式出版物。
- 合肥市施工图审查中心、达州市城管局等政府网站有转载 PDF，但属第三方转载，本轮不下载、不导入，仅记录为 UNRELIABLE_SOURCE 候选。
- GB 55008-2021 与 2024 局部修订 8.5.1 条直接相关；正式全文缺失是当前最大证据缺口。

## 3. 规范链与模块绑定

| 模块族 | 强制性通用规范 | 专业设计标准 | 历史正文/局部修订 |
|---|---|---|---|
| 混凝土梁/柱/板/楼梯 | GB 55001、GB 55008 | GB/T 50010-2010（2015 正文 + 2024 局部修订） | GB 50010-2010(2015) 441 页 |
| 独立基础 | GB 55001、GB 55003 | GB 50007-2011（工作区不可见） | — |
| 钢梁 | GB 55001、GB 55006 | GB 50017-2017（工作区不可见） | — |
| 连续梁荷载 | GB 55001 | GB 50009-2012（工作区不可见） | — |
| 抗震相关模块 | GB 55001、GB 55002 | GB/T 50011（工作区不可见） | — |

## 4. 冲突判定状态

| 条文方向 | 冲突判定状态 |
|---|---|
| GB 55008 vs GB/T 50010-2010 8.5.1 最小配筋率 | **SOURCE_NOT_AVAILABLE**（GB 55008 全文不可得） |
| GB 55001 荷载分项系数 vs GB 50009-2012 | **SOURCE_NOT_AVAILABLE**（两本均不可见） |
| GB 55003 vs GB 50007-2011 地基承载力 | **SOURCE_NOT_AVAILABLE**（两本均不可见） |
| GB 55006 vs GB 50017-2017 钢梁 | **SOURCE_NOT_AVAILABLE**（两本均不可见） |
| GB 55002 vs GB/T 50011 抗震 | **SOURCE_NOT_AVAILABLE**（两本均不可见） |
| GB/T 50010-2010 内部 2015 vs 2024 | **NO_IMPACT_CONFIRMED**（已完成逐页比对，见 AMENDMENT_2024_DIFF.md） |

## 5. 当前基线结论

- 可作为计算基线的：GB/T 50010-2010（2015 正文 + 2024 局部修订），已入库。
- 不可作为基线的：5 本强制性通用规范全文均不可见，全部 SOURCE_NOT_AVAILABLE。
- 不得因资料未齐而取消现有 REVIEW_REQUIRED；所有混凝土模块仍保持 REVIEW_REQUIRED。
