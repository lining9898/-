# 规范源清单（SOURCE INVENTORY）

> 分支：`agent/normative-iteration`　｜　基线 commit：`8170b17c0643a9e36956281103079fffa8c8ed1e`（master）
> 生成日期：2026-10-01　｜　总控 Agent：规范迭代与版本治理总控
> 机器可读副本：[`source-inventory.json`](./source-inventory.json)

## 0. 判据与边界（重要）

本清单的"可认证"判据只有一条：**文件在当前 Agent 工作区真实可读、可逐页核验（页数、内容、SHA-256 可由本工作区命令复算）**。

- 本工作区 = 仓库克隆 `/home/user/Doubao/chats/38445028538991106/repo` + 会话工作区 + 历史资料目录 `/home/user/Doubao/chats/38442278876025858/structural-calc`。
- 已补查当前环境可访问范围：无附件区（无 attachments 目录）、无 `/mnt`、`/media` 挂载区、无 Library/知识库可访问目录。
- **当前 Agent 工作区仅发现 1 本可读 PDF，不等于用户仅提供 1 本规范。** 工作区盘点结果不是用户资料总量结论。用户本机（如此前 `agent/normative-inventory` 分支 d7e9ee1 所述 `G:\ai\工作\规范\`）另有 12 份以上资料，本工作区无法独立复算其哈希，故一律标记为 `FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE`，不认证、不猜测、不升级 VERIFIED。
- 历史目录 `structural-calc/codes/*.json` 为条文摘录 JSON，**不是完整正文**，标记 `NOT_A_FULL_TEXT`。
- 版本不明者标记 `VERSION_UNCONFIRMED`。
- 任何 `REVIEW_REQUIRED / UNVERIFIED` 不得自动升级为 `VERIFIED`。

---

## 1. 当前工作区内可逐页核验的规范 PDF

| 字段 | 值 |
|---|---|
| 规范名称 | 混凝土结构设计规范 |
| 规范编号 | GB 50010-2010 |
| 版本 | 2015 年版（局部修订版，住建部公告第 919 号） |
| 发布日期 | 2010-08-18（原版）；2015-09-22（局部修订批准） |
| 实施日期 | 2011-07-01（原版）；2015-09-22（局部修订同步实施） |
| 仓库路径 | `references/codes/GB50010-2010_2015_.pdf`（另有同内容副本 `public/pdfs/gb50010-2010-2015.pdf`） |
| 文件大小 | 25 041 938 字节（约 25 MB） |
| 页数 | 441（pdfinfo 实测） |
| SHA-256 | `4ba21712ba65fb3b7e2a66142d1e2833a138d47cc4c3e1617764fa794018b906` |
| MD5 | `a3916190cb9ef0f9da74f02f067c6db9`（与 `references/codes/code-manifest.json` 记录一致） |
| 是否完整正文 | 是（441 页，含封面、修订说明、正文、附录） |
| 是否真实 PDF 原件 | 是（Adobe Acrobat Pro 11.0.16 Paper Capture 扫描件，含文字层；非网页打印件） |
| 当前有效性 | **SUPERSEDED**（已被 GB/T 50010-2010（2024 年版）取代；详见 VERSION_GOVERNANCE.md） |
| 当前可用范围 | 仅可作为**历史版本基线**用于：(a) 2015 年版条文原文比对；(b) 当前计算模块的旧公式基线校核；(c) 教学演示。**不得直接作为现行设计认证依据。** |
| 禁止使用范围 | 不得用于现行（2024-08-01 起）工程设计认证；不得据此声称模块"现行规范已 VERIFIED"；C15、HRB335 已被 2024 局部修订删除，不得在现行计算中使用。 |
| 是否已被计算模块引用 | 是。`src/core/beam/flexure.ts`、`shear.ts`、`double-flexure.ts`、`t-flexure.ts`、`slab/one-way.ts` 等均引用其条文号与 PDF 页码。 |
| 备注 | 扫描件 OCR 质量对汉字/公式提取不可靠；条文原文以人工逐页核对为准（见 docs/FUNCTION_AUDIT.md）。 |

---

## 2. 用户本机曾记录但本工作区无法复算的资料（FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE）

以下资料来自 `agent/normative-inventory` 分支 d7e9ee1 的盘点（用户本机 `G:\ai\工作\规范\` 快照）。本工作区无法独立打开、逐页核验或复算 SHA-256，故**不认证、不猜测**。哈希值原样转录自该分支，仅供溯源。

| # | 编号 | 名称 | 版本 | 页数 | 记录的 SHA-256（前 16 位） | 本工作区状态 |
|---|---|---|---|---|---|---|
| 1 | GB 55001-2021 | 工程结构通用规范 | 2021 | 70 | `e7d7bb9f88911482` | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| 2 | GB 55002-2021 | 建筑与市政工程抗震通用规范 | 2021 | 117 | `ec2455e61ee1327e` | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| 3 | GB 55003-2021 | 建筑与市政地基基础通用规范 | 2021 | 83 | `6eda058e0075e57e` | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| 4 | GB 55008-2021 | 混凝土结构通用规范 | 2021 | 74 | `8c59c206d482efe8` | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| 5 | GB 50009-2012 | 建筑结构荷载规范 | 2012 | 261 | `2b81bcdc887d6afe` | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| 6 | GB 50068-2018 | 建筑结构可靠性设计统一标准 | 2018 | 66 | `d34092a6fb60cfce` | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| 7 | GB 50011-2010 | 建筑抗震设计规范 | 2016 年版 | 526 | `feb4fa0173b852fd` | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| 8 | GB 50017-2017 | 钢结构设计标准 | 2017 | 533 | `6f96de68b65a0912` | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| 9 | JGJ 1-2014 | 装配式混凝土结构技术规程 | 2014 | 145 | `1775753f1f371e61` | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE |
| 10 | GB/T 50010-2010（2024 局部修订条文） | 混凝土结构设计标准（局部修订） | 2024 | 40 | `f0d360c050af2e6f` | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE；**非完整规范，仅 26 条修订** |
| 11 | GB/T 50011-2010（2024 局部修订条文） | 建筑抗震设计标准（局部修订） | 2024 | 20 | `62eabe1c0d82b175` | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE；非完整规范 |
| 12 | GB 50204-2015 | 混凝土结构工程施工质量验收规范 | 2015 | 79 | `c8c51d57617027cd` | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE；施工验收类，非设计计算依据 |

---

## 3. 任务点名但本工作区未定位到的资料

| 编号 | 名称 | 任务提及用途 | 本工作区状态 |
|---|---|---|---|
| GB 50007-2011 | 建筑地基基础设计规范 | 独立基础模块依据 | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE；VERSION_UNCONFIRMED（d7e9ee1 记录 342 页、`4c553fd7…`，本工作区无法复算） |
| JGJ 3-2010 | 高层建筑混凝土结构技术规程 | 高混规程 | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE；VERSION_UNCONFIRMED（d7e9ee1 记录 360 页、`a6845710…`） |
| T/CECS 553-2018 | 蒸压加气混凝土墙板应用技术规程 | 协会标准 | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE；VERSION_UNCONFIRMED（d7e9ee1 记录 58 页、`e18f9305…`） |
| 22G522-1 | 钢筋桁架混凝土楼板（国标图集） | 图集，非规范正文 | FILE_NOT_AVAILABLE_IN_CURRENT_WORKSPACE；VERSION_UNCONFIRMED（d7e9ee1 记录 64 页、`126894a3…`） |

---

## 4. 历史资料目录中的条文摘录（非完整正文）

路径：`/home/user/Doubao/chats/38442278876025858/structural-calc/codes/`

| 文件 | 性质 | 状态 |
|---|---|---|
| GB50003.json | 砌体结构设计规范条文摘录 | NOT_A_FULL_TEXT；VERSION_UNCONFIRMED |
| GB50007.json | 地基基础设计规范条文摘录 | NOT_A_FULL_TEXT；VERSION_UNCONFIRMED |
| GB50009.json | 荷载规范条文摘录 | NOT_A_FULL_TEXT；VERSION_UNCONFIRMED |
| GB50010.json | 混凝土规范条文摘录（10.9 KB） | NOT_A_FULL_TEXT；VERSION_UNCONFIRMED |
| GB50011.json | 抗震规范条文摘录 | NOT_A_FULL_TEXT；VERSION_UNCONFIRMED |
| JGJ1.json | 装配式规程条文摘录 | NOT_A_FULL_TEXT；VERSION_UNCONFIRMED |

**禁止**：以上 JSON 一律不得当作正式规范原文引用；其数值/条文仅可作为"待核验线索"。

---

## 5. 当前可作为计算基线的规范（结论）

| 用途 | 可作为基线的规范 | 备注 |
|---|---|---|
| 混凝土受弯/受剪旧公式基线比对 | GB 50010-2010（2015 年版）441 页 PDF | 工作区唯一可逐页核验的完整正文；状态 SUPERSEDED，仅作历史基线 |
| 现行（2024-08-01 起）混凝土设计认证 | **无**（GB/T 50010-2010 2024 局部修订 PDF 本工作区不可见；GB 55008-2021 本工作区不可见） | 所有混凝土计算模块整体保持 REVIEW_REQUIRED |
| 地基基础设计 | **无**（GB 50007-2011、GB 55003-2021 本工作区不可见） | 独立基础模块保持 REVIEW_REQUIRED |
| 钢结构设计 | **无**（GB 50017-2017、GB 55006-2021 本工作区不可见） | 钢梁模块保持 REVIEW_REQUIRED |
| 荷载取值 | **无**（GB 50009-2012 本工作区不可见） | 板/楼梯/基础模块的荷载组合保持 REVIEW_REQUIRED |

---

## 6. 仓库内既有规范文档（交叉核对来源，非独立 PDF）

以下文档位于基线 `docs/` 下，已在本轮交叉核对，结论并入 VERSION_GOVERNANCE.md 与 MODULE_EVIDENCE_COVERAGE.md：

- `docs/NORMATIVE_VERSION_MANAGEMENT.md` — 版本治理数据模型与注册表
- `docs/CURRENT-STANDARDS-FUSION.md` — 现行规范组合
- `docs/NORM_VERSION_GAP.md` — 2015→2024 差异待复核
- `docs/GB50010_VERIFICATION_REPORT.md` — 矩形梁正截面 12 项逐条校核
- `docs/SHEAR_VERIFICATION_REPORT.md` — 矩形梁斜截面校核
- `docs/CANDIDATE_EVIDENCE_CONFIRMATION.md` — 候选依据确认表（PENDING_USER_CONFIRMATION）
- `docs/ARCHITECTURE_AUDIT.md`、`docs/FUNCTION_AUDIT.md`、`docs/PHASE3_COMPLETION_REPORT.md`

---

## 7. 分支既有成果溯源（不合并代码，仅文档标注）

| 分支 | tip commit | 对本清单的贡献 |
|---|---|---|
| `origin/agent/normative-inventory` | `9635373` | d7e9ee1 产出首版 SOURCE_INVENTORY（13 份本机快照）；ae02d4f/9635373 产出 P4 证据（6.3.1 p70、6.3.4 p71、9.2.9 p134 页图） |
| `origin/agent/normative` | `336656e` | 版本管理模型与注册表（`src/normative/`） |
| `origin/agent/p3-integration` | `8170b17` | 与 master 同点，无独立成果 |
| `origin/agent/audit` | `72e15b7` | 计算审计器、黄金算例 |
| `origin/fix/module-audit-gaps` | `e0bb87a` | 钢梁 skill 脚手架、slab-two-way 缺口修复（改动计算代码，本轮不采用） |
| `origin/agent/ai-review-v1` | `6041dc2` | AI 审查包 |
| `origin/agent/beam-column` | `007d674` | T 形/双筋梁、连续梁、柱 skill 化 |
| `origin/agent/slab-foundation-stair` | `d99a1be` | 板/独立基础/楼梯 skill 化 |
| `gitee/master` | 镜像 | 仅作一致性核对 |

> 详见最终报告"远程分支现状"一节。
