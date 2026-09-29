import React, { useState, useRef } from 'react';
import { INITIAL_REGISTRY } from '../../codes/initialData';
import type { ClauseEvidence, VerificationAuditLog, CodeRegistry, PdfFileRecord } from '../../codes/registry';
import { computeEvidenceHash } from '../../codes/registry';

const statusColor: Record<string, string> = {
  VERIFIED: 'bg-green-100 text-green-700',
  REVIEW_REQUIRED: 'bg-amber-100 text-amber-700',
  UNVERIFIED: 'bg-gray-100 text-gray-600',
  CONFLICT: 'bg-red-100 text-red-700',
};

const CodeReviewWorkbench: React.FC = () => {
  const [registry, setRegistry] = useState<CodeRegistry>(INITIAL_REGISTRY);
  const [selectedClause, setSelectedClause] = useState<ClauseEvidence | null>(null);
  const [search, setSearch] = useState('');
  const [editText, setEditText] = useState('');
  const [pdfPageInput, setPdfPageInput] = useState<string>('');
  const [pdfFiles, setPdfFiles] = useState<PdfFileRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredClauses = registry.clauses.filter((c: any) =>
    !search || c.clause.includes(search) || c.codeNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (clause: ClauseEvidence) => {
    setSelectedClause(clause);
    setEditText(clause.originalText);
    setPdfPageInput(clause.pdfPage?.toString() || '');
  };

  /** PDF 文件导入：计算 SHA-256 */
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    const record: PdfFileRecord = {
      fileId: `pdf-${Date.now()}`,
      fileName: file.name,
      sha256: hashHex,
      fileSize: file.size,
      pageCount: 0,
      importedAt: new Date().toISOString(),
      boundEditionId: 'GB50010-2010-2015',
    };
    setPdfFiles(prev => [...prev, record]);
    alert(`PDF 已导入: ${file.name}\nSHA-256: ${hashHex.slice(0, 32)}...`);
  };

  /** 修改条文内容时自动失效 VERIFIED */
  const handleEditTextChange = (newText: string) => {
    setEditText(newText);
    if (selectedClause?.verificationStatus === 'VERIFIED' && newText !== selectedClause.originalText) {
      const newLogs = [...registry.auditLogs, {
        logId: `log-${Date.now()}`,
        evidenceId: selectedClause.evidenceId,
        action: 'REQUEST_REVIEW' as const,
        fromStatus: 'VERIFIED',
        toStatus: 'REVIEW_REQUIRED',
        operator: 'system-auto',
        timestamp: new Date().toISOString(),
        notes: '条文内容被修改，VERIFIED 自动失效',
      }];
      setRegistry({
        ...registry,
        clauses: registry.clauses.map((c: any) =>
          c.evidenceId === selectedClause.evidenceId
            ? { ...c, verificationStatus: 'REVIEW_REQUIRED' }
            : c
        ),
        auditLogs: newLogs,
      });
      setSelectedClause(prev => prev ? { ...prev, verificationStatus: 'REVIEW_REQUIRED' } : null);
    }
  };

  const handleVerify = () => {
    if (!selectedClause) return;
    const newHash = computeEvidenceHash(
      pdfFiles[0]?.sha256 || '',
      selectedClause.clause,
      editText,
      pdfPageInput ? parseInt(pdfPageInput) : null
    );
    const log: VerificationAuditLog = {
      logId: `log-${Date.now()}`,
      evidenceId: selectedClause.evidenceId,
      action: 'VERIFY',
      fromStatus: selectedClause.verificationStatus,
      toStatus: 'VERIFIED',
      operator: 'current-user',
      timestamp: new Date().toISOString(),
      notes: `evidenceHash: ${newHash}`,
    };
    setRegistry(prev => ({
      ...prev,
      clauses: prev.clauses.map((c: any) =>
        c.evidenceId === selectedClause.evidenceId
          ? { ...c, verificationStatus: 'VERIFIED' as const, originalText: editText, pdfPage: pdfPageInput ? parseInt(pdfPageInput) : null, verifiedAt: new Date().toISOString() }
          : c
      ),
      auditLogs: [...prev.auditLogs, log],
    }));
    setSelectedClause(prev => prev ? { ...prev, verificationStatus: 'VERIFIED' as const, originalText: editText } : null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左栏 */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-3 border-b">
          <h2 className="font-bold text-lg mb-2">规范证据库</h2>
          <input
            type="text"
            placeholder="搜索条文号..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm mb-2"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handlePdfUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            导入规范 PDF
          </button>
          {pdfFiles.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              已导入: {pdfFiles[pdfFiles.length - 1].fileName}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-auto">
          {registry.editions.map(ed => (
            <div key={ed.editionId} className="mb-2">
              <div className="px-3 py-2 bg-blue-50 font-medium text-sm">
                {ed.codeNumber} {ed.amendment || ed.year}
              </div>
              {filteredClauses.filter((c: any) => c.editionId === ed.editionId).map((clause: any) => (
                <button
                  key={clause.evidenceId}
                  onClick={() => handleSelect(clause)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-l-2 ${selectedClause?.evidenceId === clause.evidenceId ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}
                >
                  <div className="flex justify-between">
                    <span>{clause.clause}</span>
                    <span className={`text-xs px-1.5 rounded ${statusColor[clause.verificationStatus]}`}>
                      {clause.verificationStatus}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{clause.chapter}</div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 中栏 */}
      <div className="flex-1 p-6 overflow-auto">
        {selectedClause ? (
          <div>
            <h2 className="text-xl font-bold">{selectedClause.codeNumber} 第 {selectedClause.clause} 条</h2>
            <p className="text-sm text-gray-500 mb-4">{selectedClause.chapter}</p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">条文原文（从 PDF 复制粘贴）</label>
              <textarea
                value={editText}
                onChange={e => handleEditTextChange(e.target.value)}
                rows={8}
                className="w-full border rounded p-3 text-sm font-mono"
              />
              {selectedClause.verificationStatus === 'VERIFIED' && editText !== selectedClause.originalText && (
                <p className="text-xs text-red-600 mt-1">⚠ 原文已修改，VERIFIED 已自动失效</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">PDF 页码</label>
              <input
                type="number"
                value={pdfPageInput}
                onChange={e => setPdfPageInput(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-32"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><b>证据指纹:</b> <code className="text-xs">{computeEvidenceHash(pdfFiles[0]?.sha256 || '', selectedClause.clause, editText, pdfPageInput ? parseInt(pdfPageInput) : null)}</code></div>
              <div><b>关联 Skill:</b> {selectedClause.linkedSkills?.join(', ')}</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-20">从左侧选择条文</div>
        )}
      </div>

      {/* 右栏 */}
      <div className="w-96 border-l bg-white p-4">
        <h3 className="font-bold mb-3">人工确认操作</h3>
        {selectedClause && (
          <>
            <div className="mb-3 p-3 bg-gray-50 rounded text-sm">
              当前状态: <span className={`px-1.5 rounded ${statusColor[selectedClause.verificationStatus]}`}>{selectedClause.verificationStatus}</span>
            </div>
            <button
              onClick={handleVerify}
              className="w-full py-2 bg-green-600 text-white rounded text-sm font-medium mb-2"
            >
              确认 VERIFIED
            </button>
            <div className="mt-4">
              <h4 className="font-semibold text-sm mb-2">审计记录</h4>
              <div className="text-xs text-gray-500 space-y-1">
                {registry.auditLogs.filter((l: any) => l.evidenceId === selectedClause.evidenceId).map((log: any) => (
                  <div key={log.logId} className="p-1 bg-gray-50 rounded">
                    {log.action}: {log.fromStatus} → {log.toStatus}
                    <br />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CodeReviewWorkbench;
