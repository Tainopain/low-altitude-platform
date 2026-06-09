import { v4 as uuid } from 'uuid';
import { store, initStore } from './store';
import { pickSample, type SampleScene } from '../ai/samples';
import { generateScreenshot } from '../ai/screenshot';

function makeSeedData() {
  const now = Date.now();

  // 为每个种子事件匹配样本 → 生成标注截图
  const eventDefs: Array<{
    type: SampleScene['type']; level: SampleScene['level']; confidence: number;
    stake_number: string; direction: string; lng: number; lat: number;
    source: 'camera' | 'drone'; source_detail: string;
    status: string; drone_id?: string | null; confirmed_by?: string | null;
    created_offset_ms: number;
  }> = [
    { type: 'fire', level: 'high', confidence: 88, stake_number: 'K7+800', direction: '出城', lng: 106.500, lat: 29.485, source: 'drone', source_detail: '无人机红外热成像', status: 'arrived', drone_id: 'DJI-001', confirmed_by: null, created_offset_ms: -900000 },
    { type: 'smoke', level: 'high', confidence: 91, stake_number: 'K18+400', direction: '进城', lng: 106.540, lat: 29.615, source: 'camera', source_detail: '摄像头 · 红外确认', status: 'pending', drone_id: null, confirmed_by: null, created_offset_ms: -60000 },
    { type: 'accident', level: 'high', confidence: 94, stake_number: 'K12+300', direction: '进城', lng: 106.515, lat: 29.485, source: 'drone', source_detail: '无人机俯拍: 多车追尾', status: 'confirmed', drone_id: null, confirmed_by: '值班员张三', created_offset_ms: -120000 },
    { type: 'congestion', level: 'high', confidence: 87, stake_number: 'K32+500', direction: '出城', lng: 106.555, lat: 29.620, source: 'camera', source_detail: '摄像头 · AI 密度分析', status: 'pending', drone_id: null, confirmed_by: null, created_offset_ms: -180000 },
    { type: 'accident', level: 'high', confidence: 82, stake_number: 'K5+200', direction: '进城', lng: 106.530, lat: 29.480, source: 'camera', source_detail: '摄像头: 单车撞护栏', status: 'pending', drone_id: null, confirmed_by: null, created_offset_ms: -450000 },
    { type: 'obstacle', level: 'medium', confidence: 85, stake_number: 'K7+800', direction: '进城', lng: 106.575, lat: 29.488, source: 'camera', source_detail: '摄像头: 路面抛洒物检测', status: 'pending', drone_id: null, confirmed_by: null, created_offset_ms: -300000 },
    { type: 'smoke', level: 'medium', confidence: 68, stake_number: 'K22+600', direction: '出城', lng: 106.520, lat: 29.625, source: 'camera', source_detail: '摄像头: 疑似田间焚烧飘烟', status: 'pending', drone_id: null, confirmed_by: null, created_offset_ms: -240000 },
    { type: 'obstacle', level: 'medium', confidence: 76, stake_number: 'K15+800', direction: '进城', lng: 106.495, lat: 29.478, source: 'camera', source_detail: '摄像头: 路面异物检测', status: 'confirmed', drone_id: null, confirmed_by: '值班员李四', created_offset_ms: -360000 },
    { type: 'congestion', level: 'medium', confidence: 70, stake_number: 'K28+300', direction: '进城', lng: 106.550, lat: 29.485, source: 'camera', source_detail: '摄像头 + 高德路况', status: 'pending', drone_id: null, confirmed_by: null, created_offset_ms: -150000 },
    { type: 'congestion', level: 'low', confidence: 72, stake_number: 'K25+100', direction: '出城', lng: 106.535, lat: 29.610, source: 'camera', source_detail: '摄像头 + 高德路况', status: 'confirmed', drone_id: null, confirmed_by: '值班员张三', created_offset_ms: -600000 },
    { type: 'smoke', level: 'low', confidence: 45, stake_number: 'K30+100', direction: '进城', lng: 106.510, lat: 29.450, source: 'camera', source_detail: '摄像头: 微量烟雾（疑似尾气）', status: 'pending', drone_id: null, confirmed_by: null, created_offset_ms: -720000 },
    { type: 'congestion', level: 'low', confidence: 55, stake_number: 'K3+500', direction: '出城', lng: 106.560, lat: 29.615, source: 'camera', source_detail: '摄像头: 缓行预警', status: 'closed', drone_id: null, confirmed_by: null, created_offset_ms: -1800000 },
  ];

  const events = eventDefs.map((def) => {
    const sample = pickSample(def.type, def.level);
    const { url: screenshotUrl } = generateScreenshot(sample);

    return {
      id: uuid(),
      type: sample.type,
      level: sample.level,
      confidence: def.confidence,
      road_name: 'G50',
      stake_number: def.stake_number,
      direction: def.direction,
      lng: def.lng,
      lat: def.lat,
      source: def.source,
      source_detail: def.source_detail,
      status: def.status,
      drone_id: def.drone_id ?? null,
      confirmed_by: def.confirmed_by ?? null,
      screenshot: screenshotUrl,
      ai_description: sample.description,
      created_at: new Date(now + def.created_offset_ms).toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  return {
    users: [
      { id: uuid(), username: 'admin', password: 'admin123', role: 'admin' },
      { id: uuid(), username: 'operator', password: 'operator123', role: 'operator' },
    ],
    drones: [
      { id: 'DRONE-01', name: '北环机舱',   status: 'standby', lng: 106.507, lat: 29.605, home_lng: 106.507, home_lat: 29.605, heading: 0, battery: 100, task: '覆盖: 北环/石马河/东环', speed: 0 },
      { id: 'DRONE-02', name: '沙坪坝机舱', status: 'standby', lng: 106.449, lat: 29.552, home_lng: 106.449, home_lat: 29.552, heading: 0, battery: 100, task: '覆盖: 杨公桥/高滩岩', speed: 0 },
      { id: 'DRONE-03', name: '华岩机舱',   status: 'standby', lng: 106.445, lat: 29.508, home_lng: 106.445, home_lat: 29.508, heading: 0, battery: 100, task: '覆盖: 西环/凤中', speed: 0 },
      { id: 'DRONE-04', name: '南岸机舱',   status: 'standby', lng: 106.584, lat: 29.522, home_lng: 106.584, home_lat: 29.522, heading: 0, battery: 100, task: '覆盖: 四公里/江南', speed: 0 },
    ],
    events: [], // 不再预生成种子事件，由 AI 检测器实时生成
    chatMessages: [
      { id: uuid(), role: 'assistant', content: '你好，我是低空AI助手。当前试点路段 G50 K0-K60，1架无人机巡逻中，4路摄像头在线。', created_at: new Date().toISOString() },
    ],
  };
}

async function runSeed() {
  await initStore();
  console.log('生成种子数据 + AI 标注截图...');
  store.seed(makeSeedData());
  console.log('Seed data + screenshots written to SQLite');
}

// CLI: npm run seed
const isMain = process.argv[1]?.includes('seed');
if (isMain) {
  runSeed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

/** Auto-seed on first server startup if store is empty */
export function seedIfEmpty() {
  const events = store.getEvents();
  if (events.length === 0) {
    console.log('Empty store — auto-seeding (events skipped)...');
    const data = makeSeedData();
    // 播种用户和无人机
    store.seed({ users: data.users, drones: data.drones });
  }
}
