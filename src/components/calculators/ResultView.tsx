import React, { useState } from 'react';
import { CalculationResult } from '../../types/calculation';
import { generateReport } from '../../report/generator';
import EvidencePanel from '../evidence/EvidencePanel';
import VerificationBadge from '../evidence/VerificationBadge';
import CalculationReportView from '../report/CalculationReportView';
import AIReviewButton from '../ai-review/AIReviewButton';

/**
 * 通用计算结果渲染组件（结果 / 计算书 / 规范依据 三个页签）
 * 供板、基础、楼梯等新模块的薄计算器复用。
 */
const ResultView: React.FC<{ result: CalculationResult }> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<'result' | 'report' | 'evidence'>('result');
  const report = React.useMemo(() => generateReport(result), [result]);

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex border-b border-gray-200 bg-white rounded-t-lg shadow-sm">
        {(['result', 'report', 'evidence'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'result' ? '计算结果' : tab === 'report' ? '详细计算书' : '规范依据'}
          </button>
        ))}
        <AIReviewButton result={result} />
      </div>

      {activeTab === 'result' && (
        <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 p-5 space-y-5">
          <div className={`p-4 rounded-lg border ${
            !result.conclusion.passed ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${!result.conclusion.passed ? 'text-red-700' : 'text-amber-800'}`}>
                {result.conclusion.passed ? '所列验算满足（待复核）' : '✗ 验算不通过'}
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
                  a.severity === 'warning' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
                }`}>
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
                  c.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {c.calculatedValue} {c.unit} {c.comparison === '<=' ? '≤' : c.comparison === '>=' ? '≥' : '='} {c.limitValue} {c.unit}
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
  );
};

export default ResultView;
