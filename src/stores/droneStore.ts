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
      set({ loading: false });
    }
  },
}));
