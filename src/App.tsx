import React, { Suspense, lazy, useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import BeamFlexure from './components/calculators/BeamFlexure';
import BeamShear from './components/calculators/BeamShear';
import BeamTFlexure from './components/calculators/BeamTFlexure';
import Placeholder from './components/calculators/Placeholder';
import SteelBeam from './components/calculators/SteelBeam';
import RebarArea from './components/calculators/RebarArea';
import AxialColumn from './components/calculators/AxialColumn';
import EccentricColumn from './components/calculators/EccentricColumn';
import SectionProperties from './components/calculators/SectionProperties';
import MaterialWeight from './components/calculators/MaterialWeight';

const ContinuousBeam = lazy(() => import('./components/calculators/ContinuousBeam'));

type ModuleId = string;

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>('beam-flexure');

  const renderContent = () => {
    switch (activeModule) {
      case 'beam-flexure':
        return <BeamFlexure />;
      case 'beam-shear':
        return <BeamShear />;
      case 'beam-t-flexure':
        return <BeamTFlexure />;
      case 'steel-beam':
        return <SteelBeam />;
      case 'tools-rebar':
        return <RebarArea />;
      case 'column-axial':
        return <AxialColumn />;
      case 'column-eccentric':
        return <EccentricColumn />;
      case 'tools-params':
        return <SectionProperties />;
      case 'tools-weight':
        return <MaterialWeight />;
      case 'beam-continuous':
        return <Suspense fallback={<p className="text-sm text-gray-500">正在加载连续梁计算...</p>}><ContinuousBeam /></Suspense>;
      case 'slab-one-way':
      case 'slab-two-way':
      case 'slab-punching':
      case 'slab-crack':
      case 'slab-deflection':
      case 'foundation-independent':
      case 'staircase-plate':
      case 'wall-shear':
        return <Placeholder moduleId={activeModule} />;
      default:
        return <Placeholder moduleId={activeModule} />;
    }
  };

  return (
    <div className="flex h-screen flex-col md:flex-row bg-gray-100">
      <Sidebar activeModule={activeModule} onSelectModule={setActiveModule} />
      <main className="min-w-0 flex-1 overflow-auto p-4 md:p-6">
        {(['beam-flexure', 'beam-shear', 'beam-t-flexure', 'column-axial', 'column-eccentric'].includes(activeModule)) && (
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
