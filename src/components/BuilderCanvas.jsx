import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import ModuleBox from './ModuleBox';

const BuilderCanvas = ({ modules, selectedId, onSelect, onMove }) => {
  return (
    <div className="w-full h-full bg-slate-900">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={5}
          maxDistance={50}
        />
        
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        
        <Suspense fallback={null}>
          {modules.map((module) => (
            <ModuleBox
              key={module.id}
              module={module}
              isSelected={selectedId === module.id}
              onSelect={onSelect}
              onMove={onMove}
            />
          ))}
        </Suspense>
        
        <Grid
          args={[50, 50]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#334155"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#475569"
          fadeDistance={50}
          fadeStrength={1}
          followCamera={false}
          position={[0, -0.01, 0]}
        />
        
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#1e293b" transparent opacity={0.95} />
        </mesh>
      </Canvas>
    </div>
  );
};

export default BuilderCanvas;
