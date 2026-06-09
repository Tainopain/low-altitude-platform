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

function demoAssessment(roadName: string, type: string, level: string, direction: string) {
  const typeNames: Record<string, string> = { accident: '交通事故', congestion: '拥堵事件', obstacle: '路面障碍物', smoke: '烟雾异常', fire: '火焰检测' };
  const typeName = typeNames[type] || type;
  const loc = `${roadName}${direction}`;
  const droneName = '北环机舱';

  const templates: Record<string, any> = {
    accident: {
      conclusion: `${loc}处检测到${typeName}，现场疑似多车碰撞，碎片散落路面，占用车道，存在人员伤亡和交通中断风险，需立即响应。`,
      risk: `高危 — ${typeName}可能由驾驶员操作失误或车辆故障引发，若车道被占将导致严重拥堵和次生事故。`,
      causes: ['驾驶员操作失误（疲劳驾驶、超速）', '车辆机械故障（刹车失灵、爆胎）', '天气或路况因素（路面湿滑、能见度低）', '前方突发状况导致连锁追尾'],
      suggestions: [
        { priority: '立即', action: `通知交警和路政赶赴现场，同步开启情报板提示"前方事故，减速避让"` },
        { priority: '立即', action: `调度最近无人机（${droneName}）抵近侦察，回传现场画面确认事故规模` },
        { priority: '短期', action: '在事故点前后500米设置警示标志，引导车辆从可用车道缓慢通过' },
        { priority: '跟进', action: '持续跟踪事故处置进展，评估是否需要增派救援力量' },
      ],
      impact: { area: `${roadName}${direction}方向周边2公里`, duration: '60-120分钟', congestion: '2-5公里' },
    },
    fire: {
      conclusion: `${loc}处检测到${typeName}，可见明显火焰和浓烟，可能由车辆起火或边坡火灾引发，存在升级为重大事故的风险。`,
      risk: `高危 — ${typeName}可能由车辆自燃或边坡火灾引发，一旦火势蔓延将导致严重交通中断。`,
      causes: ['车辆自燃（发动机过热、电路短路）', '货物起火（易燃品运输、轮胎高温）', '边坡/绿化带火灾（人为抛掷烟头、高温自燃）', '附近施工或焚烧产生的火源扩散'],
      suggestions: [
        { priority: '立即', action: '通知消防、交警和路政部门赶赴现场，启动火灾应急预案' },
        { priority: '立即', action: `调度最近无人机（${droneName}）抵近侦察，通过红外热成像确认火源位置` },
        { priority: '短期', action: '在火灾点前后1公里设置警戒区域，必要时封闭车道或组织车辆绕行' },
        { priority: '跟进', action: '持续监测火势变化，评估对交通和周边环境的影响' },
      ],
      impact: { area: `${roadName}${direction}方向周边3公里`, duration: '2-4小时', congestion: '3-10公里' },
    },
    smoke: {
      conclusion: `${loc}处检测到${typeName}，灰色浓烟影响路面能见度，需判断是否为火灾前兆或误报，存在升级风险。`,
      risk: `中危 — ${typeName}可能为火灾初期或车辆故障排放，需尽快核实源头以防演变为火灾。`,
      causes: ['车辆排放超标（老旧柴油车、故障车辆）', '附近施工或焚烧行为', '火灾初期阶段的烟雾扩散', '工业排放或餐饮油烟'],
      suggestions: [
        { priority: '立即', action: `调度最近无人机（${droneName}）或通知附近巡逻人员核实烟雾源头` },
        { priority: '短期', action: '通过情报板提示过往车辆注意降速，开启车灯，保持安全车距' },
        { priority: '跟进', action: '确认为误报或非火灾源后解除预警，标记为常规事件' },
      ],
      impact: { area: `${roadName}${direction}方向周边1.5公里`, duration: '30-60分钟', congestion: '500米-1公里' },
    },
    congestion: {
      conclusion: `${loc}处检测到${typeName}，车流密度超阈值，均速下降，可能由事故或高峰车流叠加引起。`,
      risk: `中危 — ${typeName}需要关注，若不及时疏导可能升级为严重拥堵。`,
      causes: ['高峰时段车流集中', '前方匝道汇入或出口排队', '车道缩减或施工占道', '轻微事故导致的连锁缓行'],
      suggestions: [
        { priority: '立即', action: '通过情报板和导航APP发布拥堵预警，引导车辆提前绕行或错峰出行' },
        { priority: '短期', action: '若因事故导致则启动事故处置流程；若为流量过大则协调交警加强疏导' },
        { priority: '跟进', action: '持续监测拥堵发展趋势，评估是否需要临时开放应急车道' },
      ],
      impact: { area: `${roadName}${direction}方向周边2公里`, duration: '30-90分钟', congestion: '1-3公里' },
    },
    obstacle: {
      conclusion: `${loc}处检测到${typeName}，后方车辆紧急避让可能引发事故，需及时清理。`,
      risk: `中危 — ${typeName}需要及时清理，若不处理可能导致车辆受损或追尾事故。`,
      causes: ['货车货物固定不牢导致抛洒', '交通事故散落物', '人为丢弃或施工遗留物', '路面损坏产生的碎石'],
      suggestions: [
        { priority: '立即', action: '通知路政养护部门立即前往清理，通过情报板提示"前方障碍物，减速避让"' },
        { priority: '短期', action: '在障碍物后方200米设置警示标志，必要时临时封闭相关车道' },
        { priority: '跟进', action: '清理完毕后检查路面是否受损，记录事件信息' },
      ],
      impact: { area: `${roadName}${direction}方向周边1公里`, duration: '20-40分钟', congestion: '500米-1公里' },
    },
  };

  const tmpl = templates[type] || templates.accident;
  return {
    conclusion: tmpl.conclusion,
    riskLevel: tmpl.risk,
    possibleCauses: tmpl.causes.map((c: string, i: number) => `${i + 1}. ${c}`),
    disposalSuggestions: tmpl.suggestions,
    expectedImpact: tmpl.impact,
  };
}

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
      assessment: demoAssessment(pt.name, type, level, i % 2 === 0 ? '进城' : '出城'),
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
