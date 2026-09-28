import React, { useState, useMemo } from 'react';
import { calculateOneWaySlab, OneWaySlabInput } from '../../core/slab/one-way';
import { CONCRETE_GRADES, STEEL_GRADES } from '../../core/shared/materials';
import VerificationBadge from '../evidence/VerificationBadge';
import ResultView from './ResultView';

const OneWaySlab: React.FC = () => {
  const [input, setInput] = useState<OneWaySlabInput>({
    h: 120, span: 3.0, concreteGrade: 'C30', steelGrade: 'HRB400', cover: 20,
    barDiameter: 10, barSpacing: 200, gkExtra: 1.0, qk: 2.0, gammaG: 1.3, gammaQ: 1.5,
  });
  const result = useMemo(() => calculateOneWaySlab(input), [input]);
  const set = <K extends keyof OneWaySlabInput>(key: K, value: OneWaySlabInput[K]) => setInput(p => ({ ...p, [key]: value }));

  const num = (label: string, key: keyof OneWaySlabInput, unit: string) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label} ({unit})</label>
      <input type="number" value={input[key] as number} onChange={e => set(key, Number(e.target.value))}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
    </div>
  );
  const sel = (label: string, key: 'concreteGrade' | 'steelGrade', grades: string[]) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select value={input[key]} onChange={e => set(key, e.target.value as never)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
        {grades.map(g => <option key={g} value={g}>{g}</option>)}
      </select>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">单向板</h2>
        <p className="text-sm text-gray-500 mt-1">
          单跨简支单向板（1m 宽）荷载·内力·配筋·构造
          <VerificationBadge status={result.overallStatus} className="ml-2" />
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">参数输入</h3>
            <div className="space-y-3">
              {num('板厚 h', 'h', 'mm')}
              {num('计算跨度 l0', 'span', 'm')}
              {sel('混凝土强度等级', 'concreteGrade', CONCRETE_GRADES)}
              {sel('钢筋等级', 'steelGrade', STEEL_GRADES)}
              {num('保护层 c', 'cover', 'mm')}
              {num('受力钢筋直径', 'barDiameter', 'mm')}
              {num('受力钢筋间距', 'barSpacing', 'mm')}
              {num('附加恒载 gk', 'gkExtra', 'kN/m²')}
              {num('活载标准值 qk', 'qk', 'kN/m²')}
              {num('恒载分项系数 γG', 'gammaG', '')}
              {num('活载分项系数 γQ', 'gammaQ', '')}
            </div>
          </div>
        </div>
        <ResultView result={result} />
      </div>
    </div>
  );
};

export default OneWaySlab;
