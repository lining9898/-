import { SkillPackage, SkillManifest, SkillEvidenceCatalog } from '../../src/agent/skill-types';
import { buildPackage, createNormativeSkill } from '../../src/normative/factory';

import manifest from './skill.json';
import schema from './schema.json';
import evidence from './evidence.json';
import tests from './tests.json';

const pkg: SkillPackage = buildPackage(
  manifest as SkillManifest,
  schema as SkillPackage['schema'],
  evidence as SkillEvidenceCatalog,
  tests as SkillPackage['tests']
);

/**
 * GB 50007-2011 建筑地基基础设计规范 normative skill。
 * 绑定版本：2011（现行）。
 * 当前无 Calculation Skill 需要其条文 evidence，任何查询均返回 UNVERIFIED + 警告。
 * 只返回规范条文与版本元信息；禁止返回任何工程量、配筋面积、承载力数值。
 */
export const gb50007Skill = createNormativeSkill(pkg, {
  primaryEdition: '2011',
  fallbackCodeName: '建筑地基基础设计规范',
  fallbackCodeNumber: 'GB 50007',
});
