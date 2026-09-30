# 候选规范资料清单（CANDIDATE SOURCES）

> **项目状态**：版本治理与资料盘点完成；正式规范源补齐与条文级认证未完成。
> 分支：`agent/normative-iteration`　｜　生成日期：2026-10-01
> 候选 PDF 存放于会话工作区 `tmp/candidates/`，**不提交 git**；分支仅提交本清单与元数据 JSON。

## 0. 闸门规则

- 只有用户明确回复「确认导入：<规范编号+版本>」之后，候选方可转为正式 Source PDF。
- 候选来源限定：规范发布部门官网、标准服务平台、出版社授权公开页、可核实的政府公开来源。
- 不得从无法核实的网盘、论坛、OCR 文本直接认证。
- 本轮**未改动**任何 Calculation Skill、既有 Evidence 状态，未合并 master。

---

## 1. 候选 1（已正式导入，移出候选清单）

### GB/T 50010-2010《混凝土结构设计标准》2024 年局部修订条文

| 字段 | 值 |
|---|---|
| 规范名称 | 《混凝土结构设计规范》GB 50010-2010(2015 年版) 局部修订条文（2024 年版） |
| 版本 | 2024 局部修订（住建部公告 2024 年第 62 号，2024-08-01 实施） |
| 来源 URL | `http://www.sczjjgfw.gov.cn/clas/wjhb/jsb/24/downloads/jsb202462fj.pdf`（四川省人民政府驻北京办事处建筑管理处，转载住建部公告） |
| MOHURD 公告 | `https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2024/art_17339_778180.html`（公告 2024 年第 62 号） |
| **入库位置** | `references/codes/GBT50010-2010_2024_amendment.pdf`（40 页，6 400 443 字节） |
| SHA-256（复算） | `84c4b76867dbac1290142d44bdb66b65b90ae4611818d21de623f9438e5001c2` |
| 完整性判断 | **非完整规范**，仅 26 条局部修订；须与 GB 50010-2010(2015 年版) 441 页正文叠加使用。 |
| 四项事实核对 | ① 实施日期 2024-08-01（一致）；② 名称改《混凝土结构设计标准》（一致）；③ 编号改 GB/T 50010-2010（一致）；④ 共 26 条修订（一致，PDF p.2）。详见 [CANDIDATE_GB_T_50010_2024_REVIEW.md](./CANDIDATE_GB_T_50010_2024_REVIEW.md) |
| 对现有模块数值影响 | **零**。C15、HRB335 已在现有代码中未使用；其余材料参数表值未变。详见 [AMENDMENT_2024_DIFF.md](./AMENDMENT_2024_DIFF.md) |
| 体系性影响 | 8.5.1 新增对 GB 55008 的强制引用；GB 55008 本工作区不可见；现有混凝土模块整体仍须保持 REVIEW_REQUIRED。 |
| 风险 | (a) 省级政府驻外机构转载，非住建部官网直接 PDF；(b) SHA-256 与 d7e9ee1 记录 `f0d360c050af2e6f` 不一致（系不同扫描导出）。 |
| 状态 | **已正式导入（2026-10-01）**；移出候选清单 |

---

## 2. 候选 2（已降级为缺口记录，不导入、不认证）

### GB 55008-2021《混凝土结构通用规范》

| 字段 | 值 |
|---|---|
| 原候选来源 | `http://wkxzx.com/upload/20250107/7e1923b6429b00df6dc1b3d6f477c53d.pdf`（武汉勘察设计协会技术咨询服务部，**第三方协会 OCR，非官方出版社**） |
| 下载文件 | `tmp/candidates/gb55008-2021.pdf`（78 页，3 379 182 字节，ABBYY FineReader OCR） |
| SHA-256 | `3234c9215c6816f7c8ebbe6545cd07ab99f51615225705a45f1cd81f6b7e26c5` |
| 处置 | **不导入、不认证、不做条文映射**。来源非官方出版社，OCR 质量未核；页数 78 与 d7e9ee1 记录 74 页不一致。 |
| 状态 | **FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE + 来源不可靠**。建议优先获取中国建筑工业出版社正式出版物后再认证。 |

---

## 3. 未获取到可核实公开来源的资料

| 编号 | 名称 | 状态 |
|---|---|---|
| GB 55001-2021 | 工程结构通用规范 | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| GB 55003-2021 | 建筑与市政地基基础通用规范 | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| GB 55006-2021 | 钢结构通用规范 | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| GB 50009-2012 | 建筑结构荷载规范 | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| GB 50007-2011 | 建筑地基基础设计规范 | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| GB 50017-2017 | 钢结构设计标准 | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| JGJ 3-2010 | 高层建筑混凝土结构技术规程 | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| T/CECS 553-2018 | 蒸压加气混凝土墙板应用技术规程 | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| 22G522-1 | 钢筋桁架混凝土楼板（国标图集） | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |

---

## 4. 待用户确认卡片

### 卡片 1（唯一待确认）

- **规范名称**：混凝土结构设计标准（2024 年局部修订条文）
- **版本**：GB/T 50010-2010（2024-08-01 实施）
- **来源链接**：`http://www.sczjjgfw.gov.cn/clas/wjhb/jsb/24/downloads/jsb202462fj.pdf`
- **页数**：40
- **SHA-256**：`84c4b76867dbac1290142d44bdb66b65b90ae4611818d21de623f9438e5001c2`
- **完整性判断**：非完整规范，仅 26 条局部修订
- **建议用途**：完成受弯/受剪核心条文（4.1.4/4.2.3/8.5.1）2015→2024 差异核查
- **风险**：省级政府驻外机构转载；与 d7e9ee1 记录哈希不一致（不同扫描导出）
- **回复格式**：「确认导入：GB/T 50010-2010（2024 局部修订）」

候选 2（GB 55008-2021）已降级，不再列入待确认卡片。
