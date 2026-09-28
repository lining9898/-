import React, { useState } from 'react';
import type { CalculationResult } from '../../types/calculation';
import { buildReviewPackage, generateReviewPrompt } from '../../ai-review';

interface Props {
  result: CalculationResult;
  title?: string;
  internalMechanics?: boolean;
  magnitudeHighRisk?: boolean;
}

const AIReviewButton: React.FC<Props> = ({ result, title, internalMechanics, magnitudeHighRisk }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const prompt = buildReviewPackage(result, title, { internalMechanics, magnitudeHighRisk });
  const text = generateReviewPrompt(prompt);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowPreview(v => !v)}
        className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-blue-700 transition-colors"
        title="生成可复制到 ChatGPT/DeepSeek/Claude 的独立复核包"
      >
        复制给 AI 复核
      </button>
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">AI 独立复核包</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="px-4 py-2 bg-amber-50 text-xs text-amber-800 border-b">
              隐私提醒：复核内容可能包含项目尺寸、荷载、材料及计算数据。粘贴到第三方 AI 前，请确认符合所在单位的数据与保密要求。
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700">{text}</pre>
            </div>
            <div className="p-4 border-t flex gap-3">
              <button
                onClick={handleCopy}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                {copied ? '✓ 已复制' : '复制到剪贴板'}
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
              >
                关闭
              </button>
              <span className="text-xs text-gray-400 self-center ml-auto">
                可粘贴到 ChatGPT / DeepSeek / Claude
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIReviewButton;
