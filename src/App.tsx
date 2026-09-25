import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import BeamFlexure from './components/calculators/BeamFlexure';
import Placeholder from './components/calculators/Placeholder';

type ModuleId = string;

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>('beam-flexure');

  const renderContent = () => {
    switch (activeModule) {
      case 'beam-flexure':
        return <BeamFlexure />;
      case 'beam-shear':
      case 'beam-t-flexure':
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
      case 'steel':
      case 'tools-rebar':
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
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
