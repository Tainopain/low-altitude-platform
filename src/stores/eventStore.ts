import { create } from 'zustand';
import type { HighwayEvent, EventLevel } from '../types/event';

interface EventStore {
  events: HighwayEvent[];
  filterLevel: EventLevel | 'all';
  setFilterLevel: (level: EventLevel | 'all') => void;
  addEvent: (event: HighwayEvent) => void;
  updateEvent: (id: string, patch: Partial<HighwayEvent>) => void;
  removeEvent: (id: string) => void;
  loadMockEvents: () => void;
}

let eventCounter = 0;

function generateId(): string {
  return `evt_${Date.now()}_${++eventCounter}`;
}

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  filterLevel: 'all',

  setFilterLevel: (filterLevel) => set({ filterLevel }),

  addEvent: (event) =>
    set((s) => ({ events: [event, ...s.events] })),

  updateEvent: (id, patch) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),

  removeEvent: (id) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

  loadMockEvents: () => {
    const now = Date.now();
    const mockEvents: HighwayEvent[] = [
      {
        id: generateId(), type: 'smoke', level: 'high', confidence: 91,
        roadName: 'G50', stakeNumber: 'K18+400', direction: '进城',
        coordinates: [106.551, 29.562],
        source: 'camera', sourceDetail: '摄像头 · 红外确认',
        status: 'pending', createdAt: now - 60000,
      },
      {
        id: generateId(), type: 'obstacle', level: 'medium', confidence: 85,
        roadName: 'G50', stakeNumber: 'K7+800', direction: '进城',
        coordinates: [106.543, 29.548],
        source: 'camera', sourceDetail: '摄像头: 路面抛洒物检测',
        status: 'pending', createdAt: now - 300000,
      },
      {
        id: generateId(), type: 'congestion', level: 'low', confidence: 72,
        roadName: 'G50', stakeNumber: 'K25+100', direction: '出城',
        coordinates: [106.560, 29.575],
        source: 'camera', sourceDetail: '摄像头 + 高德路况',
        status: 'confirmed', confirmedBy: '值班员张三', createdAt: now - 600000,
      },
      {
        id: generateId(), type: 'fire', level: 'high', confidence: 88,
        roadName: 'G50', stakeNumber: 'K7+800', direction: '出城',
        coordinates: [106.549, 29.555],
        source: 'drone', sourceDetail: '无人机红外热成像',
        status: 'arrived', droneId: 'DJI-001', createdAt: now - 900000,
      },
      {
        id: generateId(), type: 'accident', level: 'high', confidence: 94,
        roadName: 'G50', stakeNumber: 'K12+300', direction: '进城',
        coordinates: [106.547, 29.558],
        source: 'drone', sourceDetail: '无人机俯拍: 多车追尾',
        status: 'confirmed', confirmedBy: '值班员张三', createdAt: now - 120000,
      },
    ];
    set({ events: mockEvents });
  },
}));
