# CN-Structural-Toolkit — 中国规范结构构件计算 Web 平台

基于中国规范的结构构件计算 Web 平台，采用 **Agent → Skill Registry → Engine → Result** 分层架构。

## 架构

```
AI Agent
  ↓
Skill Registry（list / describe / calculate / resolve / audit）
  ↓
┌─────────────────┬──────────────────┬─────────────────┐
│ Calculation     │ Normative       │ Auditor         │
│ Skills          │ Skills          │ Skills          │
│ "怎么算"        │ "规范说什么"     │ "是否可靠"      │
└─────────────────┴──────────────────┴─────────────────┘
  ↓                    ↓                   ↓
Engineering Engine   NormativeAnswer   AuditResult
  ↓
CalculationResult
  ↓
计算书 / 审查报告
```

### 已实现 Skills

| Skill ID | 类型 | 说明 |
|----------|------|------|
| `beam-flexure` | calculation | 矩形梁正截面受弯承载力 |
| `beam-t-flexure` | calculation | T形梁正截面受弯承载力 |
| `beam-double-flexure` | calculation | 双筋矩形梁正截面受弯承载力 |
| `beam-continuous` | calculation | 连续梁内力（结构力学方法，非 GB 规范公式） |
| `beam-shear` | calculation | 矩形梁斜截面受剪承载力 |
| `column` | calculation | 矩形箍筋柱轴压/偏心受压 |
| `gb50010` | normative | GB 50010-2010（2015年版）条文查询 |
| `calculation-auditor` | auditor | Skill 结构审查 |

## 技术栈

- **前端**: React 19 + TypeScript 7 + Vite 8
- **样式**: Tailwind CSS 4
- **测试**: Vitest 5 + Testing Library
- **计算引擎**: Rust → WebAssembly（@ferscloud/fers-calculation-web）

## 快速开始

```bash
npm install
npm run dev       # 开发
npm run build     # 生产构建
npm run test:run  # 全量测试
```

## 项目结构

```
src/
├── agent/           # Skill Registry、类型定义、Auditor
│   ├── skill-types.ts
│   ├── skill-registry.ts
│   └── calculation-auditor.ts
├── core/            # 计算引擎（梁/柱/钢/工具）
├── types/           # CalculationResult、Evidence 数据模型
├── report/          # 计算书生成器
├── components/       # React UI
└── pages/           # 页面
skills/              # Skill 包（manifest + schema + evidence + tests + entry）
tests/               # 测试
docs/                # 架构与校核文档
```

## Evidence 追溯链

```
CalculationResult → steps/formula → evidenceId → SkillEvidenceRecord → 规范名称/版本/条文/页码
```

所有 `formulaMappings[].evidenceId` 必须在对应 Skill 的 `evidence.json` 中存在。

## 规范依据

- 《混凝土结构设计规范》GB 50010-2010（2015年版）

> 计算结果仅供参考，实际工程设计请以正式施工图为准。
