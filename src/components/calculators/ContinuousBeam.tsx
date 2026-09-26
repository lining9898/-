import React, { useMemo, useState } from 'react';
import { calculateContinuousBeam, ContinuousSpanInput, DiagramPoint } from '../../core/beam/continuous';

const initialSpans: ContinuousSpanInput[] = [
  { length: 6, load: 10 }, { length: 6, load: 10 },
];
const format = (value: number, digits = 2) => (Math.abs(value) < 1e-8 ? 0 : value)
  .toLocaleString('zh-CN', { maximumFractionDigits: digits });

interface DiagramProps {
  title: string;
  unit: string;
  keyName: 'moment' | 'shear';
  color: string;
  spans: DiagramPoint[][];
  supports: number[];
}

const Diagram: React.FC<DiagramProps> = ({ title, unit, keyName, color, spans, supports }) => {
  const values = spans.flat().map(point => point[keyName]);
  const bound = Math.max(1, ...values.map(Math.abs));
  const totalLength = supports[supports.length - 1];
  const x = (position: number) => 52 + position / totalLength * 684;
  const y = (value: number) => 85 - value / bound * 62;
  const path = (points: DiagramPoint[]) => points.map((point, index) =>
    `${index === 0 ? 'M' : 'L'}${x(point.x).toFixed(2)},${y(point[keyName]).toFixed(2)}`).join(' ');
  return <section className="space-y-2">
    <h4 className="text-sm font-semibold text-gray-700">{title} <span className="font-normal text-gray-500">({unit})</span></h4>
    <div className="overflow-x-auto border-y border-gray-200 bg-white">
      <svg viewBox="0 0 760 178" className="block min-w-[640px] w-full" role="img" aria-label={`${title}，正值向上`}>
        <title>{title}</title>
        <line x1="52" y1="85" x2="736" y2="85" stroke="#94a3b8" strokeWidth="1" />
        <text x="7" y="24" fill="#475569" fontSize="11">+{format(bound)}</text>
        <text x="7" y="89" fill="#475569" fontSize="11">0</text>
        <text x="7" y="151" fill="#475569" fontSize="11">-{format(bound)}</text>
        {supports.map((position, index) => <g key={index}>
          <line x1={x(position)} y1="18" x2={x(position)} y2="148" stroke="#cbd5e1" strokeDasharray="3 4" />
          <text x={x(position)} y="169" textAnchor="middle" fill="#475569" fontSize="11">{format(position)} m</text>
        </g>)}
        {spans.map((points, index) => <path key={index} d={path(points)} fill="none"
          stroke={color} strokeWidth="2.5" strokeLinejoin="round" />)}
      </svg>
    </div>
  </section>;
};

const ContinuousBeam: React.FC = () => {
  const [spans, setSpans] = useState(initialSpans);
  const calculation = useMemo(() => {
    try {
      return { result: calculateContinuousBeam(spans), error: '' };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : '输入无效' };
    }
  }, [spans]);
  const { result, error } = calculation;
  const supportPositions = [0];
  for (const span of spans) supportPositions.push(supportPositions[supportPositions.length - 1] + span.length);

  const changeCount = (count: number) => setSpans(previous => Array.from({ length: count }, (_, index) =>
    previous[index] ?? { length: 6, load: 10 }));
  const changeSpan = (index: number, key: keyof ContinuousSpanInput, value: number) => setSpans(previous =>
    previous.map((span, current) => current === index ? { ...span, [key]: value } : span));

  return <section className="max-w-7xl mx-auto space-y-5">
    <header>
      <h2 className="text-2xl font-bold text-gray-800">连续梁内力计算</h2>
      <p className="text-sm text-gray-500 mt-1">2–4 跨 · 等刚度 EI · 支座不沉降 · 各跨均布荷载</p>
    </header>
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] gap-6">
      <section aria-label="连续梁参数" className="space-y-4">
        <fieldset>
          <legend className="text-sm font-semibold text-gray-700 mb-2">跨数</legend>
          <div className="flex overflow-hidden rounded border border-gray-300">
            {[2, 3, 4].map(count => <label key={count} className={`flex-1 text-center py-2 cursor-pointer text-sm ${spans.length === count ? 'bg-blue-700 text-white' : 'bg-white text-gray-700'}`}>
              <input type="radio" name="span-count" value={count} checked={spans.length === count}
                onChange={() => changeCount(count)} className="sr-only" />{count} 跨
            </label>)}
          </div>
        </fieldset>
        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {spans.map((span, index) => <fieldset key={index} className="py-3">
            <legend className="text-sm font-semibold text-gray-700">第 {index + 1} 跨</legend>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <label className="text-xs text-gray-600"><span className="block mb-1">跨度 L (m)</span>
                <input type="number" min="0.01" max="100" step="any" value={span.length}
                  onChange={event => changeSpan(index, 'length', Number(event.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white" />
              </label>
              <label className="text-xs text-gray-600"><span className="block mb-1">均布荷载 q (kN/m)</span>
                <input type="number" min="0" max="10000" step="any" value={span.load}
                  onChange={event => changeSpan(index, 'load', Number(event.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white" />
              </label>
            </div>
          </fieldset>)}
        </div>
        <p className="text-xs text-gray-500">荷载向下为正；每跨为完整均布荷载。未计自重、集中荷载、支座沉降和刚度变化。</p>
      </section>
      <section aria-live="polite" className="min-w-0 space-y-5">
        {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {result && <>
          <div className="border-b border-gray-200 pb-2"><h3 className="text-sm font-bold text-gray-700">分析结果</h3></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-3">
            {result.reactions.map((reaction, index) => <div key={index} className="border-b border-gray-200 pb-2">
              <p className="text-xs text-gray-500">支座 {index + 1} 竖向反力</p>
              <p className="font-semibold text-gray-800">{format(reaction)} <span className="text-xs font-normal text-gray-500">kN</span></p>
            </div>)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-sm text-left border-collapse">
              <thead><tr className="border-b border-gray-300 text-gray-500">
                <th className="py-2 pr-3 font-medium">跨</th><th className="py-2 pr-3 font-medium">左端弯矩</th>
                <th className="py-2 pr-3 font-medium">跨内最大弯矩</th><th className="py-2 pr-3 font-medium">位置</th>
                <th className="py-2 font-medium">右端弯矩</th>
              </tr></thead>
              <tbody>{result.spans.map((span, index) => <tr key={index} className="border-b border-gray-200 text-gray-800">
                <th className="py-2 pr-3 font-medium">{index + 1}</th>
                <td className="py-2 pr-3">{format(result.supportMoments[index])}</td>
                <td className="py-2 pr-3 font-semibold">{format(span.maximumMoment)}</td>
                <td className="py-2 pr-3">{format(span.maximumMomentAt)} m</td>
                <td className="py-2">{format(result.supportMoments[index + 1])}</td>
              </tr>)}</tbody>
            </table>
            <p className="mt-1 text-xs text-gray-500">弯矩单位 kN·m；正弯矩为下挠，负弯矩为支座上拱。</p>
          </div>
          <Diagram title="弯矩图" unit="kN·m" keyName="moment" color="#1d4ed8"
            spans={result.spans.map(span => span.diagram)} supports={supportPositions} />
          <Diagram title="剪力图" unit="kN" keyName="shear" color="#b45309"
            spans={result.spans.map(span => span.diagram)} supports={supportPositions} />
          <p className="text-xs text-amber-900 border-l-4 border-amber-500 bg-amber-50 px-3 py-2">
            线弹性内力分析，未进行荷载组合、承载力、裂缝、挠度或稳定验算；结果不可直接作为施工设计结论。
          </p>
          {result.attribution?.url && <a href={result.attribution.url} target="_blank" rel="noreferrer"
            className="inline-block text-xs text-blue-700 underline">{result.attribution.text}</a>}
        </>}
      </section>
    </div>
  </section>;
};

export default ContinuousBeam;
