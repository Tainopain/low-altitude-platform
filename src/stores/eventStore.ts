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
      set({ loading: false, error: null });
    }
  },
}));
