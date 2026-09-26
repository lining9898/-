import React, { useState } from 'react';
import { CalculationResult } from '../../types/calculation';
import { generateReport } from '../../report/generator';
import CalculationReportView from './CalculationReportView';
import EvidencePanel from '../evidence/EvidencePanel';

interface ResultTabsProps {
  result: CalculationResult;
  children: React.ReactNode;
}

const tabs = [
  { key: 'result', label: '计算结果' },
  { key: 'report', label: '详细计算书' },
  { key: 'evidence', label: '规范依据' },
] as const;

const ResultTabs: React.FC<ResultTabsProps> = ({ result, children }) => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['key']>('result');
  return <div className="min-w-0">
    <div role="tablist" aria-label="计算内容" className="flex border-b border-gray-200">
      {tabs.map(tab => <button key={tab.key} type="button" role="tab"
        aria-selected={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}
        className={`px-4 py-3 text-sm font-medium border-b-2 ${activeTab === tab.key
          ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
        {tab.label}
      </button>)}
    </div>
    <div role="tabpanel" className="py-4 space-y-5">
      {activeTab === 'result' && children}
      {activeTab === 'report' && <CalculationReportView report={generateReport(result)} status={result.overallStatus} />}
      {activeTab === 'evidence' && <>
        {result.allEvidence.length === 0 && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-3">
          当前仅为力学分析，尚无可关联的中国规范条文；未作设计验算。
        </p>}
        <EvidencePanel evidence={result.allEvidence} />
      </>}
    </div>
  </div>;
};

export default ResultTabs;
