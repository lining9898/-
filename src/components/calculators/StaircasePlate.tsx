import React, { useState, useMemo } from 'react';
import { calculatePlateStair, PlateStairInput } from '../../core/stair/plate';
import { CONCRETE_GRADES, STEEL_GRADES } from '../../core/shared/materials';
import VerificationBadge from '../evidence/VerificationBadge';
import ResultView from './ResultView';

const StaircasePlate: React.FC = () => {
  const [input, setInput] = useState<PlateStairInput>({
    span: 3.6, stepRise: 160, stepRun: 280, t: 120, concreteGrade: 'C30', steelGrade: 'HRB400',
    cover: 20, barDiameter: 10, barSpacing: 100, gkExtra: 1.5, qk: 3.5, gammaG: 1.3, gammaQ: 1.5,
  });
  const result = useMemo(() => calculatePlateStair(input), [input]);
  const set = <K extends keyof PlateStairInput>(key: K, value: PlateStairInput[K]) => setInput(p => ({ ...p, [key]: value }));

  const num = (label: string, key: keyof PlateStairInput, unit: string) => (
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
        <h2 className="text-2xl font-bold text-gray-800">现浇板式楼梯</h2>
        <p className="text-sm text-gray-500 mt-1">
          单跨简支板式楼梯（水平投影折算）·恒载·活载·内力·配筋
          <VerificationBadge status={result.overallStatus} className="ml-2" />
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">参数输入</h3>
            <div className="space-y-3">
              {num('水平投影跨度 l0', 'span', 'm')}
              {num('踏步高', 'stepRise', 'mm')}
              {num('踏步宽', 'stepRun', 'mm')}
              {num('梯板厚 t', 't', 'mm')}
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

export default StaircasePlate;
