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
  applyServerUpdate: (id: string, patch: Partial<HighwayEvent>) => void;
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

  // 本地即时更新（来自 WebSocket 推送）
  applyServerUpdate: (id, patch) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),

  // 乐观更新 + API 同步
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
    // Ensure token is synced from localStorage before API call
    const { setToken } = await import('../api/client');
    const stored = localStorage.getItem('token');
    if (stored) setToken(stored);
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
        aiDescription: e.aiDescription,
        assessment: e.assessment,
        source: e.source,
        sourceDetail: e.sourceDetail,
        status: e.status,
        confirmedBy: e.confirmedBy,
        droneId: e.droneId,
        createdAt: e.createdAt,
      }));
      set({ events, loading: false });
    } catch {
      // Demo 模式：客户端模拟数据
      if (get().events.length === 0) {
        loadDemoData(set);
      }
      set({ loading: false, error: null });
    }
  },
}));

function loadDemoData(set: any) {
  const now = Date.now();
  const points = [
    { name: '北环立交', district: '江北/渝北', lng: 106.497385, lat: 29.609658 },
    { name: '石马河立交', district: '江北区', lng: 106.471885, lat: 29.584855 },
    { name: '东环立交', district: '江北区', lng: 106.551681, lat: 29.620295 },
    { name: '四公里立交', district: '南岸区', lng: 106.575596, lat: 29.514190 },
    { name: '江南立交', district: '南岸区', lng: 106.592240, lat: 29.530410 },
    { name: '凤中立交', district: '九龙坡', lng: 106.447897, lat: 29.498872 },
    { name: '西环立交', district: '九龙坡', lng: 106.441436, lat: 29.517380 },
    { name: '高滩岩立交', district: '沙坪坝区', lng: 106.443702, lat: 29.539939 },
    { name: '杨公桥立交', district: '沙坪坝区', lng: 106.453861, lat: 29.564296 },
  ];
  const types = ['accident', 'congestion', 'obstacle', 'smoke', 'fire'] as const;
  const levels = ['high', 'medium', 'low'] as const;
  let counter = 0;
  const demoEvents = Array.from({ length: 12 }, (_, i) => {
    const pt = points[i % points.length];
    const type = types[Math.floor(Math.random() * types.length)];
    const level = levels[Math.floor(Math.random() * levels.length)];
    counter++;
    return {
      id: `demo_evt_${counter}`,
      type,
      level,
      confidence: 60 + Math.floor(Math.random() * 35),
      roadName: pt.name,
      stakeNumber: pt.district,
      direction: i % 2 === 0 ? '进城' : '出城',
      coordinates: [pt.lng + (Math.random() - 0.5) * 0.002, pt.lat + (Math.random() - 0.5) * 0.002] as [number, number],
      screenshot: undefined,
      aiDescription: `[${pt.name}] Demo 模式 — 模拟${type}事件，置信度${60 + Math.floor(Math.random() * 35)}%`,
      assessment: undefined,
      source: 'camera' as const,
      sourceDetail: `${pt.name} · Demo 模式`,
      status: i < 3 ? 'pending' : i < 6 ? 'confirmed' : i < 9 ? 'dispatching' : 'resolved',
      confirmedBy: i >= 3 ? '值班员' : undefined,
      droneId: i >= 6 ? 'DRONE-01' : undefined,
      createdAt: now - (11 - i) * 300000,
    };
  });
  set({ events: demoEvents });
}
