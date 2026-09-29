import React from 'react';

interface PdfEvidenceViewerProps {
  pdfUrl: string;
  pageNumber: number;
  clause: string;
  codeLabel: string;
}

const PdfEvidenceViewer: React.FC<PdfEvidenceViewerProps> = ({
  pdfUrl,
  pageNumber,
  clause,
  codeLabel,
}) => {
  const resolvedUrl = new URL(pdfUrl, document.baseURI).href;
  const src = `${resolvedUrl}#page=${pageNumber}&view=FitH`;

  return (
    <div className="mt-3 p-3 bg-white border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-blue-700">
          PDF 原文 · {codeLabel} 第 {clause} 条 · 第 {pageNumber} 页
        </span>
      </div>
      <iframe
        src={src}
        className="w-full border border-gray-200 rounded"
        style={{ height: '60vh', minHeight: 400 }}
        title={`GB50010 ${clause}`}
      />
      <p className="text-xs text-gray-400 mt-2">定位状态：PAGE_LOCATED（浏览器内置 PDF 查看器，支持缩放/翻页）</p>
    </div>
  );
};

export default PdfEvidenceViewer;
