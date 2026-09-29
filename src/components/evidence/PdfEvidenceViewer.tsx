import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(pageNumber);

  const renderPage = useCallback(async (page: number, s: number) => {
    if (!canvasRef.current) return;
    setLoading(true);
    setError(null);
    try {
      // 动态加载 pdfjs，避免 jsdom 测试环境卡 worker
      const pdfjsLib = await import('pdfjs-dist');
      // 用 document.baseURI 把相对路径解析为绝对路径，避免子路径部署时 404
      const resolvedPdfUrl = new URL(pdfUrl, document.baseURI).href;
      const resolvedWorkerUrl = new URL('pdfs/pdf.worker.min.mjs', document.baseURI).href;
      pdfjsLib.GlobalWorkerOptions.workerSrc = resolvedWorkerUrl;
      const doc = await pdfjsLib.getDocument({ url: resolvedPdfUrl }).promise;
      setTotalPages(doc.numPages);
      const clampedPage = Math.max(1, Math.min(page, doc.numPages));
      const pdfPage = await doc.getPage(clampedPage);
      const viewport = pdfPage.getViewport({ scale: s });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await pdfPage.render({ canvasContext: ctx, viewport, canvas } as any).promise;
      setCurrentPage(clampedPage);
    } catch (e) {
      setError('PDF 加载失败');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [pdfUrl]);

  useEffect(() => {
    renderPage(pageNumber, scale);
  }, [pageNumber, scale, renderPage]);

  return (
    <div className="mt-3 p-3 bg-white border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <span className="text-xs font-medium text-blue-700">
          PDF 原文 · {codeLabel} 第 {clause} 条 · 第 {currentPage} 页 / 共 {totalPages} 页
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.3))}
            className="px-2 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200"
          >−</button>
          <button
            onClick={() => setScale(s => Math.min(3, s + 0.3))}
            className="px-2 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200"
          >+</button>
          <button
            onClick={() => renderPage(currentPage - 1, scale)}
            disabled={currentPage <= 1}
            className="px-2 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40"
          >上一页</button>
          <button
            onClick={() => renderPage(currentPage + 1, scale)}
            disabled={currentPage >= totalPages}
            className="px-2 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40"
          >下一页</button>
        </div>
      </div>
      {loading && <p className="text-xs text-gray-400 text-center py-4">PDF 渲染中…</p>}
      {error && <p className="text-xs text-red-500 text-center py-4">{error}</p>}
      <div className="overflow-x-auto">
        <canvas ref={canvasRef} className="mx-auto" style={{ maxWidth: '100%' }} />
      </div>
      <p className="text-xs text-gray-400 mt-2">定位状态：PAGE_LOCATED（已定位至 PDF 页，条文区域坐标待建立）</p>
    </div>
  );
};

export default PdfEvidenceViewer;
