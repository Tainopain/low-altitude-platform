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
      // Demo 模式：客户端模拟数据
      if (get().drones.length === 0) {
        set({
          drones: [
            { id: 'DRONE-01', name: '北环机舱',   status: 'standby', coordinates: [106.507, 29.605], homePosition: [106.507, 29.605], heading: 0, battery: 100, task: '覆盖: 北环/石马河/东环', speed: 0 },
            { id: 'DRONE-02', name: '沙坪坝机舱', status: 'standby', coordinates: [106.449, 29.552], homePosition: [106.449, 29.552], heading: 0, battery: 100, task: '覆盖: 杨公桥/高滩岩', speed: 0 },
            { id: 'DRONE-03', name: '华岩机舱',   status: 'standby', coordinates: [106.445, 29.508], homePosition: [106.445, 29.508], heading: 0, battery: 100, task: '覆盖: 西环/凤中', speed: 0 },
            { id: 'DRONE-04', name: '南岸机舱',   status: 'standby', coordinates: [106.584, 29.522], homePosition: [106.584, 29.522], heading: 0, battery: 100, task: '覆盖: 四公里/江南', speed: 0 },
          ],
        });
      }
      set({ loading: false });
    }
  },
}));
