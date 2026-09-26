import React, { useMemo, useState } from 'react';
import { calculateMaterialWeight, materialWeightPresets } from '../../core/tools/material-weight';
import { materialWeightReport } from '../../report/material-weight-adapter';
import ResultTabs from '../report/ResultTabs';
import VerificationBadge from '../evidence/VerificationBadge';

const MaterialWeight: React.FC = () => {
  const [materialId, setMaterialId] = useState('reinforced-concrete');
  const [unitWeight, setUnitWeight] = useState(24.5);
  const [volume, setVolume] = useState(1);
  const preset = materialWeightPresets.find(item => item.id === materialId)!;
  const calculation = useMemo(() => {
    try {
      const weight = calculateMaterialWeight({ unitWeight, volume });
      return { report: materialWeightReport(preset, { unitWeight, volume }, weight), error: '' };
    } catch (error) {
      return { report: null, error: error instanceof Error ? error.message : '输入无效' };
    }
  }, [preset, unitWeight, volume]);
  const inRange = unitWeight >= preset.min && unitWeight <= preset.max;

  return <section className="max-w-6xl mx-auto space-y-5">
    <header>
      <h2 className="text-2xl font-bold text-gray-800">材料重度与自重</h2>
      <p className="text-sm text-gray-500 mt-1">GB 50009-2012 附录 A 表 A <VerificationBadge status="REVIEW_REQUIRED" /></p>
    </header>
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] gap-6">
      <section aria-label="材料重度参数" className="space-y-4">
        <label className="block text-sm text-gray-700">材料
          <select value={materialId} onChange={event => {
            const selected = materialWeightPresets.find(item => item.id === event.target.value)!;
            setMaterialId(selected.id);
            setUnitWeight((selected.min + selected.max) / 2);
          }} className="block w-full mt-1 border border-gray-300 rounded px-3 py-2 bg-white">
            {materialWeightPresets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <p className="text-sm text-gray-600">表列参考重度：{preset.min === preset.max ? preset.min : `${preset.min}～${preset.max}`} kN/m³</p>
        <label className="block text-sm text-gray-700">本次采用重度 γ (kN/m³)
          <input type="number" step="any" value={unitWeight} onChange={event => setUnitWeight(Number(event.target.value))}
            className="block w-full mt-1 border border-gray-300 rounded px-3 py-2 bg-white" />
        </label>
        <label className="block text-sm text-gray-700">体积 V (m³)
          <input type="number" step="any" value={volume} onChange={event => setVolume(Number(event.target.value))}
            className="block w-full mt-1 border border-gray-300 rounded px-3 py-2 bg-white" />
        </label>
        <a href="https://commons.wikimedia.org/wiki/File:GB_50009-2012_%E5%BB%BA%E7%AD%91%E7%BB%93%E6%9E%84%E8%8D%B7%E8%BD%BD%E8%A7%84%E8%8C%83.pdf"
          target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline">查看公开规范扫描件</a>
      </section>
      <section aria-live="polite" className="min-w-0">
        {calculation.error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{calculation.error}</p>}
        {calculation.report && <ResultTabs result={calculation.report}>
          <h3 className="text-sm font-bold text-gray-700">计算结果</h3>
          <p className="text-2xl font-semibold text-gray-800">{String(calculation.report.results[0].value)} <span className="text-sm font-normal">kN</span></p>
          <p className="text-sm text-gray-600">Gk = γ · V = {unitWeight} × {volume} = {calculation.report.results[0].value} kN</p>
          <p className={`text-sm p-3 border ${inRange ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
            {calculation.report.conclusion.summary}
          </p>
          <p className="text-sm text-amber-900 border-l-4 border-amber-500 bg-amber-50 px-3 py-2">
            仅计算自重标准值；未进行荷载组合或设计验算。规范条目与现行通用规范关系仍待复核。
          </p>
        </ResultTabs>}
      </section>
    </div>
  </section>;
};

export default MaterialWeight;
