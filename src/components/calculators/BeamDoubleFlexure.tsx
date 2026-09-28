import React, { useState, useMemo } from 'react';
import { calculateBeamDoubleFlexure, BeamDoubleFlexureInput } from '../../core/beam/double-flexure';
import { generateReport } from '../../report/generator';
import EvidencePanel from '../evidence/EvidencePanel';
import VerificationBadge from '../evidence/VerificationBadge';
import CalculationReportView from '../report/CalculationReportView';

const CONCRETE_GRADES = ['C20', 'C25', 'C30', 'C35', 'C40', 'C45', 'C50'];
const STEEL_GRADES = ['HPB300', 'HRB335', 'HRB400', 'HRB500'];

/** 双筋矩形梁截面示意图（上部受压钢筋，下部受拉钢筋） */
const DoubleBeamSVG: React.FC<{
  b: number; h: number; cover: number; barDiameter: number; barCount: number;
  compressionBarDiameter: number; compressionBarCount: number;
}> = ({ b, h, cover, barDiameter, barCount, compressionBarDiameter, compressionBarCount }) => {
  const svgW = 300;
  const svgH = 240;
  const scale = Math.min(220 / b, 180 / h);
  const drawB = b * scale;
  const drawH = h * scale;
  const ox = (svgW - drawB) / 2;
  const oy = (svgH - drawH) / 2 + 10;

  const barY = oy + drawH - cover * scale;
  const compBarY = oy + cover * scale;
  const tensionSpacing = drawB > barCount * barDiameter * scale * 2
    ? (drawB - barCount * barDiameter * scale) / (barCount - 1)
    : barDiameter * scale * 1.5;
  const compSpacing = drawB > compressionBarCount * compressionBarDiameter * scale * 2
    ? (drawB - compressionBarCount * compressionBarDiameter * scale) / (compressionBarCount - 1)
    : compressionBarDiameter * scale * 1.5;
  const tensionStartX = ox + (drawB - (barCount - 1) * tensionSpacing) / 2;
  const compStartX = ox + (drawB - (compressionBarCount - 1) * compSpacing) / 2;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-xs mx-auto">
      {/* 截面 */}
      <rect x={ox} y={oy} width={drawB} height={drawH} fill="#e5e7eb" stroke="#6b7280" strokeWidth={1.5} />

      {/* 受压钢筋（上部） */}
      {Array.from({ length: compressionBarCount }).map((_, i) => (
        <circle key={`c${i}`} cx={compStartX + i * compSpacing} cy={compBarY}
          r={compressionBarDiameter * scale / 2} fill="#dc2626" stroke="#b91c1c" strokeWidth={0.8} />
      ))}

      {/* 受拉钢筋（下部） */}
      {Array.from({ length: barCount }).map((_, i) => (
        <circle key={`t${i}`} cx={tensionStartX + i * tensionSpacing} cy={barY}
          r={barDiameter * scale / 2} fill="#2563eb" stroke="#1d4ed8" strokeWidth={0.8} />
      ))}

      {/* 尺寸标注 - 宽度 b */}
      <line x1={ox} y1={oy - 12} x2={ox + drawB} y2={oy - 12} stroke="#374151" strokeWidth={0.8} />
      <line x1={ox} y1={oy - 8} x2={ox} y2={oy - 16} stroke="#374151" strokeWidth={0.8} />
      <line x1={ox + drawB} y1={oy - 8} x2={ox + drawB} y2={oy - 16} stroke="#374151" strokeWidth={0.8} />
      <text x={ox + drawB / 2} y={oy - 16} textAnchor="middle" fill="#374151" fontSize={11}>
        b = {b}
      </text>

      {/* 尺寸标注 - 高度 h */}
      <line x1={ox + drawB + 12} y1={oy} x2={ox + drawB + 12} y2={oy + drawH} stroke="#374151" strokeWidth={0.8} />
      <line x1={ox + drawB + 8} y1={oy} x2={ox + drawB + 16} y2={oy} stroke="#374151" strokeWidth={0.8} />
      <line x1={ox + drawB + 8} y1={oy + drawH} x2={ox + drawB + 16} y2={oy + drawH} stroke="#374151" strokeWidth={0.8} />
      <text x={ox + drawB + 24} y={oy + drawH / 2 + 4} textAnchor="middle" fill="#374151" fontSize={11}>
        h = {h}
      </text>

      {/* 标签 */}
      <text x={svgW / 2} y={oy - 28} textAnchor="middle" fill="#dc2626" fontSize={10}>
        {compressionBarCount}φ{compressionBarDiameter}（受压）
      </text>
      <text x={svgW / 2} y={oy + drawH + 16} textAnchor="middle" fill="#2563eb" fontSize={10}>
        {barCount}φ{barDiameter}（受拉）
      </text>
    </svg>
  );
};

const BeamDoubleFlexure: React.FC = () => {
  const [input, setInput] = useState<BeamDoubleFlexureInput>({
    b: 300,
    h: 600,
    concreteGrade: 'C30',
    steelGrade: 'HRB400',
    compressionSteelGrade: 'HRB400',
    cover: 35,
    barDiameter: 25,
    barCount: 5,
    coverToCompressionCentroid: 40,
    compressionBarDiameter: 20,
    compressionBarCount: 2,
    moment: 300,
  });

  const [activeTab, setActiveTab] = useState<'result' | 'report' | 'evidence'>('result');

  const result = useMemo(() => calculateBeamDoubleFlexure(input), [input]);
  const report = useMemo(() => generateReport(result), [result]);

  const updateInput = <K extends keyof BeamDoubleFlexureInput>(key: K, value: BeamDoubleFlexureInput[K]) => {
    setInput(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">双筋矩形梁正截面受弯</h2>
        <p className="text-sm text-gray-500 mt-1">
          GB 50010 双筋矩形梁正截面受弯承载力计算
          <VerificationBadge status={result.overallStatus} className="ml-2" />
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：参数输入 */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">参数输入</h3>

            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">截面参数</div>
              <label className="block text-xs text-gray-600">
                <span className="block mb-1">截面宽度 b (mm)</span>
                <input type="number" value={input.b}
                  onChange={e => updateInput('b', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </label>
              <label className="block text-xs text-gray-600">
                <span className="block mb-1">截面高度 h (mm)</span>
                <input type="number" value={input.h}
                  onChange={e => updateInput('h', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </label>

              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">材料</div>
              <label className="block text-xs text-gray-600">
                <span className="block mb-1">混凝土强度等级</span>
                <select value={input.concreteGrade}
                  onChange={e => updateInput('concreteGrade', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  {CONCRETE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <label className="block text-xs text-gray-600">
                <span className="block mb-1">受拉钢筋等级</span>
                <select value={input.steelGrade}
                  onChange={e => updateInput('steelGrade', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  {STEEL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <label className="block text-xs text-gray-600">
                <span className="block mb-1">受压钢筋等级</span>
                <select value={input.compressionSteelGrade}
                  onChange={e => updateInput('compressionSteelGrade', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  {STEEL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>

              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">受拉配筋</div>
              <label className="block text-xs text-gray-600">
                <span className="block mb-1">保护层厚度 c (mm)</span>
                <input type="number" value={input.cover}
                  onChange={e => updateInput('cover', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </label>
              <label className="block text-xs text-gray-600">
                <span className="block mb-1">受拉钢筋直径 (mm)</span>
                <input type="number" value={input.barDiameter}
                  onChange={e => updateInput('barDiameter', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </label>
              <label className="block text-xs text-gray-600">
                <span className="block mb-1">受拉钢筋根数</span>
                <input type="number" value={input.barCount}
                  onChange={e => updateInput('barCount', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </label>

              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">受压配筋</div>
              <label className="block text-xs text-gray-600">
                <span className="block mb-1">受压钢筋合力点距 a′s (mm)</span>
                <input type="number" value={input.coverToCompressionCentroid}
                  onChange={e => updateInput('coverToCompressionCentroid', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </label>
              <label className="block text-xs text-gray-600">
                <span className="block mb-1">受压钢筋直径 (mm)</span>
                <input type="number" value={input.compressionBarDiameter}
                  onChange={e => updateInput('compressionBarDiameter', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </label>
              <label className="block text-xs text-gray-600">
                <span className="block mb-1">受压钢筋根数</span>
                <input type="number" value={input.compressionBarCount}
                  onChange={e => updateInput('compressionBarCount', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </label>

              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">作用效应</div>
              <label className="block text-xs text-gray-600">
                <span className="block mb-1">弯矩设计值 M (kN·m)</span>
                <input type="number" value={input.moment}
                  onChange={e => updateInput('moment', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">截面示意图</h3>
            <DoubleBeamSVG
              b={input.b} h={input.h} cover={input.cover}
              barDiameter={input.barDiameter} barCount={input.barCount}
              compressionBarDiameter={input.compressionBarDiameter} compressionBarCount={input.compressionBarCount}
            />
          </div>
        </div>

        {/* 右侧：结果区域 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex border-b border-gray-200 bg-white rounded-t-lg shadow-sm">
            <button role="tab" onClick={() => setActiveTab('result')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'result' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
              计算结果
            </button>
            <button role="tab" onClick={() => setActiveTab('report')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'report' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
              详细计算书
            </button>
            <button role="tab" onClick={() => setActiveTab('evidence')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'evidence' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
              规范依据
            </button>
          </div>

          {activeTab === 'result' && (
            <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 p-5 space-y-5">
              <div className={`p-4 rounded-lg border ${
                !result.conclusion.passed ? 'bg-red-50 border-red-200'
                  : result.overallStatus === 'VERIFIED' ? 'bg-green-50 border-green-200'
                  : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${
                    !result.conclusion.passed ? 'text-red-700'
                      : result.overallStatus === 'VERIFIED' ? 'text-green-700' : 'text-amber-800'}`}>
                    {result.conclusion.passed
                      ? result.overallStatus === 'VERIFIED' ? '✓ 验算通过' : '所列验算满足（待复核）'
                      : '✗ 验算不通过'}
                  </span>
                  <VerificationBadge status={result.overallStatus} />
                </div>
                <p className="text-sm text-gray-600 mt-1">{result.conclusion.summary}</p>
              </div>

              {result.advisories.length > 0 && (
                <div className="space-y-2">
                  {result.advisories.map((a, i) => (
                    <div key={i} className={`p-3 rounded text-sm ${
                      a.severity === 'error' ? 'bg-red-50 text-red-700' :
                      a.severity === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-blue-50 text-blue-700'}`}>
                      [{a.code}] {a.message}
                    </div>
                  ))}
                </div>
              )}

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

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">验算结果</h4>
                <div className="space-y-2">
                  {result.checks.map((c, i) => (
                    <div key={i} className={`p-3 rounded border flex items-center justify-between ${
                      c.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
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

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">计算步骤</h4>
                <div className="space-y-3">
                  {result.steps.map((s, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-700">步骤 {i + 1}：{s.name}</span>
                        {s.evidence.length > 0 && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-xs cursor-pointer"
                            onClick={() => setActiveTab('evidence')}>查看依据</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">{s.description}</div>
                      <div className="text-sm font-mono text-gray-700 bg-white p-2 rounded border border-gray-200 mb-1">{s.formula}</div>
                      {s.substitutedFormula && (
                        <div className="text-xs font-mono text-blue-600 bg-blue-50 p-2 rounded mb-1">{s.substitutedFormula}</div>
                      )}
                      <div className="text-sm font-bold text-gray-800">= {s.result} {s.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 p-5">
              <CalculationReportView report={report} status={result.overallStatus} />
            </div>
          )}

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

export default BeamDoubleFlexure;
