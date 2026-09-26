import { isUsableTextLayer } from './local-pages';

export interface ExtractedPage {
  page: number;
  totalPages: number;
  text: string;
  method: 'text' | 'ocr';
}

export type ExtractionMode = 'auto' | 'ocr';

export async function extractPdfPages(
  data: ArrayBuffer,
  start: number,
  end: number,
  mode: ExtractionMode,
  onPage: (page: ExtractedPage) => Promise<void>,
  shouldStop: () => boolean,
  onStatus?: (status: string) => void,
): Promise<number> {
  onStatus?.('正在解析 PDF');
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  let ocrWorker: Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>> | null = null;
  try {
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start ||
      end > pdf.numPages || end - start >= 12) {
      throw new Error(`页码范围应在 1–${pdf.numPages} 内，单次最多 12 页`);
    }
    for (let number = start; number <= end; number += 1) {
      if (shouldStop()) break;
      onStatus?.(`正在读取第 ${number} / ${pdf.numPages} 页`);
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      let text = content.items.map(item => 'str' in item ? item.str : '').join(' ').trim();
      let method: 'text' | 'ocr' = 'text';
      if (mode === 'ocr' || !isUsableTextLayer(text)) {
        method = 'ocr';
        if (!ocrWorker) {
          onStatus?.('正在加载中文 OCR 模型（首次使用需要下载）');
          const { createWorker } = await import('tesseract.js');
          ocrWorker = await createWorker('chi_sim');
        }
        onStatus?.(`正在 OCR 识别第 ${number} / ${pdf.numPages} 页`);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('无法创建 PDF 页面画布');
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        text = (await ocrWorker.recognize(canvas)).data.text.trim();
        canvas.width = 0;
        canvas.height = 0;
      }
      await onPage({ page: number, totalPages: pdf.numPages, text, method });
      page.cleanup();
    }
    return pdf.numPages;
  } finally {
    if (ocrWorker) await ocrWorker.terminate();
    await pdf.destroy();
  }
}
