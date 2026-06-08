import { create } from 'zustand';
import type { Drone } from '../types/drone';

interface DroneStore {
  drones: Drone[];
  updateGPS: (id: string, coordinates: [number, number], heading: number) => void;
  setStatus: (id: string, status: Drone['status']) => void;
  setTask: (id: string, task: string, speed?: number) => void;
  loadMockDrones: () => void;
}

export const useDroneStore = create<DroneStore>((set) => ({
  drones: [],

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

  loadMockDrones: () => {
    const mockDrones: Drone[] = [
      {
        id: 'DJI-001', name: 'DJI-001', status: 'flying',
        coordinates: [106.555, 29.565], homePosition: [106.546, 29.576],  // 北侧
        heading: 45, battery: 78, task: '巡逻中: G50南段', speed: 60,
      },
      {
        id: 'DJI-002', name: 'DJI-002', status: 'standby',
        coordinates: [106.571, 29.558], homePosition: [106.571, 29.558],  // 东侧
        heading: 0, battery: 100, task: '待命', speed: 0,
      },
      {
        id: 'DJI-003', name: 'DJI-003', status: 'standby',
        coordinates: [106.538, 29.548], homePosition: [106.538, 29.548],  // 西南
        heading: 0, battery: 95, task: '待命', speed: 0,
      },
      {
        id: 'DJI-004', name: 'DJI-004', status: 'charging',
        coordinates: [106.560, 29.540], homePosition: [106.560, 29.540],  // 南侧
        heading: 0, battery: 35, task: '充电中', speed: 0,
      },
    ];
    set({ drones: mockDrones });
  },
}));
