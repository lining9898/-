import React, { useMemo, useState } from 'react';
import { calculateRebarArea, RebarAreaInput } from '../../core/tools/rebar-area';

const initial: RebarAreaInput = { diameter: 20, count: 4, spacing: 150 };
const format = (value: number) => value.toLocaleString('zh-CN', { maximumFractionDigits: 2 });

const RebarArea: React.FC = () => {
  const [input, setInput] = useState(initial);
  const calculation = useMemo(() => {
    try {
      return { result: calculateRebarArea(input), error: '' };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : '输入无效' };
    }
  }, [input]);

  return (
    <section className="max-w-4xl mx-auto space-y-5">
      <header>
        <h2 className="text-2xl font-bold text-gray-800">钢筋公称面积</h2>
        <p className="text-sm text-gray-500 mt-1">按圆形公称截面进行几何换算</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] gap-6">
        <div className="space-y-4">
          {([
            ['diameter', '公称直径 d', 'mm'],
            ['count', '钢筋根数 n', '根'],
            ['spacing', '布置间距 s', 'mm'],
          ] as const).map(([key, label, unit]) => (
            <label key={key} className="block text-sm text-gray-700">
              <span className="block mb-1">{label} ({unit})</span>
              <input type="number" min={key === 'count' ? 1 : undefined} step={key === 'count' ? 1 : 'any'}
                value={input[key]}
                onChange={event => setInput(previous => ({ ...previous, [key]: Number(event.target.value) }))}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-blue-500" />
            </label>
          ))}
        </div>
        <div aria-live="polite">
          {calculation.error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{calculation.error}</p>}
          {calculation.result && <>
            <dl className="divide-y divide-gray-200 border-y border-gray-200">
              <div className="flex items-baseline justify-between gap-3 py-4">
                <dt className="text-sm text-gray-600">单根面积</dt>
                <dd className="font-semibold text-gray-800">{format(calculation.result.singleArea)} mm²</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-4">
                <dt className="text-sm text-gray-600">{input.count} 根合计</dt>
                <dd className="font-semibold text-gray-800">{format(calculation.result.totalArea)} mm²</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-4">
                <dt className="text-sm text-gray-600">按间距折算每米面积</dt>
                <dd className="font-semibold text-gray-800">{format(calculation.result.areaPerMetre)} mm²/m</dd>
              </div>
            </dl>
            <p className="text-sm text-gray-500 mt-4">A = πd²/4；每米面积按 1000/s 折算。仅为几何面积，不包含材料性能、锚固和配筋构造验算。</p>
          </>}
        </div>
      </div>
    </section>
  );
};

export default RebarArea;
