import React from 'react';

interface PdfEvidenceViewerProps {
  pdfUrl: string;
  pageNumber: number;
  clause: string;
  codeLabel: string;
}

// PDF 完整页面图片映射（从真实 PDF 渲染，避免手机 WebView 触发下载）
const PAGE_IMAGE_MAP: Record<number, string> = {
  52: 'evidence-assets/gb50010-2010-2015/pages/p52.jpg',
  53: 'evidence-assets/gb50010-2010-2015/pages/p53.jpg',
  55: 'evidence-assets/gb50010-2010-2015/pages/p55.jpg',
  56: 'evidence-assets/gb50010-2010-2015/pages/p56.jpg',
};

const PdfEvidenceViewer: React.FC<PdfEvidenceViewerProps> = ({
  pageNumber,
  clause,
  codeLabel,
}) => {
  const imagePath = PAGE_IMAGE_MAP[pageNumber];
  const imageUrl = imagePath ? new URL(imagePath, document.baseURI).href : null;

  return (
    <div className="mt-3 p-3 bg-white border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-blue-700">
          PDF 原页 · {codeLabel} 第 {clause} 条 · 第 {pageNumber} 页
        </span>
        {imageUrl && (
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            放大 ↗
          </a>
        )}
      </div>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`GB50010 p${pageNumber}`}
          className="w-full border border-gray-200 rounded"
        />
      ) : (
        <p className="text-xs text-gray-400">
          该页完整页面图片暂未生成，请使用上方局部条文截图。
        </p>
      )}
      <p className="text-xs text-gray-400 mt-2">
        完整 PDF 页面图像（来自真实 PDF 渲染，站内预览，不触发下载）
      </p>
    </div>
  );
};

export default PdfEvidenceViewer;
