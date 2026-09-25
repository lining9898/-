import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import BeamFlexure from './components/calculators/BeamFlexure';
import BeamShear from './components/calculators/BeamShear';
import BeamTFlexure from './components/calculators/BeamTFlexure';
import Placeholder from './components/calculators/Placeholder';
import CodeSearch from './components/codes/CodeSearch';
import SteelBeam from './components/calculators/SteelBeam';
import RebarArea from './components/calculators/RebarArea';

type ModuleId = string;

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>('beam-flexure');
  const [clauseQuery, setClauseQuery] = useState('');

  const lookupClause = (clause: string) => {
    setClauseQuery(clause);
    setActiveModule('code-search');
  };

  const renderContent = () => {
    switch (activeModule) {
      case 'beam-flexure':
        return <BeamFlexure onLookupClause={lookupClause} />;
      case 'beam-shear':
        return <BeamShear onLookupClause={lookupClause} />;
      case 'beam-t-flexure':
        return <BeamTFlexure onLookupClause={lookupClause} />;
      case 'code-search':
        return <CodeSearch query={clauseQuery} onQueryChange={setClauseQuery} />;
      case 'steel-beam':
        return <SteelBeam />;
      case 'tools-rebar':
        return <RebarArea />;
      case 'beam-continuous':
      case 'column-axial':
      case 'column-eccentric':
      case 'slab-one-way':
      case 'slab-two-way':
      case 'slab-punching':
      case 'slab-crack':
      case 'slab-deflection':
      case 'foundation-independent':
      case 'staircase-plate':
      case 'wall-shear':
      case 'tools-weight':
      case 'tools-params':
        return <Placeholder moduleId={activeModule} />;
      default:
        return <Placeholder moduleId={activeModule} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeModule={activeModule} onSelectModule={setActiveModule} />
      <main className="flex-1 overflow-auto p-6">
        {(['beam-flexure', 'beam-shear', 'beam-t-flexure', 'code-search'].includes(activeModule)) && (
          <p role="note" className="max-w-7xl mx-auto mb-4 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            当前混凝土计算依据仓库中的 GB 50010-2010（2015 年版）。住建部已发布 2024 年局部修订；本项目尚未完成新旧条款差异核查，结果不可直接作为现行工程设计依据。{' '}
            <a href="https://www.mohurd.gov.cn/file/2024/20240822/a015dc08-eaf2-474a-81c1-c4454e3b220c.pdf"
              target="_blank" rel="noreferrer" className="underline">查看住建部公告</a>
          </p>
        )}
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
