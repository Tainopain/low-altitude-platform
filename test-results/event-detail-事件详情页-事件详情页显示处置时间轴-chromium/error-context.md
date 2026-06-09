# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: event-detail.spec.ts >> 事件详情页 >> 事件详情页显示处置时间轴
- Location: e2e\event-detail.spec.ts:21:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=处置时间轴').or(locator('text=AI 分析'))
Expected: visible
Timeout: 12000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 12000ms
  - waiting for locator('text=处置时间轴').or(locator('text=AI 分析'))

```

```yaml
- banner:
  - button "home":
    - img "home"
  - text: 🛩️ 低空平台 事件 12 待 7 🚁 1/4 17:27
  - button "sun":
    - img "sun"
- main:
  - img "alert"
  - text: 今日事件 12
  - img "clock-circle"
  - text: 待处理 7
  - img "send"
  - text: 在线无人机 3 / 4
  - img "camera"
  - text: 摄像头 4/4 事件 12 待 7 🚁 1/4
  - iframe
  - text: 🏠 🏠 🏠 🏠 ✈️
  - img
  - text: © 2026 AutoNavi
  - button "zoom-in":
    - img "zoom-in"
  - button "zoom-out":
    - img "zoom-out"
  - button "aim":
    - img "aim"
  - button "global":
    - img "global"
  - button "line-chart":
    - img "line-chart"
  - button "fire":
    - img "fire"
  - button "fullscreen":
    - img "fullscreen"
  - text: ━ G50 高速 ┅ 巡逻航线 ● 高危事件 ● 中危事件 ● 低危事件 🏠 机舱 ✈️ 无人机
  - img "send"
  - text: "无人机状态 在空: 1 架 待命: 2 架 共: 4 架"
  - strong: DJI-001
  - text: "在空 巡逻中: G50南段"
  - progressbar: 78%
  - text: 60km/h
  - strong: DJI-002
  - text: 待命 待命
  - progressbar: 100%
  - text: 0km/h
  - strong: DJI-003
  - text: 待命 待命
  - progressbar: 95%
  - text: 0km/h
  - strong: DJI-004
  - text: 充电中 充电中
  - progressbar: 35%
  - strong: 实时事件流
  - switch "紧凑 详情" [checked]
  - radiogroup "segmented control":
    - radio "全部" [checked]
    - text: 全部
    - radio "高危"
    - text: 高危
    - radio "中危"
    - text: 中危
    - radio "低危"
    - text: 低危
  - button "message AI助手":
    - img "message"
    - text: AI助手
  - button "history 历史查询":
    - img "history"
    - text: 历史查询
  - text: 高危 火焰检测 G50 K7+800 17:12 已抵近 高危 烟雾异常 G50 K18+400 17:26
  - button "确认"
  - text: 高危 交通事故 G50 K12+300 17:25 已确认 高危 拥堵事件 G50 K32+500 17:24
  - button "确认"
  - text: 高危 交通事故 G50 K5+200 17:20
  - button "确认"
  - text: 中危 障碍物 G50 K7+800 17:22
  - button "确认"
  - text: 中危 烟雾异常 G50 K22+600 17:23
  - button "确认"
  - text: 中危 障碍物 G50 K15+800 17:21 已确认 中危 拥堵事件 G50 K28+300 17:25
  - button "确认"
  - text: 低危 拥堵事件 G50 K25+100 17:17 已确认 低危 烟雾异常 G50 K30+100 17:15
  - button "确认"
  - text: 低危 拥堵事件 G50 K3+500 16:57 已关闭
- img "home"
- text: 总览
- img "send"
- text: 无人机
- img "bar-chart"
- text: 数据
- img "setting"
- text: 设置
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { login, waitForEventStream } from './helpers';
  3  | 
  4  | test.describe('事件详情页', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await login(page);
  7  |     await waitForEventStream(page);
  8  |   });
  9  | 
  10 |   test('点击详情进入事件详情', async ({ page }) => {
  11 |     await page.locator('text=详情').first().click();
  12 |     await page.waitForTimeout(2000);
  13 | 
  14 |     const url = page.url();
  15 |     const isDetail = url.includes('/event/');
  16 |     const hasBack = await page.locator('text=返回大屏').isVisible({ timeout: 3000 }).catch(() => false);
  17 |     const hasAI = await page.locator('text=AI 分析').isVisible({ timeout: 3000 }).catch(() => false);
  18 |     expect(isDetail || hasBack || hasAI).toBeTruthy();
  19 |   });
  20 | 
  21 |   test('事件详情页显示处置时间轴', async ({ page }) => {
  22 |     await page.locator('text=详情').first().click();
  23 |     await expect(
  24 |       page.locator('text=处置时间轴').or(page.locator('text=AI 分析'))
> 25 |     ).toBeVisible({ timeout: 12000 });
     |       ^ Error: expect(locator).toBeVisible() failed
  26 |   });
  27 | 
  28 |   test('事件详情页包含内容', async ({ page }) => {
  29 |     await page.locator('text=详情').first().click();
  30 |     const bodyText = await page.textContent('body');
  31 |     expect(bodyText).toBeTruthy();
  32 |     expect(bodyText!.length).toBeGreaterThan(100);
  33 |   });
  34 | 
  35 |   test('返回大屏按钮有效', async ({ page }) => {
  36 |     await page.locator('text=详情').first().click();
  37 |     const backBtn = page.locator('text=返回大屏');
  38 |     if (await backBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
  39 |       await backBtn.click();
  40 |       await expect(page.locator('text=实时事件流')).toBeVisible({ timeout: 10000 });
  41 |     }
  42 |   });
  43 | });
  44 | 
```