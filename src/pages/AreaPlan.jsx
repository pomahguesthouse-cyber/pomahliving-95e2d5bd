import AreaPlanCanvas from '@/components/areaPlan/AreaPlanCanvas';
import AreaToolbar from '@/components/areaPlan/AreaToolbar';
import PropertiesPanel from '@/components/areaPlan/PropertiesPanel';
import StatusBar from '@/components/areaPlan/StatusBar';

const AreaPlanPage = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-100">
      <AreaPlanCanvas />
      <AreaToolbar />
      <PropertiesPanel />
      <StatusBar />
    </div>
  );
};

export default AreaPlanPage;
