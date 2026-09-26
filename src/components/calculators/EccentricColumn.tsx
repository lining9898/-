import React, { useMemo, useState } from 'react';
import { calculateEccentricColumn, EccentricColumnInput } from '../../core/column/eccentric';
import { eccentricColumnReport } from '../../report/eccentric-column-adapter';
import ResultTabs from '../report/ResultTabs';
import VerificationBadge from '../evidence/VerificationBadge';

const initial: EccentricColumnInput = {
  width: 400,
  depth: 500,
  coverToSteelCentroid: 50,
  reinforcementAreaEachFace: 1600,
  axialForce: 1200,
  firstOrderMoment: 60,
  concreteGrade: 'C30',
  steelGrade: 'HRB400',
};

const number = (value: number, digits = 2) => value.toLocaleString('zh-CN', { maximumFractionDigits: digits });

const EccentricColumn: React.FC = () => {
  const [input, setInput] = useState(initial);
  const calculation = useMemo(() => {
    try {
      const result = calculateEccentricColumn(input);
      return { result, report: eccentricColumnReport(input, result), error: '' };
    } catch (error) {
      return { result: null, report: null, error: error instanceof Error ? error.message : '输入无效' };
    }
  }, [input]);
  const updateNumber = (key: Exclude<keyof EccentricColumnInput, 'concreteGrade' | 'steelGrade'>, value: string) =>
    setInput(previous => ({ ...previous, [key]: Number(value) }));

  return <section className="max-w-6xl mx-auto space-y-5">
    <header>
      <h2 className="text-2xl font-bold text-gray-800">偏心受压柱</h2>
      <p className="text-sm text-gray-500 mt-1">
        矩形截面 · 单轴单曲率 · 对称双层钢筋 · 截面承载力 <VerificationBadge status="REVIEW_REQUIRED" />
      </p>
    </header>
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] gap-6">
      <section aria-label="偏心受压柱参数" className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">参数输入</h3>
        <div className="grid grid-cols-2 gap-3">
          {([
            ['width', '截面宽度 b', 'mm'], ['depth', '截面高度 h', 'mm'],
            ['coverToSteelCentroid', '钢筋合力点距边 a = a′', 'mm'], ['reinforcementAreaEachFace', '每侧纵筋面积 As = A′s', 'mm²'],
            ['axialForce', '轴向压力设计值 N', 'kN'], ['firstOrderMoment', '一阶弯矩设计值 M0', 'kN·m'],
          ] as const).map(([key, label, unit]) => <label key={key} className="block text-xs text-gray-600">
            <span className="block mb-1">{label} ({unit})</span>
            <input type="number" step="any" value={input[key]} onChange={event => updateNumber(key, event.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white" />
          </label>)}
        </div>
        <label className="block text-xs text-gray-600">混凝土强度等级
          <select value={input.concreteGrade} onChange={event => setInput(previous => ({ ...previous, concreteGrade: event.target.value as EccentricColumnInput['concreteGrade'] }))}
            className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm bg-white">
            {['C20', 'C25', 'C30', 'C35', 'C40', 'C45', 'C50'].map(grade => <option key={grade}>{grade}</option>)}
          </select>
        </label>
        <label className="block text-xs text-gray-600">钢筋等级
          <select value={input.steelGrade} onChange={event => setInput(previous => ({ ...previous, steelGrade: event.target.value as EccentricColumnInput['steelGrade'] }))}
            className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm bg-white">
            {['HPB300', 'HRB400', 'HRB500'].map(grade => <option key={grade}>{grade}</option>)}
          </select>
        </label>
        <p className="text-xs text-gray-500">M0 应为未计入附加偏心距的一阶弯矩设计值。本页不进行二阶效应计算。</p>
      </section>
      <section aria-live="polite" className="min-w-0">
        {calculation.error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{calculation.error}</p>}
        {calculation.result && calculation.report && <ResultTabs result={calculation.report}>
          <div className={`border p-4 ${calculation.result.passed ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
            <p className={`font-semibold ${calculation.result.passed ? 'text-amber-900' : 'text-red-700'}`}>
              {calculation.result.passed ? '正截面单项满足（待复核）' : '正截面单项不满足'}
            </p>
            <p className="text-sm text-gray-700 mt-1">控制弯矩 {number(calculation.result.designMoment)} kN·m，截面承载力 {number(calculation.result.momentCapacity)} kN·m。</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div><p className="text-gray-500">附加偏心距 ea</p><p className="font-semibold">{number(calculation.result.additionalEccentricity)} mm</p></div>
            <div><p className="text-gray-500">中性轴深度 x</p><p className="font-semibold">{number(calculation.result.neutralAxisDepth)} mm</p></div>
            <div><p className="text-gray-500">轴力平衡残差</p><p className="font-semibold">{number(Math.abs(calculation.result.forceResidual), 4)} kN</p></div>
            <div><p className="text-gray-500">受压侧钢筋应力</p><p className="font-semibold">{number(calculation.result.topSteelStress)} N/mm²</p></div>
            <div><p className="text-gray-500">受拉侧钢筋应力</p><p className="font-semibold">{number(calculation.result.bottomSteelStress)} N/mm²</p></div>
          </div>
          <p className="text-sm text-amber-900 border-l-4 border-amber-500 bg-amber-50 px-3 py-2">
            未验算二阶效应、双向偏心、最小配筋、箍筋构造、抗震及现行通用规范要求。单项满足不等于完整设计通过。
          </p>
        </ResultTabs>}
      </section>
    </div>
  </section>;
};

export default EccentricColumn;
