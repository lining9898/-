import React, { useEffect, useRef, useState } from 'react';
import { deleteLocalDocument, hashDocument, loadLocalPages, LocalCodePage, saveLocalPages } from '../../codes/local-pages';
import { ExtractionMode, extractPdfPages } from '../../codes/pdf-import';

interface LocalCodeImportProps {
  onOpenSearch: () => void;
}

const LocalCodeImport: React.FC<LocalCodeImportProps> = ({ onOpenSearch }) => {
  const [file, setFile] = useState<File | null>(null);
  const [codeNumber, setCodeNumber] = useState('');
  const [edition, setEdition] = useState('');
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(3);
  const [mode, setMode] = useState<ExtractionMode>('auto');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [recent, setRecent] = useState<LocalCodePage[]>([]);
  const [saved, setSaved] = useState<LocalCodePage[]>([]);
  const [pdfUrl, setPdfUrl] = useState('');
  const stopRef = useRef(false);

  const refreshSaved = async () => setSaved(await loadLocalPages());
  useEffect(() => { if (typeof indexedDB !== 'undefined') void refreshSaved(); }, []);
  useEffect(() => {
    if (!file) { setPdfUrl(''); return; }
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const run = async () => {
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end - start >= 12) {
      setError('请输入有效页码，单次最多识别 12 页');
      return;
    }
    if (!file || !/\.pdf$/i.test(file.name) || !codeNumber.trim() || !edition.trim()) {
      setError('请选择 PDF 并填写标准编号和版本');
      return;
    }
    setError('');
    setRecent([]);
    setBusy(true);
    stopRef.current = false;
    try {
      setProgress('正在读取 PDF');
      const data = await file.arrayBuffer();
      const documentId = await hashDocument(data);
      await extractPdfPages(data, start, end, mode, async extracted => {
        const page: LocalCodePage = {
          id: `${documentId}:${extracted.page}`,
          documentId,
          fileName: file.name,
          codeNumber: codeNumber.trim(),
          edition: edition.trim(),
          page: extracted.page,
          totalPages: extracted.totalPages,
          text: extracted.text,
          method: extracted.method,
          reviewStatus: 'REVIEW_REQUIRED',
        };
        await saveLocalPages([page]);
        setRecent(previous => [...previous, page]);
        setProgress(`已处理第 ${extracted.page} / ${extracted.totalPages} 页`);
      }, () => stopRef.current, setProgress);
      setProgress(stopRef.current ? '已停止；完成的页面已保存' : '本次识别完成');
      await refreshSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'PDF 识别失败');
    } finally {
      setBusy(false);
    }
  };

  const documents = Array.from(new Map(saved.map(page => [page.documentId, page])).values())
    .map(page => ({ ...page, count: saved.filter(item => item.documentId === page.documentId).length }));

  return <section className="max-w-5xl mx-auto space-y-5">
    <header>
      <h2 className="text-2xl font-bold text-gray-800">本地规范识别</h2>
      <p className="text-sm text-gray-500 mt-1">PDF 页码索引 · OCR 草稿 · REVIEW_REQUIRED</p>
    </header>
    <p className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      原 PDF 不上传服务器；页面文字仅保存在当前浏览器。首次 OCR 会下载中文识别模型。公式、表格与条文编号须对照原页人工核验，识别结果不能直接作为设计依据。
    </p>
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] gap-6">
      <div className="space-y-3">
        <label className="block text-sm text-gray-700">
          <span className="block mb-1">规范 PDF</span>
          <input type="file" accept="application/pdf,.pdf" onChange={event => setFile(event.target.files?.[0] ?? null)}
            className="w-full text-sm" />
        </label>
        <label className="block text-sm text-gray-700">
          <span className="block mb-1">标准编号</span>
          <input value={codeNumber} onChange={event => setCodeNumber(event.target.value)} placeholder="例如 GB/T 50010-2010"
            className="w-full border border-gray-300 rounded px-3 py-2" />
        </label>
        <label className="block text-sm text-gray-700">
          <span className="block mb-1">版本</span>
          <input value={edition} onChange={event => setEdition(event.target.value)} placeholder="例如 2024 局部修订"
            className="w-full border border-gray-300 rounded px-3 py-2" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-gray-700">
            <span className="block mb-1">起始 PDF 页</span>
            <input type="number" min="1" step="1" value={start} onChange={event => setStart(Number(event.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2" />
          </label>
          <label className="block text-sm text-gray-700">
            <span className="block mb-1">结束 PDF 页</span>
            <input type="number" min="1" step="1" value={end} onChange={event => setEnd(Number(event.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2" />
          </label>
        </div>
        <fieldset>
          <legend className="text-sm text-gray-700 mb-1">识别方式</legend>
          <div className="flex border border-gray-300 rounded overflow-hidden text-sm">
            {([['auto', '自动判断'], ['ocr', '强制 OCR']] as const).map(([value, label]) =>
              <label key={value} className={`flex-1 text-center py-2 cursor-pointer ${mode === value ? 'bg-blue-700 text-white' : 'bg-white text-gray-700'}`}>
                <input type="radio" className="sr-only" name="extraction-mode" checked={mode === value} onChange={() => setMode(value)} />
                {label}
              </label>)}
          </div>
        </fieldset>
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={() => void run()}
            className="bg-blue-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50">开始识别</button>
          {busy && <button type="button" onClick={() => { stopRef.current = true; setProgress('当前页完成后停止'); }}
            className="border border-gray-300 px-4 py-2 rounded text-sm">停止</button>}
        </div>
        {progress && <p role="status" className="text-sm text-gray-600">{progress}</p>}
        {error && <p role="alert" className="text-sm text-red-700 border border-red-200 bg-red-50 p-3">{error}</p>}
      </div>
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
            <h3 className="text-sm font-bold text-gray-700">本次页面</h3>
            <button type="button" onClick={onOpenSearch} className="text-sm text-blue-700 underline">检索本机索引</button>
          </div>
          {recent.length === 0 && <p className="text-sm text-gray-500 py-4">暂无识别结果</p>}
          <div className="divide-y divide-gray-200">
            {recent.map(page => <article key={page.id} className="py-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-medium">PDF 第 {page.page} 页 · {page.method === 'ocr' ? 'OCR' : '文字层'} · 待人工核对</p>
                {pdfUrl && <a href={`${pdfUrl}#page=${page.page}`} target="_blank" rel="noreferrer" className="text-blue-700 underline">对照原页</a>}
              </div>
              <p className="text-gray-600 mt-1 whitespace-pre-wrap break-words max-h-40 overflow-auto">{page.text || '未识别到文字'}</p>
            </article>)}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-700 border-b border-gray-200 pb-2">本机已导入规范</h3>
          {documents.length === 0 && <p className="text-sm text-gray-500 py-4">暂无本机规范</p>}
          <div className="divide-y divide-gray-200">
            {documents.map(document => <div key={document.documentId} className="py-3 flex flex-wrap items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-gray-800 break-words">{document.codeNumber} · {document.edition}</p>
                <p className="text-gray-500 break-words">{document.fileName} · {document.count} / {document.totalPages} 页 · REVIEW_REQUIRED</p>
              </div>
              <button type="button" onClick={async () => {
                if (!window.confirm(`删除本机索引：${document.fileName}？原 PDF 不受影响。`)) return;
                await deleteLocalDocument(document.documentId);
                await refreshSaved();
              }} className="text-red-700 underline">删除索引</button>
            </div>)}
          </div>
        </div>
      </div>
    </div>
  </section>;
};

export default LocalCodeImport;
