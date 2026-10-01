import React, { useState } from 'react';
import { Evidence } from '../../types/evidence';
import PdfEvidenceViewer from './PdfEvidenceViewer';
import { resolveCalculationNormativeBasis } from '../../normative/calculationBasis';

interface EvidencePanelProps {
  evidence: Evidence[];
  moduleId?: string;
}

const REPOSITORY_RAW = 'https://raw.githubusercontent.com/lining9898/-/master/references/codes';

const PDF_BY_SOURCE: Record<string, string> = {
  GB500072011PDF: `${REPOSITORY_RAW}/GB50007-2011.pdf`,
  GB500172017PDF: `${REPOSITORY_RAW}/GB50017-2017.pdf`,
  GB500092012PDF: `${REPOSITORY_RAW}/GB50009-2012.pdf`,
  GB5001020102015PDF: 'pdfs/gb50010-2010-2015.pdf',
  GB550012021PDF: `${REPOSITORY_RAW}/GB55001-2021.pdf`,
  GB550022021PDF: `${REPOSITORY_RAW}/GB55002-2021.pdf`,
  GB550032021PDF: `${REPOSITORY_RAW}/GB55003-2021.pdf`,
  GB550042021PDF: `${REPOSITORY_RAW}/GB55004-2021.pdf`,
  GB550052021PDF: `${REPOSITORY_RAW}/GB55005-2021.pdf`,
  GB550062021PDF: `${REPOSITORY_RAW}/GB55006-2021.pdf`,
  GB550072021PDF: `${REPOSITORY_RAW}/GB55007-2021.pdf`,
  GB550082021PDF: `${REPOSITORY_RAW}/GB55008-2021.pdf`,
  GB550312022PDF: `${REPOSITORY_RAW}/GB55031-2022.pdf`,
  GBT5001020102024AMENDMENTPDF: `${REPOSITORY_RAW}/GBT50010-2010_2024_amendment.pdf`,
};

const PDF_BY_CODE: Record<string, string> = {
  GB50007: PDF_BY_SOURCE.GB500072011PDF,
  GB50009: PDF_BY_SOURCE.GB500092012PDF,
  GB50010: PDF_BY_SOURCE.GB5001020102015PDF,
  GB50017: PDF_BY_SOURCE.GB500172017PDF,
  GBT500102010: PDF_BY_SOURCE.GBT5001020102024AMENDMENTPDF,
  GB55001: PDF_BY_SOURCE.GB550012021PDF,
  GB55002: PDF_BY_SOURCE.GB550022021PDF,
  GB55003: PDF_BY_SOURCE.GB550032021PDF,
  GB55004: PDF_BY_SOURCE.GB550042021PDF,
  GB55005: PDF_BY_SOURCE.GB550052021PDF,
  GB55006: PDF_BY_SOURCE.GB550062021PDF,
  GB55007: PDF_BY_SOURCE.GB550072021PDF,
  GB55008: PDF_BY_SOURCE.GB550082021PDF,
  GB55031: PDF_BY_SOURCE.GB550312022PDF,
};

// 条文局部截图映射（仅列出仓库内已有的真实 PDF 裁图）
const CLAUSE_IMAGE_MAP: Record<string, string> = {
  'GB50010|6.2.6': 'evidence-assets/gb50010-2010-2015/6.2.6.jpg',
  'GB50010|6.2.7': 'evidence-assets/gb50010-2010-2015/6.2.7.jpg',
  'GB50010|6.2.10': 'evidence-assets/gb50010-2010-2015/6.2.10.jpg',
  'GB50010|6.2.11': 'evidence-assets/gb50010-2010-2015/6.2.11.jpg',
};

const normalizeCode = (code: string) => code.replace(/[^a-z0-9]/gi, '').toUpperCase();

const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence, moduleId }) => {
  const [openFullPdf, setOpenFullPdf] = useState<string | null>(null);
  const basis = moduleId ? resolveCalculationNormativeBasis(moduleId, evidence) : null;

  const unique = evidence.filter(
    (e, i, arr) => arr.findIndex(x => x.clause === e.clause && x.codeNumber === e.codeNumber && x.edition === e.edition) === i
  );
  const pendingCount = unique.filter(e => e.verificationStatus !== 'VERIFIED').length;

  const getPdfUrl = (e: Evidence): string | null => {
    const sourceKey = normalizeCode(e.sourceFile?.split(/[\\/]/).pop() ?? '');
    // 先按证据记录中的具体文件匹配，避免同一规范不同版次误显示为同一 PDF。
    return PDF_BY_SOURCE[sourceKey]
      ?? (e.sourceFile ? null : PDF_BY_CODE[normalizeCode(e.codeNumber)] ?? null);
  };

  const getClauseImage = (e: Evidence): string | null => {
    const key = `${normalizeCode(e.codeNumber)}|${e.clause.trim()}`;
    // 局部截图也只对应 2015 版，不能用它冒充 2024 修订条文。
    return /2015/.test(e.edition) ? CLAUSE_IMAGE_MAP[key] ?? null : null;
  };

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 mb-4">规范依据</h3>
      {basis && <section className="mb-4 rounded border border-blue-200 bg-blue-50 p-4 text-xs text-gray-700">
        <div className="font-semibold text-blue-800">现行规范融合：{basis.status}</div>
        <div className="mt-1 text-gray-500">依据快照 {basis.fingerprint}；规范版本或条文变动后需重新生成计算与复核包。</div>
        <div className="mt-3 space-y-2">
          {basis.standards.map(standard => <div key={standard.codeNumber} className="rounded bg-white p-2 border border-blue-100">
            <div className="font-medium">{standard.designation} · {standard.authorityLevel === 'MANDATORY_GENERAL_CODE' ? '强制性通用规范' : '配套设计标准'}</div>
            <div className="mt-1">{standard.role}；现行版条文：{standard.currentClauses.length ? standard.currentClauses.join('、') : '待映射'}</div>
            {standard.historicalClauses.length > 0 && <div className="mt-1 text-amber-700">历史版计算证据：{standard.historicalClauses.join('、')}</div>}
            <div className="mt-1 text-amber-700">条文融合状态：{standard.clauseEvidenceStatus}</div>
          </div>)}
        </div>
      </section>}

      {pendingCount > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
          <p className="text-sm text-orange-700 font-medium">
            {pendingCount} 条规范依据的项目核验状态待确认；不代表未提供依据或没有原文
          </p>
        </div>
      )}

      {unique.length === 0 ? (
        <p className="text-sm text-gray-400">暂无规范依据记录</p>
      ) : (
        <div className="space-y-3">
          {unique.map((e, i) => {
            const pdfUrl = getPdfUrl(e);
            const imageUrl = getClauseImage(e);
            const viewerKey = `${e.codeNumber}-${e.edition}-${e.clause}`;
            const isFullOpen = openFullPdf === viewerKey;
            const hasPdf = Boolean(pdfUrl);
            const resolvedImage = imageUrl ? new URL(imageUrl, document.baseURI).href : null;

            return (
              <div key={i} className="p-4 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-700">
                    {e.codeNumber} {e.clause}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    e.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                    e.verificationStatus === 'REVIEW_REQUIRED' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {e.verificationStatus === 'VERIFIED' ? '已校核' :
                     e.verificationStatus === 'REVIEW_REQUIRED' ? '待校核' : '未验证'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>规范名称：{e.codeName}</div>
                  <div>版本：{e.edition || '待填写'}</div>
                  <div>{e.pdfPage ? `PDF 第 ${e.pdfPage} 页` : 'PDF 页码未登记'}</div>
                </div>

                {/* 解析条文 */}
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-700">
                  <span className="font-medium text-blue-700">解析条文：</span>
                  {e.originalText}
                </div>

                {/* PDF 原文局部截图 */}
                <div className="mt-2">
                  <span className="text-xs font-medium text-gray-600">PDF 原文：</span>
                  {resolvedImage ? (
                    <div className="mt-1">
                      <img
                        src={resolvedImage}
                        alt={`GB50010 ${e.clause}`}
                        className="w-full border border-gray-300 rounded cursor-zoom-in"
                        onClick={() => window.open(resolvedImage, '_blank')}
                      />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">
                          {e.pdfPage ? `PDF 第 ${e.pdfPage} 页` : 'PDF 页码未登记'}
                        </span>
                        <span className="text-xs text-green-600 font-medium">CLAUSE_LOCATED</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      仓库暂未收录该条文的局部截图；可打开对应 PDF 原页核对。
                    </p>
                  )}
                </div>

                {/* 完整 PDF 原页 */}
                {hasPdf && (
                  <button
                    onClick={() => setOpenFullPdf(isFullOpen ? null : viewerKey)}
                    className="mt-2 px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    {isFullOpen ? '收起完整 PDF' : e.pdfPage ? '查看完整 PDF 原页' : '打开规范 PDF'}
                  </button>
                )}
                {!hasPdf && (
                  <p className="mt-2 text-xs text-gray-400">PDF_SOURCE_MISSING</p>
                )}

                {isFullOpen && hasPdf && (
                  <PdfEvidenceViewer
                    pdfUrl={pdfUrl!}
                    pageNumber={e.pdfPage}
                    clause={e.clause}
                    codeLabel={`${e.codeNumber} ${e.edition}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EvidencePanel;
