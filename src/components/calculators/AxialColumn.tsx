import React, { useMemo, useState } from 'react';
import { AxialColumnInput, calculateAxialColumn } from '../../core/column/axial';
import { axialColumnReport } from '../../report/analysis-adapters';
import ResultTabs from '../report/ResultTabs';
import VerificationBadge from '../evidence/VerificationBadge';

const initial: AxialColumnInput = {
  width: 400, depth: 500, effectiveLength: 3200, reinforcementArea: 2400,
  axialForce: 2200, concreteStrength: 14.3, steelCompressionStrength: 360,
};

const fields: { key: keyof AxialColumnInput; label: string; unit: string }[] = [
  { key: 'width', label: '截面宽度', unit: 'mm' },
  { key: 'depth', label: '截面高度', unit: 'mm' },
  { key: 'effectiveLength', label: '计算长度 l₀', unit: 'mm' },
  { key: 'reinforcementArea', label: '全部纵筋面积 A′s', unit: 'mm²' },
  { key: 'axialForce', label: '轴向压力设计值 N', unit: 'kN' },
  { key: 'concreteStrength', label: '混凝土轴心抗压强度设计值 fc', unit: 'N/mm²' },
  { key: 'steelCompressionStrength', label: '钢筋抗压强度设计值 f′y', unit: 'N/mm²' },
];

const format = (value: number, digits = 2) =>
  value.toLocaleString('zh-CN', { maximumFractionDigits: digits });

const AxialColumn: React.FC = () => {
  const [input, setInput] = useState(initial);
  const calculation = useMemo(() => {
    try {
      return { result: calculateAxialColumn(input), error: '' };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : '输入无效' };
    }
  }, [input]);
  const { result, error } = calculation;
  const report = result ? axialColumnReport(input, result) : null;

  return <section className="max-w-6xl mx-auto space-y-5">
    <header>
      <h2 className="text-2xl font-bold text-gray-800">轴心受压柱</h2>
      <p className="text-sm text-gray-500 mt-1">矩形截面箍筋柱 · GB 50010-2010（2015 年版）6.2.15 <VerificationBadge status="REVIEW_REQUIRED" /></p>
    </header>
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] gap-6">
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">参数输入</h3>
        {fields.map(field => <label key={field.key} className="block text-xs text-gray-600">
          <span className="block mb-1">{field.label} ({field.unit})</span>
          <input type="number" step="any" value={input[field.key]}
            onChange={event => setInput(previous => ({ ...previous, [field.key]: Number(event.target.value) }))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
        </label>)}
      </div>
      <div aria-live="polite" className="space-y-5">
        {error && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 border border-red-200">{error}</p>}
        {result && report && <ResultTabs result={report}>
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">截面与稳定系数</h3>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div><dt className="text-gray-500">全截面 A</dt><dd className="font-semibold">{format(result.grossArea, 0)} mm²</dd></div>
              <div><dt className="text-gray-500">纵筋率</dt><dd className="font-semibold">{format(result.reinforcementRatio * 100)}%</dd></div>
              <div><dt className="text-gray-500">l₀ / 短边</dt><dd className="font-semibold">{format(result.slendernessRatio)}</dd></div>
              <div><dt className="text-gray-500">保守查表档位</dt><dd className="font-semibold">≤ {result.tableRatio}</dd></div>
              <div><dt className="text-gray-500">稳定系数 φ</dt><dd className="font-semibold">{format(result.stabilityFactor)}</dd></div>
              <div><dt className="text-gray-500">混凝土计算面积</dt><dd className="font-semibold">{format(result.concreteArea, 0)} mm²</dd></div>
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">正截面轴压承载力单项验算</h3>
            <p className="text-sm text-gray-700">Nᵤ = 0.9φ(fc·A{result.reinforcementRatio > 0.03 ? '净' : ''} + f′y·A′s)</p>
            <p className="text-xs text-gray-500 mt-1">纵筋率大于 3% 时，A净 = A − A′s；表内两档之间向较大长细比档取值。</p>
            <p className="text-sm font-semibold mt-3">{format(input.axialForce)} / {format(result.capacity)} kN
              <span className={result.passed ? 'text-green-700 ml-3' : 'text-red-700 ml-3'}>
                {result.passed ? '单项满足' : '不满足'}
              </span>
            </p>
          </div>
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-3">
            示例输入不代表工程选材。计算长度、fc、f′y 须按实际项目确定；本页未验算最小偏心、弯矩、箍筋构造、配筋限值、抗震及现行 2024 修订条文。单项满足不是完整设计通过结论。
          </p>
          <p className="text-xs text-gray-500">参考文件：仓库 references/codes/GB50010-2010_2015_.pdf；条文与页码仍待逐项复核。</p>
        </ResultTabs>}
      </div>
    </div>
  </section>;
};

export default AxialColumn;
