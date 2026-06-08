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
      // ---- 高危 (北岸 ≥29.610 | 南岸 ≤29.468) ----
      {
        id: generateId(), type: 'fire', level: 'high', confidence: 88,
        roadName: 'G50', stakeNumber: 'K7+800', direction: '出城',
        coordinates: [106.525, 29.465],  // 巴南 龙洲湾 (内陆5km+)
        source: 'drone', sourceDetail: '无人机红外热成像',
        status: 'arrived', droneId: 'DJI-001', createdAt: now - 900000,
      },
      {
        id: generateId(), type: 'smoke', level: 'high', confidence: 91,
        roadName: 'G50', stakeNumber: 'K18+400', direction: '进城',
        coordinates: [106.542, 29.618],  // 渝北 翠云 (内陆3km+)
        source: 'camera', sourceDetail: '摄像头 · 红外确认',
        status: 'pending', createdAt: now - 60000,
      },
      {
        id: generateId(), type: 'accident', level: 'high', confidence: 94,
        roadName: 'G50', stakeNumber: 'K12+300', direction: '进城',
        coordinates: [106.515, 29.462],  // 巴南 鱼洞 (内陆6km+)
        source: 'drone', sourceDetail: '无人机俯拍: 多车追尾',
        status: 'confirmed', confirmedBy: '值班员张三', createdAt: now - 120000,
      },
      {
        id: generateId(), type: 'congestion', level: 'high', confidence: 87,
        roadName: 'G50', stakeNumber: 'K32+500', direction: '出城',
        coordinates: [106.558, 29.620],  // 渝北 汽博 (内陆3km+)
        source: 'camera', sourceDetail: '摄像头 · AI 密度分析',
        status: 'pending', createdAt: now - 180000,
      },
      {
        id: generateId(), type: 'accident', level: 'high', confidence: 82,
        roadName: 'G50', stakeNumber: 'K5+200', direction: '进城',
        coordinates: [106.570, 29.466],  // 巴南 民主新村 (内陆5km+)
        source: 'camera', sourceDetail: '摄像头: 单车撞护栏',
        status: 'pending', createdAt: now - 450000,
      },
      // ---- 中危 ----
      {
        id: generateId(), type: 'obstacle', level: 'medium', confidence: 85,
        roadName: 'G50', stakeNumber: 'K7+800', direction: '进城',
        coordinates: [106.545, 29.463],  // 巴南 大山村 (内陆5km+)
        source: 'camera', sourceDetail: '摄像头: 路面抛洒物检测',
        status: 'pending', createdAt: now - 300000,
      },
      {
        id: generateId(), type: 'smoke', level: 'medium', confidence: 68,
        roadName: 'G50', stakeNumber: 'K22+600', direction: '出城',
        coordinates: [106.525, 29.628],  // 渝北 园博园 (内陆4km+)
        source: 'camera', sourceDetail: '摄像头: 疑似田间焚烧飘烟',
        status: 'pending', createdAt: now - 240000,
      },
      {
        id: generateId(), type: 'obstacle', level: 'medium', confidence: 76,
        roadName: 'G50', stakeNumber: 'K15+800', direction: '进城',
        coordinates: [106.505, 29.458],  // 巴南 金竹 (内陆7km+)
        source: 'camera', sourceDetail: '摄像头: 路面异物检测',
        status: 'confirmed', confirmedBy: '值班员李四', createdAt: now - 360000,
      },
      {
        id: generateId(), type: 'congestion', level: 'medium', confidence: 70,
        roadName: 'G50', stakeNumber: 'K28+300', direction: '进城',
        coordinates: [106.535, 29.460],  // 巴南 学堂湾 (内陆6km+)
        source: 'camera', sourceDetail: '摄像头 + 高德路况',
        status: 'pending', createdAt: now - 150000,
      },
      // ---- 低危 ----
      {
        id: generateId(), type: 'congestion', level: 'low', confidence: 72,
        roadName: 'G50', stakeNumber: 'K25+100', direction: '出城',
        coordinates: [106.538, 29.615],  // 渝北 鸳鸯 (内陆3km+)
        source: 'camera', sourceDetail: '摄像头 + 高德路况',
        status: 'confirmed', confirmedBy: '值班员张三', createdAt: now - 600000,
      },
      {
        id: generateId(), type: 'smoke', level: 'low', confidence: 45,
        roadName: 'G50', stakeNumber: 'K30+100', direction: '进城',
        coordinates: [106.510, 29.450],  // 巴南 金竹南 (内陆9km+)
        source: 'camera', sourceDetail: '摄像头: 微量烟雾（疑似尾气）',
        status: 'pending', createdAt: now - 720000,
      },
      {
        id: generateId(), type: 'congestion', level: 'low', confidence: 55,
        roadName: 'G50', stakeNumber: 'K3+500', direction: '出城',
        coordinates: [106.555, 29.627],  // 渝北 金童路 (内陆4km+)
        source: 'camera', sourceDetail: '摄像头: 缓行预警',
        status: 'closed', createdAt: now - 1800000,
      },
    ];
    set({ events: mockEvents });
  },
}));
