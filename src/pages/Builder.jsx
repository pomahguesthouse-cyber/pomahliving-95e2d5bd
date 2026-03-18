import { useNavigate } from 'react-router-dom';
import Topbar from '@/components/Topbar';
import ModuleSidebar from '@/components/ModuleSidebar';
import BuilderCanvas from '@/components/BuilderCanvas';
import PricePanel from '@/components/PricePanel';

const Builder = () => {
  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <Topbar />
      
      <div className="flex-1 flex overflow-hidden">
        <ModuleSidebar />
        <div className="flex-1 relative">
          <BuilderCanvas />
        </div>
        <PricePanel />
      </div>
    </div>
  );
};

export default Builder;
