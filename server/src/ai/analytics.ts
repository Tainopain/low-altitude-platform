/**
 * AI 分析引擎 v2
 * 异常检测 · 空间聚类 · 置信度校准 · Holt-Winters 预测 · 多维风险评分
 */

// ============================================================
// 1. 时间序列异常检测
// ============================================================

export function detectAnomalies(
  values: number[],
  threshold = 2.0,
): { index: number; value: number; zScore: number; severity: 'high' | 'medium' | 'low' }[] {
  const n = values.length;
  if (n < 4) return [];
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
  if (std === 0) return [];
  return values
    .map((v, i) => ({ index: i, value: v, zScore: Math.abs((v - mean) / std) }))
    .filter((d) => d.zScore > threshold)
    .map((d) => ({
      ...d,
      severity: (d.zScore > 3 ? 'high' : d.zScore > 2.5 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
    }));
}

// ============================================================
// 2. 空间聚类 — 基于 9 个监测点
// ============================================================

const MONITOR_NAMES = [
  '北环立交', '石马河立交', '东环立交', '四公里立交',
  '江南立交', '凤中立交', '西环立交', '高滩岩立交', '杨公桥立交',
];

const MONITOR_COORDS: Record<string, [number, number]> = {
  '北环立交':   [106.497385, 29.609658],
  '石马河立交': [106.471885, 29.584855],
  '东环立交':   [106.551681, 29.620295],
  '四公里立交': [106.575596, 29.514190],
  '江南立交':   [106.592240, 29.530410],
  '凤中立交':   [106.447897, 29.498872],
  '西环立交':   [106.441436, 29.517380],
  '高滩岩立交': [106.443702, 29.539939],
  '杨公桥立交': [106.453861, 29.564296],
};

interface Point { lng: number; lat: number; id: string }

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 找到最近的监测点名称 */
function nearestMonitor(lng: number, lat: number): string {
  let best = MONITOR_NAMES[0];
  let min = Infinity;
  for (const name of MONITOR_NAMES) {
    const [mlng, mlat] = MONITOR_COORDS[name];
    const d = haversineKm(lat, lng, mlat, mlng);
    if (d < min) { min = d; best = name; }
  }
  return best;
}

export function spatialClusters(
  points: Point[],
  radiusKm = 2,
  minPoints = 2,
): { center: [number, number]; count: number; ids: string[]; locationName: string }[] {
  const clusters: { center: [number, number]; count: number; ids: string[] }[] = [];
  const visited = new Set<string>();

  for (const p of points) {
    if (visited.has(p.id)) continue;
    const neighbors = points.filter((q) => {
      if (visited.has(q.id)) return false;
      return haversineKm(p.lat, p.lng, q.lat, q.lng) <= radiusKm;
    });
    if (neighbors.length >= minPoints) {
      const cx = neighbors.reduce((s, q) => s + q.lng, 0) / neighbors.length;
      const cy = neighbors.reduce((s, q) => s + q.lat, 0) / neighbors.length;
      clusters.push({ center: [cx, cy], count: neighbors.length, ids: neighbors.map((q) => q.id) });
      neighbors.forEach((q) => visited.add(q.id));
    }
  }

  return clusters.map((c) => ({
    ...c,
    locationName: nearestMonitor(c.center[0], c.center[1]),
  }));
}

// ============================================================
// 3. 置信度校准
// ============================================================

export function calibrateConfidence(confidences: number[]): number[] {
  if (confidences.length < 5) return confidences;
  const mean = confidences.reduce((s, c) => s + c, 0) / confidences.length;
  const std = Math.sqrt(confidences.reduce((s, c) => s + (c - mean) ** 2, 0) / confidences.length);
  // 自适应 Platt Scaling：均值高 + 方差小 → 轻微校准；均值低或方差大 → 强校准
  const A = mean > 75 && std < 10 ? 1.2 : mean > 60 ? 1.5 : 2.0;
  const B = mean > 80 ? -0.1 : -0.4;
  return confidences.map((c) => {
    const raw = (c / 100) * 2 - 1;
    return Math.round((1 / (1 + Math.exp(-(A * raw + B)))) * 100);
  });
}

// ============================================================
// 4. Holt-Winters 预测（趋势 + 季节性）
// ============================================================

export function forecastNext(values: number[], period = 24): {
  predicted: number; trend: 'up' | 'down' | 'stable'; confidence: number; next24h: number[];
} {
  if (values.length < period * 2) {
    // 数据不足，退化为简单指数平滑
    const mean = values.reduce((s, v) => s + v, 0) / Math.max(values.length, 1);
    return { predicted: Math.round(mean), trend: 'stable', confidence: 50, next24h: [Math.round(mean)] };
  }

  // 简单 Holt-Winters 分解
  const n = values.length;
  const trend: number[] = [];
  const seasonal: number[] = new Array(period).fill(0);
  const alpha = 0.3, beta = 0.1;

  // 初始水平
  let level = values.slice(0, period).reduce((s, v) => s + v, 0) / period;
  let slope = (values[period] - values[0]) / period;

  // 计算季节性指数
  for (let i = 0; i < period; i++) {
    let sum = 0, count = 0;
    for (let j = i; j < n; j += period) { sum += values[j]; count++; }
    seasonal[i] = count > 0 ? sum / count - level : 0;
  }

  // 平滑
  const smoothed: number[] = [];
  for (let i = 0; i < n; i++) {
    const s = seasonal[i % period];
    const pred = level + slope + s;
    smoothed.push(Math.max(0, Math.round(pred)));
    const newLevel = alpha * (values[i] - s) + (1 - alpha) * (level + slope);
    slope = beta * (newLevel - level) + (1 - beta) * slope;
    level = newLevel;
  }

  // 预测未来 24 个时段
  const next24h = Array.from({ length: 24 }, (_, i) => {
    const s = seasonal[(n + i) % period];
    return Math.max(0, Math.round(level + slope * (i + 1) + s));
  });

  const predicted = next24h[0];
  const recentTrend = next24h.slice(0, 3);
  const trendSlope = (recentTrend[2] - recentTrend[0]) / 2;
  const trendDir: 'up' | 'down' | 'stable' = trendSlope > 1 ? 'up' : trendSlope < -1 ? 'down' : 'stable';

  // 置信度基于残差
  const residuals = values.slice(-period).map((v, i) => Math.abs(v - (smoothed[n - period + i] || v)));
  const avgResidual = residuals.reduce((s, r) => s + r, 0) / residuals.length;
  const conf = Math.round(Math.max(40, Math.min(95, 100 - avgResidual * 20)));

  return { predicted, trend: trendDir, confidence: conf, next24h };
}

// ============================================================
// 5. 综合洞察生成
// ============================================================

export interface AIInsight {
  type: 'anomaly' | 'cluster' | 'trend' | 'risk' | 'typeDist';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  data?: any;
}

export function generateInsights(events: any[]): AIInsight[] {
  const insights: AIInsight[] = [];
  const now = Date.now();

  // ---- 类型分布 ----
  const typeDist: Record<string, number> = {};
  events.forEach((e) => { typeDist[e.type] = (typeDist[e.type] || 0) + 1; });
  const sortedTypes = Object.entries(typeDist).sort((a, b) => b[1] - a[1]);
  const topType = sortedTypes[0];
  if (topType) {
    const typeNames: Record<string, string> = { accident: '交通事故', congestion: '拥堵', obstacle: '障碍物', smoke: '烟雾', fire: '火焰' };
    insights.push({
      type: 'typeDist',
      title: '事件类型分析',
      description: `过去 7 天共计 ${events.length} 起事件。${sortedTypes.map(([t, c]) => `${typeNames[t] || t} ${c} 起`).join('，')}`,
      severity: (topType[1] / events.length) > 0.4 ? 'medium' : 'low',
      data: { typeDist, topType: topType[0] },
    });
  }

  // ---- 各监测点统计 ----
  const locStats: Record<string, { count: number; highCount: number }> = {};
  events.forEach((e) => {
    const name = e.road_name || nearestMonitor(e.lng || e.coordinates?.[0] || 106.5, e.lat || e.coordinates?.[1] || 29.55);
    if (!locStats[name]) locStats[name] = { count: 0, highCount: 0 };
    locStats[name].count++;
    if (e.level === 'high') locStats[name].highCount++;
  });
  const busiest = Object.entries(locStats).sort((a, b) => b[1].count - a[1].count)[0];

  // ---- 异常检测 ----
  const hourlyCounts: number[] = [];
  for (let h = 167; h >= 0; h--) {
    const start = now - (h + 1) * 3600000;
    const end = now - h * 3600000;
    hourlyCounts.push(events.filter((e) => {
      const t = new Date(e.created_at || e.createdAt).getTime();
      return t >= start && t < end;
    }).length);
  }

  const anomalies = detectAnomalies(hourlyCounts, 2.2);
  if (anomalies.length > 0) {
    const top = anomalies.sort((a, b) => b.zScore - a.zScore)[0];
    insights.push({
      type: 'anomaly',
      title: '时序异常检测',
      description: `检测到 ${anomalies.length} 个异常时段。峰值异常指数 ${top.zScore.toFixed(1)}σ，发生于 ${Math.floor(top.index / 24)} 天前`,
      severity: top.severity,
      data: { anomalyCount: anomalies.length, maxZScore: top.zScore },
    });
  }

  // ---- 空间聚类 ----
  const geoPoints = events.map((e) => ({
    lng: e.lng || (e.coordinates?.[0]),
    lat: e.lat || (e.coordinates?.[1]),
    id: e.id,
  })).filter((p) => p.lng && p.lat);

  const clusters = spatialClusters(geoPoints, 2.5, 2);
  if (clusters.length > 0) {
    const top = clusters[0];
    insights.push({
      type: 'cluster',
      title: '事件热点区域',
      description: `识别到 ${clusters.length} 个热点。${top.locationName} 附近最密集（${top.count} 起），${busiest ? `${busiest[0]} 事件量最高（${busiest[1].count} 起）` : ''}`,
      severity: top.count >= 4 ? 'high' : 'medium',
      data: { clusters: clusters.slice(0, 3), busiestLocation: busiest?.[0] },
    });
  }

  // ---- 趋势预测 ----
  const dailyCounts: number[] = [];
  for (let d = 6; d >= 0; d--) {
    const start = now - (d + 1) * 86400000;
    const end = now - d * 86400000;
    dailyCounts.push(events.filter((e) => {
      const t = new Date(e.created_at || e.createdAt).getTime();
      return t >= start && t < end;
    }).length);
  }

  const forecast = forecastNext(hourlyCounts, 24);
  insights.push({
    type: 'trend',
    title: '事件趋势预测',
    description: `下一时段预计 ${forecast.predicted} 起事件（${forecast.confidence}% 置信度）。趋势${forecast.trend === 'up' ? '上升 ↑' : forecast.trend === 'down' ? '下降 ↓' : '平稳 →'}`,
    severity: forecast.trend === 'up' ? 'medium' : 'low',
    data: { predicted: forecast.predicted, trend: forecast.trend, confidence: forecast.confidence },
  });

  // ---- 综合风险评分 ----
  const highPending = events.filter((e) => e.level === 'high' && e.status === 'pending').length;
  const recentEvents = events.filter((e) => {
    const t = new Date(e.created_at || e.createdAt).getTime();
    return (now - t) < 3600000; // 过去 1 小时
  }).length;

  const riskScore = Math.min(100, Math.round(
    highPending * 12 +
    recentEvents * 5 +
    anomalies.length * 6 +
    clusters.length * 8 +
    (forecast.trend === 'up' ? 15 : forecast.trend === 'down' ? 5 : 0)
  ));

  const riskLevel = riskScore > 60 ? '建议加强巡逻，关注高危事件' : riskScore > 30 ? '正常监控，保持响应' : '运行平稳，例行巡检';
  insights.push({
    type: 'risk',
    title: '综合风险评分',
    description: `风险指数 ${riskScore}/100（${riskLevel}）。高危待处理 ${highPending} 起，近 1 小时新增 ${recentEvents} 起`,
    severity: riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low',
    data: { riskScore, highPending, recentEvents, anomalyCount: anomalies.length, clusterCount: clusters.length },
  });

  return insights;
}
