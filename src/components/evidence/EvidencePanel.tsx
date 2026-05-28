import React from 'react';
import { Evidence } from '../../types/evidence';

interface EvidencePanelProps {
  evidence: Evidence[];
}

const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence }) => {
  // 去重
  const unique = evidence.filter(
    (e, i, arr) => arr.findIndex(x => x.clause === e.clause && x.codeNumber === e.codeNumber) === i
  );

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 mb-4">规范依据</h3>

      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
        <p className="text-sm text-orange-700 font-medium">
          当前所有规范依据均标记为"待规范原文校核"
        </p>
        <p className="text-xs text-orange-600 mt-1">
          待提供 GB 50010 规范 PDF 后，将逐条校核条文号、条文原文和页码。
        </p>
      </div>

      {unique.length === 0 ? (
        <p className="text-sm text-gray-400">暂无规范依据记录</p>
      ) : (
        <div className="space-y-3">
          {unique.map((e, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">
                  {e.codeNumber} {e.clause}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  e.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                  e.verificationStatus === 'REVIEW_REQUIRED' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {e.verificationStatus === 'VERIFIED' ? '已校核' :
                   e.verificationStatus === 'REVIEW_REQUIRED' ? '待校核' : '未验证'}
                </span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>规范名称：{e.codeName}</div>
                <div>版本：{e.edition || '待填写'}</div>
                <div>条文原文：{e.originalText}</div>
                <div>PDF 页码：{e.pdfPage ?? '待填写'}</div>
                <div>来源文件：{e.sourceFile ?? '未导入'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EvidencePanel;
