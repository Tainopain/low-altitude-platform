/**
 * AI 检测样本素材库
 * 每份素材包含场景元信息，用于替代真实摄像头流
 */

export interface SampleScene {
  id: string;
  type: 'accident' | 'congestion' | 'obstacle' | 'smoke' | 'fire';
  level: 'high' | 'medium' | 'low';
  confidence: number;
  roadName: string;
  stakeNumber: string;
  direction: string;
  description: string;
  bbox: BBox;
  cameraAngle: 'front' | 'side' | 'overhead';
  weather: 'clear' | 'rain' | 'fog' | 'night';
  laneCount: number;
}

export interface BBox {
  x: number; y: number; w: number; h: number;
  label: string;
}

/** 样本库 — 12 个重庆主城立交典型场景 */
const SAMPLES: SampleScene[] = [
  {
    id: 'sample-001',
    type: 'accident', level: 'high', confidence: 94,
    roadName: '北环立交', stakeNumber: '江北/渝北', direction: '进城',
    description: '检测到多车追尾事故。G75 兰海高速匝道口处白色轿车与黑色SUV碰撞，碎片散落路面，占用匝道。建议立即通知交巡警，引导车辆绕行。',
    bbox: { x: 0.25, y: 0.35, w: 0.45, h: 0.40, label: '交通事故 · 多车追尾' },
    cameraAngle: 'front', weather: 'clear', laneCount: 3,
  },
  {
    id: 'sample-002',
    type: 'fire', level: 'high', confidence: 91,
    roadName: '西环立交', stakeNumber: '九龙坡', direction: '出城',
    description: '检测到边坡起火。G93 成渝高速右侧护栏外可见明火，浓烟影响路面能见度。建议立即通知消防，暂时封闭右侧车道。',
    bbox: { x: 0.55, y: 0.20, w: 0.35, h: 0.50, label: '火焰 · 边坡起火' },
    cameraAngle: 'side', weather: 'clear', laneCount: 2,
  },
  {
    id: 'sample-003',
    type: 'smoke', level: 'high', confidence: 89,
    roadName: '高滩岩立交', stakeNumber: '沙坪坝区', direction: '进城',
    description: '大学城隧道入口检测到浓烟异常。灰色浓烟从隧道口涌出，能见度急剧下降。疑似隧道内车辆起火，建议立即封闭隧道，调度救援。',
    bbox: { x: 0.10, y: 0.15, w: 0.50, h: 0.55, label: '浓烟 · 隧道口异常' },
    cameraAngle: 'front', weather: 'clear', laneCount: 2,
  },
  {
    id: 'sample-004',
    type: 'congestion', level: 'high', confidence: 87,
    roadName: '东环立交', stakeNumber: '江北区', direction: '出城',
    description: '检测到严重拥堵。G50 沪渝高速长寿方向三条车道全部缓行，车流密度超阈值。疑似前方事故导致排队，建议派遣无人机巡航确认。',
    bbox: { x: 0.05, y: 0.30, w: 0.90, h: 0.50, label: '拥堵 · 全车道缓行' },
    cameraAngle: 'overhead', weather: 'clear', laneCount: 3,
  },
  {
    id: 'sample-005',
    type: 'accident', level: 'high', confidence: 82,
    roadName: '四公里立交', stakeNumber: '南岸区', direction: '进城',
    description: '检测到单车撞击护栏。G65 包茂高速入口处银色轿车失控撞向隔离带，车头严重变形。安全气囊已弹出，建议立即派遣救援。',
    bbox: { x: 0.35, y: 0.40, w: 0.25, h: 0.30, label: '事故 · 单车撞护栏' },
    cameraAngle: 'side', weather: 'rain', laneCount: 3,
  },
  {
    id: 'sample-006',
    type: 'obstacle', level: 'medium', confidence: 85,
    roadName: '江南立交', stakeNumber: '南岸区', direction: '进城',
    description: '检测到路面障碍物。真武山隧道出口左车道散落大型货物，后方车辆紧急变道避让。建议调度养护人员前往清理。',
    bbox: { x: 0.15, y: 0.45, w: 0.18, h: 0.22, label: '障碍物 · 路面抛洒物' },
    cameraAngle: 'front', weather: 'clear', laneCount: 3,
  },
  {
    id: 'sample-007',
    type: 'smoke', level: 'medium', confidence: 68,
    roadName: '凤中立交', stakeNumber: '九龙坡', direction: '出城',
    description: '华岩寺路方向检测到薄烟飘散。可能为周边区域焚烧，当前路面能见度轻微下降，建议持续观察。',
    bbox: { x: 0.60, y: 0.10, w: 0.30, h: 0.35, label: '薄烟 · 疑似区域焚烧' },
    cameraAngle: 'side', weather: 'fog', laneCount: 2,
  },
  {
    id: 'sample-008',
    type: 'obstacle', level: 'medium', confidence: 76,
    roadName: '杨公桥立交', stakeNumber: '沙坪坝区', direction: '进城',
    description: '沙滨路匝道检测到路面异物。中央车道出现疑似轮胎碎片，尺寸约 0.5m，多车紧急减速避让，存在追尾风险。',
    bbox: { x: 0.40, y: 0.50, w: 0.12, h: 0.10, label: '障碍物 · 轮胎碎片' },
    cameraAngle: 'front', weather: 'night', laneCount: 3,
  },
  {
    id: 'sample-009',
    type: 'congestion', level: 'medium', confidence: 70,
    roadName: '石马河立交', stakeNumber: '江北区', direction: '进城',
    description: '双碑大桥方向检测到中度拥堵。匝道汇入车流导致缓行，均速降至 35km/h，左侧车道通行正常，建议设置临时引导。',
    bbox: { x: 0.40, y: 0.25, w: 0.55, h: 0.45, label: '拥堵 · 匝道汇入' },
    cameraAngle: 'overhead', weather: 'clear', laneCount: 3,
  },
  {
    id: 'sample-010',
    type: 'congestion', level: 'low', confidence: 72,
    roadName: '北环立交', stakeNumber: '江北/渝北', direction: '出城',
    description: '晚高峰出城方向车流增加，G75 兰海高速均速 48km/h。各车道均可通行，暂无异常事件，建议持续监控。',
    bbox: { x: 0.05, y: 0.30, w: 0.88, h: 0.45, label: '缓行 · 晚高峰' },
    cameraAngle: 'overhead', weather: 'clear', laneCount: 3,
  },
  {
    id: 'sample-011',
    type: 'smoke', level: 'low', confidence: 45,
    roadName: '凤中立交', stakeNumber: '九龙坡', direction: '进城',
    description: '华福大道检测到微量白烟。疑似货车尾气排放超标，短暂烟雾带已消散过半，无需立即处置。',
    bbox: { x: 0.50, y: 0.40, w: 0.20, h: 0.18, label: '微量烟雾 · 疑似尾气' },
    cameraAngle: 'front', weather: 'clear', laneCount: 2,
  },
  {
    id: 'sample-012',
    type: 'congestion', level: 'low', confidence: 55,
    roadName: '四公里立交', stakeNumber: '南岸区', direction: '出城',
    description: '四公里枢纽出口匝道缓行，驶出车辆排队约 200m。主路通行正常，为常规枢纽排队现象，无需特别处置。',
    bbox: { x: 0.55, y: 0.20, w: 0.35, h: 0.55, label: '缓行 · 枢纽排队' },
    cameraAngle: 'side', weather: 'night', laneCount: 2,
  },
];

/** 根据事件类型随机获取匹配的样本 */
export function pickSample(type?: string, level?: string): SampleScene {
  const pool = SAMPLES.filter((s) => {
    if (type && s.type !== type) return false;
    if (level && s.level !== level) return false;
    return true;
  });
  if (pool.length === 0) return SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** 获取所有样本（供管理界面使用） */
export function getAllSamples(): SampleScene[] {
  return SAMPLES;
}

/** 按 ID 获取样本 */
export function getSampleById(id: string): SampleScene | undefined {
  return SAMPLES.find((s) => s.id === id);
}
