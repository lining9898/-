import React, { useState } from 'react';

interface StandardStatusNoticeProps {
  onViewDetails: () => void;
}

const STORAGE_KEY = 'hide_standard_notice';

const StandardStatusNotice: React.FC<StandardStatusNoticeProps> = ({ onViewDetails }) => {
  const [hidden, setHidden] = useState<boolean>(() => {
    try {
      // 普通用户默认隐藏开发阶段横幅
      return true;
    } catch {
      return false;
    }
  });

  if (hidden) {
    return null;
  }

  const handleClose = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      /* 存储不可用时仅隐藏当前视图 */
    }
    setHidden(true);
  };

  return (
    <div
      role="status"
      className="mx-auto mb-4 flex min-h-11 max-w-7xl items-center gap-2.5 rounded-xl border border-blue-100 bg-white px-3 py-1 shadow-sm md:gap-3 md:px-4 md:py-1.5"
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 md:gap-x-3">
        <span className="inline-flex items-center gap-1.5 text-blue-700">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
          <span className="whitespace-nowrap text-xs font-semibold md:text-sm">规范依据状态</span>
        </span>
        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-600 md:px-2 md:text-xs">
          现行规范融合中
        </span>
        <span className="whitespace-nowrap text-[11px] text-gray-700 md:text-sm">
          计算引擎基线：
          <span className="font-medium text-gray-900">GB 50010-2010（2015年版）</span>
        </span>
        <span className="hidden text-xs text-gray-400 lg:inline">目标依据：GB 55001、GB 55008 与 GB/T 50010-2010（2024 年局部修订）。</span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onViewDetails}
          className="whitespace-nowrap rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 md:px-2.5 md:py-1"
        >
          查看详情
        </button>
        <button
          type="button"
          onClick={handleClose}
          aria-label="关闭提示"
          className="rounded-md p-1 text-sm leading-none text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default StandardStatusNotice;
