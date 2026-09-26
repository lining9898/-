export interface LocalCodePage {
  id: string;
  documentId: string;
  fileName: string;
  codeNumber: string;
  edition: string;
  page: number;
  totalPages: number;
  text: string;
  method: 'text' | 'ocr';
  reviewStatus: 'REVIEW_REQUIRED';
}

export interface LocalPageHit {
  page: LocalCodePage;
  score: number;
}

const DB_NAME = 'structural-code-local-pages';
const STORE_NAME = 'pages';

export function isUsableTextLayer(text: string): boolean {
  const compact = text.replace(/\s/g, '');
  const han = compact.match(/\p{Script=Han}/gu)?.length ?? 0;
  const corrupt = compact.match(/[\u0000-\u001f\ufffd]/gu)?.length ?? 0;
  return compact.length >= 30 && han >= 10 && han / compact.length >= 0.15 &&
    corrupt / compact.length < 0.02;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '').replace(/[‐‑–—]/g, '-');
}

function queryTerms(query: string): string[] {
  const parts = normalize(query).match(/\d+(?:\.\d+){2}|[\p{Script=Han}]+|[a-z]+\d*/gu) ?? [];
  return [...new Set(parts.flatMap(part => {
    if (!/\p{Script=Han}/u.test(part) || part.length < 2) return [part];
    return Array.from({ length: part.length - 1 }, (_, index) => part.slice(index, index + 2));
  }))];
}

export function rankLocalPages(query: string, pages: readonly LocalCodePage[], limit = 8): LocalPageHit[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const terms = queryTerms(trimmed);
  if (!terms.length) return [];
  const exactClause = normalize(trimmed).match(/\d+\.\d+\.\d+/)?.[0];
  return pages.map(page => {
    const haystack = normalize(`${page.codeNumber}${page.edition}${page.text}`);
    if (exactClause && !haystack.includes(exactClause)) return { page, score: 0 };
    const hits = terms.filter(term => haystack.includes(term)).length;
    return { page, score: hits / terms.length };
  }).filter(hit => hit.score >= 0.5)
    .sort((a, b) => b.score - a.score || a.page.fileName.localeCompare(b.page.fileName) || a.page.page - b.page.page)
    .slice(0, limit);
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('documentId', 'documentId');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadLocalPages(): Promise<LocalCodePage[]> {
  const database = await openDatabase();
  if (!database) return [];
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result as LocalCodePage[]);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export async function saveLocalPages(pages: readonly LocalCodePage[]): Promise<void> {
  if (!pages.length) return;
  const database = await openDatabase();
  if (!database) throw new Error('当前浏览器不支持本地索引存储');
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      for (const page of pages) store.put(page);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    window.dispatchEvent(new Event('local-codes-updated'));
  } finally {
    database.close();
  }
}

export async function deleteLocalDocument(documentId: string): Promise<void> {
  const database = await openDatabase();
  if (!database) return;
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.index('documentId').getAllKeys(documentId);
      request.onsuccess = () => {
        for (const key of request.result) store.delete(key);
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    window.dispatchEvent(new Event('local-codes-updated'));
  } finally {
    database.close();
  }
}

export async function hashDocument(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
