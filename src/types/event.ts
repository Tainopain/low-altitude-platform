export type EventLevel = 'high' | 'medium' | 'low';
export type EventType = 'accident' | 'congestion' | 'obstacle' | 'smoke' | 'fire';
export type EventStatus = 'pending' | 'confirmed' | 'dispatching' | 'arrived' | 'processing' | 'resolved' | 'closed';
export type EventSource = 'camera' | 'drone';

export interface HighwayEvent {
  id: string;
  type: EventType;
  level: EventLevel;
  confidence: number;          // 0-100
  roadName: string;            // e.g. "G50"
  stakeNumber: string;         // e.g. "K18+400"
  direction: string;           // e.g. "进城"
  coordinates: [number, number];
  screenshot?: string;         // AI 检测截图 URL
  aiDescription?: string;      // AI 分析描述
  assessment?: any;            // AI 事件研判报告
  source: EventSource;
  sourceDetail: string;        // e.g. "摄像头 · 红外确认"
  status: EventStatus;
  confirmedBy?: string;
  createdAt: number;           // timestamp
  droneId?: string;            // 调度后关联的无人机
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  accident: '交通事故',
  congestion: '拥堵事件',
  obstacle: '障碍物',
  smoke: '烟雾异常',
  fire: '火焰检测',
};

export const EVENT_LEVEL_CONFIG: Record<EventLevel, { color: string; bgColor: string; label: string }> = {
  high:   { color: '#F85149', bgColor: 'rgba(248,81,73,0.08)', label: '高危' },
  medium: { color: '#D29922', bgColor: 'transparent', label: '中危' },
  low:    { color: '#79C0FF', bgColor: 'transparent', label: '低危' },
};
