import React from 'react';

interface PdfEvidenceViewerProps {
  pdfUrl: string;
  pageNumber: number | null;
  clause: string;
  codeLabel: string;
}

// PDF 完整页面图片映射（从真实 PDF 渲染，避免手机 WebView 触发下载）
const PAGE_IMAGE_MAP: Record<string, Record<number, string>> = {
  'gb50010-2010-2015.pdf': Object.fromEntries(
    [34, 35, 38, 40, 52, 53, 55, 56, 124].map(page =>
      [page, `evidence-assets/gb50010-2010-2015/pages/p${page}.jpg`])
  ),
  'gbt50010-2010_2024_amendment.pdf': Object.fromEntries(
    [6, 7, 14].map(page => [page, `evidence-assets/gbt50010-2024/pages/p${page}.jpg`])
  ),
  'gb55008-2021.pdf': Object.fromEntries(
    [15, 16, 17].map(page => [page, `evidence-assets/gb55008-2021/pages/p${page}.jpg`])
  ),
  'gb55001-2021.pdf': Object.fromEntries(
    [12, 13].map(page => [page, `evidence-assets/gb55001-2021/pages/p${page}.jpg`])
  ),
  'gb50009-2012.pdf': { 20: 'evidence-assets/gb50009-2012/pages/p20.jpg' },
};

export function evidencePageImagePath(pdfUrl: string, pageNumber: number | null): string | null {
  if (pageNumber === null) return null;
  const fileName = pdfUrl.split(/[?#]/)[0].split('/').pop()?.toLowerCase() ?? '';
  return PAGE_IMAGE_MAP[fileName]?.[pageNumber] ?? null;
}

const PdfEvidenceViewer: React.FC<PdfEvidenceViewerProps> = ({
  pdfUrl,
  pageNumber,
  clause,
  codeLabel,
}) => {
  const imagePath = evidencePageImagePath(pdfUrl, pageNumber);
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
