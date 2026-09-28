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
 * GB 50009-2012 建筑结构荷载规范 normative skill。
 * 绑定版本：2012（现行）。
 * 只返回规范条文与版本元信息；禁止返回任何工程量、配筋面积、承载力数值。
 */
export const gb50009Skill = createNormativeSkill(pkg, {
  primaryEdition: '2012',
  fallbackCodeName: '建筑结构荷载规范',
  fallbackCodeNumber: 'GB 50009',
});
