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
    // 河流范围: 长江 29.52-29.57, 嘉陵江 29.565-29.58 — 全部避开
    // 只用两块安全陆地: 江北渝北(lat≥29.590) + 南岸巴南九龙坡(lat≤29.510)
    const mockEvents: HighwayEvent[] = [
      // ---- 高危 ----
      {
        id: generateId(), type: 'fire', level: 'high', confidence: 88,
        roadName: 'G50', stakeNumber: 'K7+800', direction: '出城',
        coordinates: [106.535, 29.510],  // 九龙坡 滩子口
        source: 'drone', sourceDetail: '无人机红外热成像',
        status: 'arrived', droneId: 'DJI-001', createdAt: now - 900000,
      },
      {
        id: generateId(), type: 'smoke', level: 'high', confidence: 91,
        roadName: 'G50', stakeNumber: 'K18+400', direction: '进城',
        coordinates: [106.532, 29.595],  // 江北 冉家坝
        source: 'camera', sourceDetail: '摄像头 · 红外确认',
        status: 'pending', createdAt: now - 60000,
      },
      {
        id: generateId(), type: 'accident', level: 'high', confidence: 94,
        roadName: 'G50', stakeNumber: 'K12+300', direction: '进城',
        coordinates: [106.510, 29.505],  // 九龙坡 杨家坪
        source: 'drone', sourceDetail: '无人机俯拍: 多车追尾',
        status: 'confirmed', confirmedBy: '值班员张三', createdAt: now - 120000,
      },
      {
        id: generateId(), type: 'congestion', level: 'high', confidence: 87,
        roadName: 'G50', stakeNumber: 'K32+500', direction: '出城',
        coordinates: [106.550, 29.595],  // 江北 龙头寺
        source: 'camera', sourceDetail: '摄像头 · AI 密度分析',
        status: 'pending', createdAt: now - 180000,
      },
      {
        id: generateId(), type: 'accident', level: 'high', confidence: 82,
        roadName: 'G50', stakeNumber: 'K5+200', direction: '进城',
        coordinates: [106.570, 29.508],  // 南岸 四公里
        source: 'camera', sourceDetail: '摄像头: 单车撞护栏',
        status: 'pending', createdAt: now - 450000,
      },
      // ---- 中危 ----
      {
        id: generateId(), type: 'obstacle', level: 'medium', confidence: 85,
        roadName: 'G50', stakeNumber: 'K7+800', direction: '进城',
        coordinates: [106.565, 29.500],  // 南岸 六公里
        source: 'camera', sourceDetail: '摄像头: 路面抛洒物检测',
        status: 'pending', createdAt: now - 300000,
      },
      {
        id: generateId(), type: 'smoke', level: 'medium', confidence: 68,
        roadName: 'G50', stakeNumber: 'K22+600', direction: '出城',
        coordinates: [106.525, 29.600],  // 江北 大竹林
        source: 'camera', sourceDetail: '摄像头: 疑似田间焚烧飘烟',
        status: 'pending', createdAt: now - 240000,
      },
      {
        id: generateId(), type: 'obstacle', level: 'medium', confidence: 76,
        roadName: 'G50', stakeNumber: 'K15+800', direction: '进城',
        coordinates: [106.490, 29.510],  // 沙坪坝 凤天路
        source: 'camera', sourceDetail: '摄像头: 路面异物检测',
        status: 'confirmed', confirmedBy: '值班员李四', createdAt: now - 360000,
      },
      {
        id: generateId(), type: 'congestion', level: 'medium', confidence: 70,
        roadName: 'G50', stakeNumber: 'K28+300', direction: '进城',
        coordinates: [106.540, 29.498],  // 巴南 李家沱
        source: 'camera', sourceDetail: '摄像头 + 高德路况',
        status: 'pending', createdAt: now - 150000,
      },
      // ---- 低危 ----
      {
        id: generateId(), type: 'congestion', level: 'low', confidence: 72,
        roadName: 'G50', stakeNumber: 'K25+100', direction: '出城',
        coordinates: [106.542, 29.592],  // 江北 黄泥磅
        source: 'camera', sourceDetail: '摄像头 + 高德路况',
        status: 'confirmed', confirmedBy: '值班员张三', createdAt: now - 600000,
      },
      {
        id: generateId(), type: 'smoke', level: 'low', confidence: 45,
        roadName: 'G50', stakeNumber: 'K30+100', direction: '进城',
        coordinates: [106.500, 29.500],  // 九龙坡 毛线沟
        source: 'camera', sourceDetail: '摄像头: 微量烟雾（疑似尾气）',
        status: 'pending', createdAt: now - 720000,
      },
      {
        id: generateId(), type: 'congestion', level: 'low', confidence: 55,
        roadName: 'G50', stakeNumber: 'K3+500', direction: '出城',
        coordinates: [106.555, 29.600],  // 江北 唐家院子
        source: 'camera', sourceDetail: '摄像头: 缓行预警',
        status: 'closed', createdAt: now - 1800000,
      },
    ];
    set({ events: mockEvents });
  },
}));
