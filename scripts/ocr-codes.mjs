import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, appendFileSync, mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createWorker } from 'tesseract.js';

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : process.argv[index + 1];
}

const inputArg = option('--input');
if (!inputArg) {
  console.error('用法: node scripts/ocr-codes.mjs --input <PDF或目录> [--output <目录>] [--max-pages 12] [--force-ocr]');
  process.exit(1);
}

const input = resolve(inputArg);
const output = resolve(option('--output', join(input.toLowerCase().endsWith('.pdf') ? dirname(input) : input, '.ocr-index')));
const maxPages = Number(option('--max-pages', '12'));
const renderer = option('--pdftoppm', 'pdftoppm');
const forceOcr = process.argv.includes('--force-ocr');
if (!Number.isInteger(maxPages) || maxPages < 1) throw new Error('--max-pages 必须是正整数');
mkdirSync(output, { recursive: true });
const cachePath = join(output, '.tessdata');
mkdirSync(cachePath, { recursive: true });

const files = input.toLowerCase().endsWith('.pdf') ? [input]
  : readdirSync(input).filter(name => extname(name).toLowerCase() === '.pdf').map(name => join(input, name));

function usable(text) {
  const compact = text.replace(/\s/g, '');
  const han = compact.match(/\p{Script=Han}/gu)?.length ?? 0;
  const corrupt = compact.match(/[\u0000-\u001f\ufffd]/gu)?.length ?? 0;
  return compact.length >= 30 && han >= 10 && han / compact.length >= 0.15 &&
    corrupt / compact.length < 0.02;
}

async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

function renderPage(file, page, folder) {
  const prefix = join(folder, `page-${page}`);
  const result = spawnSync(renderer, ['-f', String(page), '-l', String(page), '-r', '180',
    '-singlefile', '-png', file, prefix], { encoding: 'utf8' });
  if (result.error || result.status !== 0 || !existsSync(`${prefix}.png`)) {
    throw new Error(`PDF 第 ${page} 页渲染失败：${result.error?.message ?? result.stderr}`);
  }
  return `${prefix}.png`;
}

async function processFile(file) {
  const documentId = await sha256(file);
  const destination = join(output, `${documentId}.jsonl`);
  const completed = new Set(existsSync(destination) ? readFileSync(destination, 'utf8').split(/\r?\n/)
    .filter(Boolean).map(line => JSON.parse(line).page) : []);
  const pdf = await getDocument({ data: new Uint8Array(readFileSync(file)), useSystemFonts: true }).promise;
  let worker = null;
  let count = 0;
  const temp = mkdtempSync(join(tmpdir(), 'code-ocr-'));
  try {
    console.log(`${basename(file)} | ${pdf.numPages} 页 | SHA-256 ${documentId}`);
    for (let number = 1; number <= pdf.numPages && count < maxPages; number += 1) {
      if (completed.has(number)) continue;
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      let text = content.items.map(item => 'str' in item ? item.str : '').join(' ').trim();
      let method = 'text';
      if (forceOcr || !usable(text)) {
        method = 'ocr';
        worker ??= await createWorker('chi_sim', 1, { cachePath });
        const image = renderPage(file, number, temp);
        try {
          text = (await worker.recognize(image)).data.text.trim();
        } finally {
          unlinkSync(image);
        }
      }
      const record = {
        documentId, fileName: basename(file), page: number, totalPages: pdf.numPages,
        method, reviewStatus: 'REVIEW_REQUIRED', text,
      };
      appendFileSync(destination, `${JSON.stringify(record)}\n`, 'utf8');
      count += 1;
      console.log(`  ${number}/${pdf.numPages} ${method} ${text.length} 字符`);
      page.cleanup();
    }
    console.log(`本次新增 ${count} 页；索引：${destination}`);
  } finally {
    if (worker) await worker.terminate();
    await pdf.destroy();
    for (const name of readdirSync(temp)) unlinkSync(join(temp, name));
    rmdirSync(temp);
  }
}

for (const file of files) await processFile(file);
