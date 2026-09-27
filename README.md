# 混凝土结构工具箱 (CN-Structural-Toolkit)

基于中国《混凝土结构设计规范》(GB 50010-2010, 2015年版) 的钢筋混凝土构件计算工具箱。

## 功能特性

### 当前支持功能

- **矩形梁正截面受弯承载力计算** - 基于 GB 50010-2010 第 6.2.10 条
- **矩形梁斜截面受剪承载力计算** - 基于 GB 50010-2010 第 6.3.4 条
- **矩形箍筋柱轴压承载力计算** - 矩形箍筋柱单项验算
- **矩形箍筋柱偏心受压承载力计算** - 大小偏心判别与承载力计算

### 核心计算模块

| 模块 | 规范依据 | 状态 |
|------|----------|------|
| 混凝土强度设计值 (fc, ft) | 4.1.4 | ✅ 已验证 |
| 钢筋强度设计值 (fy) | 4.2.3 | ✅ 已验证 |
| 混凝土弹性模量 (Ec) | 4.1.5 | ✅ 已验证 |
| 钢筋弹性模量 (Es) | 4.2.5 | ✅ 已验证 |
| 等效矩形应力图系数 (α1, β1) | 6.2.6 | ✅ 已验证 |
| 混凝土极限压应变 (εcu) | 6.2.1 | ✅ 已验证 |
| 界限相对受压区高度 (ξb) | 6.2.7 | ✅ 已验证 |
| 正截面受弯承载力 (Mu) | 6.2.10 | ✅ 已验证 |
| 最小配筋率 (ρmin) | 8.5.1 | ✅ 已修复 |

## 技术架构

### 前端

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS

### 计算引擎

- **核心**: Rust (编译为 WebAssembly)
- **文档生成**: 规范化计算书输出

### 部署

- 支持 Netlify 部署
- 预编译 WASM 计算模块

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
npm run test
```

## 使用方法

1. 访问在线版本: https://cn-structural-toolkit.gitee.io
2. 选择需要计算的构件类型
3. 输入构件参数 (截面尺寸、配筋、材料强度等)
4. 获取计算结果与计算书

## 项目结构

```
cn-structural-toolkit/
├── docs/                    # 规范验证与架构文档
│   ├── GB50010_VERIFICATION_REPORT.md  # 规范原文校核报告
│   ├── PHASE3_COMPLETION_REPORT.md     # 第三阶段完成报告
│   ├── SHEAR_VERIFICATION_REPORT.md    # 斜截面计算校核
│   └── ...
├── dist/                    # 构建输出
├── index.html              # 入口文件
└── package.json
```

## 规范与参考

### 主要参考规范

- 《混凝土结构设计规范》GB 50010-2010 (2015年版)

### 第三方参考项目

- AS 3600 Structural Toolkit
- ConcreteDesignPy
- claude-structural-engineering

详见 [THIRD_PARTY_REFERENCES.md](./THIRD_PARTY_REFERENCES.md)

## 许可证

详见 [dist/FERS-LICENSE.txt](./dist/FERS-LICENSE.txt)

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进本项目。

---

*本工具箱的计算结果仅供参考，实际工程设计请咨询专业工程师并以正式施工图为准。*