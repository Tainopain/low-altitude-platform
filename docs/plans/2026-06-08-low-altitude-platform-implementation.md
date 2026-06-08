# 低空无人机高速智能巡检平台 MVP 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建低空无人机高速智能巡检平台 MVP 前端，实现大屏总览（地图+无人机+事件流）、AI 对话助手、历史查询三大页面。

**Architecture:** 独立 Vite + React 18 项目，Ant Design 5 组件库 + 高德 JSAPI 2.0 地图，Zustand 状态管理，react-window 虚拟滚动。地图为主的单页布局（Header + Map + Sider + Footer），AI 助手和历史查询以 Drawer 形式抽屉滑出。MVP 阶段使用 mock 数据驱动，WebSocket 和 SSE 预留接口。

**Tech Stack:** React 18 + TypeScript + Vite + Ant Design 5 + 高德 JSAPI 2.0 + Zustand + react-window + react-markdown

**关联文档:**
- PRD: `docs/superpowers/specs/2026-06-03-low-altitude-prd.md`
- UI Design: `docs/superpowers/specs/2026-06-08-low-altitude-ui-design.md`

---

### Task 1: 项目脚手架与依赖

**Files:**
- Create: 整个 Vite 项目骨架

- [ ] **Step 1: 创建 Vite + React + TypeScript 项目**

```bash
cd c:\Users\81247
npm create vite@latest low-altitude-platform -- --template react-ts
cd low-altitude-platform
```

- [ ] **Step 2: 安装核心依赖**

```bash
npm install antd @ant-design/icons zustand react-window react-markdown @amap/amap-jsapi-loader dayjs
npm install -D @types/react-window
```

- [ ] **Step 3: 验证项目启动**

```bash
npm run dev
```
Expected: Vite dev server 启动，浏览器打开显示默认 React 页面。

- [ ] **Step 4: 清理 Vite 默认文件**

删除 `src/App.css`、`src/assets/react.svg`，清空 `src/App.tsx` 和 `src/index.css` 的默认内容。

- [ ] **Step 5: Commit**

```bash
git init && git add -A && git commit -m "chore: scaffold Vite + React 18 + Ant Design 5 project"
```

---

### Task 2: 类型定义

**Files:**
- Create: `src/types/event.ts`
- Create: `src/types/drone.ts`
- Create: `src/types/chat.ts`

- [ ] **Step 1: 定义事件类型 `src/types/event.ts`**

```typescript
export type EventLevel = 'high' | 'medium' | 'low';
export type EventType = 'accident' | 'congestion' | 'obstacle' | 'smoke' | 'fire';
export type EventStatus = 'pending' | 'confirmed' | 'dispatching' | 'arrived' | 'processing' | 'resolved' | 'closed';
export type EventSource = 'camera' | 'drone';

export interface HighwayEvent {
  id: string;
  type: EventType;
  level: EventLevel;
  confidence: number;          // 0-100
  roadName: string;            // e.g. "G50"
  stakeNumber: string;         // e.g. "K18+400"
  direction: string;           // e.g. "进城"
  coordinates: [number, number];
  screenshot?: string;         // base64 or URL
  source: EventSource;
  sourceDetail: string;        // e.g. "摄像头 · 红外确认"
  status: EventStatus;
  confirmedBy?: string;
  createdAt: number;           // timestamp
  droneId?: string;            // 调度后关联的无人机
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  accident: '交通事故',
  congestion: '拥堵事件',
  obstacle: '障碍物',
  smoke: '烟雾异常',
  fire: '火焰检测',
};

export const EVENT_LEVEL_CONFIG: Record<EventLevel, { color: string; bgColor: string; label: string }> = {
  high:   { color: '#F85149', bgColor: 'rgba(248,81,73,0.08)', label: '高危' },
  medium: { color: '#D29922', bgColor: 'transparent', label: '中危' },
  low:    { color: '#79C0FF', bgColor: 'transparent', label: '低危' },
};
```

- [ ] **Step 2: 定义无人机类型 `src/types/drone.ts`**

```typescript
export type DroneStatus = 'flying' | 'standby' | 'charging' | 'maintenance' | 'offline';

export interface Drone {
  id: string;                    // e.g. "DJI-001"
  name: string;
  status: DroneStatus;
  coordinates: [number, number];
  heading: number;               // 0-360 方向角
  battery: number;               // 0-100
  task: string;                  // e.g. "巡逻中" / "待命" / "抵近中"
  speed: number;                 // km/h
}

export const DRONE_STATUS_CONFIG: Record<DroneStatus, { color: string; label: string }> = {
  flying:      { color: '#3FB950', label: '在空' },
  standby:     { color: '#D29922', label: '待命' },
  charging:    { color: '#8B949E', label: '充电中' },
  maintenance: { color: '#8B949E', label: '维护' },
  offline:     { color: '#F85149', label: '离线' },
};
```

- [ ] **Step 3: 定义对话类型 `src/types/chat.ts`**

```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add src/types/ && git commit -m "feat: add TypeScript type definitions for events, drones, and chat"
```

---

### Task 3: Ant Design 主题配置

**Files:**
- Create: `src/theme.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: 编写主题配置 `src/theme.ts`**

```typescript
import type { ThemeConfig } from 'antd';

export const darkTheme: ThemeConfig = {
  algorithm: undefined, // 后续在 App 中通过 ConfigProvider 传入 darkAlgorithm
  token: {
    colorBgLayout: '#0D1117',
    colorBgContainer: '#161B22',
    colorBorderSecondary: '#30363D',
    colorText: '#E6EDF3',
    colorTextSecondary: '#8B949E',
    colorPrimary: '#58A6FF',
    colorError: '#F85149',
    colorWarning: '#D29922',
    colorSuccess: '#3FB950',
    borderRadius: 6,
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: '#161B22',
      footerBg: '#161B22',
      siderBg: '#0D1117',
      headerHeight: 48,
    },
    Card: {
      colorBgContainer: '#161B22',
    },
    Tag: {
      defaultBg: 'transparent',
    },
  },
};

export const lightTheme: ThemeConfig = {
  token: {
    colorBgLayout: '#FFFFFF',
    colorBgContainer: '#F6F8FA',
    colorBorderSecondary: '#D0D7DE',
    colorText: '#1F2328',
    colorTextSecondary: '#656D76',
    colorPrimary: '#0969DA',
    colorError: '#D1242F',
    colorWarning: '#9A6700',
    colorSuccess: '#1A7F37',
    borderRadius: 6,
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: '#F6F8FA',
      footerBg: '#F6F8FA',
      siderBg: '#FFFFFF',
      headerHeight: 48,
    },
  },
};
```

- [ ] **Step 2: 在 App.tsx 中挂载 ConfigProvider `src/App.tsx`**

```typescript
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';
import { useUIStore } from './stores/uiStore';
import { darkTheme, lightTheme } from './theme';

function App() {
  const themeMode = useUIStore((s) => s.theme);
  const isDark = themeMode === 'dark';

  return (
    <ConfigProvider
      theme={{
        ...(isDark ? darkTheme : lightTheme),
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      }}
    >
      <AntApp>
        <div>低空平台</div>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
```

- [ ] **Step 3: 验证深色主题生效**

```bash
npm run dev
```
Expected: 浏览器打开，背景为深色 `#0D1117`，文字为 `#E6EDF3`。

- [ ] **Step 4: Commit**

```bash
git add src/theme.ts src/App.tsx && git commit -m "feat: add Ant Design dark/light theme tokens and ConfigProvider"
```

---

### Task 4: Zustand Stores

**Files:**
- Create: `src/stores/uiStore.ts`
- Create: `src/stores/eventStore.ts`
- Create: `src/stores/droneStore.ts`
- Create: `src/stores/chatStore.ts`

- [ ] **Step 1: UI Store `src/stores/uiStore.ts`**

```typescript
import { create } from 'zustand';

interface UIStore {
  theme: 'dark' | 'light';
  siderCollapsed: boolean;
  aiDrawerOpen: boolean;
  historyDrawerOpen: boolean;
  videoWindow: { droneId: string | null; visible: boolean };
  toggleTheme: () => void;
  toggleSider: () => void;
  setAIDrawer: (open: boolean) => void;
  setHistoryDrawer: (open: boolean) => void;
  showVideoWindow: (droneId: string) => void;
  hideVideoWindow: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  theme: (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  siderCollapsed: false,
  aiDrawerOpen: false,
  historyDrawerOpen: false,
  videoWindow: { droneId: null, visible: false },

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return { theme: next };
    }),

  toggleSider: () => set((s) => ({ siderCollapsed: !s.siderCollapsed })),

  setAIDrawer: (open) => set({ aiDrawerOpen: open }),
  setHistoryDrawer: (open) => set({ historyDrawerOpen: open }),

  showVideoWindow: (droneId) => set({ videoWindow: { droneId, visible: true } }),
  hideVideoWindow: () => set({ videoWindow: { droneId: null, visible: false } }),
}));
```

- [ ] **Step 2: Event Store `src/stores/eventStore.ts`**

```typescript
import { create } from 'zustand';
import type { HighwayEvent, EventLevel } from '../types/event';

interface EventStore {
  events: HighwayEvent[];
  filterLevel: EventLevel | 'all';
  setFilterLevel: (level: EventLevel | 'all') => void;
  addEvent: (event: HighwayEvent) => void;
  updateEvent: (id: string, patch: Partial<HighwayEvent>) => void;
  removeEvent: (id: string) => void;
  loadMockEvents: () => void;
}

let eventCounter = 0;

function generateId(): string {
  return `evt_${Date.now()}_${++eventCounter}`;
}

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  filterLevel: 'all',

  setFilterLevel: (filterLevel) => set({ filterLevel }),

  addEvent: (event) =>
    set((s) => ({ events: [event, ...s.events] })),

  updateEvent: (id, patch) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),

  removeEvent: (id) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

  loadMockEvents: () => {
    const now = Date.now();
    const mockEvents: HighwayEvent[] = [
      {
        id: generateId(), type: 'smoke', level: 'high', confidence: 91,
        roadName: 'G50', stakeNumber: 'K18+400', direction: '进城',
        coordinates: [106.551, 29.562],
        source: 'camera', sourceDetail: '摄像头 · 红外确认',
        status: 'pending', createdAt: now - 60000,
      },
      {
        id: generateId(), type: 'obstacle', level: 'medium', confidence: 85,
        roadName: 'G50', stakeNumber: 'K7+800', direction: '进城',
        coordinates: [106.543, 29.548],
        source: 'camera', sourceDetail: '摄像头: 路面抛洒物检测',
        status: 'pending', createdAt: now - 300000,
      },
      {
        id: generateId(), type: 'congestion', level: 'low', confidence: 72,
        roadName: 'G50', stakeNumber: 'K25+100', direction: '出城',
        coordinates: [106.560, 29.575],
        source: 'camera', sourceDetail: '摄像头 + 高德路况',
        status: 'confirmed', confirmedBy: '值班员张三', createdAt: now - 600000,
      },
      {
        id: generateId(), type: 'fire', level: 'high', confidence: 88,
        roadName: 'G50', stakeNumber: 'K7+800', direction: '出城',
        coordinates: [106.549, 29.555],
        source: 'drone', sourceDetail: '无人机红外热成像',
        status: 'arrived', droneId: 'DJI-001', createdAt: now - 900000,
      },
      {
        id: generateId(), type: 'accident', level: 'high', confidence: 94,
        roadName: 'G50', stakeNumber: 'K12+300', direction: '进城',
        coordinates: [106.547, 29.558],
        source: 'drone', sourceDetail: '无人机俯拍: 多车追尾',
        status: 'dispatching', droneId: 'DJI-002', createdAt: now - 120000,
      },
    ];
    set({ events: mockEvents });
  },
}));
```

- [ ] **Step 3: Drone Store `src/stores/droneStore.ts`**

```typescript
import { create } from 'zustand';
import type { Drone } from '../types/drone';

interface DroneStore {
  drones: Drone[];
  updateGPS: (id: string, coordinates: [number, number], heading: number) => void;
  setStatus: (id: string, status: Drone['status']) => void;
  setTask: (id: string, task: string, speed?: number) => void;
  loadMockDrones: () => void;
}

export const useDroneStore = create<DroneStore>((set) => ({
  drones: [],

  updateGPS: (id, coordinates, heading) =>
    set((s) => ({
      drones: s.drones.map((d) => (d.id === id ? { ...d, coordinates, heading } : d)),
    })),

  setStatus: (id, status) =>
    set((s) => ({
      drones: s.drones.map((d) => (d.id === id ? { ...d, status } : d)),
    })),

  setTask: (id, task, speed) =>
    set((s) => ({
      drones: s.drones.map((d) => (d.id === id ? { ...d, task, ...(speed !== undefined ? { speed } : {}) } : d)),
    })),

  loadMockDrones: () => {
    const mockDrones: Drone[] = [
      {
        id: 'DJI-001', name: 'DJI-001', status: 'flying',
        coordinates: [106.555, 29.565], heading: 45,
        battery: 78, task: '巡逻中: G50南段', speed: 60,
      },
      {
        id: 'DJI-002', name: 'DJI-002', status: 'standby',
        coordinates: [106.545, 29.550], heading: 0,
        battery: 100, task: '待命', speed: 0,
      },
    ];
    set({ drones: mockDrones });
  },
}));
```

- [ ] **Step 4: Chat Store `src/stores/chatStore.ts`**

```typescript
import { create } from 'zustand';
import type { ChatMessage } from '../types/chat';
import { QUICK_QUESTIONS } from '../types/chat';

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

export const useChatStore = create<ChatStore>((set, get) => ({
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
```

- [ ] **Step 5: Commit**

```bash
git add src/stores/ && git commit -m "feat: add Zustand stores for UI, events, drones, and chat with mock data"
```

---

### Task 5: 共享组件（StatusTag, LevelBadge, CountUp）

**Files:**
- Create: `src/components/shared/LevelBadge.tsx`
- Create: `src/components/shared/StatusTag.tsx`
- Create: `src/components/shared/CountUp.tsx`

- [ ] **Step 1: LevelBadge `src/components/shared/LevelBadge.tsx`**

```typescript
import { Tag } from 'antd';
import type { EventLevel } from '../../types/event';
import { EVENT_LEVEL_CONFIG } from '../../types/event';

interface Props { level: EventLevel; }

export function LevelBadge({ level }: Props) {
  const cfg = EVENT_LEVEL_CONFIG[level];
  return (
    <Tag color={cfg.color} style={{ background: cfg.bgColor, border: `1px solid ${cfg.color}20` }}>
      {cfg.label}
    </Tag>
  );
}
```

- [ ] **Step 2: StatusTag `src/components/shared/StatusTag.tsx`**

```typescript
import { Tag } from 'antd';
import type { EventStatus } from '../../types/event';

const STATUS_MAP: Record<EventStatus, { color: string; label: string }> = {
  pending:      { color: 'orange', label: '待确认' },
  confirmed:    { color: 'blue', label: '已确认' },
  dispatching:  { color: 'processing', label: '无人机抵近中' },
  arrived:      { color: 'cyan', label: '已抵近' },
  processing:   { color: 'processing', label: '处理中' },
  resolved:     { color: 'green', label: '已处理' },
  closed:       { color: 'default', label: '已关闭' },
};

interface Props { status: EventStatus; }

export function StatusTag({ status }: Props) {
  const cfg = STATUS_MAP[status];
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
}
```

- [ ] **Step 3: CountUp `src/components/shared/CountUp.tsx`**

```typescript
import { useEffect, useState } from 'react';

interface Props {
  end: number;
  duration?: number;
  className?: string;
}

export function CountUp({ end, duration = 1000, className }: Props) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (end <= 0) { setValue(0); return; }
    const stepTime = Math.max(duration / end, 16);
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      if (current >= end) { setValue(end); clearInterval(timer); }
      else { setValue(current); }
    }, stepTime);
    return () => clearInterval(timer);
  }, [end, duration]);

  return <span className={className}>{value}</span>;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/ && git commit -m "feat: add shared components LevelBadge, StatusTag, CountUp"
```

---

### Task 6: 布局框架（Header + Footer + Sider）

**Files:**
- Create: `src/components/layout/AppHeader.tsx`
- Create: `src/components/layout/AppFooter.tsx`
- Create: `src/components/layout/EventSider.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: AppHeader `src/components/layout/AppHeader.tsx`**

```typescript
import { Layout, Space, Tag, Button } from 'antd';
import { SunOutlined, MoonOutlined, SettingOutlined } from '@ant-design/icons';
import { useUIStore } from '../../stores/uiStore';
import { useDroneStore } from '../../stores/droneStore';

export function AppHeader() {
  const { theme, toggleTheme } = useUIStore();
  const drones = useDroneStore((s) => s.drones);
  const flyingCount = drones.filter((d) => d.status === 'flying').length;

  return (
    <Layout.Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
      <Space>
        <span style={{ fontWeight: 700, fontSize: 16 }}>🛩️ 低空平台</span>
        <Tag>试点路段 G50 K0~K60</Tag>
        <Tag color={flyingCount > 0 ? 'green' : 'red'}>
          无人机 {flyingCount}/{drones.length}
        </Tag>
        <Tag color="green">摄像头 4/4</Tag>
      </Space>
      <Space>
        <Button
          type="text"
          icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
        />
        <Button type="text" icon={<SettingOutlined />} />
      </Space>
    </Layout.Header>
  );
}
```

- [ ] **Step 2: AppFooter `src/components/layout/AppFooter.tsx`**

```typescript
import { Layout, Space, Button, Badge } from 'antd';
import { MessageOutlined, HistoryOutlined } from '@ant-design/icons';
import { useUIStore } from '../../stores/uiStore';

export function AppFooter() {
  const { setAIDrawer, setHistoryDrawer } = useUIStore();

  return (
    <Layout.Footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px', height: 36 }}>
      <Space>
        <Badge count={0} size="small">
          <Button type="text" icon={<MessageOutlined />} onClick={() => setAIDrawer(true)}>
            AI助手
          </Button>
        </Badge>
        <Button type="text" icon={<HistoryOutlined />} onClick={() => setHistoryDrawer(true)}>
          历史查询
        </Button>
      </Space>
    </Layout.Footer>
  );
}
```

- [ ] **Step 3: EventSider（骨架）`src/components/layout/EventSider.tsx`**

```typescript
import { Layout, Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useUIStore } from '../../stores/uiStore';

export function EventSider() {
  const { siderCollapsed, toggleSider } = useUIStore();

  return (
    <Layout.Sider
      width={360}
      collapsedWidth={48}
      collapsed={siderCollapsed}
      theme="light"
      style={{ background: 'var(--sider-bg, #0D1117)', borderLeft: '1px solid #30363D' }}
      trigger={null}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 4 }}>
        <Button type="text" size="small" icon={siderCollapsed ? <LeftOutlined /> : <RightOutlined />} onClick={toggleSider} />
      </div>
      {!siderCollapsed && <div style={{ padding: '0 8px', color: '#E6EDF3' }}>事件面板占位</div>}
    </Layout.Sider>
  );
}
```

- [ ] **Step 4: 更新 App.tsx 整合布局 `src/App.tsx`**

```typescript
import { ConfigProvider, App as AntApp, Layout, theme as antTheme } from 'antd';
import { useUIStore } from './stores/uiStore';
import { useEventStore } from './stores/eventStore';
import { useDroneStore } from './stores/droneStore';
import { darkTheme, lightTheme } from './theme';
import { AppHeader } from './components/layout/AppHeader';
import { AppFooter } from './components/layout/AppFooter';
import { EventSider } from './components/layout/EventSider';
import { useEffect } from 'react';

function App() {
  const themeMode = useUIStore((s) => s.theme);
  const isDark = themeMode === 'dark';
  const loadMockEvents = useEventStore((s) => s.loadMockEvents);
  const loadMockDrones = useDroneStore((s) => s.loadMockDrones);

  useEffect(() => { loadMockEvents(); loadMockDrones(); }, []);

  return (
    <ConfigProvider
      theme={{
        ...(isDark ? darkTheme : lightTheme),
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      }}
    >
      <AntApp>
        <Layout style={{ height: '100vh' }}>
          <AppHeader />
          <Layout style={{ flex: 1 }}>
            <Layout.Content style={{ position: 'relative', background: '#0D1117' }}>
              {/* 地图占位 — 后续任务替换 */}
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B949E' }}>
                地图加载中...
              </div>
            </Layout.Content>
            <EventSider />
          </Layout>
          <AppFooter />
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
```

- [ ] **Step 5: 更新 `src/index.css` 确保全屏**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #root { height: 100%; width: 100%; overflow: hidden; }
```

- [ ] **Step 6: 验证布局**

```bash
npm run dev
```
Expected: 深色全屏布局，顶部 Header（48px），中间灰色地图占位区 + 右侧面板，底部 Footer（36px）。点击 🌙 切换浅色主题。

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/ src/App.tsx src/index.css && git commit -m "feat: add layout shell with Header, Footer, collapsible EventSider"
```

---

### Task 7: KPI 卡片

**Files:**
- Create: `src/components/dashboard/KPICards.tsx`
- Modify: `src/components/layout/EventSider.tsx`

- [ ] **Step 1: KPICards `src/components/dashboard/KPICards.tsx`**

```typescript
import { Row, Col, Card, Statistic } from 'antd';
import { AlertOutlined, ClockCircleOutlined, SendOutlined, CameraOutlined } from '@ant-design/icons';
import { useEventStore } from '../../stores/eventStore';
import { useDroneStore } from '../../stores/droneStore';
import { CountUp } from '../shared/CountUp';

export function KPICards() {
  const events = useEventStore((s) => s.events);
  const drones = useDroneStore((s) => s.drones);
  const pendingCount = events.filter((e) => e.status === 'pending').length;
  const highRiskPending = events.some((e) => e.level === 'high' && e.status === 'pending');
  const onlineDrones = drones.filter((d) => d.status === 'flying' || d.status === 'standby').length;

  const cardStyle = { textAlign: 'center' as const };

  return (
    <Row gutter={[8, 8]} style={{ padding: '8px 8px 0' }}>
      <Col span={12}>
        <Card size="small" style={cardStyle}>
          <Statistic
            title={<span><AlertOutlined style={{ color: '#F85149' }} /> 今日事件</span>}
            value={events.length}
            formatter={(v) => <CountUp end={Number(v)} />}
            valueStyle={{ fontSize: 26, fontWeight: 700 }}
          />
        </Card>
      </Col>
      <Col span={12}>
        <Card
          size="small"
          style={{
            ...cardStyle,
            ...(highRiskPending ? { animation: 'pulse-border 1s infinite', borderColor: '#F85149' } : {}),
          }}
        >
          <Statistic
            title={<span><ClockCircleOutlined /> 待处理</span>}
            value={pendingCount}
            formatter={(v) => <CountUp end={Number(v)} />}
            valueStyle={{ fontSize: 26, fontWeight: 700, color: highRiskPending ? '#F85149' : undefined }}
          />
        </Card>
      </Col>
      <Col span={12}>
        <Card size="small" style={cardStyle}>
          <Statistic
            title={<span><SendOutlined style={{ color: '#3FB950' }} /> 在线无人机</span>}
            value={onlineDrones}
            suffix={`/ ${drones.length}`}
            valueStyle={{ fontSize: 26, fontWeight: 700 }}
          />
        </Card>
      </Col>
      <Col span={12}>
        <Card size="small" style={cardStyle}>
          <Statistic
            title={<span><CameraOutlined style={{ color: '#3FB950' }} /> 摄像头</span>}
            value="4/4"
            valueStyle={{ fontSize: 26, fontWeight: 700 }}
          />
        </Card>
      </Col>
    </Row>
  );
}
```

- [ ] **Step 2: 将 KPICards 放入 EventSider**

更新 `src/components/layout/EventSider.tsx`，在占位文本处替换为 `<KPICards />`。

```typescript
import { KPICards } from '../dashboard/KPICards';
// ... 替换占位 div:
{!siderCollapsed && <KPICards />}
```

- [ ] **Step 3: 添加脉冲动画到 index.css**

```css
@keyframes pulse-border {
  0%, 100% { box-shadow: 0 0 0 0 rgba(248, 81, 73, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(248, 81, 73, 0); }
}
```

- [ ] **Step 4: 验证 KPI**

```bash
npm run dev
```
Expected: 右侧面板顶部 4 张 KPI 卡片（2×2），数字 CountUp 动画，待处理卡片如果有高危待确认事件则红色脉冲。

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/KPICards.tsx src/components/layout/EventSider.tsx src/index.css && git commit -m "feat: add KPI cards with CountUp animation and high-risk pulse"
```

---

### Task 8: 实时事件流

**Files:**
- Create: `src/components/dashboard/EventCard.tsx`
- Create: `src/components/dashboard/EventList.tsx`
- Modify: `src/components/layout/EventSider.tsx`

- [ ] **Step 1: EventCard `src/components/dashboard/EventCard.tsx`**

```typescript
import { Button, Space, Typography } from 'antd';
import { SendOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { HighwayEvent } from '../../types/event';
import { EVENT_LEVEL_CONFIG, EVENT_TYPE_LABELS } from '../../types/event';
import { LevelBadge } from '../shared/LevelBadge';
import { StatusTag } from '../shared/StatusTag';
import { useEventStore } from '../../stores/eventStore';
import { useDroneStore } from '../../stores/droneStore';
import { useUIStore } from '../../stores/uiStore';

interface Props { event: HighwayEvent; style?: React.CSSProperties; }

export function EventCard({ event, style }: Props) {
  const updateEvent = useEventStore((s) => s.updateEvent);
  const drones = useDroneStore((s) => s.drones);
  const showVideoWindow = useUIStore((s) => s.showVideoWindow);
  const cfg = EVENT_LEVEL_CONFIG[event.level];

  const timeStr = new Date(event.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  const handleConfirm = () => updateEvent(event.id, { status: 'confirmed', confirmedBy: '值班员' });
  const handleClose = () => updateEvent(event.id, { status: 'closed' });
  const handleDispatch = () => {
    const standbyDrone = drones.find((d) => d.status === 'standby');
    if (!standbyDrone) return;
    const droneId = standbyDrone.id;
    updateEvent(event.id, { status: 'dispatching', droneId });
    // Simulate arrival after 4 seconds
    setTimeout(() => {
      updateEvent(event.id, { status: 'arrived' });
    }, 4000);
  };

  const isDispatchable = event.status === 'pending' || event.status === 'confirmed';

  return (
    <div
      style={{
        padding: '10px 12px',
        background: cfg.bgColor,
        borderLeft: `4px solid ${cfg.color}`,
        borderBottom: '1px solid #30363D',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <LevelBadge level={event.level} />
        <Typography.Text strong style={{ color: '#E6EDF3', fontSize: 13 }}>
          {EVENT_TYPE_LABELS[event.type]}
        </Typography.Text>
        <Tag style={{ marginLeft: 'auto', fontSize: 11 }}>{event.confidence}%</Tag>
      </div>

      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {event.roadName} {event.stakeNumber} {event.direction}
        <span style={{ float: 'right' }}>{timeStr}</span>
      </Typography.Text>

      <div style={{ color: '#8B949E', fontSize: 12, marginTop: 2 }}>
        {event.source === 'camera' ? '📷' : '✈️'} {event.sourceDetail}
        {event.status !== 'pending' && <StatusTag status={event.status} />}
      </div>

      <Space style={{ marginTop: 6 }}>
        {event.status === 'pending' && (
          <Button size="small" type="primary" ghost icon={<CheckOutlined />} onClick={handleConfirm}>确认</Button>
        )}
        {isDispatchable && (
          <Button
            size="small"
            type="primary"
            danger
            ghost
            icon={<SendOutlined />}
            onClick={handleDispatch}
            loading={event.status === 'dispatching'}
          >
            {event.status === 'dispatching' ? '抵近中...' : '调度🚁'}
          </Button>
        )}
        {event.status === 'arrived' && (
          <Button size="small" type="primary" onClick={() => showVideoWindow(event.droneId!)}>
            查看画面
          </Button>
        )}
        {event.status !== 'closed' && (
          <Button size="small" icon={<CloseOutlined />} onClick={handleClose}>关闭</Button>
        )}
      </Space>
    </div>
  );
}

// Helper: inline Tag (avoid import cycle)
function Tag({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ display: 'inline-block', padding: '0 6px', borderRadius: 4, fontSize: 11, background: '#30363D', color: '#8B949E', ...style }}>{children}</span>;
}
```

- [ ] **Step 2: EventList `src/components/dashboard/EventList.tsx`**

```typescript
import { useRef } from 'react';
import { Segmented } from 'antd';
import { FixedSizeList as VList } from 'react-window';
import { useEventStore } from '../../stores/eventStore';
import { EventCard } from './EventCard';
import type { EventLevel } from '../../types/event';

const FILTER_OPTIONS: { label: string; value: EventLevel | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '高危', value: 'high' },
  { label: '中危', value: 'medium' },
  { label: '低危', value: 'low' },
];

const CARD_HEIGHT = 130;

export function EventList() {
  const events = useEventStore((s) => s.events);
  const filterLevel = useEventStore((s) => s.filterLevel);
  const setFilterLevel = useEventStore((s) => s.setFilterLevel);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = filterLevel === 'all' ? events : events.filter((e) => e.level === filterLevel);
  const height = containerRef.current?.clientHeight ?? 400;

  return (
    <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '8px 12px' }}>
        <Segmented
          block
          size="small"
          options={FILTER_OPTIONS}
          value={filterLevel}
          onChange={(v) => setFilterLevel(v as EventLevel | 'all')}
        />
      </div>
      <VList
        height={height - 40}
        itemCount={filtered.length}
        itemSize={CARD_HEIGHT}
        width="100%"
        style={{ overflowX: 'hidden' }}
      >
        {({ index, style }) => <EventCard event={filtered[index]} style={style} />}
      </VList>
    </div>
  );
}
```

- [ ] **Step 3: 将 EventList 放入 EventSider**

更新 `src/components/layout/EventSider.tsx`，在 KPICards 下方加入 `<EventList />`：

```typescript
import { KPICards } from '../dashboard/KPICards';
import { EventList } from '../dashboard/EventList';

// ... 面板内容区:
{!siderCollapsed && (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <KPICards />
    <EventList />
  </div>
)}
```

- [ ] **Step 4: 验证事件流**

```bash
npm run dev
```
Expected: 右侧面板 KPI 下方显示 5 条 mock 事件卡片（react-window 虚拟列表），支持高危/中危/低危筛选。点击"确认"卡片变已确认，点击"调度🚁"显示加载状态 4 秒后变"已抵近"，点"查看画面"待后续实现。

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/ src/components/layout/EventSider.tsx && git commit -m "feat: add event list with virtual scrolling, filtering, and dispatch flow"
```

---

### Task 9: 高德地图集成

**Files:**
- Create: `src/hooks/useAMap.ts`
- Create: `src/components/map/AMapContainer.tsx`
- Create: `src/components/map/MapLegend.tsx`
- Create: `src/components/map/DroneMarker.tsx`
- Create: `src/components/map/EventMarker.tsx`
- Modify: `src/App.tsx`（替换地图占位）

- [ ] **Step 1: useAMap Hook `src/hooks/useAMap.ts`**

```typescript
import { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

// 高德 Key — MVP 阶段硬编码，后续移入设置
const AMAP_KEY = 'a9b8cb42ec24eadd4e79505e8972aabe';
const AMAP_VERSION = '2.0';

interface UseAMapOptions {
  containerId: string;
  center: [number, number];
  zoom: number;
}

export function useAMap({ containerId, center, zoom }: UseAMapOptions) {
  const [amap, setAmap] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (loadingRef.current || loaded) return;
    loadingRef.current = true;

    AMapLoader.load({ key: AMAP_KEY, version: AMAP_VERSION })
      .then((AMap: any) => {
        const map = new AMap.Map(containerId, {
          center,
          zoom,
          resizeEnable: true,
          features: ['bg', 'road', 'building'],
          mapStyle: 'amap://styles/dark', // 深色底图
        });
        setAmap(map);
        setLoaded(true);
      })
      .catch((e: Error) => {
        setError(e.message);
        loadingRef.current = false;
      });
  }, [containerId]);

  return { amap, loaded, error };
}
```

- [ ] **Step 2: MapLegend `src/components/map/MapLegend.tsx`**

```typescript
import { Space } from 'antd';

export function MapLegend() {
  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, zIndex: 100,
      background: 'rgba(22,27,34,0.85)', borderRadius: 6, padding: '8px 12px',
      border: '1px solid #30363D',
    }}>
      <Space direction="vertical" size={4}>
        <span><span style={{ color: '#F85149', fontSize: 16 }}>●</span> 高危事件</span>
        <span><span style={{ color: '#D29922', fontSize: 16 }}>●</span> 中危事件</span>
        <span><span style={{ color: '#79C0FF', fontSize: 16 }}>●</span> 低危事件</span>
        <span>🏠 机巢</span>
        <span>✈️ 无人机</span>
      </Space>
    </div>
  );
}
```

- [ ] **Step 3: AMapContainer `src/components/map/AMapContainer.tsx`**

```typescript
import { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import { useAMap } from '../../hooks/useAMap';
import { useEventStore } from '../../stores/eventStore';
import { useDroneStore } from '../../stores/droneStore';
import { MapLegend } from './MapLegend';

// 试点路段 G50 中点坐标（重庆附近，Demo 用）
const CENTER: [number, number] = [106.551, 29.562];
const NEST_COORDS: [number, number] = [106.545, 29.550]; // 机巢位置

export function AMapContainer() {
  const { amap, loaded, error } = useAMap({ containerId: 'amap-container', center: CENTER, zoom: 12 });
  const events = useEventStore((s) => s.events);
  const drones = useDroneStore((s) => s.drones);
  const markersRef = useRef<Map<string, any>>(new Map());

  // 初始化固定 Marker（机巢）
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    // 机巢 Marker
    const nestMarker = new AMap.Marker({
      position: NEST_COORDS,
      content: '<div style="font-size:20px;text-align:center;">🏠</div>',
      offset: new AMap.Pixel(-12, -12),
    });
    nestMarker.setMap(amap);
    markersRef.current.set('nest', nestMarker);
  }, [amap]);

  // 同步事件 Markers
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    // 清理旧的事件 markers
    markersRef.current.forEach((m, key) => { if (key.startsWith('evt_')) m.setMap(null); });

    events.forEach((evt) => {
      const color = evt.level === 'high' ? '#F85149' : evt.level === 'medium' ? '#D29922' : '#79C0FF';
      const pulseClass = evt.level === 'high' ? 'marker-pulse' : '';
      const marker = new AMap.Marker({
        position: evt.coordinates,
        content: `<div class="${pulseClass}" style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid ${color}44;"></div>`,
        offset: new AMap.Pixel(-7, -7),
      });
      marker.on('click', () => {
        // 点击事件点：可后续弹出 InfoWindow
        console.log('Event clicked:', evt.id);
      });
      marker.setMap(amap);
      markersRef.current.set(`evt_${evt.id}`, marker);
    });
  }, [amap, events]);

  // 同步无人机 Markers
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    markersRef.current.forEach((m, key) => { if (key.startsWith('drone_')) m.setMap(null); });

    drones.forEach((drone) => {
      if (drone.status === 'offline') return;
      const color = drone.status === 'flying' ? '#3FB950' : '#D29922';
      const marker = new AMap.Marker({
        position: drone.coordinates,
        content: `<div style="font-size:18px;transform:rotate(${drone.heading}deg);text-align:center;color:${color};">✈️</div>`,
        offset: new AMap.Pixel(-10, -10),
      });
      marker.on('click', () => {
        console.log('Drone clicked:', drone.id);
      });
      marker.setMap(amap);
      markersRef.current.set(`drone_${drone.id}`, marker);
    });
  }, [amap, drones]);

  if (error) return <div style={{ color: '#F85149', padding: 24 }}>地图加载失败: {error}</div>;

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div id="amap-container" style={{ height: '100%', width: '100%' }} />
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin tip="地图加载中..." />
        </div>
      )}
      {loaded && <MapLegend />}
    </div>
  );
}
```

- [ ] **Step 4: 将 AMapContainer 放入 App.tsx**

修改 `src/App.tsx`，替换地图占位 `<div>`：

```typescript
import { AMapContainer } from './components/map/AMapContainer';

// 替换:
// <div style={{...}}>地图加载中...</div>
// 为:
<AMapContainer />
```

- [ ] **Step 5: 添加 CSS 呼吸灯动画到 `src/index.css`**

```css
@keyframes marker-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.6; }
}
.marker-pulse {
  animation: marker-pulse 2s ease-in-out infinite;
}
@keyframes pulse-border {
  0%, 100% { box-shadow: 0 0 0 0 rgba(248, 81, 73, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(248, 81, 73, 0); }
}
```

- [ ] **Step 6: 安装类型声明**

```bash
npm install -D @types/amap-jsapi-loader || true  # 如果没有则跳过
```

创建 `src/types/amap.d.ts`：

```typescript
declare module '@amap/amap-jsapi-loader' {
  export function load(config: {
    key: string;
    version: string;
  }): Promise<any>;
}
```

- [ ] **Step 7: 验证地图**

```bash
npm run dev
```
Expected: 地图区显示高德深色地图，左上角图例浮层，5 个事件红色/橙色/蓝色圆点，1-2 个无人机 ✈️ Marker，1 个机巢 🏠 Marker。高危事件圆点呼吸脉冲动画。

- [ ] **Step 8: Commit**

```bash
git add src/hooks/ src/components/map/ src/App.tsx src/index.css src/types/amap.d.ts && git commit -m "feat: integrate AMap with dark basemap, event markers, drone markers, and legend"
```

---

### Task 10: AI 对话助手 Drawer

**Files:**
- Create: `src/components/ai/MessageBubble.tsx`
- Create: `src/components/ai/QuickTags.tsx`
- Create: `src/components/ai/AIDrawer.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: MessageBubble `src/components/ai/MessageBubble.tsx`**

```typescript
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../../types/chat';

interface Props { message: ChatMessage; }

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div style={{
        maxWidth: '85%',
        padding: '8px 14px',
        borderRadius: 12,
        background: isUser ? '#58A6FF' : '#21262D',
        color: isUser ? '#fff' : '#E6EDF3',
        borderBottomRightRadius: isUser ? 4 : 12,
        borderBottomLeftRadius: isUser ? 12 : 4,
        fontSize: 13,
        lineHeight: 1.6,
      }}>
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: QuickTags `src/components/ai/QuickTags.tsx`**

```typescript
import { Space, Tag } from 'antd';
import { QUICK_QUESTIONS } from '../../types/chat';

interface Props { onSend: (text: string) => void; disabled: boolean; }

export function QuickTags({ onSend, disabled }: Props) {
  return (
    <Space wrap style={{ padding: '8px 0' }}>
      {QUICK_QUESTIONS.map((q) => (
        <Tag
          key={q.key}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer', padding: '4px 10px', fontSize: 12 }}
          color="blue"
          onClick={() => !disabled && onSend(q.text)}
        >
          {q.label}
        </Tag>
      ))}
    </Space>
  );
}
```

- [ ] **Step 3: AIDrawer `src/components/ai/AIDrawer.tsx`**

```typescript
import { useRef, useEffect } from 'react';
import { Drawer, Input, Button, Space } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useUIStore } from '../../stores/uiStore';
import { useChatStore } from '../../stores/chatStore';
import { MessageBubble } from './MessageBubble';
import { QuickTags } from './QuickTags';

export function AIDrawer() {
  const { aiDrawerOpen, setAIDrawer } = useUIStore();
  const { messages, send, streaming } = useChatStore();
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (text: string) => {
    const msg = text || input.trim();
    if (!msg || streaming) return;
    setInput('');
    await send(msg);
  };

  return (
    <Drawer
      title="🤖 AI助手 · DeepSeek V3"
      open={aiDrawerOpen}
      onClose={() => setAIDrawer(false)}
      width={480}
      styles={{ body: { padding: '0 16px', display: 'flex', flexDirection: 'column', height: 'calc(100% - 55px)' } }}
    >
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {messages.length <= 1 && (
          <QuickTags onSend={handleSend} disabled={streaming} />
        )}
      </div>
      <div style={{ padding: '12px 0', borderTop: '1px solid #30363D' }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={() => handleSend(input)}
            placeholder="输入问题..."
            disabled={streaming}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={() => handleSend(input)} loading={streaming} />
        </Space.Compact>
      </div>
    </Drawer>
  );
}

// Add missing import
import { useState } from 'react';
```

Wait — `useState` import at the bottom is awkward. Let me fix the file:

```typescript
import { useRef, useEffect, useState } from 'react';
// ... rest same, remove the bottom useState import
```

- [ ] **Step 4: 将 AIDrawer 放入 App.tsx**

```typescript
import { AIDrawer } from './components/ai/AIDrawer';
// 在 </Layout> 之后、</AntApp> 之前:
<AIDrawer />
```

- [ ] **Step 5: 验证 AI 助手**

```bash
npm run dev
```
Expected: 点击 Footer [AI助手] → 右侧滑出 480px Drawer，显示欢迎消息和 4 个快捷提问 Tag。点击 Tag 或输入问题 → 模拟延迟后显示 mock 回复（Markdown 渲染）。

- [ ] **Step 6: Commit**

```bash
git add src/components/ai/ src/App.tsx && git commit -m "feat: add AI assistant Drawer with Markdown rendering and quick question tags"
```

---

### Task 11: 历史查询 Drawer

**Files:**
- Create: `src/components/history/FilterBar.tsx`
- Create: `src/components/history/EventTable.tsx`
- Create: `src/components/history/DetailModal.tsx`
- Create: `src/components/history/HistoryDrawer.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: FilterBar `src/components/history/FilterBar.tsx`**

```typescript
import { Space, Input, Select, DatePicker, Button } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import type { EventType, EventLevel } from '../../types/event';

const { RangePicker } = DatePicker;

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  types: EventType[];
  onTypesChange: (v: EventType[]) => void;
  levels: EventLevel[];
  onLevelsChange: (v: EventLevel[]) => void;
  onExport: () => void;
}

export function FilterBar({ search, onSearchChange, types, onTypesChange, levels, onLevelsChange, onExport }: FilterBarProps) {
  return (
    <Space wrap style={{ padding: '12px 0' }}>
      <Input
        prefix={<SearchOutlined />}
        placeholder="搜索路段桩号..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ width: 200 }}
        allowClear
      />
      <Select
        mode="multiple"
        placeholder="事件类型"
        value={types}
        onChange={onTypesChange}
        style={{ minWidth: 140 }}
        options={[
          { label: '交通事故', value: 'accident' },
          { label: '拥堵事件', value: 'congestion' },
          { label: '障碍物', value: 'obstacle' },
          { label: '烟雾异常', value: 'smoke' },
          { label: '火焰检测', value: 'fire' },
        ]}
        maxTagCount={2}
      />
      <Select
        mode="multiple"
        placeholder="等级"
        value={levels}
        onChange={onLevelsChange}
        style={{ minWidth: 100 }}
        options={[
          { label: '高危', value: 'high' },
          { label: '中危', value: 'medium' },
          { label: '低危', value: 'low' },
        ]}
        maxTagCount={1}
      />
      <RangePicker />
      <Button icon={<DownloadOutlined />} onClick={onExport}>导出CSV</Button>
    </Space>
  );
}
```

- [ ] **Step 2: EventTable `src/components/history/EventTable.tsx`**

```typescript
import { useState, useMemo } from 'react';
import { Table, Progress } from 'antd';
import type { HighwayEvent, EventType, EventLevel } from '../../types/event';
import { EVENT_TYPE_LABELS } from '../../types/event';
import { LevelBadge } from '../shared/LevelBadge';
import { StatusTag } from '../shared/StatusTag';
import { DetailModal } from './DetailModal';

interface Props {
  events: HighwayEvent[];
  search: string;
  types: EventType[];
  levels: EventLevel[];
}

export function EventTable({ events, search, types, levels }: Props) {
  const [detailEvent, setDetailEvent] = useState<HighwayEvent | null>(null);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (search && !`${e.roadName} ${e.stakeNumber}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (types.length > 0 && !types.includes(e.type)) return false;
      if (levels.length > 0 && !levels.includes(e.level)) return false;
      return true;
    });
  }, [events, search, types, levels]);

  const columns = [
    {
      title: '时间', dataIndex: 'createdAt', width: 90,
      render: (v: number) => new Date(v).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    },
    {
      title: '类型', dataIndex: 'type', width: 85,
      render: (v: EventType) => EVENT_TYPE_LABELS[v],
    },
    {
      title: '路段', width: 150,
      render: (_: any, r: HighwayEvent) => `${r.roadName} ${r.stakeNumber} ${r.direction}`,
    },
    {
      title: '等级', dataIndex: 'level', width: 70,
      render: (v: EventLevel) => <LevelBadge level={v} />,
    },
    {
      title: 'AI%', dataIndex: 'confidence', width: 80,
      render: (v: number) => <Progress percent={v} size="small" strokeColor={v > 80 ? '#F85149' : '#D29922'} format={() => `${v}%`} />,
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: any) => <StatusTag status={v} />,
    },
    {
      title: '确认人', dataIndex: 'confirmedBy', width: 80,
      render: (v: string | undefined) => v || '—',
    },
    {
      title: '操作', width: 70,
      render: (_: any, r: HighwayEvent) => <a onClick={() => setDetailEvent(r)}>详情</a>,
    },
  ];

  return (
    <>
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 800 }}
      />
      <DetailModal event={detailEvent} onClose={() => setDetailEvent(null)} />
    </>
  );
}
```

- [ ] **Step 3: DetailModal `src/components/history/DetailModal.tsx`**

```typescript
import { Modal, Descriptions, Timeline, Image } from 'antd';
import type { HighwayEvent } from '../../types/event';
import { EVENT_TYPE_LABELS } from '../../types/event';
import { LevelBadge } from '../shared/LevelBadge';

interface Props { event: HighwayEvent | null; onClose: () => void; }

export function DetailModal({ event, onClose }: Props) {
  if (!event) return null;

  const timelineItems = [
    { children: `AI 检测: ${EVENT_TYPE_LABELS[event.type]} 置信度 ${event.confidence}%` },
    { children: `自动分级: ${event.level === 'high' ? '高危' : event.level === 'medium' ? '中危' : '低危'}` },
    { children: event.status !== 'pending' ? `人工确认: ${event.confirmedBy || '值班员'}` : '待确认...' },
    ...(event.droneId ? [{ children: `调度无人机: ${event.droneId}` }] : []),
    ...(event.status === 'arrived' || event.status === 'resolved' ? [{ children: '无人机抵近，画面确认' }] : []),
    ...(event.status === 'resolved' || event.status === 'closed' ? [{ children: '事件关闭归档' }] : []),
  ];

  return (
    <Modal title="事件详情" open={!!event} onCancel={onClose} footer={null} width={600}>
      {event.screenshot && (
        <Image src={event.screenshot} alt="事件截图" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} fallback="data:image/svg+xml,..." />
      )}
      <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="类型">{EVENT_TYPE_LABELS[event.type]}</Descriptions.Item>
        <Descriptions.Item label="等级"><LevelBadge level={event.level} /></Descriptions.Item>
        <Descriptions.Item label="路段">{event.roadName} {event.stakeNumber}</Descriptions.Item>
        <Descriptions.Item label="置信度">{event.confidence}%</Descriptions.Item>
        <Descriptions.Item label="检测源">{event.source === 'camera' ? '📷 摄像头' : '✈️ 无人机'}</Descriptions.Item>
        <Descriptions.Item label="时间">{new Date(event.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
      </Descriptions>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>处置时间轴</div>
      <Timeline items={timelineItems} />
    </Modal>
  );
}
```

- [ ] **Step 4: HistoryDrawer `src/components/history/HistoryDrawer.tsx`**

```typescript
import { useState } from 'react';
import { Drawer, message } from 'antd';
import { useUIStore } from '../../stores/uiStore';
import { useEventStore } from '../../stores/eventStore';
import { FilterBar } from './FilterBar';
import { EventTable } from './EventTable';
import type { EventType, EventLevel } from '../../types/event';

export function HistoryDrawer() {
  const { historyDrawerOpen, setHistoryDrawer } = useUIStore();
  const events = useEventStore((s) => s.events);
  const [search, setSearch] = useState('');
  const [types, setTypes] = useState<EventType[]>([]);
  const [levels, setLevels] = useState<EventLevel[]>([]);

  const handleExport = () => {
    message.success('CSV 导出成功（Demo）');
  };

  return (
    <Drawer
      title="📋 历史查询"
      open={historyDrawerOpen}
      onClose={() => setHistoryDrawer(false)}
      width="100%"
      styles={{ body: { padding: '0 24px' } }}
    >
      <FilterBar
        search={search} onSearchChange={setSearch}
        types={types} onTypesChange={setTypes}
        levels={levels} onLevelsChange={setLevels}
        onExport={handleExport}
      />
      <EventTable events={events} search={search} types={types} levels={levels} />
    </Drawer>
  );
}
```

- [ ] **Step 5: 将 HistoryDrawer 放入 App.tsx**

```typescript
import { HistoryDrawer } from './components/history/HistoryDrawer';
// 在 AIDrawer 旁:
<HistoryDrawer />
```

- [ ] **Step 6: 验证历史查询**

```bash
npm run dev
```
Expected: 点击 Footer [历史查询] → 全屏 Drawer，含筛选栏（搜索/类型/等级/时间/导出）和数据表格，点击"详情"弹出 Modal（含截图占位、Descriptions、Timeline）。

- [ ] **Step 7: Commit**

```bash
git add src/components/history/ src/App.tsx && git commit -m "feat: add history query Drawer with table, filters, and detail modal"
```

---

### Task 12: 图传小窗

**Files:**
- Create: `src/components/map/DroneVideoWindow.tsx`
- Modify: `src/components/map/AMapContainer.tsx`

- [ ] **Step 1: DroneVideoWindow `src/components/map/DroneVideoWindow.tsx`**

```typescript
import { Button, Space } from 'antd';
import { CloseOutlined, ExpandOutlined, AudioOutlined } from '@ant-design/icons';
import { useUIStore } from '../../stores/uiStore';
import { useDroneStore } from '../../stores/droneStore';
import { useState } from 'react';

export function DroneVideoWindow() {
  const { videoWindow, hideVideoWindow } = useUIStore();
  const drones = useDroneStore((s) => s.drones);
  const [expanded, setExpanded] = useState(false);
  if (!videoWindow.visible) return null;

  const drone = drones.find((d) => d.id === videoWindow.droneId);

  const width = expanded ? 720 : 360;
  const height = expanded ? 480 : 240;

  return (
    <div
      style={{
        position: 'absolute', bottom: 48, right: 16, zIndex: 200,
        width, height,
        background: '#161B22', borderRadius: 8, border: '1px solid #30363D',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        transition: 'width 0.3s, height 0.3s',
      }}
    >
      {/* Title Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', background: '#21262D', cursor: 'move',
      }}>
        <Space>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F85149', display: 'inline-block' }} />
          <span style={{ fontWeight: 600, fontSize: 12, color: '#E6EDF3' }}>
            {drone?.name || videoWindow.droneId} 📹 LIVE
          </span>
        </Space>
        <Space>
          <Button type="text" size="small" icon={<AudioOutlined />} style={{ color: '#8B949E' }} />
          <Button type="text" size="small" icon={<ExpandOutlined />} style={{ color: '#8B949E' }} onClick={() => setExpanded(!expanded)} />
          <Button type="text" size="small" icon={<CloseOutlined />} style={{ color: '#8B949E' }} onClick={hideVideoWindow} />
        </Space>
      </div>

      {/* Video Content — MVP 使用占位截图 */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0D1117', color: '#8B949E', fontSize: 14,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🚁</div>
          <div>4K 实时画面</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>
            {drone?.coordinates ? `${drone.coordinates[1].toFixed(4)}, ${drone.coordinates[0].toFixed(4)}` : ''} 上空 85m
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{ padding: '4px 12px', fontSize: 11, color: '#8B949E', borderTop: '1px solid #30363D' }}>
        电量 {drone?.battery ?? '—'}% · 图传码率 8.2 Mbps
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 将 DroneVideoWindow 放入 AMapContainer**

在 `src/components/map/AMapContainer.tsx` 的 `return` 中，在 `</div>` 闭合前加入：

```typescript
import { DroneVideoWindow } from './DroneVideoWindow';
// ...
<DroneVideoWindow />
```

- [ ] **Step 3: 验证图传小窗**

```bash
npm run dev
```
Expected: 在事件流中点击一个"已抵近"事件的"查看画面"按钮 → 地图右下角出现图传小窗（360×240），显示无人机编号 + LIVE。可最大化（720×480）和关闭。

- [ ] **Step 4: Commit**

```bash
git add src/components/map/DroneVideoWindow.tsx src/components/map/AMapContainer.tsx && git commit -m "feat: add drone video floating window with resize and close"
```

---

### Task 13: 调度动画 & 最终联调

**Files:**
- Modify: `src/components/map/AMapContainer.tsx`（调度动画逻辑）
- Modify: `src/components/dashboard/EventCard.tsx`（触发动画）
- Modify: `src/App.tsx`（全局脉冲 CSS 注入）

- [ ] **Step 1: 在 AMapContainer 加入调度动画监听**

在 `src/components/map/AMapContainer.tsx` 中新增：

```typescript
import { useEffect, useRef } from 'react';
// ...

// 调度动画：监听 events 中 status='dispatching' 的事件
const prevDispatchingRef = useRef<Set<string>>(new Set());

useEffect(() => {
  if (!amap) return;
  const AMap = (window as any).AMap;
  if (!AMap) return;

  const dispatchingEvents = events.filter((e) => e.status === 'dispatching' && e.droneId);
  const currentIds = new Set(dispatchingEvents.map((e) => e.id));

  dispatchingEvents.forEach((evt) => {
    if (prevDispatchingRef.current.has(evt.id)) return; // 已启动动画

    const drone = drones.find((d) => d.id === evt.droneId);
    if (!drone) return;

    // 创建轨迹线
    const polyline = new AMap.Polyline({
      path: [drone.coordinates, evt.coordinates],
      strokeColor: '#58A6FF',
      strokeWeight: 2,
      strokeStyle: 'dashed',
      strokeDasharray: [10, 10],
    });
    polyline.setMap(amap);

    // 创建临时 Marker 做动画
    const droneMarker = markersRef.current.get(`drone_${drone.id}`);
    if (droneMarker) {
      droneMarker.moveTo(evt.coordinates, { duration: 4000, autoRotation: true });
    }

    // 动画结束后清理轨迹线
    setTimeout(() => {
      polyline.setMap(null);
    }, 5000);
  });

  prevDispatchingRef.current = currentIds;
}, [events, drones, amap]);
```

- [ ] **Step 2: 确保深色主题 CSS 注入到全应用遮罩层**

在 `src/App.tsx` 的 `ConfigProvider` 中添加全局样式，确保 `.ant-drawer-mask`、`.ant-modal-mask` 等遮罩也匹配深色主题。检查 Ant Design 5 的 `darkAlgorithm` 是否自动处理——通常是自动的，确认一下即可。

- [ ] **Step 3: 全流程端到端验证**

```bash
npm run dev
```

按以下路径走一遍：
1. 页面加载 → 地图显示深色底图 + 事件点 + 无人机 + 机巢
2. 右侧面板 → KPI CountUp 动画 → 事件列表 5 条虚拟滚动 → 筛选切换
3. 点击某事件"确认" → 卡片变已确认
4. 点击某待确认事件"调度🚁" → 按钮变为 loading "抵近中..." → 4 秒后"已抵近"；地图上如有对应无人机 Marker 则看到动画
5. 点击"查看画面" → 图传小窗出现，可最大化和关闭
6. 点击 Footer [AI助手] → Drawer 滑出 → 点快捷 Tag → mock 回复（Markdown）
7. 点击 Footer [历史查询] → 全屏 Drawer → 筛选 → 表格 → 点详情 → Modal + Timeline
8. 点 Header 🌙 → 切换浅色主题 → 全部 UI 亮色 → 切换回深色
9. 折叠/展开右侧事件面板

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add drone dispatch animation and final integration"
```

---

### Task 14: 最终检查

- [ ] **Step 1: TypeScript 编译**

```bash
npx tsc --noEmit
```
Expected: 零错误。

- [ ] **Step 2: 构建验证**

```bash
npm run build
```
Expected: `dist/` 生成成功，无警告。

- [ ] **Step 3: 预览构建产物**

```bash
npm run preview
```
Expected: 浏览器打开，功能正常。

- [ ] **Step 4: 对照 Spec 清单检查**

| Spec 要求 | 状态 |
|-----------|:---:|
| 深/浅双主题 | ✅ ConfigProvider + localStorage |
| Header 信息栏 | ✅ Logo + 路段 + 无人机 + 摄像头 + 主题切换 |
| 地图 AMap 深色底图 | ✅ |
| 5 类 Marker（机巢/无人机/事件3级） | ✅ |
| 无人机调度动画 | ✅ Polyline + moveTo |
| 图例浮层 | ✅ |
| KPI 4 卡 + CountUp | ✅ |
| 待处理脉冲 | ✅ CSS animation |
| 虚拟滚动事件列表 | ✅ react-window |
| 事件筛选（Segmented） | ✅ |
| 事件操作（确认/调度/关闭） | ✅ |
| AI Drawer 480px | ✅ Markdown + QuickTags |
| 历史查询全屏 Drawer | ✅ Table + Filter + Modal |
| 图传浮动小窗 | ✅ 可拖拽占位（title bar cursor: move） + 最大化 |
| 响应式策略 | ⚠️ 基础实现，需后续迭代增强 |

- [ ] **Step 5: 最终 Commit**

```bash
git add -A && git commit -m "chore: final cleanup, type check passed, build verified"
```

---
