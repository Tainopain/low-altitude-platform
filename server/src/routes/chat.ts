import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { store } from '../db/store.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/messages', (_req, res) => {
  const messages = store.getChatMessages().map((r: any) => ({
    id: r.id, role: r.role, content: r.content,
    timestamp: new Date(r.created_at).getTime(),
  }));
  res.json(messages);
});

router.post('/send', (_req, res) => {
  const { text } = _req.body;
  if (!text) return res.status(400).json({ error: '消息不能为空' });

  const userMsg = { id: uuid(), role: 'user', content: text, created_at: new Date().toISOString() };
  store.addChatMessage(userMsg);

  const response = generateMockResponse(text);
  const aiMsg = { id: uuid(), role: 'assistant', content: response, created_at: new Date().toISOString() };
  store.addChatMessage(aiMsg);

  res.json({
    userMessage: { id: userMsg.id, role: 'user', content: text, timestamp: Date.now() },
    aiMessage: { id: aiMsg.id, role: 'assistant', content: response, timestamp: Date.now() },
  });
});

const MOCK_RESPONSES: Record<string, string> = {
  '无人机状态': '当前 4 架无人机：\n- **DJI-001** 🟢 在空巡逻中，电量 78%\n- **DJI-002** 🟡 待命，电量 100%\n- **DJI-003** 🟡 待命，电量 95%\n- **DJI-004** ⚪ 充电中，电量 35%',
  '高危事件': '当前高危事件 5 条：\n1. **G50 K7+800** 火焰检测 88%\n2. **G50 K18+400** 烟雾异常 91%\n3. **G50 K12+300** 交通事故 94%\n4. **G50 K32+500** 拥堵事件 87%\n5. **G50 K5+200** 交通事故 82%',
  '路况': '试点路段 G50 当前状态：\n- 进城方向：基本畅通\n- 出城方向：K25 附近轻度拥堵\n- 全路段 4 路摄像头在线',
  '统计': '今日事件统计：\n- 总计：12 条\n- 高危：5 | 中危：4 | 低危：3\n- 待处理：7 条',
};

function generateMockResponse(text: string): string {
  for (const [key, res] of Object.entries(MOCK_RESPONSES)) {
    if (text.includes(key)) return res;
  }
  return `试点路段 G50 运行正常。1 架无人机巡逻中，4 路摄像头在线，今日已检测 12 条事件。\n\n可查询："无人机状态？""高危事件列表""当前路段路况""今日事件统计"`;
}

export default router;
