import { describe, expect, it } from 'vitest';
import { calculateBeamFlexure } from '../../src/core/beam/flexure';
import { calculateBeamShear, BeamShearInput } from '../../src/core/beam/shear';
import { calculateAxialColumn } from '../../src/core/column/axial';
import { calculateEccentricColumn, EccentricColumnInput } from '../../src/core/column/eccentric';
import { calculateRebarArea } from '../../src/core/tools/rebar-area';
import { calculateSteelBeam } from '../../src/core/steel/beam';

/**
 * 单位专项回归测试（Part 2）
 * 目标：锁定 N↔kN、N·mm↔kN·m、mm↔m、mm²↔m²、MPa↔Pa 的换算，
 * 防止 10³ / 10⁶ / 10⁹ 数量级错误悄悄进入结果。
 * 每个用例都用“独立复算”的方式核对最终结果所在的数量级与单位。
 */

const close = (actual: number, expected: number, tol: number) => Math.abs(actual - expected) <= tol;

describe('单位专项回归：10³/10⁶/10⁹ 数量级防护', () => {
  describe('梁正截面受弯（Mu: N·mm → kN·m，需 /10⁶）', () => {
    const input = {
      b: 250, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400',
      cover: 25, barDiameter: 20, barCount: 4, moment: 120,
    };
    const result = calculateBeamFlexure(input);
    const Mu = result.results.find(r => r.label === '受弯承载力 Mu')!.value as number;

    it('Mu 数量级为 ~10² kN·m（而非 10⁸ N·mm 泄漏或 10⁻⁴ 错误）', () => {
      // 独立复算：α1·fc·b·x·(h0−x/2)，单位 N·mm；/10⁶ → kN·m
      const As = 4 * Math.PI * 20 ** 2 / 4;
      const h0 = 500 - 25 - 10;
      const x = 360 * As / (14.3 * 250);
      const Nmm = 14.3 * 250 * x * (h0 - x / 2);
      const expected = Nmm / 1e6;
      expect(close(Mu as number, expected, 0.02)).toBe(true);
      expect(Mu).toBeGreaterThan(100);
      expect(Mu).toBeLessThan(1000);
      expect(result.results.find(r => r.label === '受弯承载力 Mu')!.unit).toBe('kN·m');
    });

    it('As 以 mm² 表示（π·d²/4，无 10⁶ 放大）', () => {
      const As = result.results.find(r => r.label === '受拉钢筋面积 As')!.value as number;
      expect(close(As, 4 * Math.PI * 20 ** 2 / 4, 0.01)).toBe(true);
      expect(As).toBeLessThan(1e4);
    });

    it('受压区高度 x 以 mm 表示', () => {
      const x = result.results.find(r => r.label === '受压区高度 x')!.value as number;
      expect(x).toBeGreaterThan(50);
      expect(x).toBeLessThan(300);
    });
  });

  describe('梁斜截面受剪（Vc/Vs/Vcs/Vmax: N → kN，需 /10³）', () => {
    const input: BeamShearInput = {
      b: 250, h: 500, h0: 460, concreteGrade: 'C30', stirrupGrade: 'HPB300',
      V: 120, stirrupLegs: 2, stirrupSpacing: 200, stirrupDiameter: 8, loadType: 'uniform',
    };
    const result = calculateBeamShear(input);
    const byLabel = (l: string) => result.results.find(r => r.label === l)!.value as number;

    it('Vc、Vs、Vcs、Vmax 都以 kN 表示且数量级为 ~10²', () => {
      // 独立复算（N 制）：Vc = αcv·ft·b·h0 [N]，/1000 → kN
      const VcN = 0.7 * 1.43 * 250 * 460;
      expect(close(byLabel('混凝土受剪承载力 Vc'), VcN / 1000, 0.1)).toBe(true);
      const Asv = 2 * Math.PI * 8 ** 2 / 4;
      const VsN = 270 * (Asv / 200) * 460;
      expect(close(byLabel('箍筋受剪承载力 Vs'), VsN / 1000, 0.1)).toBe(true);
      for (const l of ['混凝土受剪承载力 Vc', '箍筋受剪承载力 Vs', '斜截面受剪承载力 Vcs', '截面限制值 Vmax']) {
        const v = byLabel(l);
        expect(result.results.find(r => r.label === l)!.unit).toBe('kN');
        expect(v).toBeGreaterThan(50);
        expect(v).toBeLessThan(2000);
      }
    });

    it('Vmax 独立复算：k·βc·fc·b·h0 [N] / 1000 → kN', () => {
      const expected = 0.25 * 1.0 * 14.3 * 250 * 460 / 1000;
      expect(close(byLabel('截面限制值 Vmax'), expected, 0.1)).toBe(true);
    });

    it('配箍率 ρsv 无量纲百分比（~10⁻³ → 显示 %）', () => {
      const Asv = 2 * Math.PI * 8 ** 2 / 4;
      const rho = Asv / (250 * 200);
      expect(close(byLabel('配箍率 ρsv'), rho * 100, 0.01)).toBe(true);
      expect(result.results.find(r => r.label === '配箍率 ρsv')!.unit).toBe('%');
    });
  });

  describe('柱轴力（Nu: N → kN，需 /10³）', () => {
    const input = {
      width: 400, depth: 500, effectiveLength: 3200, reinforcementArea: 2400,
      axialForce: 2200, concreteStrength: 14.3, steelCompressionStrength: 360,
    };
    const result = calculateAxialColumn(input);

    it('Nu = 0.9·φ·(fc·A + fy·As) [N] / 1000 → kN', () => {
      const Nnewton = 0.9 * 1 * (14.3 * 200000 + 360 * 2400);
      expect(close(result.capacity, Nnewton / 1000, 0.1)).toBe(true);
      expect(result.capacity).toBeGreaterThan(1000);
      expect(result.capacity).toBeLessThan(10000);
    });

    it('轴向压力与承载力同以 kN 比较，不发生 10³ 错配', () => {
      // axialForce 2200 kN vs capacity 3351.6 kN —— 若一方被误当 N 会差 10³
      expect(input.axialForce).toBeLessThan(result.capacity);
      expect(result.capacity - input.axialForce).toBeLessThan(2000);
    });
  });

  describe('柱偏心（N·mm → kN·m 需 /10⁶；kN·mm → kN·m 需 /10³）', () => {
    const input: EccentricColumnInput = {
      width: 400, depth: 500, coverToSteelCentroid: 40, reinforcementAreaEachFace: 1500,
      axialForce: 1200, firstOrderMoment: 180, concreteGrade: 'C30', steelGrade: 'HRB400',
    };
    const result = calculateEccentricColumn(input);

    it('设计弯矩 M = M0 + N·ea：kN·mm /1000 → kN·m', () => {
      expect(close(result.additionalEccentricity, Math.max(20, 500 / 30), 0.01)).toBe(true);
      expect(close(result.designMoment, 180 + 1200 * 20 / 1000, 0.01)).toBe(true);
      expect(result.designMoment).toBeGreaterThan(100);
      expect(result.designMoment).toBeLessThan(1000);
    });

    it('截面抗弯承载力 Mu：N·mm /10⁶ → kN·m', () => {
      expect(result.momentCapacity).toBeGreaterThan(100);
      expect(result.momentCapacity).toBeLessThan(10000);
    });
  });

  describe('钢筋面积（mm²/m 换算含 ×1000）', () => {
    const result = calculateRebarArea({ diameter: 20, count: 4, spacing: 200 });

    it('areaPerMetre = singleArea·1000/spacing，单位 mm²/m', () => {
      const single = Math.PI * 20 ** 2 / 4;
      expect(close(result.singleArea, single, 0.01)).toBe(true);
      expect(close(result.areaPerMetre, single * 1000 / 200, 0.01)).toBe(true);
      // 若漏乘 1000 或误乘 1e6，数量级都会错
      expect(result.areaPerMetre).toBeGreaterThan(1000);
      expect(result.areaPerMetre).toBeLessThan(10000);
    });
  });

  describe('钢梁应力（kN·m → N·mm 需 ×10⁶；kN → N 需 ×10³）', () => {
    const result = calculateSteelBeam({
      h: 500, bf: 200, tf: 12, tw: 8, moment: 100, shear: 80,
      bendingStrength: 215, shearStrength: 125, stabilityFactor: 0.9,
    });

    it('弯曲应力 ~70 N/mm²（MPa），而非 70×10⁶ 或 70×10⁻⁶', () => {
      expect(result.bendingStress).toBeGreaterThan(50);
      expect(result.bendingStress).toBeLessThan(100);
      expect(result.shearStress).toBeGreaterThan(10);
      expect(result.shearStress).toBeLessThan(50);
    });
  });
});
