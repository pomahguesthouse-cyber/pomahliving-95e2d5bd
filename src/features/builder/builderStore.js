import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useBuilderStore = create(
  persist(
    (set, get) => ({
      landSize: { w: 10, l: 12 },
      modules: [],
      selectedId: null,
      isDragging: false,
      history: [],
      historyIndex: -1,

      addModule: (module) => {
        const state = get();
        if (state.modules.length >= 20) return;
        
        const newModule = {
          ...module,
          id: `${module.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          x: module.x ?? module.defaultW / 2,
          z: module.z ?? module.defaultL / 2,
          rotation: module.rotation || 0,
          w: module.w || module.defaultW,
          l: module.l || module.defaultL,
          visible: module.visible !== false,
        };
        
        set((state) => {
          const newModules = [...state.modules, newModule];
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(state.modules)));
          return {
            modules: newModules,
            selectedId: newModule.id,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      updateModulePosition: (id, x, z) => {
        set((state) => ({
          modules: state.modules.map((m) =>
            m.id === id ? { ...m, x, z } : m
          ),
        }));
      },

      resizeModule: (id, newW, newL) => {
        const state = get();
        const module = state.modules.find((m) => m.id === id);
        if (!module) return;
        
        const minSize = 2;
        const clampedW = Math.max(minSize, newW);
        const clampedL = Math.max(minSize, newL);
        
        set((state) => {
          const newModules = state.modules.map((m) =>
            m.id === id ? { ...m, w: clampedW, l: clampedL } : m
          );
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(state.modules)));
          return {
            modules: newModules,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      rotateModule: (id) => {
        set((state) => {
          const newModules = state.modules.map((m) => {
            if (m.id !== id) return m;
            const newRotation = m.rotation === 0 ? 90 : 0;
            const newW = m.rotation === 0 ? m.l : m.defaultW || m.w;
            const newL = m.rotation === 0 ? m.defaultW || m.w : m.l;
            return { ...m, rotation: newRotation, w: newW, l: newL };
          });
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(state.modules)));
          return {
            modules: newModules,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      removeModule: (id) => {
        set((state) => {
          const newModules = state.modules.filter((m) => m.id !== id);
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(state.modules)));
          return {
            modules: newModules,
            selectedId: state.selectedId === id ? null : state.selectedId,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      toggleModuleVisibility: (id) => {
        set((state) => ({
          modules: state.modules.map((m) =>
            m.id === id ? { ...m, visible: !m.visible } : m
          ),
        }));
      },

      setSelected: (id) => {
        set({ selectedId: id });
      },

      setDragging: (isDragging) => {
        set({ isDragging });
      },

      setLandSize: (w, l) => {
        set({ landSize: { w, l }, modules: [], selectedId: null, history: [], historyIndex: -1 });
      },

      clearAll: () => {
        set((state) => {
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(state.modules)));
          return {
            modules: [],
            selectedId: null,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      addModulesBatch: (newModules) => {
        set((state) => {
          const modulesWithId = newModules.map((m, i) => ({
            ...m,
            id: `${m.type || 'room'}-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
            rotation: m.rotation || 0,
            visible: m.visible !== false,
          }));
          const allModules = [...state.modules, ...modulesWithId];
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(state.modules)));
          return {
            modules: allModules,
            selectedId: modulesWithId[0]?.id || null,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      undo: () => {
        const state = get();
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          set({
            modules: JSON.parse(JSON.stringify(state.history[newIndex])),
            historyIndex: newIndex,
            selectedId: null,
          });
        }
      },

      redo: () => {
        const state = get();
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          set({
            modules: JSON.parse(JSON.stringify(state.history[newIndex])),
            historyIndex: newIndex,
            selectedId: null,
          });
        }
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      saveDesign: () => {
        const state = get();
        const design = {
          landSize: state.landSize,
          modules: state.modules,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem('pomahDesign', JSON.stringify(design));
        return design;
      },

      loadDesign: () => {
        const saved = localStorage.getItem('pomahDesign');
        if (saved) {
          const design = JSON.parse(saved);
          set({
            landSize: design.landSize,
            modules: design.modules,
            selectedId: null,
            history: [JSON.parse(JSON.stringify(design.modules))],
            historyIndex: 0,
          });
          return design;
        }
        return null;
      },
    }),
    {
      name: 'pomah-builder-storage',
      partialize: (state) => ({
        landSize: state.landSize,
        modules: state.modules,
      }),
    }
  )
);

export default useBuilderStore;
