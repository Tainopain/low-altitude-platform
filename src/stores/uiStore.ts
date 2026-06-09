import { create } from 'zustand';

interface UIStore {
  theme: 'dark' | 'light';
  siderCollapsed: boolean;
  aiDrawerOpen: boolean;
  historyDrawerOpen: boolean;
  videoWindow: { droneId: string | null; visible: boolean };
  wsConnected: boolean;
  toggleTheme: () => void;
  toggleSider: () => void;
  setAIDrawer: (open: boolean) => void;
  setHistoryDrawer: (open: boolean) => void;
  showVideoWindow: (droneId: string) => void;
  hideVideoWindow: () => void;
  setWsConnected: (connected: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  theme: (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  siderCollapsed: false,
  aiDrawerOpen: false,
  historyDrawerOpen: false,
  videoWindow: { droneId: null, visible: false },
  wsConnected: false,

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return { theme: next };
    }),

  toggleSider: () => set((s) => ({ siderCollapsed: !s.siderCollapsed })),

  setAIDrawer: (open) => set({ aiDrawerOpen: open }),
  setHistoryDrawer: (open) => set({ historyDrawerOpen: open }),

  showVideoWindow: (droneId) => set({ videoWindow: { droneId, visible: true } }),
  hideVideoWindow: () => set({ videoWindow: { droneId: null, visible: false } }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
