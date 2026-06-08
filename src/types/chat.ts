export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const QUICK_QUESTIONS = [
  { key: 'drone', label: '🚁 无人机状态？', text: '现在无人机状态怎么样？' },
  { key: 'high-risk', label: '⚠ 高危事件列表', text: '今天有哪些高危事件？' },
  { key: 'road', label: '🛣️ 当前路段路况', text: '当前试点路段路况如何？' },
  { key: 'stats', label: '📊 今日事件统计', text: '今天的事件统计汇总' },
];
