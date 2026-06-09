/**
 * AI 检测模拟器 v4 — 重庆主城 9 立交监控点
 * 90 秒间隔，随机选择监控点 + 事件类型，生成标注截图并推送
 */
import { v4 as uuid } from 'uuid';
import { store } from '../db/store';
import { broadcast } from '../ws';
import { pickSample } from './samples';
import { generateScreenshot } from './screenshot';
import { generateAssessment } from './assessment';

/** 9 个重庆主城立交监控点 */
interface MonitorPoint {
  name: string;        // 立交名称
  district: string;    // 所在区域
  road: string;        // 关联高速/道路
  lng: number;
  lat: number;
}

const MONITOR_POINTS: MonitorPoint[] = [
  { name: '北环立交',   district: '江北/渝北', road: 'G75兰海高速',     lng: 106.497385, lat: 29.609658 },
  { name: '石马河立交', district: '江北区',     road: '双碑大桥',        lng: 106.471885, lat: 29.584855 },
  { name: '东环立交',   district: '江北区',     road: 'G50沪渝高速',     lng: 106.551681, lat: 29.620295 },
  { name: '四公里立交', district: '南岸区',     road: 'G65包茂高速',     lng: 106.575596, lat: 29.514190 },
  { name: '江南立交',   district: '南岸区',     road: '真武山隧道',      lng: 106.592240, lat: 29.530410 },
  { name: '凤中立交',   district: '九龙坡',     road: '华岩',           lng: 106.447897, lat: 29.498872 },
  { name: '西环立交',   district: '九龙坡',     road: 'G93成渝高速',     lng: 106.441436, lat: 29.517380 },
  { name: '高滩岩立交', district: '沙坪坝区',   road: '大学城隧道',      lng: 106.443702, lat: 29.539939 },
  { name: '杨公桥立交', district: '沙坪坝区',   road: '沙滨路/三峡广场', lng: 106.453861, lat: 29.564296 },
];

/** 从 9 个监控点随机选取一个，加 ±100m 抖动 */
function pickPoint(): MonitorPoint {
  const point = MONITOR_POINTS[Math.floor(Math.random() * MONITOR_POINTS.length)];
  return {
    ...point,
    lng: point.lng + (Math.random() - 0.5) * 0.002,
    lat: point.lat + (Math.random() - 0.5) * 0.002,
  };
}

let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;

export function startAIDetector(intervalMs = 300000) {
  if (running) return;
  running = true;
  console.log(`🤖 AI 检测模拟器 v4 启动（9 立交监控点），间隔 ~${intervalMs / 1000}s`);

  const tick = () => {
    if (!running) return;

    // 随机选 3 个不同的监控点
    const shuffled = [...MONITOR_POINTS].sort(() => Math.random() - 0.5);
    const points = shuffled.slice(0, 3);

    // 确保 3 种不同事件类型
    const allTypes = ['accident', 'congestion', 'obstacle', 'smoke', 'fire'] as const;
    const shuffledTypes = [...allTypes].sort(() => Math.random() - 0.5);
    const types = shuffledTypes.slice(0, 3);

    const logLines: string[] = [];

    points.forEach((point, i) => {
      const eventType = types[i];
      const sample = pickSample(eventType);
      const { url: screenshotUrl } = generateScreenshot(sample);
      const dir = point.lng > 106.50 ? '出城' : '进城';

      // 生成 AI 研判报告
      const drones = store.getDrones();
      const droneName = drones[0]?.name || '最近待命无人机';
      const assessment = generateAssessment({
        type: sample.type, level: sample.level, confidence: sample.confidence,
        roadName: point.name, stakeNumber: point.district, direction: dir,
        description: sample.description, weather: sample.weather, droneName,
      });

      const event = {
        id: uuid(),
        type: sample.type,
        level: sample.level,
        confidence: sample.confidence,
        road_name: point.name,
        stake_number: point.district,
        direction: dir,
        lng: point.lng,
        lat: point.lat,
        source: 'camera' as const,
        source_detail: `${point.name} · AI ${sample.weather === 'night' ? '红外' : '视觉'}检测`,
        status: 'pending',
        drone_id: null,
        confirmed_by: null,
        screenshot: screenshotUrl,
        ai_description: `[${point.name}] ${sample.description} | 关联道路: ${point.road}`,
        assessment: JSON.stringify(assessment),
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
          screenshot: screenshotUrl,
          aiDescription: event.ai_description,
          createdAt: Date.now(),
        },
      });

      const lvlLabel = sample.level === 'high' ? '🔴' : sample.level === 'medium' ? '🟡' : '🔵';
      logLines.push(`${lvlLabel} ${sample.type} ${sample.level} @ ${point.name}`);
    });

    console.log(`📡 300s 批次: 3 事件 →\n    ${logLines.join('\n    ')}`);

    timer = setTimeout(tick, intervalMs + Math.floor(Math.random() * 10000 - 5000));
  };

  // 首次延迟 5-8 秒
  timer = setTimeout(tick, 5000 + Math.random() * 3000);
}

export function stopAIDetector() {
  running = false;
  if (timer) clearTimeout(timer);
}

export { MONITOR_POINTS };
