import { Router } from 'express';
import { store } from '../db/store';

const router = Router();

/**
 * GET /api/stats — 大屏 KPI 汇总数据
 */
router.get('/', (_req, res) => {
  const events = store.getEvents();
  const drones = store.getDrones();

  const total = events.length;
  const pending = events.filter((e: any) => e.status === 'pending').length;
  const highRisk = events.filter((e: any) => e.level === 'high').length;
  const highPending = events.filter((e: any) => e.level === 'high' && e.status === 'pending').length;

  const flying = drones.filter((d: any) => d.status === 'flying').length;
  const standby = drones.filter((d: any) => d.status === 'standby').length;
  const totalDrones = drones.length;

  const avgConfidence = total > 0
    ? Math.round(events.reduce((s: number, e: any) => s + e.confidence, 0) / total)
    : 0;

  // 过去 24 小时事件数
  const dayAgo = Date.now() - 86400000;
  const todayCount = events.filter((e: any) => new Date(e.created_at).getTime() > dayAgo).length;

  // 类型分布
  const typeDist: Record<string, number> = {};
  events.forEach((e: any) => { typeDist[e.type] = (typeDist[e.type] || 0) + 1; });

  // 等级分布
  const levelDist: Record<string, number> = {};
  events.forEach((e: any) => { levelDist[e.level] = (levelDist[e.level] || 0) + 1; });

  res.json({
    events: { total, pending, todayCount, highRisk, highPending, avgConfidence },
    drones: { total: totalDrones, flying, standby },
    distribution: { types: typeDist, levels: levelDist },
    camerasOnline: 9,
  });
});

export default router;
