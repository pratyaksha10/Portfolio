import { create } from 'zustand';

interface PortalStore {
  activePortalId: string | null;
  lastActivePortalId: string | null;
  setActivePortal: (activePortalId: string | null) => void;
}

export const usePortalStore = create<PortalStore>((set) => ({
  activePortalId: null,
  lastActivePortalId: null,
  setActivePortal: (activePortalId) => set((state) => ({
    activePortalId,
    lastActivePortalId: activePortalId === null ? state.activePortalId : state.lastActivePortalId
  })),
}))
