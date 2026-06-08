# 低空 — 无人机高速智能巡检平台 UI 设计 Spec

> **日期：** 2026-06-08
> **类型：** UI/UX 设计文档
> **关联 PRD：** `docs/superpowers/specs/2026-06-03-low-altitude-prd.md`
> **设计原则：** 地图为主、信息紧凑、值班员单屏操作、深/浅双主题

---

## 1. 技术选型

| 维度 | 选择 |
|------|------|
| 框架 | React 18 + Vite |
| 组件库 | Ant Design 5 |
| 样式 | Ant Design 主题令牌 + CSS Modules（地图部分） |
| 地图 | 高德 JSAPI 2.0，`@amap/amap-jsapi-loader` 异步加载 |
| 图标 | `@ant-design/icons` + `lucide-react` |
| 动画 | Ant Design 内置动效 + CSS `@keyframes` |
| 实时通信 | WebSocket（事件推送 + 无人机 GPS） |
| 流式对话 | SSE（AI 助手） |
| 虚拟滚动 | `react-window`（事件列表） |
| 状态管理 | Zustand（轻量） |

---

## 2. 色彩体系

### 2.1 深色模式（默认，值班主用）

| 角色 | 色值 | 用途 |
|------|------|------|
| 页面背景 | `#0D1117` | Layout 底色 |
| 卡片/面板 | `#161B22` | Sider、Card、List |
| 边框 | `#30363D` | 分隔线、表格线 |
| 主文字 | `#E6EDF3` | 正文、KPI 数值 |
| 次文字 | `#8B949E` | 时间戳、辅助标签 |
| 强调色 | `#58A6FF` | 主按钮、选中态、在线指示 |
| 告警红 | `#F85149` | 高危事件、弹窗边框 |
| 警告橙 | `#D29922` | 中危事件 |
| 信息蓝 | `#79C0FF` | 低危事件 |
| 成功绿 | `#3FB950` | 正常/在线状态 |

### 2.2 浅色模式（日间可选）

| 角色 | 色值 |
|------|------|
| 页面背景 | `#FFFFFF` |
| 卡片/面板 | `#F6F8FA` |
| 边框 | `#D0D7DE` |
| 主文字 | `#1F2328` |
| 次文字 | `#656D76` |

### 2.3 主题切换

- 使用 Ant Design 5 `ConfigProvider` + `theme.algorithm`
- 深色：`darkAlgorithm`，浅色：`defaultAlgorithm`
- 覆盖上述色值到 `token.colorBgLayout`、`token.colorBorderSecondary` 等
- 切换入口：Header 右侧 `🌙/☀️` 按钮，持久化到 `localStorage`

---

## 3. 全局布局

```
┌──────────────────────────────────────────────────────────┐
│ Header (48px)                                              │
│  Logo | 路段 | 无人机 | 摄像头 | [🌙] [⚙]                 │
├────────────────────────────────────────────┬─────────────┤
│                                            │ 事件面板      │
│                                            │ (360px)      │
│           地图区 (flex: 1)                  │ ┌──────────┐ │
│                                            │ │ KPI 4卡  │ │
│  高德地图全高度                             │ └──────────┘ │
│  左上角图例叠层                             │ ┌──────────┐ │
│                                            │ │ 实时事件流 │ │
│                                            │ │ (虚拟滚动) │ │
│                                            │ └──────────┘ │
│                                            │              │
│                                            │ [◀ 折叠]    │
├────────────────────────────────────────────┴─────────────┤
│ Footer (36px)                                              │
│  事件快照缩略图 × N  |  [💬 AI助手] [📋 历史查询]         │
└──────────────────────────────────────────────────────────┘
```

### 3.1 布局组件映射

| 区域 | Ant Design 组件 | 说明 |
|------|----------------|------|
| Header | `Layout.Header` + `Space` + `Tag` | 48px 固定 |
| 事件面板 | `Layout.Sider` width=360, collapsible | 折叠 → 48px 图标条 |
| 地图 | `Layout.Content` + div#amap-container | flex: 1 自适应 |
| Footer | `Layout.Footer` + `Space` | 36px 固定 |

### 3.2 响应式策略

- **≥1920px**（标准大屏）：完整三栏布局
- **1366-1919px**（笔记本）：事件面板缩为 280px，地图自适应
- **<1366px**：事件面板默认折叠，需手动展开

---

## 4. 地图区

### 4.1 初始化

- `@amap/amap-jsapi-loader` 异步加载 JSAPI 2.0
- 默认中心：试点路段 G50 中点，zoom 12
- 底图 `features: ['bg', 'road', 'building']`，隐藏 POI 标注

### 4.2 Marker 设计

| Marker | 图标 | 更新方式 |
|--------|------|---------|
| 机巢 | 六边形底座图标 🏠（自定义 SVG） | 静态 |
| 无人机 | ✈️ 旋转图标（朝向 = 飞行方向） | WebSocket GPS 每 2s |
| 事件-高危 | 红色呼吸脉冲圆（CSS animation） | WebSocket 实时 |
| 事件-中危 | 橙色圆 | WebSocket 实时 |
| 事件-低危 | 蓝色圆 | WebSocket 实时 |

### 4.3 无人机调度动画

1. 事件行点击"调度🚁" → `map.setFitView()` 缩放到机巢+事件点范围
2. 无人机 Marker 沿 `Polyline` 从机巢平滑移动到事件点（`Marker.moveTo()`）
3. 动画时长 = 实际距离 / 60km/h × 10（倍速）→ 预估 3-5 秒
4. 轨迹线为虚线样式，动画完成后 3 秒消失
5. 抵达 → `InfoWindow` 弹出：`✅ 已抵达 [查看画面]`
6. 点击查看 → 触发图传小窗（地图右下角）

### 4.4 交互

| 操作 | 行为 |
|------|------|
| 点击无人机 Marker | InfoWindow: 编号/电量/任务/航速 |
| 点击事件 Marker | InfoWindow: 类型/等级/置信度/截图/时间 |
| 地图缩放/拖拽 | 自由操作，右下角"复位"按钮回默认视角 |
| 图例（左上角） | 半透明浮层：高危🔴 中危🟠 低危🔵 机巢🏠 无人机✈️ |

---

## 5. 右侧事件面板

### 5.1 KPI 卡片（面板顶部，固定）

使用 Ant Design `Card` + `Statistic`，`size="small"`，4 列紧凑布局：

| 卡片 | 图标 | 动态行为 |
|------|------|---------|
| 今日事件 | `AlertTriangle` | CountUp 数字动画 |
| 待处理 | `Clock` | 高危时红色边框脉冲 |
| 在线无人机 | `Plane` | 绿点在线 / 红点离线 |
| 摄像头 | `Camera` | 全部在线绿 / 部分橙 |

### 5.2 实时事件流（面板主体，虚拟滚动）

**筛选器：** `Segmented` 分段控件：全部 / 高危 / 中危 / 低危

**事件卡片结构：**

```
┌─────────────────────────────────┐
│ ▌🔴 高危  烟雾异常  91%        │  ← 等级色左边框 4px
│ ▌G50 K18+400            17:19  │  ← 高危半透明红底
│ ▌📷 摄像头 · 红外确认          │     中低危无色底
│ ▌[确认] [调度🚁] [关闭]       │
└─────────────────────────────────┘
```

**元素规范：**

| 元素 | 规格 |
|------|------|
| 等级条 | 左侧 4px 竖条，高危 `#F85149` / 中危 `#D29922` / 低危 `#79C0FF` |
| 高危底色 | `rgba(248,81,73,0.08)` |
| 标题行 | 等级图标 + 类型名 + AI 置信度 `Tag` |
| 来源行 | 📷 或 ✈️ + 检测手段描述 |
| 操作行 | `Button.Group`：[确认] [调度🚁] [关闭] |

**操作后状态变化：**

| 操作 | 视觉反馈 |
|------|---------|
| 确认 | 卡片绿底 + "已确认"水印 |
| 调度🚁 | 按钮 → `[🚁抵近中...]` disabled + Spin + ETA 倒计时 |
| 关闭 | 灰色删除线 → 3s 后移除 |

**虚拟滚动：** `react-window` FixedSizeList，每条 120px，闭拢态 40px。

---

## 6. AI 助手（Drawer）

### 6.1 布局

```
┌─────────────────────────────────────┐
│ 🤖 AI助手 · DeepSeek V3      [✕]  │  ← Drawer Header
├─────────────────────────────────────┤
│ 消息流（自动滚底，fadeIn 动效）      │
│                                     │
│  🤖 你好，我是低空AI助手。          │  ← 灰色气泡
│                                     │
│  快捷提问:                          │
│  [🚁 无人机状态？]                  │  ← Ant Tag, 可点击
│  [⚠ 高危事件列表]                   │
│  [🛣️ 当前路段路况]                  │
│  [📊 今日事件统计]                   │
│                                     │
│  👤 用户消息                        │  ← 蓝色气泡
│  🤖 AI 回复（Markdown）            │  ← 灰色气泡
│                                     │
├─────────────────────────────────────┤
│ [输入框]                          [→]│
└─────────────────────────────────────┘
```

### 6.2 交互

| 元素 | 行为 |
|------|------|
| Drawer 宽度 | 480px，固定 |
| 触发 | Footer [💬 AI助手] 按钮 |
| 快捷提问 | 4 个预置 Tag，点击即发送 |
| 流式输出 | SSE streaming |
| Markdown | `react-markdown` 渲染 |
| 上下文 | 每次对话自动注入系统状态 |
| 联动 | AI 提及事件时，可点击跳转地图定位 |

---

## 7. 历史查询（全屏 Drawer）

### 7.1 筛选栏

| 控件 | 组件 |
|------|------|
| 搜索 | `Input.Search` 模糊匹配路段桩号 |
| 类型 | `Select` 多选（5 类事件） |
| 等级 | `Select` 多选（高危/中危/低危） |
| 时间 | `DatePicker.RangePicker` 默认 7 天 |
| 导出 | `Button` CSV 下载 |

### 7.2 数据表格

| 列 | 宽度 | 渲染 |
|------|:---:|------|
| 时间 | 100 | `HH:mm:ss` |
| 类型 | 80 | 图标 + `Tag` |
| 路段桩号 | 180 | 路名 + 桩号 |
| 等级 | 80 | 彩色 `Badge` |
| AI 置信度 | 70 | 百分比 + 微型进度条 |
| 状态 | 90 | `Tag`：待确认/已确认/处理中/已关闭 |
| 确认人 | 80 | 操作员名 / "—" |
| 操作 | 80 | `[详情]` → Detail Modal |

### 7.3 详情 Modal

- 事件截图（大图）
- AI 检测信息（类型、置信度、检测源）
- 处置时间轴（Ant `Timeline`）：检测 → 分级 → 推送 → 确认 → 调度 → 抵近 → 关闭
- 无人机轨迹回放（如有调度记录）

---

## 8. 底栏 & 图传小窗

### 8.1 底栏（Footer, 36px）

```
📷📷📷📷  ← 最新 20 条事件截图缩略图 48×36px, 横向排列
              [💬 AI助手] [📋 历史查询] [⚙ 设置]
```

- 缩略图：点击 → 地图定位到该事件 Marker
- AI 助手按钮：带未读消息小徽标
- 设置下拉菜单：主题切换 / 高德 Key / 路段配置 / 关于

### 8.2 图传小窗

- 位置：地图右下角浮动，360×240px，可拖拽
- 标题栏：无人机编号 + `🔴 LIVE`
- 内容：WebRTC 视频流（MVP 可用静帧截图模拟）
- 状态栏：位置 + 高度
- 操作：`[🔊]` 声音、`[⏹]` 关闭、`[⛶]` 最大化（半屏分屏）
- 返航后自动关闭

---

## 9. 动画规范

| 场景 | 动画 | 时长 |
|------|------|:---:|
| KPI 数字变化 | CountUp 递增 | 1s |
| 事件卡片出现 | `fadeIn` + `slideDown` | 300ms |
| 事件卡片关闭 | 灰色删除线 → `fadeOut` | 300ms |
| 调度无人机 | Marker 平滑移动 + 虚线轨迹 | 3-5s（倍速） |
| 高危事件标记 | 呼吸脉冲（`scale` 1→1.3→1） | 2s 循环 |
| Drawer 打开 | 右侧滑入 | 300ms |
| 图传小窗出现 | `scaleIn` + `fadeIn` | 200ms |
| 高危 KPI 卡片 | 边框红色脉冲 | 1s 循环 |
| 状态 Tag 变化 | `fadeIn` 替换 | 200ms |

---

## 10. 组件树

```
App
├── ConfigProvider (theme)
│   ├── Layout
│   │   ├── Header
│   │   │   ├── Logo
│   │   │   ├── Space
│   │   │   │   ├── Tag（路段）
│   │   │   │   ├── Tag（无人机状态）
│   │   │   │   └── Tag（摄像头状态）
│   │   │   └── Space
│   │   │       ├── Button（主题切换）
│   │   │       └── Dropdown（设置）
│   │   ├── Layout.Content
│   │   │   ├── AMapContainer（地图 + Marker + 动画）
│   │   │   ├── MapLegend（图例浮层）
│   │   │   ├── MapResetButton（复位按钮）
│   │   │   └── DroneVideoWindow（图传小窗，条件渲染）
│   │   ├── Layout.Sider（事件面板，collapsible）
│   │   │   ├── KPICards
│   │   │   │   ├── Statistic（今日事件）
│   │   │   │   ├── Statistic（待处理）
│   │   │   │   ├── Statistic（在线无人机）
│   │   │   │   └── Statistic（摄像头）
│   │   │   ├── Segmented（筛选器）
│   │   │   └── EventList（react-window）
│   │   │       └── EventCard × N
│   │   │           ├── LevelBar
│   │   │           ├── TitleRow
│   │   │           ├── SourceRow
│   │   │           └── ActionButtons
│   │   └── Footer
│   │       ├── ThumbnailStrip（快照缩略图）
│   │       └── Space
│   │           ├── Button（AI助手）
│   │           └── Button（历史查询）
│   ├── AIDrawer（AI 助手）
│   │   ├── MessageList
│   │   │   ├── MessageBubble × N
│   │   │   └── QuickTags
│   │   └── InputBar
│   ├── HistoryDrawer（历史查询）
│   │   ├── FilterBar
│   │   ├── EventTable（Ant Table）
│   │   └── DetailModal
│   │       ├── Screenshot
│   │       ├── AIInfo
│   │       └── Timeline
│   └── Zustand Stores
│       ├── eventStore（事件列表 + WebSocket）
│       ├── droneStore（无人机状态 + GPS）
│       ├── uiStore（主题/面板折叠/Drawer 状态）
│       └── chatStore（AI 消息历史 + SSE）
```

---

## 11. 状态管理（Zustand）

### eventStore
```ts
interface EventStore {
  events: Event[];           // 全量事件列表
  addEvent: (e: Event) => void;
  updateEvent: (id: string, patch: Partial<Event>) => void;
  removeEvent: (id: string) => void;
  connectWS: () => void;     // WebSocket 连接
}
```

### droneStore
```ts
interface DroneStore {
  drones: Map<string, Drone>;  // 无人机状态
  updateGPS: (id: string, pos: [number, number], heading: number) => void;
  setStatus: (id: string, status: DroneStatus) => void;
}
```

### uiStore
```ts
interface UIStore {
  theme: 'dark' | 'light';
  siderCollapsed: boolean;
  aiDrawerOpen: boolean;
  historyDrawerOpen: boolean;
  videoWindow: { droneId: string; visible: boolean };
  toggleTheme: () => void;
  // ...
}
```

### chatStore
```ts
interface ChatStore {
  messages: Message[];
  send: (text: string) => Promise<void>;
  streaming: boolean;
}
```

---

## 12. 关键路径交互时序

### 12.1 AI 检测到事件 → 大屏展示

```
摄像头/无人机 → YOLOv8 → WebSocket → eventStore.addEvent()
→ EventList 新增卡片（fadeIn）→ KPI 数字更新（CountUp）
→ 地图新增 Marker（呼吸灯）
→ 高危: 钉钉推送 + 大屏弹窗 + KPI 边框脉冲
```

### 12.2 值班员一键调度 → 无人机抵近

```
点击 [调度🚁] → eventStore.updateEvent(id, {status:'dispatching'})
→ droneStore 获取最近待命机 → 地图 Marker 动画启动
→ EventCard 按钮变为 [🚁抵近中...ETA 3min]
→ 动画完成 → InfoWindow 弹出 → [查看画面]
→ 图传小窗出现 → eventStore.updateEvent(id, {status:'arrived'})
→ 值班员画面确认 → 确认/误报 → eventStore 更新状态
```

---

## 13. 文件结构

```
src/
├── main.tsx
├── App.tsx
├── theme.ts                      # Ant Design 主题令牌配置
├── stores/
│   ├── eventStore.ts
│   ├── droneStore.ts
│   ├── uiStore.ts
│   └── chatStore.ts
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx
│   │   ├── AppFooter.tsx
│   │   └── EventSider.tsx
│   ├── map/
│   │   ├── AMapContainer.tsx      # 地图初始化 + Marker 管理
│   │   ├── MapLegend.tsx
│   │   ├── DroneMarker.tsx        # 无人机 Marker + 动画
│   │   ├── EventMarker.tsx        # 事件 Marker + 呼吸灯
│   │   └── DroneVideoWindow.tsx   # 图传浮动小窗
│   ├── dashboard/
│   │   ├── KPICards.tsx
│   │   ├── EventList.tsx          # react-window 虚拟列表
│   │   └── EventCard.tsx
│   ├── ai/
│   │   ├── AIDrawer.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   └── QuickTags.tsx
│   ├── history/
│   │   ├── HistoryDrawer.tsx
│   │   ├── FilterBar.tsx
│   │   ├── EventTable.tsx
│   │   └── DetailModal.tsx
│   └── shared/
│       ├── StatusTag.tsx
│       ├── LevelBadge.tsx
│       └── CountUp.tsx
├── hooks/
│   ├── useAMap.ts                 # 高德地图加载 Hook
│   ├── useWebSocket.ts
│   └── useSSE.ts
├── services/
│   ├── api.ts                     # HTTP 请求
│   ├── websocket.ts               # WebSocket 客户端
│   └── sse.ts                     # SSE 客户端
└── types/
    ├── event.ts
    ├── drone.ts
    └── chat.ts
```
