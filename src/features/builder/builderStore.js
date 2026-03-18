import { create } from 'zustand';

const useBuilderStore = create((set, get) => ({
  landSize: { w: 10, l: 12 },
  modules: [],
  selectedId: null,
  isDragging: false,

  addModule: (module) => {
    const state = get();
    if (state.modules.length >= 20) return;
    
    const newModule = {
      ...module,
      id: `${module.type}-${Date.now()}`,
      x: 0,
      z: 0,
      rotation: 0,
      w: module.defaultW,
      l: module.defaultL,
    };
    
    set((state) => ({
      modules: [...state.modules, newModule],
      selectedId: newModule.id,
    }));
  },

  updateModulePosition: (id, x, z) => {
    set((state) => ({
      modules: state.modules.map((m) =>
        m.id === id ? { ...m, x, z } : m
      ),
    }));
  },

  resizeModule: (id, newW, newL) => {
    set((state) => ({
      modules: state.modules.map((m) =>
        m.id === id ? { ...m, w: newW, l: newL } : m
      ),
    }));
  },

  rotateModule: (id) => {
    set((state) => ({
      modules: state.modules.map((m) => {
        if (m.id !== id) return m;
        const newRotation = m.rotation === 0 ? 90 : 0;
        const newW = m.rotation === 0 ? m.l : m.defaultW;
        const newL = m.rotation === 0 ? m.defaultW : m.l;
        return { ...m, rotation: newRotation, w: newW, l: newL };
      }),
    }));
  },

  removeModule: (id) => {
    set((state) => ({
      modules: state.modules.filter((m) => m.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
  },

  setSelected: (id) => {
    set({ selectedId: id });
  },

  setDragging: (isDragging) => {
    set({ isDragging });
  },

  setLandSize: (w, l) => {
    set({ landSize: { w, l } });
  },

  clearAll: () => {
    set({ modules: [], selectedId: null });
  },
}));

export default useBuilderStore;
