import { create } from 'zustand';
import type { ChatMessage } from '../types/chat';
import { api } from '../api/client';

interface ChatStore {
  messages: ChatMessage[];
  streaming: boolean;
  send: (text: string) => Promise<void>;
  clearMessages: () => void;
  loadMessages: () => Promise<void>;
}

let msgCounter = 0;
function genMsgId(): string { return `msg_${++msgCounter}`; }

export const useChatStore = create<ChatStore>((set) => ({
  messages: [
    { id: genMsgId(), role: 'assistant', content: '你好，我是低空AI助手。当前试点路段 G50 K0-K60，1架无人机巡逻中，4路摄像头在线，今日已检测 12 条事件。', timestamp: Date.now() },
  ],
  streaming: false,

  send: async (text) => {
    const userMsg: ChatMessage = { id: genMsgId(), role: 'user', content: text, timestamp: Date.now() };
    set((s) => ({ messages: [...s.messages, userMsg], streaming: true }));

    try {
      const result = await api.sendChat(text);
      const aiMsg: ChatMessage = { id: result.aiMessage.id, role: 'assistant', content: result.aiMessage.content, timestamp: result.aiMessage.timestamp };
      set((s) => ({ messages: [...s.messages, aiMsg], streaming: false }));
    } catch {
      // API unavailable — mock response
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
      const response = mockResponse(text);
      const aiMsg: ChatMessage = { id: genMsgId(), role: 'assistant', content: response, timestamp: Date.now() };
      set((s) => ({ messages: [...s.messages, aiMsg], streaming: false }));
    }
  },

  clearMessages: () =>
    set({
      messages: [{ id: genMsgId(), role: 'assistant', content: '对话已清空。有什么可以帮你？', timestamp: Date.now() }],
    }),

  loadMessages: async () => {
    try {
      const data = await api.getChatMessages();
      if (data.length > 0) {
        const messages: ChatMessage[] = data.map((m: any) => ({
          id: m.id, role: m.role, content: m.content, timestamp: m.timestamp || Date.now(),
        }));
        set({ messages });
      }
    } catch {
      // Keep default welcome message
    }
  },
}));

function mockResponse(text: string): string {
  const map: Record<string, string> = {
    '无人机状态': '当前 4 架无人机：\n- **DJI-001** 🟢 在空巡逻中，电量 78%\n- **DJI-002** 🟡 待命，电量 100%\n- **DJI-003** 🟡 待命，电量 95%\n- **DJI-004** ⚪ 充电中，电量 35%',
    '高危事件': '当前高危事件 5 条：\n1. G50 K7+800 火焰检测 88%\n2. G50 K18+400 烟雾异常 91%\n3. G50 K12+300 交通事故 94%\n4. G50 K32+500 拥堵事件 87%\n5. G50 K5+200 交通事故 82%',
    '路况': '试点路段 G50 当前状态：\n- 进城方向：基本畅通\n- 出城方向：K25 附近轻度拥堵\n- 全路段 4 路摄像头在线',
    '统计': '今日事件统计：\n- 总计：12 条\n- 高危：5 | 中危：4 | 低危：3\n- 待处理：7 条',
  };
  for (const [k, v] of Object.entries(map)) { if (text.includes(k)) return v; }
  return '试点路段 G50 运行正常。1 架无人机巡逻中，4 路摄像头在线，今日已检测 12 条事件。\n\n可查询："无人机状态？""高危事件列表""当前路段路况""今日事件统计"';
}
