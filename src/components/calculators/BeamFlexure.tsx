import React, { useState, useMemo } from 'react';
import { calculateBeamFlexure, BeamFlexureInput } from '../../core/beam/flexure';
import { generateReport } from '../../report/generator';
import BeamSectionSVG from '../svg/BeamSectionSVG';
import EvidencePanel from '../evidence/EvidencePanel';
import VerificationBadge from '../evidence/VerificationBadge';
import CalculationReportView from '../report/CalculationReportView';
import AIReviewButton from '../ai-review/AIReviewButton';
import { STEEL_GRADES } from '../../core/shared/materials';

const CONCRETE_GRADES = ['C20', 'C25', 'C30', 'C35', 'C40', 'C45', 'C50'];

const BeamFlexure: React.FC = () => {
  const [input, setInput] = useState<BeamFlexureInput>({
    b: 250,
    h: 500,
    concreteGrade: 'C30',
    steelGrade: 'HRB400',
    cover: 25,
    barDiameter: 20,
    barCount: 4,
    moment: 120,
    beamType: 'unknown',
    seismicGrade: 'unknown',
    sectionLocation: 'unknown',
    structuralSafetyGrade: 'unknown',
    designSituation: 'unknown',
    seismicAction: 'unknown',
  });

  const [activeTab, setActiveTab] = useState<'result' | 'report' | 'evidence'>('result');

  const result = useMemo(() => calculateBeamFlexure(input), [input]);
  const report = useMemo(() => generateReport(result), [result]);

  const updateInput = <K extends keyof BeamFlexureInput>(key: K, value: BeamFlexureInput[K]) => {
    setInput(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">矩形梁正截面受弯</h2>
        <p className="text-sm text-gray-500 mt-1">
          GB 50010 混凝土梁正截面受弯承载力计算
          <VerificationBadge status={result.overallStatus} className="ml-2" />
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：参数输入 */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">参数输入</h3>

            {/* 截面参数 */}
            <div className="space-y-3">
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
              <div>
                <label className="block text-xs text-gray-500 mb-1">构件类型 (GB 55008 §4.4.4)</label>
                <select
                  value={input.beamType}
                  onChange={e => updateInput('beamType', e.target.value as 'frameBeam' | 'nonFrameBeam' | 'unknown')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="unknown">未声明</option>
                  <option value="frameBeam">框架梁</option>
                  <option value="nonFrameBeam">非框架梁</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">抗震等级</label>
                <select value={input.seismicGrade ?? 'unknown'}
                  onChange={e => updateInput('seismicGrade', e.target.value as BeamFlexureInput['seismicGrade'])}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option value="unknown">未声明</option>
                  <option value="none">不按抗震设计</option>
                  <option value="1">一级</option><option value="2">二级</option>
                  <option value="3">三级</option><option value="4">四级</option>
                </select>
                <p className="mt-1 text-xs text-amber-700">框架梁按等级及验算位置核算表 4.4.8-1；其他抗震构造仍需单独核验。</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">验算位置</label>
                <select value={input.sectionLocation ?? 'unknown'}
                  onChange={e => updateInput('sectionLocation', e.target.value as BeamFlexureInput['sectionLocation'])}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option value="unknown">未声明</option>
                  <option value="support">梁端（支座）</option>
                  <option value="span">跨中</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">结构安全等级 (GB 55001 表 3.1.12)</label>
                <select value={input.structuralSafetyGrade ?? 'unknown'}
                  onChange={e => updateInput('structuralSafetyGrade', e.target.value as BeamFlexureInput['structuralSafetyGrade'])}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option value="unknown">未声明（暂按 γ₀=1.0）</option>
                  <option value="1">一级（γ₀=1.1）</option>
                  <option value="2">二级（γ₀=1.0）</option>
                  <option value="3">三级（γ₀=0.9）</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">弯矩 M 对应的设计状况</label>
                <select value={input.designSituation ?? 'unknown'}
                  onChange={e => updateInput('designSituation', e.target.value as BeamFlexureInput['designSituation'])}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option value="unknown">未声明</option>
                  <option value="persistent">持久</option>
                  <option value="transient">短暂</option>
                  <option value="accidental">偶然</option>
                  <option value="seismic">地震</option>
                </select>
              </div>
              {input.designSituation === 'seismic' && <div>
                <label className="block text-xs text-gray-500 mb-1">地震组合类别 (GB 55002 表 4.3.1)</label>
                <select value={input.seismicAction ?? 'unknown'}
                  onChange={e => updateInput('seismicAction', e.target.value as BeamFlexureInput['seismicAction'])}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option value="unknown">未声明（暂按 γRE=1.0）</option>
                  <option value="general">一般地震组合（γRE=0.75）</option>
                  <option value="verticalDominant">竖向地震为主（γRE=1.0）</option>
                </select>
              </div>}
              <div>
                <label className="block text-xs text-gray-500 mb-1">受拉纵筋外缘距受拉边 c (mm)</label>
                <input
                  type="number"
                  value={input.cover}
                  onChange={e => updateInput('cover', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">输入受拉边至纵筋外缘的实际距离；有箍筋时，按保护层与箍筋布置确定。</p>
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
              <div>
                <label className="block text-xs text-gray-500 mb-1">作用组合弯矩设计值 M（未乘 γ₀，kN·m）</label>
                <input
                  type="number"
                  value={input.moment}
                  onChange={e => updateInput('moment', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">弯矩荷载组合／内力计算来源</label>
                <input type="text" value={input.momentBasis ?? ''}
                  onChange={e => updateInput('momentBasis', e.target.value)}
                  placeholder="例如：荷载组合计算书编号与工况"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                <p className="mt-1 text-xs text-gray-500">本模块不生成荷载组合；请输入可追溯的 M 来源。</p>
              </div>
            </div>
          </div>

          {/* SVG 示意图 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">截面示意图</h3>
            <BeamSectionSVG
              b={input.b}
              h={input.h}
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
            <AIReviewButton result={result} title="矩形梁正截面受弯" />
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
                      {a.message}
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
              <EvidencePanel evidence={result.allEvidence} moduleId={result.calculatorType} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BeamFlexure;
