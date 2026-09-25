import React, { useMemo, useState } from 'react';
import { calculateSteelBeam, SteelBeamInput } from '../../core/steel/beam';

const SOURCE = 'https://jncc.jinan.gov.cn/attach/0/c24799cca3194d3ba1d87c72caa1c3ef.pdf';

const fields: { key: keyof SteelBeamInput; label: string; unit: string; step?: string }[] = [
  { key: 'h', label: '截面高度 h', unit: 'mm' },
  { key: 'bf', label: '翼缘宽度 bf', unit: 'mm' },
  { key: 'tf', label: '翼缘厚度 tf', unit: 'mm' },
  { key: 'tw', label: '腹板厚度 tw', unit: 'mm' },
  { key: 'moment', label: '弯矩设计值 M', unit: 'kN·m' },
  { key: 'shear', label: '剪力设计值 V', unit: 'kN' },
  { key: 'bendingStrength', label: '抗弯强度设计值 f', unit: 'N/mm²' },
  { key: 'shearStrength', label: '抗剪强度设计值 fv', unit: 'N/mm²' },
  { key: 'stabilityFactor', label: '整体稳定系数 φb', unit: '', step: '0.01' },
];

const initialInput: SteelBeamInput = {
  h: 400, bf: 200, tf: 12, tw: 8,
  moment: 120, shear: 80,
  bendingStrength: 215, shearStrength: 125, stabilityFactor: 0.8,
};

const number = (value: number, digits = 2) => value.toLocaleString('zh-CN', { maximumFractionDigits: digits });

const SteelBeam: React.FC = () => {
  const [input, setInput] = useState(initialInput);
  const calculation = useMemo(() => {
    try {
      return { result: calculateSteelBeam(input), error: '' };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : '输入无效' };
    }
  }, [input]);
  const { result, error } = calculation;

  const checks = result ? [
    { name: '受弯强度', clause: '6.1.1', formula: 'σ = M / W ≤ f（弹性，γx = 1）', value: result.bendingStress, limit: input.bendingStrength, passed: result.bendingPassed },
    { name: '受剪强度', clause: '6.1.3', formula: 'τ = VS / (I · tw) ≤ fv', value: result.shearStress, limit: input.shearStrength, passed: result.shearPassed },
    { name: '整体稳定', clause: '6.2.2', formula: 'σb = M / (φb · W) ≤ f', value: result.stabilityStress, limit: input.bendingStrength, passed: result.stabilityPassed },
  ] : [];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <header>
        <h2 className="text-2xl font-bold text-gray-800">钢梁受弯、受剪与整体稳定</h2>
        <p className="text-sm text-gray-500 mt-1">GB 50017-2017 · 对称工字形截面 · 待人工复核</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] gap-6">
        <section className="space-y-3" aria-label="钢梁参数">
          <h3 className="text-sm font-bold text-gray-700">参数输入</h3>
          {fields.map(field => (
            <label key={field.key} className="block text-xs text-gray-600">
              <span className="block mb-1">{field.label} {field.unit && `(${field.unit})`}</span>
              <input
                type="number"
                step={field.step || 'any'}
                value={input[field.key]}
                onChange={event => setInput(previous => ({ ...previous, [field.key]: Number(event.target.value) }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </label>
          ))}
        </section>
        <section className="space-y-5" aria-live="polite">
          {error && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 border border-red-200">{error}</p>}
          {result && <>
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">截面特性</h3>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><dt className="text-gray-500">面积 A</dt><dd className="font-semibold">{number(result.area)} mm²</dd></div>
                <div><dt className="text-gray-500">惯性矩 I</dt><dd className="font-semibold">{number(result.inertia, 0)} mm⁴</dd></div>
                <div><dt className="text-gray-500">截面模量 W</dt><dd className="font-semibold">{number(result.sectionModulus, 0)} mm³</dd></div>
                <div><dt className="text-gray-500">半截面面积矩 S</dt><dd className="font-semibold">{number(result.firstMoment, 0)} mm³</dd></div>
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3">单项验算</h3>
              <div className="divide-y divide-gray-200 border-y border-gray-200">
                {checks.map(check => <div key={check.name} className="py-3 flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{check.name} <span className="text-xs text-gray-500">{check.clause}</span></p>
                    <p className="text-xs text-gray-500 mt-1">{check.formula}</p>
                    <p className="text-xs font-mono mt-1">{number(check.value)} ≤ {number(check.limit)} N/mm²</p>
                  </div>
                  <strong className={check.passed ? 'text-green-700' : 'text-red-700'}>{check.passed ? '单项满足' : '不满足'}</strong>
                </div>)}
              </div>
            </div>
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-3">
              示例输入不代表项目材料。f、fv 应按材料、厚度等条件另行确定；φb 应按附录 C 和实际侧向支承条件另行确定。此处未验算截面宽厚比、局部稳定、组合应力、挠度、疲劳、连接及抗震要求；三项单独满足不能作为完整设计通过结论。
            </p>
            <a href={SOURCE} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">
              查看规范扫描件（济南市住建部门）
            </a>
          </>}
        </section>
      </div>
    </div>
  );
};

export default SteelBeam;
