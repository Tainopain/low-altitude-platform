import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { store } from '../db/store';
import { authMiddleware, adminOnly } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);
router.use(adminOnly);

// POST /api/admin/reset — 重置数据：清空事件，恢复用户和 4 无人机
router.post('/reset', (_req, res) => {
  // 删除所有事件和无人机
  store.resetEvents();
  store.resetDrones(true); // true = delete all

  // 重新播种：用户 + 4 无人机 + 欢迎消息
  store.seed({
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
    chatMessages: [
      { id: uuid(), role: 'assistant', content: '你好，我是低空AI助手。当前重庆主城 9 个立交监控点，4 架无人机待命，9 路摄像头在线。', created_at: new Date().toISOString() },
    ],
  });

  res.json({ success: true, message: '数据已重置。事件已清空，无人机已恢复，AI 检测器将在 90s 内生成新事件。' });
});

export default router;
