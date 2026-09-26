import React, { useEffect, useState } from 'react';
import { clauseLocators, searchClauses, sourceCode, sourcePdfUrl } from '../../codes/clause-index';
import { ruleCorpus } from '../../codes/rule-corpus';
import { retrieveRules } from '../../codes/retrieve-rules';
import { auditRule } from '../../audit/function-audit';
import { loadLocalPages, LocalPageHit, rankLocalPages } from '../../codes/local-pages';

interface CodeSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
}

const CodeSearch: React.FC<CodeSearchProps> = ({ query, onQueryChange }) => {
  const [localHits, setLocalHits] = useState<LocalPageHit[]>([]);
  const [localPageCount, setLocalPageCount] = useState(0);
  useEffect(() => {
    if (typeof indexedDB === 'undefined') return;
    let active = true;
    const refresh = async () => {
      try {
        const pages = await loadLocalPages();
        if (active) {
          setLocalPageCount(pages.length);
          setLocalHits(rankLocalPages(query, pages));
        }
      } catch {
        if (active) {
          setLocalPageCount(0);
          setLocalHits([]);
        }
      }
    };
    void refresh();
    window.addEventListener('local-codes-updated', refresh);
    return () => {
      active = false;
      window.removeEventListener('local-codes-updated', refresh);
    };
  }, [query]);
  const retrieved = retrieveRules(query, ruleCorpus.length);
  const enrichedClauses = new Set(retrieved.filter(item => !item.rule.source).map(item => item.rule.clause));
  const otherCode = /GB\s*\d{5}/i.test(query) && !/GB\s*50010/i.test(query);
  const locatorOnly = otherCode ? [] : searchClauses(query).filter(item => !enrichedClauses.has(item.clause));
  const resultCount = retrieved.length + locatorOnly.length + localHits.length;

  return (
    <section className="max-w-5xl mx-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">规范检索与函数反查</h2>
        <p className="text-sm text-gray-500 mt-1">多规范条文索引 · {sourceCode.name} {sourceCode.number}-{sourceCode.edition}</p>
      </header>

      <label htmlFor="clause-query" className="block text-sm font-medium text-gray-700 mb-2">条文号或关键词</label>
      <input
        id="clause-query"
        type="search"
        value={query}
        onChange={event => onQueryChange(event.target.value)}
        placeholder="例如 6.3.1、细长梁受剪、T形梁最小配筋"
        className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <p className="text-sm text-gray-600 mt-4 mb-3">
        {resultCount} 条结果 · {clauseLocators.length} 条页码定位，其中 {ruleCorpus.length} 条有规则摘要和样例审计 · 本机已导入 {localPageCount} 页；原文校核状态不因检索、OCR 或样例通过而改变
      </p>

      {resultCount === 0 ? (
        <p className="border-t border-gray-200 py-6 text-sm text-gray-500">索引中没有匹配的条文。请核对条文号或尝试其他关键词。</p>
      ) : (
        <div className="divide-y divide-gray-200 border-y border-gray-200 bg-white">
          {retrieved.map(({ rule }) => {
            const probes = auditRule(rule.auditKey ?? rule.clause);
            const code = rule.source?.codeNumber ?? sourceCode.number;
            const edition = rule.source?.edition ?? sourceCode.edition;
            const totalPages = rule.source?.totalPages ?? sourceCode.totalPages;
            const pdfUrl = rule.source ? `${rule.source.pdfUrl}#page=${rule.pdfPages[0]}` : sourcePdfUrl(rule.pdfPages[0]);
            const status = probes.some(probe => probe.status === 'mismatch') ? '发现偏差'
              : probes.some(probe => probe.status === 'not-covered') ? '未覆盖' : '样例一致';
            return (
              <article key={rule.clause} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{code}-{edition} 第 {rule.clause} 条 · {rule.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      源 PDF 起始页：{rule.pdfPages[0]} / {totalPages}
                      {rule.pdfPages.length > 1 && `（续页 ${rule.pdfPages.slice(1).join('、')}）`} · 摘要非规范原文
                    </p>
                  </div>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`打开第 ${rule.clause} 条源 PDF`}
                    className="text-sm font-medium text-blue-700 hover:underline"
                  >
                    打开源 PDF ↗
                  </a>
                </div>
                <p className="text-sm text-gray-700 mt-3">规则摘要（非原文）：{rule.summary}</p>
                <details className="mt-3 border-t border-gray-100 pt-3" open={Boolean(query.trim())}>
                  <summary className="cursor-pointer text-sm font-medium text-gray-800">
                    函数反查 · <span className={status === '发现偏差' ? 'text-red-700' : status === '未覆盖' ? 'text-amber-700' : 'text-green-700'}>{status}</span> · {rule.calculator}
                  </summary>
                  <div className="mt-3 space-y-2">
                    {probes.map(probe => (
                      <div key={probe.name} className={`border-l-2 pl-3 text-sm text-gray-700 ${probe.status === 'mismatch' ? 'border-red-500' : probe.status === 'not-covered' ? 'border-amber-500' : 'border-green-500'}`}>
                        <div className="font-medium">{probe.name} · {probe.status === 'matched' ? '样例一致' : probe.status === 'mismatch' ? '发现偏差' : '未覆盖'}</div>
                        <div className="text-gray-500">输入：{probe.input}</div>
                        {probe.expected !== null && (
                          <div>期望 {probe.expected} {probe.unit} · 函数 {probe.actual ?? '无结果'} {probe.unit}</div>
                        )}
                        {probe.note && <div className="text-gray-600">{probe.note}</div>}
                      </div>
                    ))}
                  </div>
                </details>
              </article>
            );
          })}
          {locatorOnly.map(locator => (
            <div key={locator.clause} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <h3 className="font-semibold text-gray-800">第 {locator.clause} 条</h3>
                <p className="text-sm text-gray-600 mt-1">源 PDF 起始页：{locator.pdfPage} / {sourceCode.totalPages} · 仅页码定位，尚无函数审计</p>
              </div>
              <a
                href={sourcePdfUrl(locator.pdfPage)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`打开第 ${locator.clause} 条源 PDF`}
                className="text-sm font-medium text-blue-700 hover:underline"
              >
                打开源 PDF ↗
              </a>
            </div>
          ))}
          {localHits.map(({ page }) => (
            <article key={page.id} className="px-4 py-4">
              <h3 className="font-semibold text-gray-800">{page.codeNumber} · {page.edition} · PDF 第 {page.page} 页</h3>
              <p className="text-sm text-amber-800 mt-1">本机导入 · {page.method === 'ocr' ? 'OCR' : '文字层'} · REVIEW_REQUIRED · 无函数自动审计</p>
              <p className="text-xs text-gray-500 mt-1 break-words">{page.fileName} · 文件 SHA-256：{page.documentId}</p>
              <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap break-words">{page.text.slice(0, 600)}{page.text.length > 600 ? '…' : ''}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default CodeSearch;
