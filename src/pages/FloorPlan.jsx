import AppLayout from '@/components/floorplan/AppLayout';
import TopToolbar from '@/components/floorplan/TopToolbar';
import ToolSidebar from '@/components/floorplan/ToolSidebar';
import CanvasContainer from '@/components/floorplan/CanvasContainer';
import PropertiesPanel from '@/components/floorplan/PropertiesPanel';

const FloorPlan = () => {
  return (
    <AppLayout>
      <TopToolbar />
      <div className="flex-1 flex overflow-hidden">
        <ToolSidebar />
        <CanvasContainer />
        <PropertiesPanel />
      </div>
    </AppLayout>
  );
};

export default FloorPlan;
