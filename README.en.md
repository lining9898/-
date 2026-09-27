# Concrete Structure Toolkit (CN-Structural-Toolkit)

A calculation toolkit for reinforced concrete members based on China's "Code for Design of Concrete Structures" (GB 50010-2010, 2015 Edition).

## Features

### Currently Supported Functions

- **Flexural Capacity of Rectangular Beam Normal Section** - Based on GB 50010-2010 Clause 6.2.10
- **Shear Capacity of Rectangular Beam Inclined Section** - Based on GB 50010-2010 Clause 6.3.4
- **Axial Compression Capacity of Rectangular Stirrup Column** - Single-item verification for rectangular stirrup columns
- **Eccentric Compression Capacity of Rectangular Stirrup Column** - Large/small eccentricity classification and capacity calculation

### Core Calculation Modules

| Module | Code Basis | Status |
|------|----------|------|
| Concrete Design Strength Values (fc, ft) | 4.1.4 | ✅ Verified |
| Steel Reinforcement Design Strength Values (fy) | 4.2.3 | ✅ Verified |
| Concrete Modulus of Elasticity (Ec) | 4.1.5 | ✅ Verified |
| Steel Reinforcement Modulus of Elasticity (Es) | 4.2.5 | ✅ Verified |
| Equivalent Rectangular Stress Block Parameters (α1, β1) | 6.2.6 | ✅ Verified |
| Concrete Ultimate Compressive Strain (εcu) | 6.2.1 | ✅ Verified |
| Limiting Relative Height of Compression Zone (ξb) | 6.2.7 | ✅ Verified |
| Normal Section Flexural Capacity (Mu) | 6.2.10 | ✅ Verified |
| Minimum Reinforcement Ratio (ρmin) | 8.5.1 | ✅ Fixed |

## Technical Architecture

### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS

### Calculation Engine

- **Core**: Rust (Compiled to WebAssembly)
- **Document Generation**: Standardized calculation report output

### Deployment

- Supports Netlify deployment
- Pre-compiled WASM calculation modules

## Quick Start

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

### Build Production Version

```bash
npm run build
```

### Run Tests

```bash
npm run test
```

## Usage

1. Visit the online version: https://cn-structural-toolkit.gitee.io
2. Select the member type requiring calculation
3. Input member parameters (section dimensions, reinforcement, material strength, etc.)
4. Obtain calculation results and reports

## Project Structure

```
cn-structural-toolkit/
├── docs/                    # Code Verification & Architecture Documentation
│   ├── GB50010_VERIFICATION_REPORT.md  # Original Code Verification Report
│   ├── PHASE3_COMPLETION_REPORT.md     # Phase 3 Completion Report
│   ├── SHEAR_VERIFICATION_REPORT.md    # Inclined Section Calculation Verification
│   └── ...
├── dist/                    # Build Output
├── index.html              # Entry File
└── package.json
```

## Standards & References

### Primary Reference Standard

- "Code for Design of Concrete Structures" GB 50010-2010 (2015 Edition)

### Third-Party Reference Projects

- AS 3600 Structural Toolkit
- ConcreteDesignPy
- claude-structural-engineering

See [THIRD_PARTY_REFERENCES.md](./THIRD_PARTY_REFERENCES.md) for details.

## License

See [dist/FERS-LICENSE.txt](./dist/FERS-LICENSE.txt) for details.

## Contribution Guidelines

Welcome to submit Issues and Pull Requests to improve this project.

---

*The calculation results of this toolkit are for reference only. For actual engineering design, please consult professional engineers and refer to formal construction drawings.*