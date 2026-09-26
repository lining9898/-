import React, { useMemo, useState } from 'react';
import { calculateSectionProperties, SectionInput, SectionShape } from '../../core/section/properties';

const initial: SectionInput = { shape: 'rectangle', b: 200, h: 500, bf: 600, hf: 100, d: 300 };
const shapes: { value: SectionShape; label: string }[] = [
  { value: 'rectangle', label: '矩形' },
  { value: 'circle', label: '圆形' },
  { value: 't', label: 'T 形' },
];

const format = (value: number) => value.toLocaleString('zh-CN', { maximumFractionDigits: 2 });

const SectionProperties: React.FC = () => {
  const [input, setInput] = useState(initial);
  const calculation = useMemo(() => {
    try {
      return { result: calculateSectionProperties(input), error: '' };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : '截面尺寸无效' };
    }
  }, [input]);
  const { result, error } = calculation;
  const fields: { key: 'b' | 'h' | 'bf' | 'hf' | 'd'; label: string }[] = input.shape === 'circle'
    ? [{ key: 'd', label: '直径 d' }]
    : input.shape === 'rectangle'
      ? [{ key: 'b', label: '宽度 b' }, { key: 'h', label: '高度 h' }]
      : [
        { key: 'b', label: '腹板宽度 b' }, { key: 'h', label: '总高度 h' },
        { key: 'bf', label: '翼缘宽度 bf' }, { key: 'hf', label: '翼缘厚度 hf' },
      ];
  const metrics = result ? [
    ['截面面积 A', result.area, 'mm²'],
    ['形心距底边 ȳ', result.centroidFromBottom, 'mm'],
    ['水平轴惯性矩 Ix', result.ix, 'mm⁴'],
    ['竖直轴惯性矩 Iy', result.iy, 'mm⁴'],
    ['上缘截面模量 Wx,top', result.wxTop, 'mm³'],
    ['下缘截面模量 Wx,bottom', result.wxBottom, 'mm³'],
    ['侧缘截面模量 Wy', result.wy, 'mm³'],
    ['水平轴回转半径 rx', result.rx, 'mm'],
    ['竖直轴回转半径 ry', result.ry, 'mm'],
  ] as const : [];

  return <section className="max-w-6xl mx-auto space-y-5">
    <header>
      <h2 className="text-2xl font-bold text-gray-800">常用结构参数</h2>
      <p className="text-sm text-gray-500 mt-1">截面几何量 · 尺寸单位 mm</p>
    </header>
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] gap-6">
      <div className="space-y-4">
        <fieldset>
          <legend className="text-sm font-semibold text-gray-700 mb-2">截面形状</legend>
          <div className="flex border border-gray-300 rounded overflow-hidden text-sm">
            {shapes.map(shape => <label key={shape.value}
              className={`flex-1 text-center py-2 cursor-pointer ${input.shape === shape.value ? 'bg-blue-700 text-white' : 'bg-white text-gray-700'}`}>
              <input type="radio" name="section-shape" value={shape.value} checked={input.shape === shape.value}
                onChange={() => setInput(previous => ({ ...previous, shape: shape.value }))} className="sr-only" />
              {shape.label}
            </label>)}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          {fields.map(field => <label key={field.key} className="block text-sm text-gray-700">
            <span className="block mb-1">{field.label} (mm)</span>
            <input type="number" min="0" step="any" value={input[field.key]}
              onChange={event => setInput(previous => ({ ...previous, [field.key]: Number(event.target.value) }))}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white" />
          </label>)}
        </div>
        <p className="text-xs text-gray-500">T 形截面默认翼缘居中；不考虑孔洞、倒角或钢筋。Ix 为过形心的水平轴，Iy 为过形心的竖直轴。</p>
      </div>
      <div className="space-y-4">
        {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {result && <>
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-sm font-bold text-gray-700">几何结果</h3>
          </div>
          <dl className="grid grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-4">
            {metrics.map(([label, value, unit]) => <div key={label} className="min-w-0 border-b border-gray-200 pb-2">
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="font-semibold text-gray-800 break-words">{format(value)} <span className="text-xs font-normal text-gray-500">{unit}</span></dd>
            </div>)}
          </dl>
          <p className="text-xs text-amber-800 border-l-4 border-amber-500 bg-amber-50 px-3 py-2">
            仅计算理想截面几何量，不含材料、荷载、稳定和承载力验算；不能直接作为结构设计结论。
          </p>
        </>}
      </div>
    </div>
  </section>;
};

export default SectionProperties;
