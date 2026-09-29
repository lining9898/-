import React, { useState } from 'react';
import { DOMAIN_LABELS, resolveCurrentStandardFusion, type StructuralDomain } from '../normative/fusion';

interface StandardsStatusProps {
  onBack: () => void;
}

const StandardsStatus: React.FC<StandardsStatusProps> = ({ onBack }) => {
  const [domain, setDomain] = useState<StructuralDomain>('CONCRETE');
  const fusion = resolveCurrentStandardFusion(domain);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-gray-800">规范状态</h1>
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
          >
            返回计算
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-1 border-b border-gray-200" role="tablist" aria-label="结构专业">
          {(Object.keys(DOMAIN_LABELS) as StructuralDomain[]).map(item => (
            <button key={item} type="button" role="tab" aria-selected={domain === item}
              onClick={() => setDomain(item)}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${domain === item ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {DOMAIN_LABELS[item]}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-blue-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3">
            <span className="inline-flex items-center gap-1.5 text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
              <span className="text-sm font-semibold">{DOMAIN_LABELS[domain]}适用规范</span>
            </span>
            <span className="text-xs font-medium text-amber-600">{fusion.status}</span>
          </div>

          <div className="divide-y divide-gray-100">
            {fusion.standards.map(item => (
              <div key={item.codeNumber} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{item.version?.designation ?? item.codeNumber}</div>
                    <div className="mt-1 text-xs text-gray-500">{item.version?.codeName ?? '版本尚未登记'} · {item.role}</div>
                  </div>
                  <span className={`text-xs font-medium ${item.authorityLevel === 'MANDATORY_GENERAL_CODE' ? 'text-red-700' : 'text-blue-700'}`}>
                    {item.authorityLevel === 'MANDATORY_GENERAL_CODE' ? '强制性通用规范' : '配套设计标准'}
                  </span>
                </div>
                <div className="mt-2 text-xs text-amber-700">版本状态：{item.version?.status ?? 'MISSING'} · 条文融合：{item.clauseEvidenceStatus}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-gray-500">当前仅完成现行版本与适用关系核验；逐条公式、参数和限值未完成 Evidence 映射前，计算结果继续标记 REVIEW_REQUIRED。</p>
      </div>
    </div>
  );
};

export default StandardsStatus;
