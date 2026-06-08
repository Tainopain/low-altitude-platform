import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { store } from '../db/store.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// LLM 配置 (支持 OpenAI 兼容 API)
const LLM_API_URL = process.env.LLM_API_URL || '';     // e.g. https://api.deepseek.com/v1
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'deepseek-chat';

router.get('/messages', (_req, res) => {
  const messages = store.getChatMessages().map((r: any) => ({
    id: r.id, role: r.role, content: r.content,
    timestamp: new Date(r.created_at).getTime(),
  }));
  res.json(messages);
});

router.post('/send', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: '消息不能为空' });

  const userMsg = { id: uuid(), role: 'user', content: text, created_at: new Date().toISOString() };
  store.addChatMessage(userMsg);

  let response: string;
  try {
    response = await callLLM(text);
  } catch {
    response = generateMockResponse(text);
  }

  const aiMsg = { id: uuid(), role: 'assistant', content: response, created_at: new Date().toISOString() };
  store.addChatMessage(aiMsg);

  res.json({
    userMessage: { id: userMsg.id, role: 'user', content: text, timestamp: Date.now() },
    aiMessage: { id: aiMsg.id, role: 'assistant', content: response, timestamp: Date.now() },
  });
});

async function callLLM(userText: string): Promise<string> {
  if (!LLM_API_URL || !LLM_API_KEY) {
    throw new Error('LLM not configured');
  }

  const events = store.getEvents();
  const drones = store.getDrones();
  const context = buildContext(events, drones);

  const res = await fetch(`${LLM_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        {
          role: 'system',
          content: `你是低空AI巡检平台的智能助手。当前系统状态：${context}。请用中文简洁回答用户关于无人机、事件、路况的问题。回答控制在200字以内。`,
        },
        { role: 'user', content: userText },
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM API error: ${res.status}`);
  }

  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content || '抱歉，AI 暂时无法回复。';
}

function buildContext(events: any[], drones: any[]): string {
  const highCount = events.filter((e) => e.level === 'high').length;
  const pendingCount = events.filter((e) => e.status === 'pending').length;
  const flyingCount = drones.filter((d) => d.status === 'flying').length;
  return `试点路段G50 K0-K60，${drones.length}架无人机(${flyingCount}架在空)，4路摄像头在线，今日${events.length}条事件(高危${highCount}条，待处理${pendingCount}条)`;
}

// Mock fallback
const MOCK_RESPONSES: Record<string, string> = {
  '无人机状态': '当前 4 架无人机：\n- **DJI-001** 🟢 在空巡逻中，电量 78%\n- **DJI-002** 🟡 待命，电量 100%\n- **DJI-003** 🟡 待命，电量 95%\n- **DJI-004** ⚪ 充电中，电量 35%',
  '高危事件': '当前高危事件：\n1. G50 K7+800 火焰检测 88%\n2. G50 K18+400 烟雾异常 91%\n3. G50 K12+300 交通事故 94%\n4. G50 K32+500 拥堵事件 87%\n5. G50 K5+200 交通事故 82%',
  '路况': '试点路段 G50 当前状态：\n- 进城方向：基本畅通\n- 出城方向：K25 附近轻度拥堵\n- 全路段 4 路摄像头在线',
  '统计': '今日事件统计：总计 12 条，高危 5 | 中危 4 | 低危 3，待处理 7 条。',
};

function generateMockResponse(text: string): string {
  for (const [k, v] of Object.entries(MOCK_RESPONSES)) {
    if (text.includes(k)) return v;
  }
  return '试点路段 G50 运行正常。1 架无人机巡逻中，4 路摄像头在线，今日已检测事件若干。\n\n可查询："无人机状态""高危事件列表""当前路段路况""今日事件统计"';
}

export default router;
