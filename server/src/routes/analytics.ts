import { Router } from 'express';
import { store } from '../db/store';
import { authMiddleware } from '../middleware/auth';
import { generateInsights, calibrateConfidence, spatialClusters } from '../ai/analytics';

const router = Router();
router.use(authMiddleware);

/** GET /api/analytics/insights — AI 分析洞察 */
router.get('/insights', (_req, res) => {
  const events = store.getEvents();
  const insights = generateInsights(events);
  res.json({ insights, generatedAt: new Date().toISOString() });
});

/** GET /api/analytics/calibration — 置信度校准数据 */
router.get('/calibration', (_req, res) => {
  const events = store.getEvents();
  const rawConfidences = events.map((e: any) => e.confidence);
  const calibrated = calibrateConfidence(rawConfidences);

  const result = events.map((e: any, i: number) => ({
    id: e.id,
    type: e.type,
    rawConfidence: e.confidence,
    calibratedConfidence: calibrated[i],
  }));

  res.json(result);
});

/** GET /api/analytics/clusters — 事件空间聚类 */
router.get('/clusters', (_req, res) => {
  const events = store.getEvents();
  const points = events.map((e: any) => ({
    lng: e.lng,
    lat: e.lat,
    id: e.id,
    type: e.type,
    level: e.level,
  }));

  const clusters = spatialClusters(points, 2, 3);
  res.json({ clusters, total: events.length });
});

export default router;
