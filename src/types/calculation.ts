/**
 * 统一计算结果数据结构
 * 所有构件计算器（梁、板、柱、墙、基础、楼梯）都返回此结构
 */

import { Evidence, VerificationStatus } from './evidence';

/** 计算步骤 */
export interface CalculationStep {
  /** 步骤名称 */
  name: string;
  /** 步骤描述 */
  description: string;
  /** 公式（LaTeX 格式） */
  formula: string;
  /** 公式中各符号的含义 */
  symbolDefinitions?: { symbol: string; meaning: string; unit: string }[];
  /** 代入数值后的公式 */
  substitutedFormula?: string;
  /** 中间结果 */
  result: number | string;
  /** 结果单位 */
  unit: string;
  /** 关联的规范依据 */
  evidence: Evidence[];
}

/** 验算项 */
export interface CheckItem {
  /** 检查名称 */
  name: string;
  /** 计算值 */
  calculatedValue: number;
  /** 限值 */
  limitValue: number;
  /** 比较方式 */
  comparison: '<=' | '>=' | '==' | 'range';
  /** 范围下限（comparison 为 range 时使用） */
  rangeMin?: number;
  /** 范围上限（comparison 为 range 时使用） */
  rangeMax?: number;
  /** 是否通过 */
  passed: boolean;
  /** 单位 */
  unit: string;
  /** 关联的规范依据 */
  evidence: Evidence[];
}

/** 警告/提示 */
export interface Advisory {
  /** 严重程度 */
  severity: 'info' | 'warning' | 'error';
  /** 代码标识 */
  code: string;
  /** 描述 */
  message: string;
}

/** 统一计算结果 */
export interface CalculationResult {
  /** 计算器类型标识 */
  calculatorType: string;
  /** 计算时间 */
  timestamp: string;
  /** 整体校核状态 */
  overallStatus: VerificationStatus;

  /** 输入参数 */
  inputs: { label: string; value: number | string; unit: string }[];
  /** 材料参数 */
  materials: { label: string; value: number | string; unit: string; evidence?: Evidence[] }[];
  /** 截面/几何参数 */
  geometry: { label: string; value: number | string; unit: string; evidence?: Evidence[] }[];

  /** 计算步骤（完整过程） */
  steps: CalculationStep[];

  /** 主要计算结果 */
  results: { label: string; value: number | string; unit: string; evidence?: Evidence[] }[];

  /** 验算项 */
  checks: CheckItem[];

  /** 最终结论 */
  conclusion: {
    passed: boolean;
    summary: string;
    evidence: Evidence[];
  };

  /** 警告和提示 */
  advisories: Advisory[];

  /** 所有关联的规范依据（汇总） */
  allEvidence: Evidence[];
}

/** 创建一个基础的空计算结果 */
export function createEmptyResult(calculatorType: string): CalculationResult {
  return {
    calculatorType,
    timestamp: new Date().toISOString(),
    overallStatus: 'REVIEW_REQUIRED',
    inputs: [],
    materials: [],
    geometry: [],
    steps: [],
    results: [],
    checks: [],
    conclusion: {
      passed: false,
      summary: '计算未完成',
      evidence: [],
    },
    advisories: [],
    allEvidence: [],
  };
}
