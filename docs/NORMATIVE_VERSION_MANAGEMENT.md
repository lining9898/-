# 规范版本管理（Agent 3）

> 目标：同一规范编号下多版本共存、绝不覆盖旧版；判断"哪个版本现行"只依据可靠、可追溯来源，不凭模型记忆。

## 数据模型（`src/normative/types.ts`）

```typescript
interface NormativeVersion {
  codeName; codeNumber; designation; edition;
  publishDate; effectiveDate;           // ISO yyyy-mm-dd
  status: 'CURRENT'|'UPCOMING'|'SUPERSEDED'|'REVIEW_REQUIRED';
  replacedBy?;                          // 被哪个版本取代（edition）
  source;                               // 可靠、可追溯来源（URL/文件）
  verificationStatus;                   // 版本状态核验
  note?;
}

interface NormativeChangeSet {
  id; codeNumber; fromEdition; toEdition;
  changedClauses[]; changedFormulas[];
  changedParameters[]; changedApplicability[];
  affectedSkills[];                     // 受影响 Calculation Skill（→ REVIEW_REQUIRED）
  reviewDate; source; verificationStatus; note?;
}
```

## 注册表（`src/normative/registry.ts`）

- 以 `(codeNumber, edition)` 为键，重复注册抛错 → 旧版无法被覆盖。
- `resolve(codeNumber, {edition?, effectiveDate?})`：
  - 指定 `edition` → 返回该版本；不存在 → `REVIEW_REQUIRED` + 警告。
  - 指定 `effectiveDate` → 取该日期已生效的最新版本。
  - 未指定 → 仅当存在 **且仅一个** 已核验 `CURRENT` 时才判现行；多个 `CURRENT` 或 `CURRENT` 未核验 → `REVIEW_REQUIRED`，绝不盲选。

## 版本感知的 Normative Skill（`src/normative/factory.ts`）

每个 Normative Skill 绑定一个 `primaryEdition`（其 evidence 所属版本）。resolve 时：

1. 经注册表解析目标版本；
2. 仅当解析版本 == `primaryEdition` 才返回该版 evidence；
3. 其他版本一律 `UNVERIFIED` + 警告（绝不凭记忆作答）；
4. `NormativeAnswer` 只含版本/条文元信息与原文，**不含 Mu/Vu/Nu/As/承载力/配筋/工程量**。

## 已收录版本（`src/normative/data.ts`）

| 规范 | edition | 状态 | 来源 |
|---|---|---|---|
| GB 50010 混凝土结构设计规范 | 2010 | SUPERSEDED | 仓库内 2015 年版 PDF 封面/修订说明 |
| GB 50010 | 2010（2015年版） | SUPERSEDED | 仓库内 PDF 修订说明（公告919号） |
| GB 50010（GB/T 50010-2010） | 2010（2024年版） | CURRENT | 住建部公告（2024-08-01 实施） |
| GB 50009 建筑结构荷载规范 | 2012 | CURRENT | 住建部公告第1405号 |
| GB 50007 建筑地基基础设计规范 | 2011 | CURRENT | 住建部公告第1096号 |

## 变更集与 affectedSkills

| 变更集 | changedClauses / Parameters | affectedSkills | 状态 |
|---|---|---|---|
| 2010 → 2015年版 | 9 条（4.2.1…G.0.12） | beam-flexure / beam-shear / column | VERIFIED（依据仓库内 PDF 修订说明） |
| 2015年版 → 2024年版 | C15、HRB335 删除；改名 GB/T 50010-2010 | beam-flexure / beam-shear / column | REVIEW_REQUIRED（2024 原文未入库） |

回答"新规范发布后，我哪些计算模块需要重新验证"：
`normativeVersionRegistry.listChangeSets(codeNumber)` → 按 `affectedSkills` 将对应 Calculation Skill 置为 `REVIEW_REQUIRED`，直至 Auditor + 人工/可靠证据复核后才可 `VERIFIED`。新版不得自动把旧 Skill 改为 `VERIFIED`。
