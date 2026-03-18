import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import { Suspense, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import ModuleBox from './ModuleBox';
import useBuilderStore from '../features/builder/builderStore';

const CameraController = ({ viewMode }) => {
  const { camera } = useThree();
  
  useEffect(() => {
    if (viewMode === 'top') {
      camera.position.set(0, 30, 0);
      camera.lookAt(0, 0, 0);
    } else if (viewMode === 'front') {
      camera.position.set(0, 10, 30);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(15, 15, 15);
      camera.lookAt(0, 0, 0);
    }
  }, [viewMode, camera]);
  
  return null;
};

const LandBoundary = ({ landSize }) => {
  return (
    <group position={[landSize.w / 2, 0.03, landSize.l / 2]}>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(landSize.w, 0.1, landSize.l)]} />
        <lineBasicMaterial color="#22d3ee" linewidth={2} />
      </lineSegments>
    </group>
  );
};

const BuilderCanvas = () => {
  const modules = useBuilderStore((state) => state.modules);
  const selectedId = useBuilderStore((state) => state.selectedId);
  const setSelected = useBuilderStore((state) => state.setSelected);
  const updateModulePosition = useBuilderStore((state) => state.updateModulePosition);
  const landSize = useBuilderStore((state) => state.landSize);
  const [viewMode, setViewMode] = useState('3d');
  const [showGrid, setShowGrid] = useState(true);
  const controlsRef = useRef();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selected = useBuilderStore.getState().selectedId;
        if (selected) {
          useBuilderStore.getState().removeModule(selected);
        }
      }
      if (e.key === 'Escape') {
        setSelected(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelected]);

  const handleSelect = (id) => {
    setSelected(id);
  };

  const handleMove = (id, x, z) => {
    updateModulePosition(id, x, z);
  };

  return (
    <div className="w-full h-full bg-[#0f0f1a] relative">
      <Canvas shadows gl={{ antialias: true }}>
        <CameraController viewMode={viewMode} />
        
        {(viewMode === 'top' || viewMode === 'front') ? (
          <OrthographicCamera
            makeDefault
            position={viewMode === 'top' ? [0, 30, 0] : [0, 10, 30]}
            zoom={10}
            near={0.1}
            far={1000}
          />
        ) : (
          <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} />
        )}
        
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={viewMode === '3d'}
          maxPolarAngle={viewMode === '3d' ? Math.PI / 2.1 : Math.PI / 2}
          minDistance={5}
          maxDistance={50}
        />
        
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        
        <Suspense fallback={null}>
          {modules.map((module) => (
            module.visible && (
              <ModuleBox
                key={module.id}
                module={module}
                isSelected={selectedId === module.id}
                onSelect={handleSelect}
                onMove={handleMove}
              />
            )
          ))}
        </Suspense>
        
        {showGrid && (
          <Grid
            args={[50, 50]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#2d2d42"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#3d3d5c"
            fadeDistance={50}
            fadeStrength={1}
            followCamera={false}
            position={[0, 0.01, 0]}
          />
        )}
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#12121f" transparent opacity={1} />
        </mesh>
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[landSize.w / 2, 0.02, landSize.l / 2]} receiveShadow>
          <planeGeometry args={[landSize.w, landSize.l]} />
          <meshBasicMaterial color="#1a1a2e" transparent opacity={0.9} />
        </mesh>
        
        <LandBoundary landSize={landSize} />
      </Canvas>
      
      <div className="absolute bottom-3 left-3 flex flex-col gap-2">
        <div className="bg-[#1a1a2e]/95 backdrop-blur border border-[#2d2d42] rounded-lg p-1.5 shadow-lg">
          <div className="flex gap-1">
            {[
              { id: '3d', label: '3D' },
              { id: 'top', label: 'Top' },
              { id: 'front', label: 'Front' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors ${
                  viewMode === mode.id
                    ? 'bg-cyan-500 text-white'
                    : 'bg-[#2d2d42] text-gray-400 hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-[#1a1a2e]/95 backdrop-blur border border-[#2d2d42] rounded-lg p-1.5 shadow-lg">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors ${
              showGrid
                ? 'bg-cyan-500 text-white'
                : 'bg-[#2d2d42] text-gray-400 hover:text-white'
            }`}
          >
            Grid
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-3 right-3 bg-[#1a1a2e]/95 backdrop-blur border border-[#2d2d42] rounded-lg px-2.5 py-1.5 shadow-lg">
        <div className="text-[9px] text-gray-500 space-y-0.5">
          <div>Click to select</div>
          <div>Drag to move</div>
          <div>Del to delete</div>
        </div>
      </div>
    </div>
  );
};

export default BuilderCanvas;
