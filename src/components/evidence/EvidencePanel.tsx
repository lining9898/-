import React, { useState } from 'react';
import { Evidence } from '../../types/evidence';
import PdfEvidenceViewer from './PdfEvidenceViewer';

interface EvidencePanelProps {
  evidence: Evidence[];
}

const PDF_MAP: Record<string, string> = {
  'GB 50010': 'pdfs/gb50010-2010-2015.pdf',
};

// 条文局部截图映射（从真实 PDF 裁切生成）
const CLAUSE_IMAGE_MAP: Record<string, string> = {
  'GB 50010|6.2.6': 'evidence-assets/gb50010-2010-2015/6.2.6.jpg',
  'GB 50010|6.2.7': 'evidence-assets/gb50010-2010-2015/6.2.7.jpg',
  'GB 50010|6.2.10': 'evidence-assets/gb50010-2010-2015/6.2.10.jpg',
  'GB 50010|6.2.11': 'evidence-assets/gb50010-2010-2015/6.2.11.jpg',
};

const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence }) => {
  const [openFullPdf, setOpenFullPdf] = useState<string | null>(null);

  const unique = evidence.filter(
    (e, i, arr) => arr.findIndex(x => x.clause === e.clause && x.codeNumber === e.codeNumber) === i
  );
  const pendingCount = unique.filter(e => e.verificationStatus !== 'VERIFIED').length;

  const getPdfUrl = (e: Evidence): string | null => {
    const key = e.codeNumber.replace(/\s+/g, ' ').trim();
    return PDF_MAP[key] ?? null;
  };

  const getClauseImage = (e: Evidence): string | null => {
    const key = `${e.codeNumber}|${e.clause}`;
    return CLAUSE_IMAGE_MAP[key] ?? null;
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
            const imageUrl = getClauseImage(e);
            const viewerKey = `${e.codeNumber}-${e.clause}`;
            const isFullOpen = openFullPdf === viewerKey;
            const hasPdf = pdfUrl && e.pdfPage;
            const resolvedImage = imageUrl ? new URL(imageUrl, document.baseURI).href : null;

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
                </div>

                {/* 解析条文 */}
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-700">
                  <span className="font-medium text-blue-700">解析条文：</span>
                  {e.originalText}
                </div>

                {/* PDF 原文局部截图 */}
                <div className="mt-2">
                  <span className="text-xs font-medium text-gray-600">PDF 原文：</span>
                  {resolvedImage ? (
                    <div className="mt-1">
                      <img
                        src={resolvedImage}
                        alt={`GB50010 ${e.clause}`}
                        className="w-full border border-gray-300 rounded cursor-zoom-in"
                        onClick={() => window.open(resolvedImage, '_blank')}
                      />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">
                          GB 50010-2010（2015年版）PDF 第 {e.pdfPage} 页
                        </span>
                        <span className="text-xs text-green-600 font-medium">CLAUSE_LOCATED</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      已定位 PDF P{e.pdfPage ?? '?'}，条文区域截图待建立
                    </p>
                  )}
                </div>

                {/* 完整 PDF 原页 */}
                {hasPdf && (
                  <button
                    onClick={() => setOpenFullPdf(isFullOpen ? null : viewerKey)}
                    className="mt-2 px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    {isFullOpen ? '收起完整 PDF' : '查看完整 PDF 原页'}
                  </button>
                )}
                {!hasPdf && (
                  <p className="mt-2 text-xs text-gray-400">PDF_SOURCE_MISSING</p>
                )}

                {isFullOpen && hasPdf && (
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
