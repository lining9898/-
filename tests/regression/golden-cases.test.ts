import { describe, expect, it } from 'vitest';
import { CalculationResult } from '../../src/types/calculation';
import { calculateBeamFlexure } from '../../src/core/beam/flexure';
import { calculateBeamShear } from '../../src/core/beam/shear';
import { calculateAxialColumn } from '../../src/core/column/axial';
import { calculateEccentricColumn } from '../../src/core/column/eccentric';
import { axialColumnReport } from '../../src/report/analysis-adapters';
import { eccentricColumnReport } from '../../src/report/eccentric-column-adapter';
import { calculateRebarArea } from '../../src/core/tools/rebar-area';
import { calculateSteelBeam } from '../../src/core/steel/beam';

import beamFlexureGolden from '../../skills/beam-flexure/golden-cases.json';
import beamShearGolden from '../../skills/beam-shear/golden-cases.json';
import columnGolden from '../../skills/column/golden-cases.json';
import rebarAreaGolden from '../../skills/rebar-area/golden-cases.json';
import steelBeamGolden from '../../skills/steel-beam/golden-cases.json';

interface GoldenExpected {
  label: string;
  value: number;
  unit: string;
  tolerance: number;
}
interface GoldenCheck { name: string; passed: boolean }
interface GoldenCase {
  id: string;
  description?: string;
  input: unknown;
  expected: GoldenExpected[];
  checks: GoldenCheck[];
  reference: string;
  evidenceStatus: string;
  note?: string;
}
interface GoldenCatalog { skillId: string; basis: string; cases: GoldenCase[] }

const catalogs: GoldenCatalog[] = [
  beamFlexureGolden as unknown as GoldenCatalog,
  beamShearGolden as unknown as GoldenCatalog,
  columnGolden as unknown as GoldenCatalog,
  rebarAreaGolden as unknown as GoldenCatalog,
  steelBeamGolden as unknown as GoldenCatalog,
];

/** 运行一个 golden case，返回 CalculationResult（或平铺对象转成近似结果列表）。 */
function runCase(skillId: string, input: unknown): CalculationResult {
  switch (skillId) {
    case 'beam-flexure':
      return calculateBeamFlexure(input as Parameters<typeof calculateBeamFlexure>[0]);
    case 'beam-shear':
      return calculateBeamShear(input as Parameters<typeof calculateBeamShear>[0]);
    case 'column': {
      const c = input as { mode: 'axial' | 'eccentric'; input: unknown };
      if (c.mode === 'axial') {
        const r = calculateAxialColumn(c.input as Parameters<typeof calculateAxialColumn>[0]);
        return axialColumnReport(c.input as Parameters<typeof calculateAxialColumn>[0], r);
      }
      const r = calculateEccentricColumn(c.input as Parameters<typeof calculateEccentricColumn>[0]);
      return eccentricColumnReport(c.input as Parameters<typeof calculateEccentricColumn>[0], r);
    }
    case 'rebar-area': {
      const r = calculateRebarArea(input as Parameters<typeof calculateRebarArea>[0]);
      return {
        calculatorType: 'rebar-area', timestamp: '', overallStatus: 'VERIFIED',
        inputs: [], materials: [], geometry: [], steps: [], results: [
          { label: 'singleArea', value: r.singleArea, unit: 'mm²' },
          { label: 'totalArea', value: r.totalArea, unit: 'mm²' },
          { label: 'areaPerMetre', value: r.areaPerMetre, unit: 'mm²/m' },
        ], checks: [], conclusion: { passed: true, summary: '', evidence: [] },
        advisories: [], allEvidence: [],
      } as CalculationResult;
    }
    case 'steel-beam': {
      const r = calculateSteelBeam(input as Parameters<typeof calculateSteelBeam>[0]);
      return {
        calculatorType: 'steel-beam', timestamp: '', overallStatus: 'REVIEW_REQUIRED',
        inputs: [], materials: [], geometry: [], steps: [], results: [
          { label: 'area', value: r.area, unit: 'mm²' },
          { label: 'sectionModulus', value: r.sectionModulus, unit: 'mm³' },
          { label: 'bendingStress', value: r.bendingStress, unit: 'N/mm²' },
          { label: 'shearStress', value: r.shearStress, unit: 'N/mm²' },
          { label: 'stabilityStress', value: r.stabilityStress, unit: 'N/mm²' },
        ], checks: [], conclusion: { passed: true, summary: '', evidence: [] },
        advisories: [], allEvidence: [],
      } as CalculationResult;
    }
    default:
      throw new Error(`未登记的 Golden skillId: ${skillId}`);
  }
}

/** 在 results / steps / checks / geometry / materials / inputs 中按 label 或 name 定位数值。 */
function findValue(result: CalculationResult, label: string): number | undefined {
  const fromResults = result.results.find(item => item.label === label);
  if (fromResults !== undefined && typeof fromResults.value === 'number') return fromResults.value;
  const fromGeometry = result.geometry.find(item => item.label === label);
  if (fromGeometry !== undefined && typeof fromGeometry.value === 'number') return fromGeometry.value;
  const fromMaterials = result.materials.find(item => item.label === label);
  if (fromMaterials !== undefined && typeof fromMaterials.value === 'number') return fromMaterials.value;
  const fromSteps = result.steps.find(step => step.name === label);
  if (fromSteps !== undefined && typeof fromSteps.result === 'number') return fromSteps.result;
  const fromChecks = result.checks.find(check => check.name === label);
  if (fromChecks !== undefined) return fromChecks.calculatedValue;
  return undefined;
}

describe('Golden Cases 回归基准', () => {
  for (const catalog of catalogs) {
    describe(`${catalog.skillId}（依据：${catalog.basis}）`, () => {
      for (const c of catalog.cases) {
        it(`${c.id} — ${c.description ?? ''}（evidenceStatus: ${c.evidenceStatus}）`, () => {
          const result = runCase(catalog.skillId, c.input);
          // 每个期望值在允许误差内命中，且单位一致
          for (const exp of c.expected) {
            const actual = findValue(result, exp.label);
            expect(actual, `${exp.label} 未在结果/步骤/验算中找到`).toBeDefined();
            expect(Math.abs((actual as number) - exp.value),
              `${exp.label}: 期望 ${exp.value} ${exp.unit}，实际 ${actual}`)
              .toBeLessThanOrEqual(exp.tolerance);
            const found = result.results.find(i => i.label === exp.label)
              || (result.steps.find(s => s.name === exp.label) as unknown as { unit?: string });
            if (exp.unit && found && 'unit' in found && found.unit) {
              expect(found.unit, `${exp.label} 单位`).toBe(exp.unit);
            }
          }
          // 验算项通过状态
          for (const chk of c.checks) {
            const check = result.checks.find(x => x.name === chk.name);
            expect(check, `验算项 ${chk.name} 未找到`).toBeDefined();
            expect(check!.passed, `验算项 ${chk.name} 应 ${chk.passed}`).toBe(chk.passed);
          }
        });
      }
    });
  }
});
