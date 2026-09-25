import React, { useState, useMemo } from 'react';
import { calculateBeamShear, BeamShearInput } from '../../core/beam/shear';
import { generateReport } from '../../report/generator';
import EvidencePanel from '../evidence/EvidencePanel';
import VerificationBadge from '../evidence/VerificationBadge';
import CalculationReportView from '../report/CalculationReportView';

const CONCRETE_GRADES = ['C20', 'C25', 'C30', 'C35', 'C40', 'C45', 'C50'];
const STEEL_GRADES = ['HPB300', 'HRB335', 'HRB400', 'HRB500'];

/** 梁截面 + 箍筋示意图 */
const BeamShearSVG: React.FC<{ b: number; h: number; h0: number; stirrupDiameter: number; stirrupLegs: number }> = ({
  b, h, h0, stirrupDiameter, stirrupLegs,
}) => {
  const svgW = 300;
  const svgH = 240;
  const scale = Math.min(240 / b, 180 / h);
  const drawW = b * scale;
  const drawH = h * scale;
  const ox = (svgW - drawW) / 2;
  const oy = (svgH - drawH) / 2 + 10;
  
  // 根据 h0 计算受拉钢筋位置
  const cover = h - h0;
  const stirrupX1 = ox + cover * scale;
  const stirrupX2 = ox + drawW - cover * scale;
  const stirrupY1 = oy + cover * scale;
  const stirrupY2 = oy + drawH - cover * scale;

  // 箍筋肢的 x 坐标
  const legPositions: number[] = [];
  if (stirrupLegs === 2) {
    legPositions.push(stirrupX1, stirrupX2);
  } else if (stirrupLegs === 3) {
    legPositions.push(stirrupX1, (stirrupX1 + stirrupX2) / 2, stirrupX2);
  } else if (stirrupLegs === 4) {
    const third = (stirrupX2 - stirrupX1) / 3;
    legPositions.push(stirrupX1, stirrupX1 + third, stirrupX1 + 2 * third, stirrupX2);
  } else {
    legPositions.push(stirrupX1, stirrupX2);
  }

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-xs mx-auto">
      {/* 混凝土截面 */}
      <rect x={ox} y={oy} width={drawW} height={drawH} fill="#e5e7eb" stroke="#6b7280" strokeWidth={1.5} />

      {/* 箍筋外轮廓 */}
      <rect x={stirrupX1} y={stirrupY1} width={stirrupX2 - stirrupX1} height={stirrupY2 - stirrupY1}
        fill="none" stroke="#2563eb" strokeWidth={1.5} rx={4} />

      {/* 箍筋肢（竖向线段） */}
      {legPositions.map((lx, i) => (
        <line key={i} x1={lx} y1={stirrupY1} x2={lx} y2={stirrupY2}
          stroke="#2563eb" strokeWidth={1.2} strokeDasharray="4 3" />
      ))}

      {/* 尺寸标注 - 宽度 b */}
      <line x1={ox} y1={oy + drawH + 18} x2={ox + drawW} y2={oy + drawH + 18} stroke="#374151" strokeWidth={0.8} />
      <line x1={ox} y1={oy + drawH + 14} x2={ox} y2={oy + drawH + 22} stroke="#374151" strokeWidth={0.8} />
      <line x1={ox + drawW} y1={oy + drawH + 14} x2={ox + drawW} y2={oy + drawH + 22} stroke="#374151" strokeWidth={0.8} />
      <text x={ox + drawW / 2} y={oy + drawH + 30} textAnchor="middle" className="text-xs" fill="#374151" fontSize={11}>
        b = {b}
      </text>

      {/* 尺寸标注 - 高度 h */}
      <line x1={ox + drawW + 18} y1={oy} x2={ox + drawW + 18} y2={oy + drawH} stroke="#374151" strokeWidth={0.8} />
      <line x1={ox + drawW + 14} y1={oy} x2={ox + drawW + 22} y2={oy} stroke="#374151" strokeWidth={0.8} />
      <line x1={ox + drawW + 14} y1={oy + drawH} x2={ox + drawW + 22} y2={oy + drawH} stroke="#374151" strokeWidth={0.8} />
      <text x={ox + drawW + 30} y={oy + drawH / 2 + 4} textAnchor="middle" className="text-xs" fill="#374151" fontSize={11}>
        h = {h}
      </text>

      {/* 标签 */}
      <text x={svgW / 2} y={16} textAnchor="middle" fill="#6b7280" fontSize={10}>
        箍筋 {stirrupLegs}肢 φ{stirrupDiameter}
      </text>
    </svg>
  );
};

const BeamShear: React.FC<{ onLookupClause?: (clause: string) => void }> = ({ onLookupClause }) => {
  const [input, setInput] = useState<BeamShearInput>({
    b: 250,
    h: 500,
    h0: 460,
    stirrupDiameter: 8,
    concreteGrade: 'C30',
    stirrupGrade: 'HRB400',
    V: 150,
    stirrupLegs: 2,
    stirrupSpacing: 150,
    loadType: 'uniform',
    shearSpan: undefined,
  });

  const [activeTab, setActiveTab] = useState<'result' | 'report' | 'evidence'>('result');

  const result = useMemo(() => calculateBeamShear(input), [input]);
  const report = useMemo(() => generateReport(result), [result]);

  const updateInput = <K extends keyof BeamShearInput>(key: K, value: BeamShearInput[K]) => {
    setInput(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">矩形梁斜截面受剪</h2>
        <p className="text-sm text-gray-500 mt-1">
          GB 50010 混凝土梁斜截面受剪承载力计算
          <VerificationBadge status={result.overallStatus} className="ml-2" />
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：参数输入 */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">参数输入</h3>

            <div className="space-y-3">
              {/* 截面参数 */}
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">截面参数</div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">截面宽度 b (mm)</label>
                <input
                  type="number"
                  value={input.b}
                  onChange={e => updateInput('b', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">截面高度 h (mm)</label>
                <input
                  type="number"
                  value={input.h}
                  onChange={e => updateInput('h', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">有效高度 h₀ (mm)</label>
                <input
                  type="number"
                  value={input.h0}
                  onChange={e => updateInput('h0', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 材料 */}
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">材料</div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">混凝土强度等级</label>
                <select
                  value={input.concreteGrade}
                  onChange={e => updateInput('concreteGrade', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  {CONCRETE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">箍筋等级</label>
                <select
                  value={input.stirrupGrade}
                  onChange={e => updateInput('stirrupGrade', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  {STEEL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* 箍筋配置 */}
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">箍筋配置</div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">箍筋直径 (mm)</label>
                <input
                  type="number"
                  value={input.stirrupDiameter}
                  onChange={e => updateInput('stirrupDiameter', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">箍筋肢数</label>
                <select
                  value={input.stirrupLegs}
                  onChange={e => updateInput('stirrupLegs', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value={2}>2 肢</option>
                  <option value={3}>3 肢</option>
                  <option value={4}>4 肢</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">箍筋间距 s (mm)</label>
                <input
                  type="number"
                  value={input.stirrupSpacing}
                  onChange={e => updateInput('stirrupSpacing', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 作用效应 */}
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">作用效应</div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">剪力设计值 V (kN)</label>
                <input
                  type="number"
                  value={input.V}
                  onChange={e => updateInput('V', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 荷载条件 */}
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">荷载条件</div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">荷载类型</label>
                <select
                  value={input.loadType}
                  onChange={e => updateInput('loadType', e.target.value as 'uniform' | 'concentrated')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="uniform">均布荷载</option>
                  <option value="concentrated">集中荷载</option>
                </select>
              </div>
              {input.loadType === 'concentrated' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">剪跨 a (mm)</label>
                  <input
                    type="number"
                    value={input.shearSpan ?? ''}
                    onChange={e => updateInput('shearSpan', Number(e.target.value) || undefined)}
                    placeholder="集中荷载作用点到支座的距离"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SVG 示意图 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">截面示意图</h3>
            <BeamShearSVG
              b={input.b}
              h={input.h}
              h0={input.h0}
              stirrupDiameter={input.stirrupDiameter}
              stirrupLegs={input.stirrupLegs}
            />
          </div>
        </div>

        {/* 右侧：结果区域 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab 切换 */}
          <div className="flex border-b border-gray-200 bg-white rounded-t-lg shadow-sm">
            <button
              onClick={() => setActiveTab('result')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'result'
                  ? 'text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              计算结果
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'report'
                  ? 'text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              详细计算书
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'evidence'
                  ? 'text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              规范依据
            </button>
          </div>

          {/* 计算结果 */}
          {activeTab === 'result' && (
            <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 p-5 space-y-5">
              {/* 结论 */}
              <div className={`p-4 rounded-lg border ${
                !result.conclusion.passed ? 'bg-red-50 border-red-200'
                  : result.overallStatus === 'VERIFIED' ? 'bg-green-50 border-green-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${
                    !result.conclusion.passed ? 'text-red-700'
                      : result.overallStatus === 'VERIFIED' ? 'text-green-700' : 'text-amber-800'
                  }`}>
                    {result.conclusion.passed
                      ? result.overallStatus === 'VERIFIED' ? '✓ 验算通过' : '所列验算满足（待复核）'
                      : '✗ 验算不通过'}
                  </span>
                  <VerificationBadge status={result.overallStatus} />
                </div>
                <p className="text-sm text-gray-600 mt-1">{result.conclusion.summary}</p>
              </div>

              {/* 警告 */}
              {result.advisories.length > 0 && (
                <div className="space-y-2">
                  {result.advisories.map((a, i) => (
                    <div key={i} className={`p-3 rounded text-sm ${
                      a.severity === 'error' ? 'bg-red-50 text-red-700' :
                      a.severity === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      [{a.code}] {a.message}
                    </div>
                  ))}
                </div>
              )}

              {/* 主要结果 */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">计算结果</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {result.results.map((r, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded border border-gray-100">
                      <div className="text-xs text-gray-500">{r.label}</div>
                      <div className="text-lg font-bold text-gray-800">
                        {r.value} <span className="text-xs font-normal text-gray-500">{r.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 验算项 */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">验算结果</h4>
                <div className="space-y-2">
                  {result.checks.map((c, i) => (
                    <div key={i} className={`p-3 rounded border flex items-center justify-between ${
                      c.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div>
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {c.calculatedValue} {c.unit} {c.comparison === '<=' ? '≤' : '≥'} {c.limitValue} {c.unit}
                        </div>
                      </div>
                      <div className={`text-sm font-bold ${c.passed ? 'text-green-700' : 'text-red-700'}`}>
                        {c.passed ? '通过' : '不通过'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 计算步骤 */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">计算步骤</h4>
                <div className="space-y-3">
                  {result.steps.map((s, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-700">
                          步骤 {i + 1}：{s.name}
                        </span>
                        {s.evidence.length > 0 && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-xs cursor-pointer"
                                onClick={() => setActiveTab('evidence')}>
                            查看依据
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">{s.description}</div>
                      <div className="text-sm font-mono text-gray-700 bg-white p-2 rounded border border-gray-200 mb-1">
                        {s.formula}
                      </div>
                      {s.substitutedFormula && (
                        <div className="text-xs font-mono text-blue-600 bg-blue-50 p-2 rounded mb-1">
                          {s.substitutedFormula}
                        </div>
                      )}
                      <div className="text-sm font-bold text-gray-800">
                        = {s.result} {s.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 详细计算书 */}
          {activeTab === 'report' && (
            <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 p-5">
              <CalculationReportView report={report} status={result.overallStatus} />
            </div>
          )}

          {/* 规范依据 */}
          {activeTab === 'evidence' && (
            <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 p-5">
              <EvidencePanel evidence={result.allEvidence} onLookupClause={onLookupClause} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BeamShear;
