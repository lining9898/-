import React from 'react';
import { clauseLocators, searchClauses, sourceCode, sourcePdfUrl } from '../../codes/clause-index';

interface CodeSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
}

const CodeSearch: React.FC<CodeSearchProps> = ({ query, onQueryChange }) => {
  const results = searchClauses(query);

  return (
    <section className="max-w-5xl mx-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">条文检索</h2>
        <p className="text-sm text-gray-500 mt-1">{sourceCode.name} {sourceCode.number}-{sourceCode.edition}</p>
      </header>

      <label htmlFor="clause-query" className="block text-sm font-medium text-gray-700 mb-2">条文号或关键词</label>
      <input
        id="clause-query"
        type="search"
        value={query}
        onChange={event => onQueryChange(event.target.value)}
        placeholder="例如 8.5.1、T形梁、最小配筋"
        className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <p className="text-sm text-gray-600 mt-4 mb-3">
        {results.length} 条结果 · 当前仅收录 {clauseLocators.length} 条已定位条文，条文原文和计算依据仍待校核
      </p>

      {results.length === 0 ? (
        <p className="border-t border-gray-200 py-6 text-sm text-gray-500">索引中没有匹配的条文。请核对条文号或尝试其他关键词。</p>
      ) : (
        <div className="divide-y divide-gray-200 border-y border-gray-200 bg-white">
          {results.map(locator => (
            <div key={locator.clause} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <h3 className="font-semibold text-gray-800">第 {locator.clause} 条</h3>
                <p className="text-sm text-gray-600 mt-1">源 PDF 起始页：{locator.pdfPage} / {sourceCode.totalPages} · 原文待校核</p>
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
        </div>
      )}
    </section>
  );
};

export default CodeSearch;
