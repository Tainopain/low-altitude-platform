import { create } from 'zustand';
import type { ChatMessage } from '../types/chat';

interface ChatStore {
  messages: ChatMessage[];
  streaming: boolean;
  send: (text: string) => Promise<void>;
  clearMessages: () => void;
}

let msgCounter = 0;
function genMsgId(): string { return `msg_${++msgCounter}`; }

// Mock responses keyed by question keywords
const MOCK_RESPONSES: Record<string, string> = {
  '无人机状态': '当前 2 架无人机：\n- **DJI-001** 🟢 在空巡逻中，G50南段，电量 78%，航速 60km/h\n- **DJI-002** 🟡 待命，电量 100%\n\n机巢温度 25°C，下次维护: 7 天后。',
  '高危事件': '当前高危事件 3 条：\n1. **G50 K18+400** 烟雾异常 91% — 📷 摄像头+红外确认，建议调度无人机抵近\n2. **G50 K7+800** 火焰检测 88% — ✈️ 无人机已抵近确认\n3. **G50 K12+300** 交通事故 94% — ✈️ DJI-002 正在抵近中',
  '路况': '试点路段 G50 K0-K60 当前状态：\n- 进城方向：基本畅通，均速 72km/h\n- 出城方向：K25 附近轻度拥堵，均速 48km/h\n- 全路段 4 路摄像头在线，1 架无人机巡逻中',
  '统计': '今日事件统计（截至当前）：\n- 总计：60 条\n- 高危：12 条 | 中危：23 条 | 低危：25 条\n- 待处理：45 条\n- 已调度无人机：8 次\n- AI 检测准确率：89%',
};

function findMockResponse(text: string): string {
  for (const [key, response] of Object.entries(MOCK_RESPONSES)) {
    if (text.includes(key)) return response;
  }
  return `根据当前系统状态，试点路段 G50 运行正常。1 架无人机巡逻中，4 路摄像头在线，今日已检测 60 条事件。\n\n如需详细信息，可以尝试：\n- "无人机状态？"\n- "高危事件列表"\n- "当前路段路况"\n- "今日事件统计"`;
}

export const useChatStore = create<ChatStore>((set, _get) => ({
  messages: [
    {
      id: genMsgId(), role: 'assistant',
      content: `你好，我是低空AI助手。当前试点路段 G50 K0-K60，1架无人机巡逻中，4路摄像头在线，今日已检测 60 条事件。`,
      timestamp: Date.now(),
    },
  ],
  streaming: false,

  send: async (text) => {
    const userMsg: ChatMessage = { id: genMsgId(), role: 'user', content: text, timestamp: Date.now() };
    set((s) => ({ messages: [...s.messages, userMsg], streaming: true }));

    // Simulate streaming delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

    const response = findMockResponse(text);
    const aiMsg: ChatMessage = { id: genMsgId(), role: 'assistant', content: response, timestamp: Date.now() };
    set((s) => ({ messages: [...s.messages, aiMsg], streaming: false }));
  },

  clearMessages: () =>
    set({
      messages: [
        { id: genMsgId(), role: 'assistant', content: '对话已清空。有什么可以帮你？', timestamp: Date.now() },
      ],
    }),
}));
