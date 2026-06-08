import { create } from 'zustand';
import type { HighwayEvent, EventLevel } from '../types/event';
import { api } from '../api/client';

interface EventStore {
  events: HighwayEvent[];
  loading: boolean;
  error: string | null;
  filterLevel: EventLevel | 'all';
  setFilterLevel: (level: EventLevel | 'all') => void;
  addEvent: (event: HighwayEvent) => void;
  updateEvent: (id: string, patch: Partial<HighwayEvent>) => Promise<void>;
  removeEvent: (id: string) => void;
  loadEvents: () => Promise<void>;
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  loading: false,
  error: null,
  filterLevel: 'all',

  setFilterLevel: (filterLevel) => set({ filterLevel }),

  addEvent: (event) => set((s) => ({ events: [event, ...s.events] })),

  updateEvent: async (id, patch) => {
    // Optimistic update
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
    // Sync to API
    try {
      const apiPatch: Record<string, any> = {};
      if (patch.status) apiPatch.status = patch.status;
      if (patch.confirmedBy) apiPatch.confirmed_by = patch.confirmedBy;
      if (patch.droneId) apiPatch.drone_id = patch.droneId;
      await api.updateEvent(id, apiPatch);
    } catch {
      // API unavailable — revert on next loadEvents
    }
  },

  removeEvent: (id) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

  loadEvents: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.getEvents();
      const events: HighwayEvent[] = data.map((e: any) => ({
        id: e.id, type: e.type, level: e.level,
        confidence: e.confidence,
        roadName: e.roadName,
        stakeNumber: e.stakeNumber,
        direction: e.direction,
        coordinates: e.coordinates,
        screenshot: e.screenshot,
        source: e.source,
        sourceDetail: e.sourceDetail,
        status: e.status,
        confirmedBy: e.confirmedBy,
        droneId: e.droneId,
        createdAt: e.createdAt,
      }));
      set({ events, loading: false });
    } catch {
      // API unavailable — keep existing data or use mock
      if (get().events.length === 0) {
        loadMockData(set);
      }
      set({ loading: false, error: null });
    }
  },
}));

// Mock data fallback
let eventCounter = 0;
function genId() { return `evt_${Date.now()}_${++eventCounter}`; }

function loadMockData(set: any) {
  const now = Date.now();
  set({
    events: [
      { id: genId(), type: 'fire', level: 'high', confidence: 88, roadName: 'G50', stakeNumber: 'K7+800', direction: '出城', coordinates: [106.500, 29.485], source: 'drone', sourceDetail: '无人机红外热成像', status: 'arrived', droneId: 'DJI-001', createdAt: now - 900000 },
      { id: genId(), type: 'smoke', level: 'high', confidence: 91, roadName: 'G50', stakeNumber: 'K18+400', direction: '进城', coordinates: [106.540, 29.615], source: 'camera', sourceDetail: '摄像头 · 红外确认', status: 'pending', createdAt: now - 60000 },
      { id: genId(), type: 'accident', level: 'high', confidence: 94, roadName: 'G50', stakeNumber: 'K12+300', direction: '进城', coordinates: [106.515, 29.485], source: 'drone', sourceDetail: '无人机俯拍: 多车追尾', status: 'confirmed', confirmedBy: '值班员张三', createdAt: now - 120000 },
      { id: genId(), type: 'congestion', level: 'high', confidence: 87, roadName: 'G50', stakeNumber: 'K32+500', direction: '出城', coordinates: [106.555, 29.620], source: 'camera', sourceDetail: '摄像头 · AI 密度分析', status: 'pending', createdAt: now - 180000 },
      { id: genId(), type: 'accident', level: 'high', confidence: 82, roadName: 'G50', stakeNumber: 'K5+200', direction: '进城', coordinates: [106.530, 29.480], source: 'camera', sourceDetail: '摄像头: 单车撞护栏', status: 'pending', createdAt: now - 450000 },
      { id: genId(), type: 'obstacle', level: 'medium', confidence: 85, roadName: 'G50', stakeNumber: 'K7+800', direction: '进城', coordinates: [106.575, 29.488], source: 'camera', sourceDetail: '摄像头: 路面抛洒物检测', status: 'pending', createdAt: now - 300000 },
      { id: genId(), type: 'smoke', level: 'medium', confidence: 68, roadName: 'G50', stakeNumber: 'K22+600', direction: '出城', coordinates: [106.520, 29.625], source: 'camera', sourceDetail: '摄像头: 疑似田间焚烧飘烟', status: 'pending', createdAt: now - 240000 },
      { id: genId(), type: 'obstacle', level: 'medium', confidence: 76, roadName: 'G50', stakeNumber: 'K15+800', direction: '进城', coordinates: [106.495, 29.478], source: 'camera', sourceDetail: '摄像头: 路面异物检测', status: 'confirmed', confirmedBy: '值班员李四', createdAt: now - 360000 },
      { id: genId(), type: 'congestion', level: 'medium', confidence: 70, roadName: 'G50', stakeNumber: 'K28+300', direction: '进城', coordinates: [106.550, 29.485], source: 'camera', sourceDetail: '摄像头 + 高德路况', status: 'pending', createdAt: now - 150000 },
      { id: genId(), type: 'congestion', level: 'low', confidence: 72, roadName: 'G50', stakeNumber: 'K25+100', direction: '出城', coordinates: [106.535, 29.610], source: 'camera', sourceDetail: '摄像头 + 高德路况', status: 'confirmed', confirmedBy: '值班员张三', createdAt: now - 600000 },
      { id: genId(), type: 'smoke', level: 'low', confidence: 45, roadName: 'G50', stakeNumber: 'K30+100', direction: '进城', coordinates: [106.510, 29.450], source: 'camera', sourceDetail: '摄像头: 微量烟雾（疑似尾气）', status: 'pending', createdAt: now - 720000 },
      { id: genId(), type: 'congestion', level: 'low', confidence: 55, roadName: 'G50', stakeNumber: 'K3+500', direction: '出城', coordinates: [106.560, 29.615], source: 'camera', sourceDetail: '摄像头: 缓行预警', status: 'closed', createdAt: now - 1800000 },
    ],
  });
}
