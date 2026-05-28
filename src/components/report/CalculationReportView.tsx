import React from 'react';
import { ReportSection } from '../../report/generator';

interface CalculationReportViewProps {
  report: ReportSection[];
}

const CalculationReportView: React.FC<CalculationReportViewProps> = ({ report }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-700">详细计算书</h3>
        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
          REVIEW_REQUIRED
        </span>
      </div>

      <div className="space-y-6">
        {report.map((section, i) => (
          <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
            <h4 className="text-sm font-bold text-gray-700 mb-2">{section.title}</h4>
            <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {section.content}
            </div>
            {section.evidence.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {section.evidence
                  .filter((e, j, arr) => arr.findIndex(x => x.clause === e.clause && x.codeNumber === e.codeNumber) === j)
                  .map((e, j) => (
                    <span key={j} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                      {e.codeNumber} {e.clause}
                    </span>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalculationReportView;
