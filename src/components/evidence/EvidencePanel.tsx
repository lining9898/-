import React, { useState } from 'react';
import { Evidence } from '../../types/evidence';
import PdfEvidenceViewer from './PdfEvidenceViewer';

interface EvidencePanelProps {
  evidence: Evidence[];
}

// 根据规范编号映射 PDF 文件路径（public/pdfs/ 下，相对 base 路径）
const PDF_MAP: Record<string, string> = {
  'GB 50010': `${import.meta.env.BASE_URL}pdfs/gb50010-2010-2015.pdf`,
};

const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence }) => {
  const [openPdf, setOpenPdf] = useState<string | null>(null);

  // 去重
  const unique = evidence.filter(
    (e, i, arr) => arr.findIndex(x => x.clause === e.clause && x.codeNumber === e.codeNumber) === i
  );
  const pendingCount = unique.filter(e => e.verificationStatus !== 'VERIFIED').length;

  const getPdfUrl = (e: Evidence): string | null => {
    // 标准化 key
    const key = e.codeNumber.replace(/\s+/g, ' ').trim();
    return PDF_MAP[key] ?? null;
  };

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 mb-4">规范依据</h3>

      {pendingCount > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
          <p className="text-sm text-orange-700 font-medium">
            {pendingCount} 条规范依据尚未完成原文校核
          </p>
        </div>
      )}

      {unique.length === 0 ? (
        <p className="text-sm text-gray-400">暂无规范依据记录</p>
      ) : (
        <div className="space-y-3">
          {unique.map((e, i) => {
            const pdfUrl = getPdfUrl(e);
            const viewerKey = `${e.codeNumber}-${e.clause}`;
            const isOpen = openPdf === viewerKey;
            const hasPdf = pdfUrl && e.pdfPage;

            return (
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
                  <div>{e.verificationStatus === 'VERIFIED' ? '条文原文' : '待核验依据摘录'}：{e.originalText}</div>
                  <div>{e.verificationStatus === 'VERIFIED' ? 'PDF 页码' : '待核验 PDF 页码'}：{e.pdfPage ?? '待填写'}</div>
                  <div>来源文件：{e.sourceFile ?? '未导入'}</div>
                </div>

                {hasPdf ? (
                  <button
                    onClick={() => setOpenPdf(isOpen ? null : viewerKey)}
                    className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {isOpen ? '收起 PDF 原文' : '查看 PDF 原文'}
                  </button>
                ) : (
                  <p className="mt-2 text-xs text-gray-400">PDF_SOURCE_MISSING（原始 PDF 暂不可用）</p>
                )}

                {isOpen && hasPdf && (
                  <PdfEvidenceViewer
                    pdfUrl={pdfUrl!}
                    pageNumber={e.pdfPage!}
                    clause={e.clause}
                    codeLabel={`${e.codeNumber} ${e.edition}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EvidencePanel;
