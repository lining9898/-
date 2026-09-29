import React, { useState } from 'react';
import { INITIAL_REGISTRY } from '../../codes/initialData';
import type { ClauseEvidence, VerificationAuditLog, CodeRegistry } from '../../codes/registry';

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

  const filteredClauses = registry.clauses.filter((c: any) =>
    !search || c.clause.includes(search) || c.codeNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (clause: ClauseEvidence) => {
    setSelectedClause(clause);
    setEditText(clause.originalText);
  };

  const handleVerify = () => {
    if (!selectedClause) return;
    const log: VerificationAuditLog = {
      logId: `log-${Date.now()}`,
      evidenceId: selectedClause.evidenceId,
      action: 'VERIFY',
      fromStatus: selectedClause.verificationStatus,
      toStatus: 'VERIFIED',
      operator: 'current-user',
      timestamp: new Date().toISOString(),
    };
    setRegistry(prev => ({
      ...prev,
      clauses: prev.clauses.map((c: any) =>
        c.evidenceId === selectedClause.evidenceId
          ? { ...c, verificationStatus: 'VERIFIED', originalText: editText, verifiedAt: new Date().toISOString() }
          : c
      ),
      auditLogs: [...prev.auditLogs, log],
    }));
    setSelectedClause(prev => prev ? { ...prev, verificationStatus: 'VERIFIED', originalText: editText } : null);
  };

  const handleRequestReview = () => {
    if (!selectedClause) return;
    setRegistry(prev => ({
      ...prev,
      clauses: prev.clauses.map((c: any) =>
        c.evidenceId === selectedClause.evidenceId
          ? { ...c, verificationStatus: 'REVIEW_REQUIRED' }
          : c
      ),
    }));
    setSelectedClause(prev => prev ? { ...prev, verificationStatus: 'REVIEW_REQUIRED' } : null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左栏：规范目录 */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-3 border-b">
          <h2 className="font-bold text-lg mb-2">规范证据库</h2>
          <input
            type="text"
            placeholder="搜索条文号 / 规范编号..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {registry.editions.map((ed: any) => (
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

      {/* 中栏：条文原文 */}
      <div className="flex-1 p-6 overflow-auto">
        {selectedClause ? (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold">{selectedClause.codeNumber} 第 {selectedClause.clause} 条</h2>
              <p className="text-sm text-gray-500">{selectedClause.chapter}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">条文原文</label>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={10}
                className="w-full border rounded p-3 text-sm font-mono"
                placeholder="从 PDF 复制条文原文到此处..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><b>PDF 页码:</b> {selectedClause.pdfPage || '未录入'}</div>
              <div><b>来源文件:</b> {selectedClause.sourceFile || '未录入'}</div>
              <div><b>关联 Skill:</b> {selectedClause.linkedSkills?.join(', ') || '无'}</div>
              <div><b>核验状态:</b> {selectedClause.verificationStatus}</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-20">
            从左侧选择一条条文开始核验
          </div>
        )}
      </div>

      {/* 右栏：操作区 */}
      <div className="w-96 border-l bg-white p-4 flex flex-col">
        <h3 className="font-bold mb-3">人工确认操作</h3>
        {selectedClause ? (
          <>
            <div className="mb-3 p-3 bg-gray-50 rounded text-sm">
              <div>当前状态: <span className={`px-1.5 rounded ${statusColor[selectedClause.verificationStatus]}`}>{selectedClause.verificationStatus}</span></div>
            </div>
            <div className="space-y-2">
              <button
                onClick={handleVerify}
                className="w-full py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
              >
                确认 VERIFIED（人工核验通过）
              </button>
              <button
                onClick={handleRequestReview}
                className="w-full py-2 bg-amber-500 text-white rounded text-sm font-medium hover:bg-amber-600"
              >
                标记 REVIEW_REQUIRED
              </button>
              <button className="w-full py-2 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600">
                标记 CONFLICT（证据冲突）
              </button>
            </div>
            <div className="mt-6 flex-1">
              <h4 className="font-semibold text-sm mb-2">操作记录</h4>
              <div className="text-xs text-gray-500 space-y-1 overflow-auto">
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
        ) : (
          <p className="text-sm text-gray-400">选择条文后可执行操作</p>
        )}
      </div>
    </div>
  );
};

export default CodeReviewWorkbench;
