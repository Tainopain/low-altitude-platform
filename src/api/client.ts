/**
 * API 客户端
 * 后端地址通过 VITE_API_URL 环境变量配置，默认 localhost:3001
 * 若后端不可用，自动降级为本地 mock 数据
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let authToken: string | null = localStorage.getItem('token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export function getToken(): string | null {
  return authToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  post: (path: string, body?: Record<string, any>) =>
    request<any>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  // Auth
  login: (username: string, password: string, role?: string) =>
    request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    }),

  // Events
  getEvents: () => request<any[]>('/api/events'),
  getEvent: (id: string) => request<any>(`/api/events/${id}`),
  updateEvent: (id: string, patch: Record<string, any>) =>
    request<any>(`/api/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  createEvent: (data: Record<string, any>) =>
    request<any>('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Drones
  getDrones: () => request<any[]>('/api/drones'),
  updateDrone: (id: string, patch: Record<string, any>) =>
    request<any>(`/api/drones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  // Chat
  getChatMessages: () => request<any[]>('/api/chat/messages'),
  sendChat: (text: string) =>
    request<{ userMessage: any; aiMessage: any }>('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
};
