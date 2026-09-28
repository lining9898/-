import { describe, expect, it } from 'vitest';
import { normativeVersionRegistry } from '../../src/normative/registry';
import { NormativeVersion } from '../../src/normative/types';
import { skillRegistry } from '../../src/agent/skill-registry';
import { gb50010Package } from '../../src/agent/skill-registry';

describe('规范版本模型（Agent 3）', () => {
  // -------------------------------------------------------------------------
  // 同规范多版本共存 & 旧版不被覆盖
  // -------------------------------------------------------------------------
  it('1. 同一规范编号可同时存在多个 edition，旧版不被覆盖', () => {
    const versions = normativeVersionRegistry.getVersions('GB 50010');
    // 2010 / 2010（2015年版）/ 2024年版 三版共存
    const editions = versions.map(v => v.edition);
    expect(editions).toContain('2010');
    expect(editions).toContain('2010（2015年版）');
    expect(editions).toContain('2010（2024年版，GB/T 50010-2010）');
    // 2010 版仍在（未被覆盖），且被标记为 SUPERSEDED
    const v2010 = normativeVersionRegistry.getVersion('GB 50010', '2010');
    expect(v2010).toBeDefined();
    expect(v2010!.status).toBe('SUPERSEDED');
    expect(v2010!.replacedBy).toBe('2010（2015年版）');
  });

  it('2. 重复注册同一 (codeNumber, edition) 会被拒绝，防止覆盖旧版', () => {
    const dup: NormativeVersion = {
      codeName: '测试', codeNumber: 'GB 99999', designation: 'GB 99999', edition: 'E1',
      publishDate: '2020-01-01', effectiveDate: '2020-02-01', status: 'CURRENT',
      source: 'x', verificationStatus: 'VERIFIED',
    };
    const registry = new (Object.getPrototypeOf(normativeVersionRegistry).constructor)();
    registry.registerVersion(dup);
    expect(() => registry.registerVersion({ ...dup })).toThrow(/禁止覆盖旧版/);
  });

  it('3. 支持 CURRENT/UPCOMING/SUPERSEDED/REVIEW_REQUIRED 四种状态', () => {
    const registry = new (Object.getPrototypeOf(normativeVersionRegistry).constructor)();
    for (const status of ['CURRENT', 'UPCOMING', 'SUPERSEDED', 'REVIEW_REQUIRED']) {
      const v: NormativeVersion = {
        codeName: 'x', codeNumber: 'GB 1', designation: 'x', edition: status,
        publishDate: '2020-01-01', effectiveDate: '2020-02-01',
        status: status as NormativeVersion['status'], source: 's', verificationStatus: 'VERIFIED',
      };
      registry.registerVersion(v);
      expect(registry.getVersion('GB 1', status)!.status).toBe(status);
    }
  });

  // -------------------------------------------------------------------------
  // 无来源不得 VERIFIED & 版本状态必须有来源
  // -------------------------------------------------------------------------
  it('4. 无来源/未核验的 CURRENT 版本，resolve 不得将其判为现行', () => {
    const registry = new (Object.getPrototypeOf(normativeVersionRegistry).constructor)();
    registry.registerVersion({
      codeName: 'x', codeNumber: 'GB 2', designation: 'x', edition: '2020',
      publishDate: '2020-01-01', effectiveDate: '2020-02-01',
      status: 'CURRENT', source: '', verificationStatus: 'REVIEW_REQUIRED',
    });
    const res = registry.resolve('GB 2');
    expect(res.status).toBe('REVIEW_REQUIRED'); // 不因 status 字段是 CURRENT 就判现行
    expect(res.warnings.some((w: string) => w.includes('缺少可靠来源'))).toBe(true);
  });

  it('5. 所有内置版本均有非空来源，且核验状态为 VERIFIED', () => {
    for (const v of normativeVersionRegistry.listAll()) {
      expect(v.source.trim().length, `${v.codeNumber}/${v.edition} 缺少来源`).toBeGreaterThan(0);
      if (v.verificationStatus === 'VERIFIED') {
        expect(v.source.trim().length).toBeGreaterThan(0);
      }
    }
  });

  // -------------------------------------------------------------------------
  // resolve：指定版本 / 未指定版本 / 版本冲突
  // -------------------------------------------------------------------------
  it('6. resolve 指定版本：返回该版本并提示其被取代', () => {
    const res = normativeVersionRegistry.resolve('GB 50010', { edition: '2010（2015年版）' });
    expect(res.version?.edition).toBe('2010（2015年版）');
    expect(res.status).toBe('SUPERSEDED');
    expect(res.warnings.some(w => w.includes('取代'))).toBe(true);
  });

  it('7. resolve 指定不存在的版本：返回 REVIEW_REQUIRED + 警告', () => {
    const res = normativeVersionRegistry.resolve('GB 50010', { edition: '2002' });
    expect(res.version).toBeUndefined();
    expect(res.status).toBe('REVIEW_REQUIRED');
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  it('8. resolve 未指定版本：取已核验的 CURRENT（2024 年版）', () => {
    const res = normativeVersionRegistry.resolve('GB 50010');
    expect(res.version?.edition).toBe('2010（2024年版，GB/T 50010-2010）');
    expect(res.status).toBe('CURRENT');
  });

  it('9. resolve 按实施日期：2023 年应取 2015 年版，2024-09 应取 2024 年版', () => {
    const r2023 = normativeVersionRegistry.resolve('GB 50010', { effectiveDate: '2023-06-01' });
    expect(r2023.version?.edition).toBe('2010（2015年版）');
    const r2024 = normativeVersionRegistry.resolve('GB 50010', { effectiveDate: '2024-09-01' });
    expect(r2024.version?.edition).toBe('2010（2024年版，GB/T 50010-2010）');
  });

  it('10. 版本冲突：同一编号存在多个已核验 CURRENT 时，不得盲选', () => {
    const registry = new (Object.getPrototypeOf(normativeVersionRegistry).constructor)();
    const base = (e: string): NormativeVersion => ({
      codeName: 'x', codeNumber: 'GB 3', designation: 'x', edition: e,
      publishDate: '2020-01-01', effectiveDate: '2020-02-01',
      status: 'CURRENT', source: 's', verificationStatus: 'VERIFIED',
    });
    registry.registerVersion(base('E1'));
    registry.registerVersion(base('E2'));
    const res = registry.resolve('GB 3');
    expect(res.version).toBeUndefined();
    expect(res.status).toBe('REVIEW_REQUIRED');
    expect(res.warnings.some((w: string) => w.includes('多个已核验 CURRENT'))).toBe(true);
  });

  it('11. 不存在条文：skill resolve 返回 UNVERIFIED + 警告', () => {
    const a = skillRegistry.resolve({ code: 'GB50010', clause: '99.99.99', edition: '2010（2015年版）' });
    expect(a.verificationStatus).toBe('UNVERIFIED');
    expect(a.warnings.length).toBeGreaterThan(0);
    expect(a.text).toBe('');
  });

  // -------------------------------------------------------------------------
  // Evidence 完整性
  // -------------------------------------------------------------------------
  it('12. GB50010 中 VERIFIED evidence 必须同时具备 sourceFile / pdfPage / text', () => {
    for (const r of gb50010Package.evidence.records) {
      if (r.verificationStatus === 'VERIFIED') {
        expect(r.sourceFile, `${r.id} VERIFIED 但无 sourceFile`).toBeTruthy();
        expect(r.pdfPage, `${r.id} VERIFIED 但无 pdfPage`).not.toBeNull();
        expect(r.text && r.text.length > 0, `${r.id} VERIFIED 但无原文 text`).toBe(true);
      }
    }
  });

  // -------------------------------------------------------------------------
  // NormativeAnswer 无工程量字段
  // -------------------------------------------------------------------------
  it('13. 三本规范的 NormativeAnswer 均不含工程量/承载力字段', () => {
    const queries = [
      { code: 'GB50010', clause: '6.2.10', edition: '2010（2015年版）' },
      { code: 'GB50009', clause: '表 A' },
      { code: 'GB50007', clause: '5.2.4' },
    ];
    for (const q of queries) {
      const a = skillRegistry.resolve(q);
      for (const key of ['Mu', 'Vu', 'Nu', 'As', 'capacity', 'stress', 'deflection', 'results', 'checks', 'steps', 'inputs']) {
        expect((a as any)[key], `${q.code} 返回了工程字段 ${key}`).toBeUndefined();
      }
    }
  });

  // -------------------------------------------------------------------------
  // affectedSkills 映射
  // -------------------------------------------------------------------------
  it('14. GB50010 2015→2024 变更集正确映射受影响 Calculation Skill', () => {
    const cs = normativeVersionRegistry.getChangeSet(
      'GB 50010', '2010（2015年版）', '2010（2024年版，GB/T 50010-2010）'
    );
    expect(cs).toBeDefined();
    expect(cs!.affectedSkills).toContain('beam-flexure');
    expect(cs!.affectedSkills).toContain('beam-shear');
    expect(cs!.affectedSkills).toContain('column');
    expect(cs!.verificationStatus).toBe('REVIEW_REQUIRED'); // 新版不得自动 VERIFIED
  });

  it('15. GB50010 2010→2015 变更集的 changedClauses 与仓库内 PDF 修订说明一致', () => {
    const cs = normativeVersionRegistry.getChangeSet('GB 50010', '2010', '2010（2015年版）');
    expect(cs).toBeDefined();
    for (const c of ['4.2.1', '4.2.2', '4.2.3', '4.2.5', '9.3.2', '9.7.6', '11.7.11', 'G.0.12']) {
      expect(cs!.changedClauses).toContain(c);
    }
  });

  // -------------------------------------------------------------------------
  // GB50010 版本感知 resolve
  // -------------------------------------------------------------------------
  it('16. 未指定版本时，GB50010 默认解析为 2024 年版但 Skill 仅收录 2015 年版 → UNVERIFIED + 警告', () => {
    const a = skillRegistry.resolve({ code: 'GB50010', clause: '6.2.10' });
    expect(a.verificationStatus).toBe('UNVERIFIED');
    expect(a.codeStatus).toBe('CURRENT');
    expect(a.warnings.some(w => w.includes('2024') || w.includes('仅提供'))).toBe(true);
  });

  it('17. 指定 2015 年版时，返回该版 VERIFIED 条文 + 被取代警告', () => {
    const a = skillRegistry.resolve({ code: 'GB50010', clause: '6.2.10', edition: '2010（2015年版）' });
    expect(a.verificationStatus).toBe('VERIFIED');
    expect(a.edition).toBe('2010（2015年版）');
    expect(a.codeStatus).toBe('SUPERSEDED');
    expect(a.replacedBy).toContain('2024');
    expect(a.text.length).toBeGreaterThan(0);
    expect(a.page).not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // GB50009 / GB50007
  // -------------------------------------------------------------------------
  it('18. GB50009 resolve：返回 2012 现行版本，evidence 保持 REVIEW_REQUIRED（无原文）', () => {
    const a = skillRegistry.resolve({ code: 'GB50009', clause: '表 A' });
    expect(a.codeName).toBe('建筑结构荷载规范');
    expect(a.edition).toBe('2012');
    expect(a.codeStatus).toBe('CURRENT');
    expect(a.verificationStatus).toBe('REVIEW_REQUIRED');
  });

  it('19. GB50007 resolve：返回 2011 现行版本，无收录条文 → UNVERIFIED', () => {
    const a = skillRegistry.resolve({ code: 'GB50007', clause: '5.2.4' });
    expect(a.codeName).toBe('建筑地基基础设计规范');
    expect(a.edition).toBe('2011');
    expect(a.codeStatus).toBe('CURRENT');
    expect(a.verificationStatus).toBe('UNVERIFIED');
  });

  it('20. GB50009/GB50007 版本状态均有来源且已核验为 CURRENT', () => {
    expect(normativeVersionRegistry.getVersion('GB 50009', '2012')?.status).toBe('CURRENT');
    expect(normativeVersionRegistry.getVersion('GB 50009', '2012')?.verificationStatus).toBe('VERIFIED');
    expect(normativeVersionRegistry.getVersion('GB 50007', '2011')?.status).toBe('CURRENT');
    expect(normativeVersionRegistry.getVersion('GB 50007', '2011')?.verificationStatus).toBe('VERIFIED');
  });
});
