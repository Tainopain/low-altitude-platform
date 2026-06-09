import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { store } from '../db/store';
import { authMiddleware } from '../middleware/auth';

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
    console.log('   Chat: LLM response');
  } catch (e: any) {
    console.log(`   Chat: Mock fallback (LLM: ${e.message})`);
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
  const highCount = events.filter((e: any) => e.level === 'high').length;
  const pendingCount = events.filter((e: any) => e.status === 'pending').length;
  const standbyCount = drones.filter((d: any) => d.status === 'standby').length;
  const locNames = [...new Set(events.map((e: any) => e.road_name).filter(Boolean))].slice(0, 5).join('、');
  return `重庆主城9立交监控点(${locNames}等)，${drones.length}架无人机(${standbyCount}架待命)，9路摄像头在线，今日${events.length}条事件(高危${highCount}条，待处理${pendingCount}条)`;
}

// Mock fallback — 动态生成，基于实时数据
function generateMockResponse(text: string): string {
  console.log('   Chat query:', text);
  const events = store.getEvents();
  const drones = store.getDrones();
  console.log(`   Data: ${events.length} events, ${drones.length} drones`);
  const highEvents = events.filter((e: any) => e.level === 'high');
  const pendingEvents = events.filter((e: any) => e.status === 'pending');
  const locNames = [...new Set(events.map((e: any) => e.road_name).filter(Boolean))];

  if (text.includes('无人机') || text.includes('机舱')) {
    const droneList = drones.map((d: any) =>
      `- **${d.name}** ${d.status === 'standby' ? '🟡 待命' : d.status === 'flying' ? '🟢 在空' : '⚪ 离线'}，电量 ${d.battery}%，${d.task}`
    ).join('\n');
    return `当前 ${drones.length} 架无人机：\n${droneList}\n飞行覆盖半径 5km，9 路摄像头全部在线。`;
  }

  if (text.includes('高危') || text.includes('事件')) {
    if (highEvents.length === 0) return '当前无高危事件，系统运行正常。';
    const top5 = highEvents.slice(0, 5).map((e: any, i: number) =>
      `${i + 1}. ${e.road_name} ${e.type} 置信度 ${e.confidence}% ${e.status === 'pending' ? '⏳待处理' : '✅已确认'}`
    ).join('\n');
    return `当前高危事件 ${highEvents.length} 起：\n${top5}\n${pendingEvents.length > 0 ? `共 ${pendingEvents.length} 起待处理，建议优先关注。` : '全部已确认处置。'}`;
  }

  if (text.includes('路况')) {
    const locSummary = locNames.slice(0, 5).map((n: string) => {
      const count = events.filter((e: any) => e.road_name === n).length;
      return `${n}：${count} 起事件`;
    }).join('\n');
    return `重庆主城 9 立交监控点当前状态：\n${locSummary}\n总计 ${events.length} 起事件，9 路摄像头在线，4 架无人机待命。`;
  }

  if (text.includes('统计')) {
    const high = events.filter((e: any) => e.level === 'high').length;
    const med = events.filter((e: any) => e.level === 'medium').length;
    const low = events.filter((e: any) => e.level === 'low').length;
    const types: Record<string, number> = {};
    events.forEach((e: any) => { types[e.type] = (types[e.type] || 0) + 1; });
    const typeStr = Object.entries(types).map(([t, c]) => {
      const names: Record<string, string> = { accident: '事故', congestion: '拥堵', obstacle: '障碍物', smoke: '烟雾', fire: '火焰' };
      return `${names[t] || t} ${c} 起`;
    }).join(' | ');
    return `今日事件统计：\n- 总计 ${events.length} 起\n- 高危 ${high} | 中危 ${med} | 低危 ${low}\n- 待处理 ${pendingEvents.length} 起\n- 类型：${typeStr}`;
  }

  // 默认回复
  return `重庆主城 9 立交监控点运行正常。${drones.length} 架无人机待命，9 路摄像头在线，当前 ${events.length} 起事件（高危 ${highEvents.length} 起）。\n\n可查询："无人机状态""高危事件""当前路况""事件统计"`;
};

export default router;
