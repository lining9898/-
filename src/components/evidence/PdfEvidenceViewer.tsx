import React from 'react';

interface PdfEvidenceViewerProps {
  pdfUrl: string;
  pageNumber: number | null;
  clause: string;
  codeLabel: string;
}

// PDF 完整页面图片映射（从真实 PDF 渲染，避免手机 WebView 触发下载）
const PAGE_IMAGE_MAP: Record<number, string> = {
  34: 'evidence-assets/gb50010-2010-2015/pages/p34.jpg',
  35: 'evidence-assets/gb50010-2010-2015/pages/p35.jpg',
  38: 'evidence-assets/gb50010-2010-2015/pages/p38.jpg',
  40: 'evidence-assets/gb50010-2010-2015/pages/p40.jpg',
  52: 'evidence-assets/gb50010-2010-2015/pages/p52.jpg',
  53: 'evidence-assets/gb50010-2010-2015/pages/p53.jpg',
  55: 'evidence-assets/gb50010-2010-2015/pages/p55.jpg',
  56: 'evidence-assets/gb50010-2010-2015/pages/p56.jpg',
  124: 'evidence-assets/gb50010-2010-2015/pages/p124.jpg',
};

const PdfEvidenceViewer: React.FC<PdfEvidenceViewerProps> = ({
  pdfUrl,
  pageNumber,
  clause,
  codeLabel,
}) => {
  const imagePath = pageNumber ? PAGE_IMAGE_MAP[pageNumber] : undefined;
  const imageUrl = imagePath ? new URL(imagePath, document.baseURI).href : null;
  const pdfPage = pageNumber ?? 1;
  const pdfPageUrl = `${new URL(pdfUrl, document.baseURI).href}#page=${pdfPage}&toolbar=0`;

  return (
    <div className="mt-3 p-3 bg-white border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-blue-700">
          PDF 原页 · {codeLabel} 第 {clause} 条 · {pageNumber ? `第 ${pageNumber} 页` : '页码未登记（从首页开始）'}
        </span>
        <div className="flex items-center gap-3">
          {imageUrl && (
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              放大页面图 ↗
            </a>
          )}
          <a
            href={pdfPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            打开 PDF 原页 ↗
          </a>
        </div>
      </div>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${codeLabel} 第 ${pageNumber} 页`}
          className="w-full border border-gray-200 rounded"
        />
      ) : (
        <iframe
          title={`${codeLabel} ${pageNumber ? `第 ${pageNumber} 页` : '规范原文'}`}
          src={pdfPageUrl}
          className="h-[70vh] w-full rounded border border-gray-200 bg-gray-50"
          loading="lazy"
        />
      )}
      <p className="text-xs text-gray-400 mt-2">
        优先显示仓库内的页面截图；缺少截图时直接嵌入对应 PDF 原页。
      </p>
    </div>
  );
};

export default PdfEvidenceViewer;
