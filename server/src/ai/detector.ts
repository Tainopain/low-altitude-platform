/**
 * AI 检测模拟器 v2
 * 模拟真实 YOLOv8 检测行为：加权概率、时段模式、路段热点
 */
import { v4 as uuid } from 'uuid';
import { store } from '../db/store.js';
import { broadcast } from '../ws.js';

// 事件类型基础概率 (事故<拥堵<烟雾≈障碍物<火焰)
const TYPE_WEIGHTS: Record<string, number> = {
  congestion: 25, obstacle: 22, smoke: 20, accident: 18, fire: 15,
};

// 路段桩号 (含热点属性)
const STAKES = [
  { num: 'K5+200',  lng: 106.530, lat: 29.480, hotspot: 0.8 },
  { num: 'K7+800',  lng: 106.575, lat: 29.488, hotspot: 1.5 },  // 事故多发
  { num: 'K12+300', lng: 106.515, lat: 29.485, hotspot: 1.3 },  // 多发段
  { num: 'K15+800', lng: 106.495, lat: 29.478, hotspot: 0.7 },
  { num: 'K18+400', lng: 106.540, lat: 29.615, hotspot: 1.2 },
  { num: 'K22+600', lng: 106.520, lat: 29.625, hotspot: 0.6 },
  { num: 'K25+100', lng: 106.535, lat: 29.610, hotspot: 1.0 },
  { num: 'K28+300', lng: 106.550, lat: 29.485, hotspot: 1.1 },
  { num: 'K32+500', lng: 106.555, lat: 29.620, hotspot: 1.4 },  // 拥堵热点
  { num: 'K35+800', lng: 106.560, lat: 29.615, hotspot: 0.9 },
];

const DIRECTIONS = ['进城', '出城'];

function weightedRand<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

// 时段调整权重：夜间烟雾/火焰更容易被红外检测
function hourMultiplier(type: string): number {
  const hour = new Date().getHours();
  if ((type === 'smoke' || type === 'fire') && (hour < 6 || hour > 20)) return 2.0;
  if (type === 'congestion' && (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19)) return 1.5;
  return 1.0;
}

// 基于热点和类型计算置信度
function smartConfidence(type: string, hotspot: number): number {
  const base = type === 'fire' ? 82 : type === 'accident' ? 78 : type === 'smoke' ? 70 : 65;
  const variation = (Math.random() - 0.3) * 20; // -6 to +14
  const hotspotBonus = (hotspot - 1) * 8;
  return Math.min(98, Math.max(45, Math.round(base + variation + hotspotBonus)));
}

let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;

export function startAIDetector(intervalMs = 30000) {
  if (running) return;
  running = true;
  console.log(`🤖 AI 检测模拟器 v2 启动，间隔 ${intervalMs / 1000}s`);

  const tick = () => {
    if (!running) return;

    // Weighted random: hotspot * type weight * hour multiplier
    const typeWeights: Record<string, number> = {};
    for (const t of Object.keys(TYPE_WEIGHTS)) {
      typeWeights[t] = TYPE_WEIGHTS[t] * hourMultiplier(t);
    }
    const type = weightedRand(typeWeights);

    // Hotspot-weighted stake selection
    const stakeWeights: Record<string, number> = {};
    STAKES.forEach((s) => { stakeWeights[s.num] = s.hotspot; });
    const stake = STAKES.find((s) => s.num === weightedRand(stakeWeights))!;

    // Smart level assignment
    const confidence = smartConfidence(type, stake.hotspot);
    const level = confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low';

    const source = Math.random() > 0.3 ? 'camera' : 'drone';
    const sourceDetails: Record<string, string[]> = {
      camera: ['摄像头 · AI 实时检测', '摄像头 · 红外确认', '摄像头 · 行为分析', '摄像头 + 高德路况'],
      drone: ['无人机巡逻 · AI 检测', '无人机红外热成像', '无人机俯拍 · 异常识别'],
    };
    const detail = sourceDetails[source][Math.floor(Math.random() * sourceDetails[source].length)];

    const event = {
      id: uuid(),
      type,
      level,
      confidence,
      road_name: 'G50',
      stake_number: stake.num,
      direction: DIRECTIONS[Math.floor(Math.random() * 2)],
      lng: stake.lng + (Math.random() - 0.5) * 0.008,
      lat: stake.lat + (Math.random() - 0.5) * 0.008,
      source,
      source_detail: detail,
      status: 'pending',
      drone_id: null,
      confirmed_by: null,
      screenshot: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.createEvent(event);

    broadcast({
      type: 'event:new',
      payload: {
        id: event.id, type: event.type, level: event.level,
        confidence: event.confidence,
        roadName: event.road_name, stakeNumber: event.stake_number,
        direction: event.direction,
        coordinates: [event.lng, event.lat],
        source: event.source, sourceDetail: event.source_detail,
        status: event.status, confirmedBy: null, droneId: null,
        createdAt: Date.now(),
      },
    });

    const lvlLabel = level === 'high' ? '🔴' : level === 'medium' ? '🟡' : '🔵';
    console.log(`${lvlLabel} AI: ${type} ${level} @ ${stake.num} (${confidence}%)`);

    timer = setTimeout(tick, intervalMs + Math.floor(Math.random() * 10000 - 5000));
  };

  timer = setTimeout(tick, 3000);
}

export function stopAIDetector() {
  running = false;
  if (timer) clearTimeout(timer);
}
