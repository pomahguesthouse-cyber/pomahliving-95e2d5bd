import FloorCanvas from './FloorCanvas';
import CanvasOverlay from './CanvasOverlay';

const CanvasContainer = () => {
  return (
    <div className="flex-1 relative overflow-hidden">
      <FloorCanvas />
      <CanvasOverlay />
    </div>
  );
};

export default CanvasContainer;
