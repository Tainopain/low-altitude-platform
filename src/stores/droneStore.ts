import { create } from 'zustand';
import type { Drone } from '../types/drone';
import { api } from '../api/client';

interface DroneStore {
  drones: Drone[];
  loading: boolean;
  updateGPS: (id: string, coordinates: [number, number], heading: number) => void;
  setStatus: (id: string, status: Drone['status']) => void;
  setTask: (id: string, task: string, speed?: number) => void;
  loadDrones: () => Promise<void>;
}

export const useDroneStore = create<DroneStore>((set, get) => ({
  drones: [],
  loading: false,

  updateGPS: (id, coordinates, heading) =>
    set((s) => ({
      drones: s.drones.map((d) => (d.id === id ? { ...d, coordinates, heading } : d)),
    })),

  setStatus: (id, status) =>
    set((s) => ({
      drones: s.drones.map((d) => (d.id === id ? { ...d, status } : d)),
    })),

  setTask: (id, task, speed) =>
    set((s) => ({
      drones: s.drones.map((d) => (d.id === id ? { ...d, task, ...(speed !== undefined ? { speed } : {}) } : d)),
    })),

  loadDrones: async () => {
    set({ loading: true });
    const stored = localStorage.getItem('token');
    if (stored) {
      const { setToken } = await import('../api/client');
      setToken(stored);
    }
    try {
      const data = await api.getDrones();
      const drones: Drone[] = data.map((d: any) => ({
        id: d.id, name: d.name, status: d.status,
        coordinates: d.coordinates,
        homePosition: d.homePosition,
        heading: d.heading, battery: d.battery,
        task: d.task, speed: d.speed,
      }));
      set({ drones, loading: false });
    } catch {
      if (get().drones.length === 0) loadMockData(set);
      set({ loading: false });
    }
  },
}));

function loadMockData(set: any) {
  set({
    drones: [
      { id: 'DJI-001', name: 'DJI-001', status: 'flying', coordinates: [106.500, 29.505], homePosition: [106.500, 29.505], heading: 45, battery: 78, task: '巡逻中: G50南段', speed: 60 },
      { id: 'DJI-002', name: 'DJI-002', status: 'standby', coordinates: [106.535, 29.592], homePosition: [106.535, 29.592], heading: 0, battery: 100, task: '待命', speed: 0 },
      { id: 'DJI-003', name: 'DJI-003', status: 'standby', coordinates: [106.570, 29.505], homePosition: [106.570, 29.505], heading: 0, battery: 95, task: '待命', speed: 0 },
      { id: 'DJI-004', name: 'DJI-004', status: 'charging', coordinates: [106.555, 29.598], homePosition: [106.555, 29.598], heading: 0, battery: 35, task: '充电中', speed: 0 },
    ],
  });
}
