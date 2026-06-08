# 🛩️ 低空 — AI 驱动无人机高速智能巡检平台

> 以 **AI 视觉大模型为感知大脑**、无人机为空中执行终端、路边摄像头为地面锚点的高速公路实时风险监测与智能响应平台。

---

## 快速开始

```bash
# 1. 安装依赖
npm install
cd server && npm install && cd ..

# 2. 初始化种子数据
npm run server:seed

# 3. 一键启动开发环境（前端 + 后端）
npm start
```

> 前端 http://localhost:5173 | 后端 http://localhost:3001

### Docker 部署

```bash
docker compose up -d
# 访问 http://localhost:8080
```

---

## 项目结构

```
low-altitude-platform/
├── src/                        # 前端 React SPA
│   ├── pages/                  # 6 个路由页面
│   │   ├── DashboardPage.tsx   # 大屏总览（首页）
│   │   ├── LoginPage.tsx       # 登录页
│   │   ├── EventDetailPage.tsx # 事件详情
│   │   ├── DronePage.tsx       # 无人机管理
│   │   ├── AnalyticsPage.tsx   # 数据看板
│   │   └── SettingsPage.tsx    # 系统设置
│   ├── components/             # 共享组件(ai/dashboard/history/layout/map/shared)
│   ├── hooks/                  # 自定义 Hooks (useAMap/useWebSocket)
│   ├── stores/                 # Zustand 状态管理 (ui/event/drone/chat)
│   ├── api/                    # API 客户端 (JWT + fetch)
│   └── types/                  # TypeScript 类型定义
│
├── server/                     # 后端 Express API
│   ├── src/
│   │   ├── routes/             # auth/events/drones/chat
│   │   ├── ai/detector.ts      # AI 检测模拟器
│   │   ├── db/                 # JSON 文件存储 + 种子数据
│   │   └── middleware/         # JWT 认证
│   └── data/                   # 运行时数据（自动创建）
│
├── docs/                       # 设计文档 (PRD + UI方案 + 实施计划)
├── docker-compose.yml          # Docker 部署
├── nginx.conf                  # Nginx 反向代理
└── .env                        # 环境变量
```

---

## 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/login` | 登录页 | 用户名+密码+角色选择 |
| `/` | 大屏总览 | KPI + 地图 + 无人机 + 事件流 |
| `/event/:id` | 事件详情 | AI 分析 + 时间轴 + 操作 |
| `/drones` | 无人机管理 | 机队卡片 + 飞行日志 |
| `/analytics` | 数据看板 | 折线图/饼图/仪表盘/柱状图 |
| `/settings` | 系统设置 | 主题/地图/AI 模型配置 |

---

## API 接口

所有接口需 JWT Token（Header: `Authorization: Bearer <token>`）

### 认证
```
POST /api/auth/login    { username, password, role? }  →  { token, user }
```

### 事件
```
GET    /api/events          → 事件列表
GET    /api/events/:id      → 事件详情
POST   /api/events          → 创建事件 (AI 检测)
PATCH  /api/events/:id      → 更新事件状态
```

### 无人机
```
GET    /api/drones          → 无人机列表
PATCH  /api/drones/:id      → 更新无人机状态
```

### AI 对话
```
GET    /api/chat/messages   → 历史消息
POST   /api/chat/send       { text }  →  { userMessage, aiMessage }
```

### WebSocket
```
ws://localhost:3001/ws
消息类型: event:new | event:update | drone:update
```

---

## 环境变量

前端 (`.env`):
```bash
VITE_AMAP_KEY=your_amap_key    # 高德地图 JSAPI Key
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/ws
```

后端 (`server/.env`):
```bash
JWT_SECRET=my-secret-key
LLM_API_URL=https://api.deepseek.com/v1    # 可选，不配则用 mock
LLM_API_KEY=sk-xxx                         # 可选
LLM_MODEL=deepseek-chat
AI_INTERVAL=30000                          # AI 检测间隔(ms)
```

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | React 19 + TypeScript 6 + Vite 8 |
| UI 库 | Ant Design 6 + @ant-design/icons |
| 状态管理 | Zustand 5 |
| 地图 | 高德 JSAPI 2.0 (WebGL) |
| 图表 | Recharts |
| 路由 | React Router 7 |
| 后端 | Express 4 + TypeScript |
| 实时通信 | WebSocket (ws) |
| 认证 | JWT |
| 部署 | Docker + Nginx |

---

## 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| operator | operator123 | 值班员 |

---

## AI 检测模拟器

后端启动后每 30 秒自动生成一条模拟 AI 检测事件，通过 WebSocket 推送到前端大屏。设置 `AI_INTERVAL=10000` 调整为 10 秒。

## 对话 AI 接入

1. 在 `server/.env` 中配置 `LLM_API_URL` 和 `LLM_API_KEY`
2. 支持所有 OpenAI 兼容 API（DeepSeek / OpenAI / 通义千问 / 本地模型）
3. 不配置时自动降级为内置 mock 回复
