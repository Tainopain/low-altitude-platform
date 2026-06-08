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
    // 坐标避开长江(29.54-29.57)与嘉陵江，分布在江北(>29.58)、南岸(<29.535)、渝中半岛(29.558-29.568)
    const mockEvents: HighwayEvent[] = [
      // ---- 高危 ----
      {
        id: generateId(), type: 'fire', level: 'high', confidence: 88,
        roadName: 'G50', stakeNumber: 'K7+800', direction: '出城',
        coordinates: [106.555, 29.565],  // 渝中半岛
        source: 'drone', sourceDetail: '无人机红外热成像',
        status: 'arrived', droneId: 'DJI-001', createdAt: now - 900000,
      },
      {
        id: generateId(), type: 'smoke', level: 'high', confidence: 91,
        roadName: 'G50', stakeNumber: 'K18+400', direction: '进城',
        coordinates: [106.541, 29.590],  // 江北西
        source: 'camera', sourceDetail: '摄像头 · 红外确认',
        status: 'pending', createdAt: now - 60000,
      },
      {
        id: generateId(), type: 'accident', level: 'high', confidence: 94,
        roadName: 'G50', stakeNumber: 'K12+300', direction: '进城',
        coordinates: [106.548, 29.532],  // 南岸西
        source: 'drone', sourceDetail: '无人机俯拍: 多车追尾',
        status: 'confirmed', confirmedBy: '值班员张三', createdAt: now - 120000,
      },
      {
        id: generateId(), type: 'congestion', level: 'high', confidence: 87,
        roadName: 'G50', stakeNumber: 'K32+500', direction: '出城',
        coordinates: [106.555, 29.600],  // 江北东
        source: 'camera', sourceDetail: '摄像头 · AI 密度分析',
        status: 'pending', createdAt: now - 180000,
      },
      {
        id: generateId(), type: 'accident', level: 'high', confidence: 82,
        roadName: 'G50', stakeNumber: 'K5+200', direction: '进城',
        coordinates: [106.558, 29.525],  // 南岸东
        source: 'camera', sourceDetail: '摄像头: 单车撞护栏',
        status: 'pending', createdAt: now - 450000,
      },
      // ---- 中危 ----
      {
        id: generateId(), type: 'obstacle', level: 'medium', confidence: 85,
        roadName: 'G50', stakeNumber: 'K7+800', direction: '进城',
        coordinates: [106.537, 29.533],  // 南岸西南
        source: 'camera', sourceDetail: '摄像头: 路面抛洒物检测',
        status: 'pending', createdAt: now - 300000,
      },
      {
        id: generateId(), type: 'smoke', level: 'medium', confidence: 68,
        roadName: 'G50', stakeNumber: 'K22+600', direction: '出城',
        coordinates: [106.552, 29.595],  // 江北中
        source: 'camera', sourceDetail: '摄像头: 疑似田间焚烧飘烟',
        status: 'pending', createdAt: now - 240000,
      },
      {
        id: generateId(), type: 'obstacle', level: 'medium', confidence: 76,
        roadName: 'G50', stakeNumber: 'K15+800', direction: '进城',
        coordinates: [106.561, 29.562],  // 渝中东
        source: 'camera', sourceDetail: '摄像头: 路面异物检测',
        status: 'confirmed', confirmedBy: '值班员李四', createdAt: now - 360000,
      },
      {
        id: generateId(), type: 'congestion', level: 'medium', confidence: 70,
        roadName: 'G50', stakeNumber: 'K28+300', direction: '进城',
        coordinates: [106.544, 29.528],  // 南岸南
        source: 'camera', sourceDetail: '摄像头 + 高德路况',
        status: 'pending', createdAt: now - 150000,
      },
      // ---- 低危 ----
      {
        id: generateId(), type: 'congestion', level: 'low', confidence: 72,
        roadName: 'G50', stakeNumber: 'K25+100', direction: '出城',
        coordinates: [106.560, 29.585],  // 江北东
        source: 'camera', sourceDetail: '摄像头 + 高德路况',
        status: 'confirmed', confirmedBy: '值班员张三', createdAt: now - 600000,
      },
      {
        id: generateId(), type: 'smoke', level: 'low', confidence: 45,
        roadName: 'G50', stakeNumber: 'K30+100', direction: '进城',
        coordinates: [106.531, 29.530],  // 南岸西南角
        source: 'camera', sourceDetail: '摄像头: 微量烟雾（疑似尾气）',
        status: 'pending', createdAt: now - 720000,
      },
      {
        id: generateId(), type: 'congestion', level: 'low', confidence: 55,
        roadName: 'G50', stakeNumber: 'K3+500', direction: '出城',
        coordinates: [106.548, 29.607],  // 江北西北
        source: 'camera', sourceDetail: '摄像头: 缓行预警',
        status: 'closed', createdAt: now - 1800000,
      },
    ];
    set({ events: mockEvents });
  },
}));
