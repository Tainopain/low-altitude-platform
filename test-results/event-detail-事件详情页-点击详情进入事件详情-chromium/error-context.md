# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: event-detail.spec.ts >> 事件详情页 >> 点击详情进入事件详情
- Location: e2e\event-detail.spec.ts:10:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - banner [ref=e5]:
    - generic [ref=e6]:
      - button "home" [ref=e8] [cursor=pointer]:
        - img "home" [ref=e10]:
          - img [ref=e11]
      - generic [ref=e13]: 🛩️ 低空平台
      - generic [ref=e15]: 事件 13
      - generic [ref=e17]: 待 8
      - generic [ref=e19]: 🚁 1/4
    - generic [ref=e20]:
      - generic "WebSocket 已连接" [ref=e22]
      - generic [ref=e23]: 17:27
      - button "sun" [ref=e25] [cursor=pointer]:
        - img "sun" [ref=e27]:
          - img [ref=e28]
  - main [ref=e30]:
    - generic [ref=e31]:
      - generic [ref=e32]:
        - generic [ref=e35]:
          - generic [ref=e38]:
            - img "alert" [ref=e39]:
              - img [ref=e40]
            - text: 今日事件
          - generic [ref=e43]: "11"
        - generic [ref=e46]:
          - generic [ref=e49]:
            - img "clock-circle" [ref=e50]:
              - img [ref=e51]
            - text: 待处理
          - generic [ref=e55]: "6"
        - generic [ref=e58]:
          - generic [ref=e61]:
            - img "send" [ref=e62]:
              - img [ref=e63]
            - text: 在线无人机
          - generic [ref=e65]:
            - generic [ref=e66]: "3"
            - generic [ref=e68]: / 4
        - generic [ref=e71]:
          - generic [ref=e74]:
            - img "camera" [ref=e75]:
              - img [ref=e76]
            - text: 摄像头
          - generic [ref=e79]: 4/4
      - generic [ref=e80]:
        - generic [ref=e81]:
          - generic [ref=e82]: 事件 13
          - generic [ref=e83]: 待 8
          - generic [ref=e84]: 🚁 1/4
        - generic [ref=e85]:
          - generic [ref=e86]:
            - iframe [ref=e87]:
              
            - generic [ref=e89]:
              - generic:
                - generic [ref=e92]: 🏠
                - generic [ref=e94]: 🏠
                - generic [ref=e96]: 🏠
                - generic [ref=e98]: 🏠
                - generic [ref=e124]: ✈️
            - generic:
              - img
            - generic [ref=e125]: © 2026 AutoNavi
          - generic [ref=e127]:
            - button "zoom-in" [ref=e128] [cursor=pointer]:
              - img "zoom-in" [ref=e130]:
                - img [ref=e131]
            - button "zoom-out" [ref=e133] [cursor=pointer]:
              - img "zoom-out" [ref=e135]:
                - img [ref=e136]
            - button "aim" [ref=e138] [cursor=pointer]:
              - img "aim" [ref=e140]:
                - img [ref=e141]
            - button "global" [ref=e144] [cursor=pointer]:
              - img "global" [ref=e146]:
                - img [ref=e147]
            - button "line-chart" [ref=e149] [cursor=pointer]:
              - img "line-chart" [ref=e151]:
                - img [ref=e152]
            - button "fire" [ref=e154] [cursor=pointer]:
              - img "fire" [ref=e156]:
                - img [ref=e157]
            - button "fullscreen" [ref=e159] [cursor=pointer]:
              - img "fullscreen" [ref=e161]:
                - img [ref=e162]
          - generic [ref=e165]:
            - generic [ref=e167]: ━ G50 高速
            - generic [ref=e169]: ┅ 巡逻航线
            - generic [ref=e171]: ● 高危事件
            - generic [ref=e173]: ● 中危事件
            - generic [ref=e175]: ● 低危事件
            - generic [ref=e176]: 🏠 机舱
            - generic [ref=e177]: ✈️ 无人机
      - generic [ref=e178]:
        - generic [ref=e180]:
          - generic:
            - img "send" [ref=e181]:
              - img [ref=e182]
            - text: 无人机状态
          - generic:
            - generic [ref=e184]: "在空: 1 架"
            - generic [ref=e185]: "待命: 2 架"
            - generic [ref=e186]: "共: 4 架"
        - generic [ref=e188]:
          - generic:
            - strong [ref=e190]: DJI-001
            - generic [ref=e191]: 在空
          - generic: "巡逻中: G50南段"
          - generic:
            - progressbar:
              - generic "78%" [ref=e192]
            - generic [ref=e193]: 60km/h
        - generic [ref=e195]:
          - generic:
            - strong [ref=e197]: DJI-002
            - generic [ref=e198]: 待命
          - generic: 待命
          - generic:
            - progressbar:
              - generic "100%" [ref=e199]
            - generic [ref=e200]: 0km/h
        - generic [ref=e202]:
          - generic:
            - strong [ref=e204]: DJI-003
            - generic [ref=e205]: 待命
          - generic: 待命
          - generic:
            - progressbar:
              - generic "95%" [ref=e206]
            - generic [ref=e207]: 0km/h
        - generic [ref=e209]:
          - generic:
            - strong [ref=e211]: DJI-004
            - generic [ref=e212]: 充电中
          - generic: 充电中
          - generic:
            - progressbar:
              - generic "35%" [ref=e213]
    - generic [ref=e215]:
      - generic [ref=e216]:
        - strong [ref=e218]: 实时事件流
        - generic [ref=e219]:
          - switch "紧凑 详情" [checked] [active] [ref=e221] [cursor=pointer]:
            - generic [ref=e223]:
              - generic: 紧凑
              - generic: 详情
          - radiogroup "segmented control" [ref=e225]:
            - generic [ref=e226]:
              - generic [ref=e227] [cursor=pointer]:
                - radio "全部" [checked]
                - generic "全部" [ref=e228]
              - generic [ref=e229] [cursor=pointer]:
                - radio "高危"
                - generic "高危" [ref=e230]
              - generic [ref=e231] [cursor=pointer]:
                - radio "中危"
                - generic "中危" [ref=e232]
              - generic [ref=e233] [cursor=pointer]:
                - radio "低危"
                - generic "低危" [ref=e234]
          - button "message AI助手" [ref=e237] [cursor=pointer]:
            - img "message" [ref=e239]:
              - img [ref=e240]
            - generic [ref=e242]: AI助手
          - button "history 历史查询" [ref=e244] [cursor=pointer]:
            - img "history" [ref=e246]:
              - img [ref=e247]
            - generic [ref=e249]: 历史查询
      - generic [ref=e250]:
        - generic [ref=e251] [cursor=pointer]:
          - generic [ref=e252]: 中危
          - generic [ref=e253]: 烟雾异常
          - generic [ref=e254]: G50 K22+600
          - generic [ref=e255]: 17:27
          - button "确认" [ref=e256]:
            - generic [ref=e257]: 确认
        - generic [ref=e258] [cursor=pointer]:
          - generic [ref=e259]: 高危
          - generic [ref=e260]: 火焰检测
          - generic [ref=e261]: G50 K7+800
          - generic [ref=e262]: 17:12
          - generic [ref=e263]: 已抵近
        - generic [ref=e264] [cursor=pointer]:
          - generic [ref=e265]: 高危
          - generic [ref=e266]: 烟雾异常
          - generic [ref=e267]: G50 K18+400
          - generic [ref=e268]: 17:26
          - button "确认" [ref=e269]:
            - generic [ref=e270]: 确认
        - generic [ref=e271] [cursor=pointer]:
          - generic [ref=e272]: 高危
          - generic [ref=e273]: 交通事故
          - generic [ref=e274]: G50 K12+300
          - generic [ref=e275]: 17:25
          - generic [ref=e276]: 已确认
        - generic [ref=e277] [cursor=pointer]:
          - generic [ref=e278]: 高危
          - generic [ref=e279]: 拥堵事件
          - generic [ref=e280]: G50 K32+500
          - generic [ref=e281]: 17:24
          - button "确认" [ref=e282]:
            - generic [ref=e283]: 确认
        - generic [ref=e284] [cursor=pointer]:
          - generic [ref=e285]: 高危
          - generic [ref=e286]: 交通事故
          - generic [ref=e287]: G50 K5+200
          - generic [ref=e288]: 17:19
          - button "确认" [ref=e289]:
            - generic [ref=e290]: 确认
        - generic [ref=e291] [cursor=pointer]:
          - generic [ref=e292]: 中危
          - generic [ref=e293]: 障碍物
          - generic [ref=e294]: G50 K7+800
          - generic [ref=e295]: 17:22
          - button "确认" [ref=e296]:
            - generic [ref=e297]: 确认
        - generic [ref=e298] [cursor=pointer]:
          - generic [ref=e299]: 中危
          - generic [ref=e300]: 烟雾异常
          - generic [ref=e301]: G50 K22+600
          - generic [ref=e302]: 17:23
          - button "确认" [ref=e303]:
            - generic [ref=e304]: 确认
        - generic [ref=e305] [cursor=pointer]:
          - generic [ref=e306]: 中危
          - generic [ref=e307]: 障碍物
          - generic [ref=e308]: G50 K15+800
          - generic [ref=e309]: 17:21
          - generic [ref=e310]: 已确认
        - generic [ref=e311] [cursor=pointer]:
          - generic [ref=e312]: 中危
          - generic [ref=e313]: 拥堵事件
          - generic [ref=e314]: G50 K28+300
          - generic [ref=e315]: 17:24
          - button "确认" [ref=e316]:
            - generic [ref=e317]: 确认
        - generic [ref=e318] [cursor=pointer]:
          - generic [ref=e319]: 低危
          - generic [ref=e320]: 拥堵事件
          - generic [ref=e321]: G50 K25+100
          - generic [ref=e322]: 17:17
          - generic [ref=e323]: 已确认
        - generic [ref=e324] [cursor=pointer]:
          - generic [ref=e325]: 低危
          - generic [ref=e326]: 烟雾异常
          - generic [ref=e327]: G50 K30+100
          - generic [ref=e328]: 17:15
          - button "确认" [ref=e329]:
            - generic [ref=e330]: 确认
        - generic [ref=e331] [cursor=pointer]:
          - generic [ref=e332]: 低危
          - generic [ref=e333]: 拥堵事件
          - generic [ref=e334]: G50 K3+500
          - generic [ref=e335]: 16:57
          - generic [ref=e336]: 已关闭
  - generic [ref=e337]:
    - generic [ref=e338] [cursor=pointer]:
      - img "home" [ref=e339]:
        - img [ref=e340]
      - generic [ref=e342]: 总览
    - generic [ref=e343] [cursor=pointer]:
      - img "send" [ref=e344]:
        - img [ref=e345]
      - generic [ref=e347]: 无人机
    - generic [ref=e348] [cursor=pointer]:
      - img "bar-chart" [ref=e349]:
        - img [ref=e350]
      - generic [ref=e352]: 数据
    - generic [ref=e353] [cursor=pointer]:
      - img "setting" [ref=e354]:
        - img [ref=e355]
      - generic [ref=e357]: 设置
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
> 18 |     expect(isDetail || hasBack || hasAI).toBeTruthy();
     |                                          ^ Error: expect(received).toBeTruthy()
  19 |   });
  20 | 
  21 |   test('事件详情页显示处置时间轴', async ({ page }) => {
  22 |     await page.locator('text=详情').first().click();
  23 |     await expect(
  24 |       page.locator('text=处置时间轴').or(page.locator('text=AI 分析'))
  25 |     ).toBeVisible({ timeout: 12000 });
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