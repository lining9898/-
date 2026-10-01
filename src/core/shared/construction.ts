/**
 * 构造尺寸合规规则（GB 55008-2021 §4.4.4）
 *
 * 统一入口：sectionDimensionCompliance()
 * 不满足 → BLOCKED，错误码 SECTION_DIMENSION_BELOW_MINIMUM
 * 适用性不明 → applicable='unknown'，不阻断但提示需人工确认
 */

export type Applicability = 'yes' | 'no' | 'unknown';

export interface SectionDimensionInput {
  componentType: 'frameBeam' | 'frameRectColumn' | 'frameCircColumn' | 'shearWall' | 'solidSlab' | 'hollowSlab' | 'compositeSlab' | 'unknown';
  dimension: number;       // 截面尺寸 (mm)
  buildingType?: 'high-rise' | 'multi-story';
  layerType?: 'precast' | 'cast-in-place'; // 叠合板用
}

export interface SectionDimensionResult {
  passed: boolean;
  applicable: Applicability;
  code?: string;
  requiredMinimum?: number;
  actualValue?: number;
  unit: string;
  rule: string;
  evidence: string;
  message: string;
}

export function sectionDimensionCompliance(input: SectionDimensionInput): SectionDimensionResult {
  const base = {
    unit: 'mm' as const,
    rule: 'GB 55008-2021 §4.4.4',
    evidence: 'GB 55008-2021 §4.4.4 (p.12 printed)',
  };

  // 适用性不明：不阻断，提示人工确认
  if (input.componentType === 'unknown' || !input.componentType) {
    return {
      ...base,
      passed: true,
      applicable: 'unknown',
      message: '构件类型未识别，无法判定 GB 55008-2021 §4.4.4 最小截面要求；请人工确认。',
    };
  }

  switch (input.componentType) {
    case 'frameBeam': {
      const required = 200;
      if (input.dimension < required) {
        return {
          ...base,
          passed: false,
          applicable: 'yes',
          code: 'SECTION_DIMENSION_BELOW_MINIMUM',
          requiredMinimum: required,
          actualValue: input.dimension,
          message: `矩形截面框架梁宽度 ${input.dimension}mm 小于 GB 55008-2021 §4.4.4 最低要求 ${required}mm。`,
        };
      }
      return { ...base, passed: true, applicable: 'yes', requiredMinimum: required, actualValue: input.dimension, message: '框架梁宽度满足 §4.4.4 最低要求。' };
    }
    case 'frameRectColumn': {
      const required = 300;
      if (input.dimension < required) {
        return {
          ...base,
          passed: false,
          applicable: 'yes',
          code: 'SECTION_DIMENSION_BELOW_MINIMUM',
          requiredMinimum: required,
          actualValue: input.dimension,
          message: `矩形截面框架柱边长 ${input.dimension}mm 小于 GB 55008-2021 §4.4.4 最低要求 ${required}mm。`,
        };
      }
      return { ...base, passed: true, applicable: 'yes', requiredMinimum: required, actualValue: input.dimension, message: '矩形框架柱边长满足 §4.4.4 最低要求。' };
    }
    case 'frameCircColumn': {
      const required = 350;
      if (input.dimension < required) {
        return {
          ...base,
          passed: false,
          applicable: 'yes',
          code: 'SECTION_DIMENSION_BELOW_MINIMUM',
          requiredMinimum: required,
          actualValue: input.dimension,
          message: `圆形截面框架柱直径 ${input.dimension}mm 小于 GB 55008-2021 §4.4.4 最低要求 ${required}mm。`,
        };
      }
      return { ...base, passed: true, applicable: 'yes', requiredMinimum: required, actualValue: input.dimension, message: '圆形框架柱直径满足 §4.4.4 最低要求。' };
    }
    case 'solidSlab': {
      const required = 80;
      if (input.dimension < required) {
        return {
          ...base,
          passed: false,
          applicable: 'yes',
          code: 'SECTION_DIMENSION_BELOW_MINIMUM',
          requiredMinimum: required,
          actualValue: input.dimension,
          message: `现浇实心板厚度 ${input.dimension}mm 小于 GB 55008-2021 §4.4.4 最低要求 ${required}mm。`,
        };
      }
      return { ...base, passed: true, applicable: 'yes', requiredMinimum: required, actualValue: input.dimension, message: '现浇实心板厚度满足 §4.4.4 最低要求。' };
    }
    default:
      return {
        ...base,
        passed: true,
        applicable: 'unknown',
        message: '该构件类型暂未建立 §4.4.4 最小截面规则；请人工确认。',
      };
  }
}
