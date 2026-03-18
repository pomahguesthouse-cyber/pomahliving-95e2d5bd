import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useBuilderStore from '../features/builder/builderStore';
import { positionToGrid } from '../utils/gridUtils';
import { canPlaceModule } from '../features/builder/collision';

const ModuleBox = ({ module, isSelected, onSelect, onMove }) => {
  const meshRef = useRef();
  const { camera, gl } = useThree();
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycaster = useRef(new THREE.Raycaster());
  const isDragging = useRef(false);
  const setDragging = useBuilderStore((state) => state.setDragging);
  const landSize = useBuilderStore((state) => state.landSize);
  const modules = useBuilderStore((state) => state.modules);

  const height = 2.5;
  const color = module.color;

  useEffect(() => {
    const handlePointerUpGlobal = () => {
      isDragging.current = false;
      setDragging(false);
      gl.domElement.style.cursor = 'auto';
    };

    window.addEventListener('pointerup', handlePointerUpGlobal);
    return () => window.removeEventListener('pointerup', handlePointerUpGlobal);
  }, [gl, setDragging]);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    onSelect(module.id);
    isDragging.current = true;
    setDragging(true);
    gl.domElement.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || !isSelected) return;

    const rect = gl.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera({ x, y }, camera);
    const intersection = new THREE.Vector3();
    raycaster.current.ray.intersectPlane(planeRef.current, intersection);

    if (intersection) {
      const testModule = { ...module, x: intersection.x, z: intersection.z };
      const { x: newX, z: newZ } = positionToGrid(intersection.x, intersection.z, testModule, landSize);

      const movedModule = { ...testModule, x: newX, z: newZ };
      const otherModules = modules.filter((m) => m.id !== module.id);

      if (canPlaceModule(movedModule, otherModules, landSize)) {
        onMove(module.id, newX, newZ);
      }
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    setDragging(false);
    gl.domElement.style.cursor = 'auto';
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[module.x, height / 2, module.z]}
        rotation={[0, (module.rotation * Math.PI) / 180, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[module.w, height, module.l]} />
        <meshStandardMaterial
          color={isSelected ? '#ffffff' : color}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {isSelected && (
        <lineSegments position={[module.x, height / 2, module.z]} rotation={[0, (module.rotation * Math.PI) / 180, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(module.w + 0.1, height + 0.1, module.l + 0.1)]} />
          <lineBasicMaterial color="#22d3ee" linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
};

export default ModuleBox;
