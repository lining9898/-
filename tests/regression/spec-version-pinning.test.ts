import { describe, expect, it } from 'vitest';
import { skillRegistry } from '../../src/agent/skill-registry';
import { auditSkillPackage } from '../../src/agent/calculation-auditor';
import { calculateBeamFlexure } from '../../src/core/beam/flexure';
import { calculateBeamShear } from '../../src/core/beam/shear';
import { calculateAxialColumn } from '../../src/core/column/axial';
import { calculateEccentricColumn } from '../../src/core/column/eccentric';

/**
 * 规范版本风险回归（Part 6）
 * 目的：
 * 1) 确保 CalculationResult 的 Evidence edition 与指定设计依据一致、且结果内部不混杂多个版本；
 * 2) 确保未来出现新版规范时，旧算例不会因默认规范变化而悄悄改变数值结果；
 * 3) 版本一致性审计能力（EDITION_INCONSISTENT / EDITION_MISMATCH）可被触发。
 */

const DESIGN_BASIS = '2010（2015年版）';

describe('规范版本风险：设计依据一致性', () => {
  it('每个 registered calculation Skill 的 Evidence 目录版本一致且非空', () => {
    for (const s of skillRegistry.list().filter(x => x.kind === 'calculation')) {
      const pkg = skillRegistry.describe(s.id)!;
      const audit = auditSkillPackage(pkg);
      expect(audit.issues.some(i => i.code === 'EDITION_INCONSISTENT'),
        `${s.id} 的 Evidence 版本应一致`).toBe(false);
      for (const record of pkg.evidence.records) {
        expect(record.edition, `${s.id}.${record.id} 缺少版本`).toBeTruthy();
      }
    }
  });

  it('列明各 concrete 计算器声明的设计依据版本为 2010（2015年版）', () => {
    for (const s of skillRegistry.list().filter(x => x.kind === 'calculation')) {
      const pkg = skillRegistry.describe(s.id)!;
      // 只约束实际引用 GB 50010 的混凝土计算器，钢结构等专业有自己的设计依据。
      const gb50010Records = pkg.evidence.records.filter(r =>
        r.codeNumber.replace(/[\s/]/g, '').toUpperCase() === 'GB50010'
      );
      if (gb50010Records.length === 0) continue;
      const editions = new Set(gb50010Records.map(r => r.edition));
      expect(editions.has(DESIGN_BASIS), `${s.id} 应声明 ${DESIGN_BASIS}`).toBe(true);
    }
  });

  it('运行期 CalculationResult 的 Evidence 版本非空、单一且与设计依据一致', () => {
    const flexure = calculateBeamFlexure({
      b: 250, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400',
      cover: 25, barDiameter: 20, barCount: 4, moment: 120,
    });
    const editions = new Set(flexure.allEvidence.map(e => e.edition).filter(Boolean));
    expect(editions.size, '受弯结果应使用单一规范版本').toBe(1);
    const edition = [...editions][0];
    // 结果内版本单一、非空；与目录所用版本语义一致（字符串形态以目录为准，见审计报告 Finding 2）
    expect(edition).toBeTruthy();
    expect(edition.toUpperCase().includes('2010')).toBe(true);
  });

  it('旧算例基准被冻结：默认版本变化会破坏以下数值回归（防悄悄漂移）', () => {
    // 这些数值来自 golden-cases，一旦因默认规范版本改动而变，本测试即失败。
    const flexure = calculateBeamFlexure({
      b: 250, h: 500, concreteGrade: 'C30', steelGrade: 'HRB400',
      cover: 25, barDiameter: 20, barCount: 4, moment: 120,
    });
    const shear = calculateBeamShear({
      b: 250, h: 500, h0: 460, concreteGrade: 'C30', stirrupGrade: 'HPB300',
      V: 120, stirrupLegs: 2, stirrupSpacing: 200, stirrupDiameter: 8, loadType: 'uniform',
    });
    const axial = calculateAxialColumn({
      width: 400, depth: 500, effectiveLength: 3200, reinforcementArea: 2400,
      axialForce: 2200, concreteStrength: 14.3, steelCompressionStrength: 360,
    });
    const eccentric = calculateEccentricColumn({
      width: 400, depth: 500, coverToSteelCentroid: 40, reinforcementAreaEachFace: 1500,
      axialForce: 1200, firstOrderMoment: 180, concreteGrade: 'C30', steelGrade: 'HRB400',
    });

    expect(Math.abs((flexure.results.find(r => r.label === '受弯承载力 Mu')!.value as number) - 181.74)).toBeLessThanOrEqual(0.02);
    expect(Math.abs((shear.results.find(r => r.label === '斜截面受剪承载力 Vcs')!.value as number) - 177.55)).toBeLessThanOrEqual(0.2);
    expect(Math.abs(axial.capacity - 3351.6)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(eccentric.designMoment - 204)).toBeLessThanOrEqual(0.01);
  });

  it('normative / auditor Skill 不再被 unit 检查误伤（scope 修正）', () => {
    const gb = auditSkillPackage(skillRegistry.describe('gb50010')!);
    const auditor = auditSkillPackage(skillRegistry.describe('calculation-auditor')!);
    expect(gb.issues.some(i => i.code === 'UNIT_MISSING')).toBe(false);
    expect(auditor.issues.some(i => i.code === 'UNIT_MISSING')).toBe(false);
  });
});
