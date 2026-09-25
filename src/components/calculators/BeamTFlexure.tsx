import React, { useState, useMemo } from 'react';
import { calculateBeamTFlexure, BeamTFlexureInput } from '../../core/beam/t-flexure';
import { generateReport } from '../../report/generator';
import EvidencePanel from '../evidence/EvidencePanel';
import CalculationReportView from '../report/CalculationReportView';

const CONCRETE_GRADES = ['C20', 'C25', 'C30', 'C35', 'C40', 'C45', 'C50'];
const STEEL_GRADES = ['HPB300', 'HRB335', 'HRB400', 'HRB500'];

/** T形梁截面示意图 */
const TBeamSVG: React.FC<{ b: number; h: number; hf: number; bf: number; cover: number; barDiameter: number; barCount: number }> = ({
  b, h, hf, bf, cover, barDiameter, barCount,
}) => {
  const svgW = 300;
  const svgH = 240;
  const scale = Math.min(240 / bf, 180 / h);
  const drawBf = bf * scale;
  const drawH = h * scale;
  const drawB = b * scale;
  const drawHf = hf * scale;
  const ox = (svgW - drawBf) / 2;
  const oy = (svgH - drawH) / 2 + 10;

  // 受拉钢筋位置
  const barY = oy + drawH - cover * scale;
  const barSpacing = drawB > barCount * barDiameter * scale * 2
    ? (drawB - barCount * barDiameter * scale) / (barCount - 1)
    : barDiameter * scale * 1.5;
  const barStartX = ox + (drawBf - drawB) / 2 + (drawB - (barCount - 1) * barSpacing) / 2;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-xs mx-auto">
      {/* 翼缘 */}
      <rect x={ox} y={oy} width={drawBf} height={drawHf} fill="#e5e7eb" stroke="#6b7280" strokeWidth={1.5} />

      {/* 腹板 */}
      <rect x={ox + (drawBf - drawB) / 2} y={oy + drawHf} width={drawB} height={drawH - drawHf} fill="#e5e7eb" stroke="#6b7280" strokeWidth={1.5} />

      {/* 受拉钢筋 */}
      {Array.from({ length: barCount }).map((_, i) => (
        <circle key={i} cx={barStartX + i * barSpacing} cy={barY} r={barDiameter * scale / 2} fill="#2563eb" stroke="#1d4ed8" strokeWidth={0.8} />
      ))}

      {/* 尺寸标注 - 翼缘宽度 bf */}
      <line x1={ox} y1={oy - 12} x2={ox + drawBf} y2={oy - 12} stroke="#374151" strokeWidth={0.8} />
      <line x1={ox} y1={oy - 8} x2={ox} y2={oy - 16} stroke="#374151" strokeWidth={0.8} />
      <line x1={ox + drawBf} y1={oy - 8} x2={ox + drawBf} y2={oy - 16} stroke="#374151" strokeWidth={0.8} />
      <text x={ox + drawBf / 2} y={oy - 16} textAnchor="middle" className="text-xs" fill="#374151" fontSize={11}>
        bf = {bf}
      </text>

      {/* 尺寸标注 - 腹板宽度 b */}
      <line x1={ox + (drawBf - drawB) / 2} y1={oy + drawHf + 12} x2={ox + (drawBf + drawB) / 2} y2={oy + drawHf + 12} stroke="#374151" strokeWidth={0.8} />
      <text x={ox + drawBf / 2} y={oy + drawHf + 24} textAnchor="middle" className="text-xs" fill="#374151" fontSize={11}>
        b = {b}
      </text>

      {/* 尺寸标注 - 高度 h */}
      <line x1={ox + drawBf + 12} y1={oy} x2={ox + drawBf + 12} y2={oy + drawH} stroke="#374151" strokeWidth={0.8} />
      <line x1={ox + drawBf + 8} y1={oy} x2={ox + drawBf + 16} y2={oy} stroke="#374151" strokeWidth={0.8} />
      <line x1={ox + drawBf + 8} y1={oy + drawH} x2={ox + drawBf + 16} y2={oy + drawH} stroke="#374151" strokeWidth={0.8} />
      <text x={ox + drawBf + 24} y={oy + drawH / 2 + 4} textAnchor="middle" className="text-xs" fill="#374151" fontSize={11}>
        h = {h}
      </text>

      {/* 翼缘厚度 hf */}
      <line x1={ox - 12} y1={oy} x2={ox - 12} y2={oy + drawHf} stroke="#374151" strokeWidth={0.8} />
      <text x={ox - 20} y={oy + drawHf / 2 + 4} textAnchor="middle" className="text-xs" fill="#374151" fontSize={11}>
        hf
      </text>

      {/* 标签 */}
      <text x={svgW / 2} y={16} textAnchor="middle" fill="#6b7280" fontSize={10}>
        {barCount}φ{barDiameter}
      </text>
    </svg>
  );
};

const BeamTFlexure: React.FC = () => {
  const [input, setInput] = useState<BeamTFlexureInput>({
    b: 200,
    h: 500,
    hf: 100,
    bf: 600,
    concreteGrade: 'C30',
    steelGrade: 'HRB400',
    cover: 25,
    barDiameter: 20,
    barCount: 4,
    moment: 120,
  });

  const [activeTab, setActiveTab] = useState<'result' | 'report' | 'evidence'>('result');

  const result = useMemo(() => calculateBeamTFlexure(input), [input]);
  const report = useMemo(() => generateReport(result), [result]);

  const updateInput = <K extends keyof BeamTFlexureInput>(key: K, value: BeamTFlexureInput[K]) => {
    setInput(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">T形梁正截面受弯</h2>
        <p className="text-sm text-gray-500 mt-1">
          GB 50010 混凝土T形梁正截面受弯承载力计算
          <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
            REVIEW_REQUIRED
          </span>
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
                <label className="block text-xs text-gray-500 mb-1">腹板宽度 b (mm)</label>
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
                <label className="block text-xs text-gray-500 mb-1">翼缘厚度 hf (mm)</label>
                <input
                  type="number"
                  value={input.hf}
                  onChange={e => updateInput('hf', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">翼缘计算宽度 bf (mm)</label>
                <input
                  type="number"
                  value={input.bf}
                  onChange={e => updateInput('bf', Number(e.target.value))}
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
                <label className="block text-xs text-gray-500 mb-1">钢筋等级</label>
                <select
                  value={input.steelGrade}
                  onChange={e => updateInput('steelGrade', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  {STEEL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* 配筋 */}
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">配筋</div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">保护层厚度 c (mm)</label>
                <input
                  type="number"
                  value={input.cover}
                  onChange={e => updateInput('cover', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">受拉钢筋直径 (mm)</label>
                <input
                  type="number"
                  value={input.barDiameter}
                  onChange={e => updateInput('barDiameter', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">受拉钢筋根数</label>
                <input
                  type="number"
                  value={input.barCount}
                  onChange={e => updateInput('barCount', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 作用效应 */}
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">作用效应</div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">弯矩设计值 M (kN·m)</label>
                <input
                  type="number"
                  value={input.moment}
                  onChange={e => updateInput('moment', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SVG 示意图 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">截面示意图</h3>
            <TBeamSVG
              b={input.b}
              h={input.h}
              hf={input.hf}
              bf={input.bf}
              cover={input.cover}
              barDiameter={input.barDiameter}
              barCount={input.barCount}
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
                result.conclusion.passed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${
                    result.conclusion.passed ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.conclusion.passed ? '✓ 验算通过' : '✗ 验算不通过'}
                  </span>
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                    REVIEW_REQUIRED
                  </span>
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
              <CalculationReportView report={report} />
            </div>
          )}

          {/* 规范依据 */}
          {activeTab === 'evidence' && (
            <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 p-5">
              <EvidencePanel evidence={result.allEvidence} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BeamTFlexure;
