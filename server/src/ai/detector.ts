/**
 * AI 检测模拟器
 * 模拟 YOLOv8 视觉推理管道，周期性生成随机事件
 * MVP 阶段替代真实 AI 推理服务
 */
import { v4 as uuid } from 'uuid';
import { store } from '../db/store.js';
import { broadcast } from '../ws.js';

const EVENT_TYPES = ['accident', 'congestion', 'obstacle', 'smoke', 'fire'] as const;
const LEVELS = ['high', 'medium', 'low'] as const;

// 模拟 G50 路段桩号范围
const STAKES = [
  { num: 'K5+200', lng: 106.530, lat: 29.480 },
  { num: 'K7+800', lng: 106.575, lat: 29.488 },
  { num: 'K12+300', lng: 106.515, lat: 29.485 },
  { num: 'K15+800', lng: 106.495, lat: 29.478 },
  { num: 'K18+400', lng: 106.540, lat: 29.615 },
  { num: 'K22+600', lng: 106.520, lat: 29.625 },
  { num: 'K25+100', lng: 106.535, lat: 29.610 },
  { num: 'K28+300', lng: 106.550, lat: 29.485 },
  { num: 'K32+500', lng: 106.555, lat: 29.620 },
  { num: 'K35+800', lng: 106.560, lat: 29.615 },
];

const DIRECTIONS = ['进城', '出城'];
const SOURCES = [
  { source: 'camera', detail: '摄像头 · AI 实时检测' },
  { source: 'camera', detail: '摄像头 · 红外确认' },
  { source: 'drone', detail: '无人机巡逻 · AI 检测' },
];

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;

export function startAIDetector(intervalMs = 30000) {
  if (running) return;
  running = true;
  console.log(`AI 检测模拟器启动，间隔 ${intervalMs / 1000}s`);

  const tick = () => {
    if (!running) return;

    const stake = rand(STAKES);
    const type = rand(EVENT_TYPES);
    const level = rand(LEVELS);
    const source = rand(SOURCES);
    const confidence = randInt(type === 'fire' ? 80 : type === 'accident' ? 75 : 55, 95);

    const event = {
      id: uuid(),
      type,
      level,
      confidence,
      road_name: 'G50',
      stake_number: stake.num,
      direction: rand(DIRECTIONS),
      lng: stake.lng + (Math.random() - 0.5) * 0.01,
      lat: stake.lat + (Math.random() - 0.5) * 0.01,
      source: source.source,
      source_detail: source.detail,
      status: 'pending',
      drone_id: null,
      confirmed_by: null,
      screenshot: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.createEvent(event);

    // Map to frontend format
    const payload = {
      id: event.id, type: event.type, level: event.level,
      confidence: event.confidence,
      roadName: event.road_name,
      stakeNumber: event.stake_number,
      direction: event.direction,
      coordinates: [event.lng, event.lat],
      screenshot: event.screenshot,
      source: event.source,
      sourceDetail: event.source_detail,
      status: event.status,
      confirmedBy: event.confirmed_by,
      droneId: event.drone_id,
      createdAt: new Date(event.created_at).getTime(),
    };

    broadcast({ type: 'event:new', payload });
    console.log(`🤖 AI 检测: ${type} ${level} @ ${stake.num} (${confidence}%)`);

    timer = setTimeout(tick, intervalMs + randInt(-5000, 5000));
  };

  timer = setTimeout(tick, 5000); // First detection after 5s
}

export function stopAIDetector() {
  running = false;
  if (timer) clearTimeout(timer);
}
