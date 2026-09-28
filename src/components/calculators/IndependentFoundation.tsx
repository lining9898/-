import React, { useState, useMemo } from 'react';
import { calculateIndependentFoundation, IndependentFoundationInput } from '../../core/foundation/independent';
import { CONCRETE_GRADES, STEEL_GRADES } from '../../core/shared/materials';
import VerificationBadge from '../evidence/VerificationBadge';
import ResultView from './ResultView';

const IndependentFoundation: React.FC = () => {
  const [input, setInput] = useState<IndependentFoundationInput>({
    L: 3.0, B: 2.4, h: 800, bc: 500, hc: 400, d: 1.5, gammaM: 20, fa: 300,
    Nk: 1200, N: 1560, concreteGrade: 'C30', steelGrade: 'HRB400', cover: 40,
    barDiameter: 16, barSpacing: 150,
  });
  const result = useMemo(() => calculateIndependentFoundation(input), [input]);
  const set = <K extends keyof IndependentFoundationInput>(key: K, value: IndependentFoundationInput[K]) =>
    setInput(p => ({ ...p, [key]: value }));

  const num = (label: string, key: keyof IndependentFoundationInput, unit: string) => (
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
        <h2 className="text-2xl font-bold text-gray-800">柱下独立基础</h2>
        <p className="text-sm text-gray-500 mt-1">
          轴心受压矩形基础：地基承载力·受弯·冲切·抗剪·配筋
          <VerificationBadge status={result.overallStatus} className="ml-2" />
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">参数输入</h3>
            <div className="space-y-3">
              {num('基础长边 L', 'L', 'm')}
              {num('基础短边 B', 'B', 'm')}
              {num('基础高度 h', 'h', 'mm')}
              {num('柱截面 bc(沿L)', 'bc', 'mm')}
              {num('柱截面 hc(沿B)', 'hc', 'mm')}
              {num('埋深 d', 'd', 'm')}
              {num('基础及覆土重度 γm', 'gammaM', 'kN/m³')}
              {num('地基承载力特征值 fa', 'fa', 'kPa')}
              {num('轴力标准值 Nk', 'Nk', 'kN')}
              {num('轴力设计值 N', 'N', 'kN')}
              {sel('混凝土强度等级', 'concreteGrade', CONCRETE_GRADES)}
              {sel('钢筋等级', 'steelGrade', STEEL_GRADES)}
              {num('保护层 c', 'cover', 'mm')}
              {num('受力钢筋直径', 'barDiameter', 'mm')}
              {num('受力钢筋间距', 'barSpacing', 'mm')}
            </div>
          </div>
        </div>
        <ResultView result={result} />
      </div>
    </div>
  );
};

export default IndependentFoundation;
