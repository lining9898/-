import React, { useState } from 'react';
import type { CalculationResult } from '../../types/calculation';
import { buildReviewPackage, generateReviewPrompt, type ReviewResult } from '../../ai-review';
import { callDeepSeekReview } from '../../ai-review/providers/deepseek';
import { getApiKey, setApiKey, clearApiKey, hasApiKey } from '../../ai-review/providers/keyStore';

interface Props {
  result: CalculationResult;
  title?: string;
  internalMechanics?: boolean;
  magnitudeHighRisk?: boolean;
}

const DeepSeekReviewButton: React.FC<Props> = ({ result, title, internalMechanics, magnitudeHighRisk }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [keyInput, setKeyInput] = useState(getApiKey());
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [dataWarning, setDataWarning] = useState(false);

  const handleReview = async () => {
    setError('');
    setReviewResult(null);

    // 验证 Key
    if (!keyInput.trim()) {
      setError('请输入 DeepSeek API Key');
      return;
    }
    setApiKey(keyInput.trim());

    // 数据外发确认
    if (!dataWarning) {
      setDataWarning(true);
      return;
    }

    setLoading(true);
    try {
      const pkg = buildReviewPackage(result, title, { internalMechanics, magnitudeHighRisk });
      const prompt = generateReviewPrompt(pkg);
      const callResult = await callDeepSeekReview(prompt, { apiKey: keyInput.trim() });
      if (callResult.ok && callResult.result) {
        setReviewResult(callResult.result);
      } else {
        setError(callResult.error || '复核失败');
      }
    } catch (e: any) {
      setError(`请求异常: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearKey = () => {
    setKeyInput('');
    clearApiKey();
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="px-4 py-3 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        title="使用 DeepSeek API 进行在线 AI 复核"
      >
        DeepSeek 在线复核
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDialog(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">DeepSeek 在线 AI 复核</h3>
              <button onClick={() => setShowDialog(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="px-4 py-2 bg-blue-50 text-xs text-blue-800 border-b">
              DeepSeek API Key 由用户自行提供，API 调用费用由 DeepSeek 向用户收取。
              Key 仅保存在当前会话（sessionStorage），关闭页面后清除，不会上传到本平台服务器。
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* API Key 输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DeepSeek API Key</label>
                <div className="flex gap-2">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1 border rounded px-3 py-2 text-sm"
                  />
                  <button onClick={() => setShowKey(v => !v)} className="px-3 py-2 text-sm bg-gray-100 rounded">
                    {showKey ? '隐藏' : '显示'}
                  </button>
                  <button onClick={handleClearKey} className="px-3 py-2 text-sm bg-gray-100 rounded text-red-600">
                    清除
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">在 platform.deepseek.com 获取 API Key</p>
              </div>

              {/* 数据外发确认 */}
              {!dataWarning && !loading && !reviewResult && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                  点击"开始复核"后，本次结构计算数据（尺寸、荷载、材料、计算过程）将发送至 DeepSeek 进行 AI 复核。
                </div>
              )}

              {/* 错误 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* 加载中 */}
              {loading && (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-pulse">DeepSeek 复核中，请稍候...</div>
                </div>
              )}

              {/* 结果 */}
              {reviewResult && (
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg border ${
                    reviewResult.status === 'PASS' ? 'bg-green-50 border-green-200' :
                    reviewResult.status === 'FAIL' ? 'bg-red-50 border-red-200' :
                    'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="font-bold text-lg">复核状态: {reviewResult.status}</div>
                    <div className="text-sm mt-1">{reviewResult.summary}</div>
                    <div className="text-xs text-gray-500 mt-2">复核人: {reviewResult.reviewer}</div>
                  </div>

                  {reviewResult.issues.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">问题清单 ({reviewResult.issues.length})</h4>
                      {reviewResult.issues.map((iss, i) => (
                        <div key={i} className="border rounded p-3 mb-2 text-sm">
                          <div className="flex gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              iss.severity === 'BLOCKER' ? 'bg-red-600 text-white' :
                              iss.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                              iss.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>{iss.severity}</span>
                            <span className="text-xs text-gray-400 self-center">{iss.category}</span>
                          </div>
                          <div className="font-medium mt-1">{iss.title}</div>
                          <div className="text-gray-600 mt-1">{iss.description}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-400">
                    注意：AI 复核结果仅供参考，不改变本平台 Evidence 验证状态。最终设计仍需结构工程师确认。
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex gap-3">
              <button
                onClick={handleReview}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {loading ? '复核中...' : dataWarning ? '开始复核' : '确认数据外发并开始'}
              </button>
              <button
                onClick={() => setShowDialog(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
              >
                关闭
              </button>
              <span className="text-xs text-gray-400 self-center ml-auto">
                失败后仍可使用"复制给 AI 复核"
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeepSeekReviewButton;
