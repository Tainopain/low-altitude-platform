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
    { id: genMsgId(), role: 'assistant', content: '你好，我是低空AI助手。当前重庆主城9个立交监控点，4架无人机待命，9路摄像头在线。', timestamp: Date.now() },
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
    '无人机状态': '当前 4 架无人机待命：\n- **北环机舱** 🟡 待命，覆盖北环/石马河/东环\n- **沙坪坝机舱** 🟡 待命，覆盖杨公桥/高滩岩\n- **华岩机舱** 🟡 待命，覆盖西环/凤中\n- **南岸机舱** 🟡 待命，覆盖四公里/江南\n飞行半径 5km',
    '高危事件': '请查看大屏实时事件流获取最新高危事件。点击事件卡片可查看 AI 分析详情。',
    '路况': '重庆主城 9 立交监控点当前状态：\n- 9 路摄像头全部在线\n- 4 架无人机待命（5km 覆盖半径）\n- AI 检测每 90s 轮询一次',
    '统计': '请查看数据看板页面获取完整的统计分析，包括事件趋势、热力分布和 AI 洞察。',
  };
  for (const [k, v] of Object.entries(map)) { if (text.includes(k)) return v; }
  return '重庆主城 9 立交监控点运行正常。4 架无人机待命，9 路摄像头在线。\n\n可查询："无人机状态？""高危事件列表""当前路段路况""今日事件统计"';
}
