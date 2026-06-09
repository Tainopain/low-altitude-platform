# 低空平台 AI 完整参考手册 v1.0

---

## 目录

1. [AI 架构总览](#1-ai-架构总览)
2. [检测模拟器 Detector](#2-检测模拟器-detector)
3. [样本素材库 Samples](#3-样本素材库-samples)
4. [截图生成器 Screenshot](#4-截图生成器-screenshot)
5. [分析引擎 Analytics](#5-分析引擎-analytics)
6. [事件研判 Assessment](#6-事件研判-assessment)
7. [对话助手 Chat](#7-对话助手-chat)
8. [前端 AI 可视化](#8-前端-ai-可视化)
9. [AI API 接口](#9-ai-api-接口)
10. [模板库完整索引](#10-模板库完整索引)

---

## 1. AI 架构总览

```
server/src/ai/
├── detector.ts       检测模拟器 v4 — 核心入口，串联全部 AI 模块
├── analytics.ts      分析引擎 v2 — 5 种统计算法 + 综合洞察
├── assessment.ts     研判引擎 — 5 类事件 × 4 天气 × 3 等级模板库
├── samples.ts        素材库 — 12 个重庆立交场景 + AI 描述文案
├── screenshot.ts     截图生成器 — SVG 道路场景 + 检测框标注
└── patrol.ts         巡逻模拟器 — 无人机 GPS 沿路点移动

server/src/routes/
├── chat.ts           AI 对话路由 — LLM + Mock 双模，实时上下文注入
├── analytics.ts      AI 分析 API — /insights, /calibration, /clusters
└── events.ts         事件 CRUD — 包含 assessment, aiDescription, screenshot

src/components/
├── analytics/AIInsightsPanel.tsx   AI 洞察面板（4 类卡片）
├── analytics/EventHeatmap.tsx      事件热力图（AMap.HeatMap）
├── ai/AIDrawer.tsx                 AI 对话 Drawer
└── map/AMapContainer.tsx           地图（动态网格聚合 + InfoWindow)
```

---

## 2. 检测模拟器 Detector

**文件：** `server/src/ai/detector.ts`
**版本：** v4

### 核心参数

| 参数 | 默认值 | 说明 |
|------|:--:|------|
| intervalMs | 300000 (5min) | 检测间隔 |
| 监控点数 | 9 | 重庆主城立交 |
| 每批事件数 | 3 | 随机 3 个不同立交 |
| 事件类型数 | 3 | 每批 3 种不同类型 |
| 坐标抖动 | ±100m | 模拟 GPS 误差 |

### 9 个监控点

| # | 名称 | lng | lat |
|:--:|------|------|------|
| 1 | 北环立交 | 106.497385 | 29.609658 |
| 2 | 石马河立交 | 106.471885 | 29.584855 |
| 3 | 东环立交 | 106.551681 | 29.620295 |
| 4 | 四公里立交 | 106.575596 | 29.514190 |
| 5 | 江南立交 | 106.592240 | 29.530410 |
| 6 | 凤中立交 | 106.447897 | 29.498872 |
| 7 | 西环立交 | 106.441436 | 29.517380 |
| 8 | 高滩岩立交 | 106.443702 | 29.539939 |
| 9 | 杨公桥立交 | 106.453861 | 29.564296 |

### 事件生成流程

```
1. 随机选 3 个监控点
2. 随机选 3 种事件类型
3. 从素材库选取匹配场景
4. 调用截图生成器 → SVG 标注截图
5. 调用研判引擎 → 结构化研判报告
6. 写入 SQLite + WebSocket 推送
```

### 环境变量

```bash
AI_INTERVAL=300000    # 检测间隔 (ms)，0=关闭
PATROL_INTERVAL=0     # 巡逻间隔 (ms)，0=关闭
```

---

## 3. 样本素材库 Samples

**文件：** `server/src/ai/samples.ts`

### 12 个场景分布

| ID | 类型 | 等级 | 置信度 | 对应立交 | 天气 | 视角 |
|------|------|:--:|:--:|------|------|------|
| sample-001 | 事故 | 高 | 94% | 北环立交 | 晴 | 前视 |
| sample-002 | 火焰 | 高 | 91% | 西环立交 | 晴 | 侧视 |
| sample-003 | 烟雾 | 高 | 89% | 高滩岩立交 | 晴 | 前视 |
| sample-004 | 拥堵 | 高 | 87% | 东环立交 | 晴 | 俯拍 |
| sample-005 | 事故 | 高 | 82% | 四公里立交 | 雨 | 侧视 |
| sample-006 | 障碍物 | 中 | 85% | 江南立交 | 晴 | 前视 |
| sample-007 | 烟雾 | 中 | 68% | 凤中立交 | 雾 | 侧视 |
| sample-008 | 障碍物 | 中 | 76% | 杨公桥立交 | 夜 | 前视 |
| sample-009 | 拥堵 | 中 | 70% | 石马河立交 | 晴 | 俯拍 |
| sample-010 | 拥堵 | 低 | 72% | 北环立交 | 晴 | 俯拍 |
| sample-011 | 烟雾 | 低 | 45% | 凤中立交 | 晴 | 前视 |
| sample-012 | 拥堵 | 低 | 55% | 四公里立交 | 夜 | 侧视 |

### 场景数据结构

```typescript
interface SampleScene {
  id: string;
  type: 'accident'|'congestion'|'obstacle'|'smoke'|'fire';
  level: 'high'|'medium'|'low';
  confidence: number;
  roadName: string;        // 立交名称
  stakeNumber: string;     // 所在区域
  direction: string;       // 进城/出城
  description: string;     // AI 分析文案
  bbox: { x, y, w, h, label }; // 检测框归一化坐标
  cameraAngle: 'front'|'side'|'overhead';
  weather: 'clear'|'rain'|'fog'|'night';
  laneCount: number;
}
```

### API

```typescript
pickSample(type?, level?): SampleScene   // 按类型/等级筛选随机取
getAllSamples(): SampleScene[]           // 获取全部
getSampleById(id): SampleScene           // 按 ID 获取
```

---

## 4. 截图生成器 Screenshot

**文件：** `server/src/ai/screenshot.ts`

### 生成规格

| 属性 | 值 |
|------|------|
| 格式 | SVG |
| 尺寸 | 640 × 360 (16:9) |
| 输出目录 | `server/data/screenshots/` |
| URL | `/api/screenshots/{filename}.svg` |

### 画面构成

```
┌──────────────────────────────────────────┐
│ 天空（按天气变色：晴蓝/雨灰/雾白/夜黑）   │
│   ☁ 远山剪影                              │
├──────────────────────────────────────────┤
│ 路面（灰黑）+ 车道线（虚线）+ 护栏         │
│   🚗 车辆元素（事故/拥堵/正常）            │
│   🔥/💨 事件元素（火焰/烟雾/障碍物/碎片）  │
│   ▯ AI 检测框（红色脉冲 + 角标）           │
│   🏷 标签（类型 + 置信度%）                │
├──────────────────────────────────────────┤
│ 📷 G50 K12+300 进城    2026-06-10 14:30 │
│ AI DETECTED                              │
└──────────────────────────────────────────┘
```

### 事件元素渲染

| 事件类型 | 渲染内容 |
|------|------|
| 事故 | 碰撞车辆（倾斜红色轿车 + 橙色货车）+ 路面碎片 |
| 火焰 | 三层火焰椭圆（红→橙→白）+ CSS 动画 |
| 烟雾 | 三层烟雾椭圆（灰+半透明）+ 水平浮动动画 |
| 拥堵 | 6 辆密集排列车辆（多色） |
| 障碍物 | 木箱（棕色矩形 + 对角线纹理）+ 避让车辆 |

---

## 5. 分析引擎 Analytics

**文件：** `server/src/ai/analytics.ts`
**版本：** v2

### 5.1 异常检测 — Z-score

```typescript
detectAnomalies(values: number[], threshold=2.0)
→ { index, value, zScore, severity }[]
```

- 输入：168 小时的事件计数序列
- 输出：异常时段列表
- severity: zScore > 3 → high, > 2.5 → medium, else low

### 5.2 空间聚类 — 简化 DBSCAN

```typescript
spatialClusters(points: Point[], radiusKm=2.5, minPoints=2)
→ { center, count, ids, locationName }[]
```

- 基于 Haversine 距离公式
- 聚类结果映射到最近监测点名称
- 自动识别热点立交

### 5.3 置信度校准 — 自适应 Platt Scaling

```typescript
calibrateConfidence(confidences: number[]): number[]
```

- 自适应参数 A, B 基于实际分布（均值、方差）
- 高均值低方差 → 轻微校准；否则 → 强校准

### 5.4 趋势预测 — Holt-Winters

```typescript
forecastNext(values: number[], period=24)
→ { predicted, trend, confidence, next24h[] }
```

- 趋势分量 + 季节性分量（24 小时周期）
- 预测未来 24 个时段
- 置信度基于残差分析

### 5.5 综合洞察

```typescript
generateInsights(events: any[]): AIInsight[]
```

返回 5 类洞察：

| 类型 | 内容 |
|------|------|
| typeDist | 事件类型分布 + 占比 |
| anomaly | Z-score 时序异常检测 |
| cluster | 空间热点 + 最繁忙立交 |
| trend | Holt-Winters 预测 + 趋势方向 |
| risk | 6 因子加权综合评分 (0-100) |

**风险评分公式：**
```
riskScore = highPending × 12 + recentEvents × 5 + anomalies × 6 + clusters × 8 + trendBonus
```

---

## 6. 事件研判 Assessment

**文件：** `server/src/ai/assessment.ts`

### 研判报告结构

```typescript
interface EventAssessment {
  conclusion: string;                          // 研判结论
  riskLevel: string;                           // 风险等级详细说明
  possibleCauses: string[];                    // 可能原因（3-4条）
  disposalSuggestions: Array<{                 // 处置建议
    priority: '立即' | '短期' | '跟进';
    action: string;
  }>;
  expectedImpact: {                            // 预计影响
    affectedArea: string;                      // 影响路段
    duration: string;                          // 影响时长
    congestionLength: string;                  // 拥堵长度
  };
}
```

### 模板库规模

| 维度 | 数量 |
|------|:--:|
| 事件类型 | 5（事故/火焰/烟雾/拥堵/障碍物） |
| 风险等级 | 3（高/中/低） |
| 天气条件 | 4（晴/雨/雾/夜） |
| 研判结论模板 | 10 条（每种类型 2 条） |
| 可能原因条目 | 67 条（每种类型 × 天气 3-5 条） |
| 处置建议条目 | 57 条（每种类型 × 等级 3 条 × 3 优先级） |
| 影响评估 | 15 组（每种类型 × 等级） |

### 5 类事件 — 完整处置建议模板

#### 交通事故 (accident)

| 等级 | 立即 | 短期 | 跟进 |
|:--:|------|------|------|
| 高危 | 通知交警+急救+路政，情报板"前方事故，减速避让"；调度{droneName}抵近侦察 | 事故点前后500m设警示标志，引导车辆缓行；若占多车道启动分流预案 | 持续跟踪处置进展，评估增援需求 |
| 中危 | 通知交警现场处置，情报板提示"注意避让" | 视情况调度无人机确认 | 处理完毕后恢复交通，记录处置过程 |
| 低危 | 确认是否轻微刮擦无需出警 | 引导涉事车辆移至应急车道 | 纳入月度事故统计 |

#### 火灾 (fire)

| 等级 | 立即 | 短期 | 跟进 |
|:--:|------|------|------|
| 高危 | 通知消防+交警+路政，启动火灾应急预案；调度{droneName}红外热成像确认火源 | 火灾点前后1km设警戒区，必要时封闭车道；评估直升机灭火支援 | 持续监测火势，评估交通和环境影响 |
| 中危 | 通知消防核实火情，无人机抵近确认 | 设置临时限速和警示标志 | 确认火源后处置，评估持续影响 |
| 低危 | 确认是否误报 | 小火情用车载灭火器处置 | 标记为隐患点，加强后续监控 |

#### 烟雾异常 (smoke)

| 等级 | 立即 | 短期 | 跟进 |
|:--:|------|------|------|
| 高危 | 通知消防核实是否为火灾，调度{droneName}侦察；开启通风+情报板"前方烟雾" | 烟雾区前后设限速标志，必要时封闭车道 | 持续监测扩散趋势，确认源头 |
| 中危 | 调度无人机或巡逻人员核实源头 | 情报板提示降速，保持车距 | 确认为误报后解除预警 |
| 低危 | 确认是否日常排放 | 烟雾持续>10min升级 | 标记区域和时间段特征 |

#### 拥堵 (congestion)

| 等级 | 立即 | 短期 | 跟进 |
|:--:|------|------|------|
| 高危 | 调度{droneName}沿路段巡航确认原因；情报板+导航APP发布拥堵预警 | 若事故导致则启动事故流程；若流量过大则协调交警疏导 | 持续监测趋势，评估是否开放应急车道 |
| 中危 | 情报板提示后方车辆降速 | 持续>30min则无人机巡航 | 纳入高峰预警模型 |
| 低危 | 确认是否常规高峰缓行 | 拥堵指数持续上升则升级 | 用于优化信号配时 |

#### 路面障碍物 (obstacle)

| 等级 | 立即 | 短期 | 跟进 |
|:--:|------|------|------|
| 高危 | 通知路政养护立即清理，情报板"前方障碍物"；调度{droneName}确认类型和尺寸 | 障碍物后方200m设警示标志+锥桶，必要时封闭车道 | 清理后检查路面是否受损，记录抛洒源 |
| 中危 | 通知养护部门清理，情报板提示"注意路面障碍" | 评估是否临时封闭车道 | 确认清理后恢复交通 |
| 低危 | 关注是否已被自然移除 | 若持续存在则通知养护 | 标记为常规路面异常 |

### 天气条件对原因的影响

| 天气 | 事故 | 火灾 | 烟雾 | 拥堵 | 障碍物 |
|------|------|------|------|------|------|
| 晴 | 操作失误/机械故障/天气路况/连锁追尾 | 自燃/货物起火/边坡火灾/施工火源 | 排放超标/施工焚烧/初期火灾/工业排放 | 高峰车流/匝道汇入/施工占道/轻微事故/信号配时 | 货物抛洒/事故散落/人为丢弃/路面损坏 |
| 雨 | 路面湿滑/能见度低/水滑失控/视线受阻 | 电路受潮/雷击起火/涉水故障 | 水蒸气凝结/车辆故障/电气短路 | 降速效率低/安全车距增大/故障率上升/出行变化 | 碎石滚落/积水掩盖/货物松动 |
| 雾 | 能见度急降/车距误判/未及时发现 | 火情不易发现/电气故障/红外精度降 | 雾烟混合/排烟更明显/焚烧增多 | 限速效率降/车距增大/谨慎驾驶 | 未能及时发现/施工设施不规范 |
| 夜 | 视线不良/疲劳驾驶/眩光影响/夜间超速 | 发现滞后/自燃风险高/非法焚烧 | 红外更敏感/非法焚烧/灯光误判 | 夜间施工/货车集中/照明不足/出口排队 | 未能及时发现/施工遗留/货车抛洒 |

---

## 7. 对话助手 Chat

**文件：** `server/src/routes/chat.ts`

### 架构

```
用户提问 → POST /api/chat/send → callLLM (try)
                                  ├─ 成功 → LLM 回复
                                  └─ 失败 → generateMockResponse (动态查询DB)
                                              ├─ "无人机" → 实时机舱列表
                                              ├─ "高危" → 实时高危事件
                                              ├─ "路况" → 各立交事件量
                                              ├─ "统计" → 等级/类型分布
                                              └─ 默认 → 系统状态摘要
```

### 系统上下文注入（LLM 模式）

```
你是低空AI巡检平台的智能助手。
当前系统状态：重庆主城9立交监控点(北环立交、石马河立交等)，
4架无人机(4架待命)，9路摄像头在线，
今日60条事件(高危25条，待处理12条)。
请用中文简洁回答，控制在200字以内。
```

### Mock 回复示例

**问：无人机状态怎么样？**
```
当前 4 架无人机：
- **北环机舱** 🟡 待命，电量 100%，覆盖: 北环/石马河/东环
- **沙坪坝机舱** 🟡 待命，电量 100%，覆盖: 杨公桥/高滩岩
- **华岩机舱** 🟡 待命，电量 100%，覆盖: 西环/凤中
- **南岸机舱** 🟡 待命，电量 100%，覆盖: 四公里/江南
飞行覆盖半径 5km，9 路摄像头全部在线。
```

**问：有哪些高危事件？**
```
当前高危事件 25 起：
1. 北环立交 accident 置信度 94% ⏳待处理
2. 杨公桥立交 fire 置信度 91% ✅已确认
...
共 12 起待处理，建议优先关注。
```

---

## 8. 前端 AI 可视化

### 8.1 AI 洞察面板

**文件：** `src/components/analytics/AIInsightsPanel.tsx`

位置：Analytics 页面右侧，与热力图并排。

展示 4-5 类 AI 洞察卡片：

| 卡片 | 图标 | 内容 |
|------|:--:|------|
| 事件类型分析 | 📊 | 类型分布 + 占比 |
| 时序异常检测 | ⚠ | Z-score 异常时段 |
| 事件热点区域 | 🔥 | 聚类位置 + 事件数 |
| 事件趋势预测 | 📈 | Holt-Winters 预测 |
| 综合风险评分 | 🛡 | 0-100 指数 + 建议 |

### 8.2 事件热力图

**文件：** `src/components/analytics/EventHeatmap.tsx`

- AMap.HeatMap 图层
- 200m 网格聚合
- 高危×3 / 中危×2 / 低危×1 权重
- 颜色梯度：蓝→绿→橙→红→深红
- 独立开关

### 8.3 地图动态网格聚合

**文件：** `src/components/map/AMapContainer.tsx`

- 缩放自适应网格（zoom≥15: 50m / zoom≥13: 200m / zoom≥10: 500m / else 2km）
- 同格事件合并显示数字气泡
- 高危事件红色脉冲动画
- 点击聚合点展示事件列表
- 点击单事件展示 InfoWindow（含截图缩略图）

### 8.4 事件详情 — 研判卡片

**文件：** `src/pages/EventDetailPage.tsx`

在处置时间轴和 AI 分析之间展示金色边框研判卡片：
- 研判结论（加粗段落）
- 风险等级（颜色编码：红/橙/绿）
- 可能原因（无序列表）
- 处置建议（立即🔴/短期🟠/跟进🔵 标签）
- 预计影响（路段/时长/拥堵）

---

## 9. AI API 接口

| 端点 | 方法 | 说明 |
|------|:--:|------|
| `/api/analytics/insights` | GET | AI 综合洞察报告 |
| `/api/analytics/calibration` | GET | 置信度校准对比数据 |
| `/api/analytics/clusters` | GET | 事件空间聚类结果 |
| `/api/chat/messages` | GET | AI 对话历史 |
| `/api/chat/send` | POST | 发送消息 → AI 回复 |

### Insights 响应示例

```json
{
  "insights": [
    {
      "type": "typeDist",
      "title": "事件类型分析",
      "description": "过去 7 天共计 60 起事件。交通事故 18 起，拥堵 15 起...",
      "severity": "medium"
    },
    {
      "type": "anomaly",
      "title": "时序异常检测",
      "description": "检测到 3 个异常时段。峰值异常指数 3.2σ",
      "severity": "high"
    },
    {
      "type": "cluster",
      "title": "事件热点区域",
      "description": "识别到 2 个热点。北环立交附近最密集（8 起）",
      "severity": "high"
    },
    {
      "type": "trend",
      "title": "事件趋势预测",
      "description": "下一时段预计 4 起事件（78% 置信度）。趋势平稳 →",
      "severity": "low"
    },
    {
      "type": "risk",
      "title": "综合风险评分",
      "description": "风险指数 42/100（正常监控，保持响应）",
      "severity": "medium"
    }
  ]
}
```

---

## 10. 模板库完整索引

### 研判结论模板（10 条）

| ID | 类型 | 模板 |
|:--:|------|------|
| C1 | 事故 | `{location}处摄像头检测到{typeName}，置信度{confidence}%。现场疑似{detail}，存在人员伤亡和交通中断风险，需立即响应。` |
| C2 | 事故 | `{location}发生{typeName}事件，置信度{confidence}%。{detail}占用车道，可能引发二次事故和严重拥堵。` |
| C3 | 火灾 | `{location}处检测到{typeName}，置信度{confidence}%。火势{detail}，可能由车辆起火或边坡火灾引发，存在升级为重大事故的风险。` |
| C4 | 火灾 | `{location}发现{typeName}，置信度{confidence}%。{detail}，需立即核实火源并评估蔓延风险。` |
| C5 | 烟雾 | `{location}处检测到{typeName}，置信度{confidence}%。{detail}，需判断是否为火灾前兆或误报，存在升级风险。` |
| C6 | 烟雾 | `{location}发现{typeName}异常，置信度{confidence}%。{detail}，需尽快核实源头以防演变为火灾。` |
| C7 | 拥堵 | `{location}处检测到{typeName}，置信度{confidence}%。当前{detail}，均速下降，可能由事故或高峰车流叠加引起。` |
| C8 | 拥堵 | `{location}发生{typeName}，置信度{confidence}%。{detail}，车流密度超阈值，需关注是否升级为严重拥堵。` |
| C9 | 障碍物 | `{location}处检测到{typeName}，置信度{confidence}%。{detail}，存在追尾和车辆受损风险，需及时清理。` |
| C10 | 障碍物 | `{location}发现{typeName}，置信度{confidence}%。{detail}，后方车辆紧急避让可能引发事故。` |

### 风险等级说明模板（3 条）

| ID | 等级 | 模板 |
|:--:|:--:|------|
| R1 | 高危 | `高危 — {typeName}可能由严重事故或火灾引发，虽当前影响有限，但若不及时处置，将导致严重交通中断和次生事故。` |
| R2 | 中危 | `中危 — {typeName}需要关注和及时处置，若不处理可能升级为高影响事件。` |
| R3 | 低危 | `低危 — {typeName}当前影响有限，建议常规处置和持续观察。` |

### 变量说明

| 变量 | 来源 | 示例 |
|------|------|------|
| `{location}` | 立交名 + 区域 + 方向 | `北环立交江北/渝北进城` |
| `{typeName}` | 事件类型映射 | `交通事故` |
| `{confidence}` | 检测置信度 | `94` |
| `{detail}` | 样本描述文案 | `检测到多车追尾事故...` |
| `{droneName}` | 最近待命无人机名 | `北环机舱` |

---

*版本: v1.0 | 日期: 2026-06-10 | 总模板条目: 134*
