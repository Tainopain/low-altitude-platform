import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { store } from '../db/store.js';
import { authMiddleware } from '../middleware/auth.js';
import { broadcast } from '../ws.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req, res) => {
  const events = store.getEvents().map(mapEvent);
  res.json(events);
});

router.get('/:id', (req, res) => {
  const row = store.getEventById(req.params.id);
  if (!row) return res.status(404).json({ error: '事件不存在' });
  res.json(mapEvent(row));
});

router.patch('/:id', (req, res) => {
  const patch: Record<string, any> = {};
  for (const key of ['status', 'confirmed_by', 'drone_id']) {
    if (req.body[key] !== undefined) patch[key] = req.body[key];
  }
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: '无有效更新字段' });
  }

  const updated = store.updateEvent(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: '事件不存在' });

  const event = mapEvent(updated);
  broadcast({ type: 'event:update', payload: event });
  res.json(event);
});

router.post('/', (req, res) => {
  const { type, level, confidence, road_name, stake_number, direction, lng, lat, source, source_detail } = req.body;
  if (!type || !level || lng === undefined || lat === undefined) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const row = {
    id: uuid(), type, level,
    confidence: confidence || 0,
    road_name: road_name || 'G50',
    stake_number: stake_number || '',
    direction: direction || '',
    lng, lat,
    source: source || 'camera',
    source_detail: source_detail || '',
    status: 'pending',
    drone_id: null,
    confirmed_by: null,
    screenshot: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.createEvent(row);
  const event = mapEvent(row);
  broadcast({ type: 'event:new', payload: event });
  res.status(201).json(event);
});

function mapEvent(row: any) {
  return {
    id: row.id, type: row.type, level: row.level,
    confidence: row.confidence,
    roadName: row.road_name,
    stakeNumber: row.stake_number,
    direction: row.direction,
    coordinates: [row.lng, row.lat],
    screenshot: row.screenshot,
    source: row.source,
    sourceDetail: row.source_detail,
    status: row.status,
    confirmedBy: row.confirmed_by,
    droneId: row.drone_id,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export default router;
