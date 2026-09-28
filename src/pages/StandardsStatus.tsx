import React from 'react';

interface StandardsStatusProps {
  onBack: () => void;
}

const StandardsStatus: React.FC<StandardsStatusProps> = ({ onBack }) => {
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

        <div className="rounded-xl border border-blue-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3">
            <span className="inline-flex items-center gap-1.5 text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
              <span className="text-sm font-semibold">规范依据状态</span>
            </span>
          </div>

          <dl className="divide-y divide-gray-100 px-5">
            <div className="flex items-center justify-between gap-4 py-3.5">
              <dt className="text-sm text-gray-500">规范名称</dt>
              <dd className="text-sm font-medium text-gray-900">GB 50010-2010</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3.5">
              <dt className="text-sm text-gray-500">版本</dt>
              <dd className="text-sm font-medium text-gray-900">2015年版</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3.5">
              <dt className="text-sm text-gray-500">状态</dt>
              <dd>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                  现行依据校核中
                </span>
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-3.5">
              <dt className="shrink-0 text-sm text-gray-500">说明</dt>
              <dd className="text-sm text-gray-700">本平台正在进行规范版本差异整理。</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default StandardsStatus;
