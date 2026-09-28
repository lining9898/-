# AI-assisted structural calculation architecture

```text
AI Agent
  ↓
Skill Registry（list / describe / calculate / resolve / audit）
  ↓
┌─────────────────┬──────────────────┬─────────────────┐
│ Calculation     │ Normative       │ Auditor         │
│ "怎么算"        │ "规范说什么"     │ "是否可靠"      │
└─────────────────┴──────────────────┴─────────────────┘
  ↓                    ↓                   ↓
Engineering Engine   NormativeAnswer   AuditResult
  ↓
CalculationResult
  ↓
计算书 / 审查报告
```

## Boundary

- 三类 Skill 职责严格分离：
  - **Calculation Skill** 返回 `CalculationResult`（数值、验算、步骤）
  - **Normative Skill** 返回 `NormativeAnswer`（规范条文元信息，不含任何工程数值）
  - **Auditor Skill** 返回 `CalculationAuditResult`（结构审查，不执行工程计算）
- `src/core` 拥有数值计算。`src/types/calculation.ts` 是输出契约；`src/types/evidence.ts` 持有证据状态。
- 检索到的条文是候选，不是信任来源。未对照原 PDF 校核的保持 `REVIEW_REQUIRED`。

## Skill Registry 接口

| 方法 | 输入 | 返回 | 说明 |
|------|------|------|------|
| `list()` | — | `SkillSummary[]` | 列出所有已注册 Skill |
| `describe(id)` | Skill ID | `SkillPackage \| undefined` | 返回 manifest/schema/evidence/tests |
| `calculate(id, input)` | Skill ID + 输入 | `CalculationResult` | 调用 calculation Skill |
| `resolve(query)` | `{code, clause}` | `NormativeAnswer` | 调用 normative Skill 查询规范条文 |
| `audit(id)` | Skill ID | `CalculationAuditResult` | 结构审查 |

## 已注册 Skills

| ID | 类型 | 说明 |
|----|------|------|
| `beam-flexure` | calculation | 矩形梁正截面受弯 |
| `beam-shear` | calculation | 矩形梁斜截面受剪 |
| `column` | calculation | 矩形箍筋柱轴压/偏心 |
| `gb50010` | normative | GB 50010-2010（2015年版）条文查询 |
| `calculation-auditor` | auditor | Skill 结构审查 |

## NormativeAnswer 数据模型

```typescript
interface NormativeAnswer {
  query: { code: string; clause: string };
  codeName: string;       // 规范名称
  codeNumber: string;      // 规范编号
  edition: string;        // 版本
  chapter: string;        // 章节
  clause: string;         // 条文号
  text: string;           // 条文原文（未导入为空）
  page: number | null;    // PDF 页码
  source: string | null;   // 来源文件
  verificationStatus: VerificationStatus;
  applicability: string;   // 适用范围
  warnings: string[];     // 警告
}
```

**禁止**：NormativeAnswer 不得包含 Mu、Vu、Nu、As、承载力、配筋等工程计算结果字段。

## Evidence 追溯链

```
CalculationResult.steps[].evidence
  → evidenceId
  → SkillEvidenceRecord { codeName, codeNumber, edition, chapter, clause, sourceFile, pdfPage, verificationStatus }
```

`formulaMappings[].evidenceId` 必须在对应 Skill 的 `evidence.json` 中存在（由 auditor 检查）。
VERIFIED 的 evidence 必须同时有 sourceFile 和 pdfPage。

## 架构契约测试

`tests/agent/normative-skill.test.ts` 保证：
1. Calculation Skill 返回 CalculationResult
2. Normative Skill 返回 NormativeAnswer
3. calculate() 不调用 normative Skill
4. resolve() 不调用 calculation Skill
5. NormativeAnswer 不含工程计算字段
6. VERIFIED evidence 有完整来源
7. 无重复 Skill ID
8. formulaMappings 的 evidenceId 存在
9. audit() 不执行工程计算
10. 未收录条文返回 UNVERIFIED
