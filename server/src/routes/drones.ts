import { Router } from 'express';
import { store } from '../db/store.js';
import { authMiddleware } from '../middleware/auth.js';
import { broadcast } from '../ws.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req, res) => {
  const drones = store.getDrones().map(mapDrone);
  res.json(drones);
});

router.patch('/:id', (req, res) => {
  const patch: Record<string, any> = {};
  for (const key of ['status', 'lng', 'lat', 'heading', 'battery', 'task', 'speed']) {
    if (req.body[key] !== undefined) patch[key] = req.body[key];
  }
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: '无有效更新字段' });
  }

  const updated = store.updateDrone(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: '无人机不存在' });

  const drone = mapDrone(updated);
  broadcast({ type: 'drone:update', payload: drone });
  res.json(drone);
});

function mapDrone(row: any) {
  return {
    id: row.id, name: row.name, status: row.status,
    coordinates: [row.lng, row.lat],
    homePosition: [row.home_lng, row.home_lat],
    heading: row.heading, battery: row.battery,
    task: row.task, speed: row.speed,
  };
}

export default router;
