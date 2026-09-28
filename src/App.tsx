import React, { useEffect, useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import StandardStatusNotice from './components/layout/StandardStatusNotice';
import StandardsStatus from './pages/StandardsStatus';
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
import ContinuousBeam from './components/calculators/ContinuousBeam';

type ModuleId = string;

const STANDARDS_STATUS_TAIL = '/standards/status';
type View = 'calculator' | 'standards-status';

const CONCRETE_MODULES = ['beam-flexure', 'beam-shear', 'beam-t-flexure', 'column-axial', 'column-eccentric'];

const getInitialView = (): View =>
  typeof window !== 'undefined' && window.location.pathname.endsWith(STANDARDS_STATUS_TAIL)
    ? 'standards-status'
    : 'calculator';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>('beam-flexure');
  const [view, setView] = useState<View>(getInitialView);

  useEffect(() => {
    const onPopState = () => setView(getInitialView());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openStandardsStatus = () => {
    window.history.pushState({}, '', 'standards/status');
    setView('standards-status');
  };

  const backToCalculator = () => {
    window.history.pushState({}, '', './');
    setView('calculator');
  };

  if (view === 'standards-status') {
    return <StandardsStatus onBack={backToCalculator} />;
  }

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
        return <ContinuousBeam />;
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
        {CONCRETE_MODULES.includes(activeModule) && (
          <StandardStatusNotice onViewDetails={openStandardsStatus} />
        )}
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
