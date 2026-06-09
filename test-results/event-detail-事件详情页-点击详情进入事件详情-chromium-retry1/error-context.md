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
      - generic [ref=e15]: 事件 12
      - generic [ref=e17]: 待 7
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
          - generic [ref=e43]: "12"
        - generic [ref=e46]:
          - generic [ref=e49]:
            - img "clock-circle" [ref=e50]:
              - img [ref=e51]
            - text: 待处理
          - generic [ref=e55]: "7"
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
          - generic [ref=e82]: 事件 12
          - generic [ref=e83]: 待 7
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
                - generic [ref=e100]: ✈️
            - generic:
              - img
            - generic [ref=e101]: © 2026 AutoNavi
          - generic [ref=e103]:
            - button "zoom-in" [ref=e104] [cursor=pointer]:
              - img "zoom-in" [ref=e106]:
                - img [ref=e107]
            - button "zoom-out" [ref=e109] [cursor=pointer]:
              - img "zoom-out" [ref=e111]:
                - img [ref=e112]
            - button "aim" [ref=e114] [cursor=pointer]:
              - img "aim" [ref=e116]:
                - img [ref=e117]
            - button "global" [ref=e120] [cursor=pointer]:
              - img "global" [ref=e122]:
                - img [ref=e123]
            - button "line-chart" [ref=e125] [cursor=pointer]:
              - img "line-chart" [ref=e127]:
                - img [ref=e128]
            - button "fire" [ref=e130] [cursor=pointer]:
              - img "fire" [ref=e132]:
                - img [ref=e133]
            - button "fullscreen" [ref=e135] [cursor=pointer]:
              - img "fullscreen" [ref=e137]:
                - img [ref=e138]
          - generic [ref=e141]:
            - generic [ref=e143]: ━ G50 高速
            - generic [ref=e145]: ┅ 巡逻航线
            - generic [ref=e147]: ● 高危事件
            - generic [ref=e149]: ● 中危事件
            - generic [ref=e151]: ● 低危事件
            - generic [ref=e152]: 🏠 机舱
            - generic [ref=e153]: ✈️ 无人机
      - generic [ref=e154]:
        - generic [ref=e156]:
          - generic:
            - img "send" [ref=e157]:
              - img [ref=e158]
            - text: 无人机状态
          - generic:
            - generic [ref=e160]: "在空: 1 架"
            - generic [ref=e161]: "待命: 2 架"
            - generic [ref=e162]: "共: 4 架"
        - generic [ref=e164]:
          - generic:
            - strong [ref=e166]: DJI-001
            - generic [ref=e167]: 在空
          - generic: "巡逻中: G50南段"
          - generic:
            - progressbar:
              - generic "78%" [ref=e168]
            - generic [ref=e169]: 60km/h
        - generic [ref=e171]:
          - generic:
            - strong [ref=e173]: DJI-002
            - generic [ref=e174]: 待命
          - generic: 待命
          - generic:
            - progressbar:
              - generic "100%" [ref=e175]
            - generic [ref=e176]: 0km/h
        - generic [ref=e178]:
          - generic:
            - strong [ref=e180]: DJI-003
            - generic [ref=e181]: 待命
          - generic: 待命
          - generic:
            - progressbar:
              - generic "95%" [ref=e182]
            - generic [ref=e183]: 0km/h
        - generic [ref=e185]:
          - generic:
            - strong [ref=e187]: DJI-004
            - generic [ref=e188]: 充电中
          - generic: 充电中
          - generic:
            - progressbar:
              - generic "35%" [ref=e189]
    - generic [ref=e191]:
      - generic [ref=e192]:
        - strong [ref=e194]: 实时事件流
        - generic [ref=e195]:
          - switch "紧凑 详情" [checked] [active] [ref=e197] [cursor=pointer]:
            - generic [ref=e199]:
              - generic: 紧凑
              - generic: 详情
          - radiogroup "segmented control" [ref=e201]:
            - generic [ref=e202]:
              - generic [ref=e203] [cursor=pointer]:
                - radio "全部" [checked]
                - generic "全部" [ref=e204]
              - generic [ref=e205] [cursor=pointer]:
                - radio "高危"
                - generic "高危" [ref=e206]
              - generic [ref=e207] [cursor=pointer]:
                - radio "中危"
                - generic "中危" [ref=e208]
              - generic [ref=e209] [cursor=pointer]:
                - radio "低危"
                - generic "低危" [ref=e210]
          - button "message AI助手" [ref=e213] [cursor=pointer]:
            - img "message" [ref=e215]:
              - img [ref=e216]
            - generic [ref=e218]: AI助手
          - button "history 历史查询" [ref=e220] [cursor=pointer]:
            - img "history" [ref=e222]:
              - img [ref=e223]
            - generic [ref=e225]: 历史查询
      - generic [ref=e226]:
        - generic [ref=e227] [cursor=pointer]:
          - generic [ref=e228]: 高危
          - generic [ref=e229]: 火焰检测
          - generic [ref=e230]: G50 K7+800
          - generic [ref=e231]: 17:12
          - generic [ref=e232]: 已抵近
        - generic [ref=e233] [cursor=pointer]:
          - generic [ref=e234]: 高危
          - generic [ref=e235]: 烟雾异常
          - generic [ref=e236]: G50 K18+400
          - generic [ref=e237]: 17:26
          - button "确认" [ref=e238]:
            - generic [ref=e239]: 确认
        - generic [ref=e240] [cursor=pointer]:
          - generic [ref=e241]: 高危
          - generic [ref=e242]: 交通事故
          - generic [ref=e243]: G50 K12+300
          - generic [ref=e244]: 17:25
          - generic [ref=e245]: 已确认
        - generic [ref=e246] [cursor=pointer]:
          - generic [ref=e247]: 高危
          - generic [ref=e248]: 拥堵事件
          - generic [ref=e249]: G50 K32+500
          - generic [ref=e250]: 17:24
          - button "确认" [ref=e251]:
            - generic [ref=e252]: 确认
        - generic [ref=e253] [cursor=pointer]:
          - generic [ref=e254]: 高危
          - generic [ref=e255]: 交通事故
          - generic [ref=e256]: G50 K5+200
          - generic [ref=e257]: 17:20
          - button "确认" [ref=e258]:
            - generic [ref=e259]: 确认
        - generic [ref=e260] [cursor=pointer]:
          - generic [ref=e261]: 中危
          - generic [ref=e262]: 障碍物
          - generic [ref=e263]: G50 K7+800
          - generic [ref=e264]: 17:22
          - button "确认" [ref=e265]:
            - generic [ref=e266]: 确认
        - generic [ref=e267] [cursor=pointer]:
          - generic [ref=e268]: 中危
          - generic [ref=e269]: 烟雾异常
          - generic [ref=e270]: G50 K22+600
          - generic [ref=e271]: 17:23
          - button "确认" [ref=e272]:
            - generic [ref=e273]: 确认
        - generic [ref=e274] [cursor=pointer]:
          - generic [ref=e275]: 中危
          - generic [ref=e276]: 障碍物
          - generic [ref=e277]: G50 K15+800
          - generic [ref=e278]: 17:21
          - generic [ref=e279]: 已确认
        - generic [ref=e280] [cursor=pointer]:
          - generic [ref=e281]: 中危
          - generic [ref=e282]: 拥堵事件
          - generic [ref=e283]: G50 K28+300
          - generic [ref=e284]: 17:25
          - button "确认" [ref=e285]:
            - generic [ref=e286]: 确认
        - generic [ref=e287] [cursor=pointer]:
          - generic [ref=e288]: 低危
          - generic [ref=e289]: 拥堵事件
          - generic [ref=e290]: G50 K25+100
          - generic [ref=e291]: 17:17
          - generic [ref=e292]: 已确认
        - generic [ref=e293] [cursor=pointer]:
          - generic [ref=e294]: 低危
          - generic [ref=e295]: 烟雾异常
          - generic [ref=e296]: G50 K30+100
          - generic [ref=e297]: 17:15
          - button "确认" [ref=e298]:
            - generic [ref=e299]: 确认
        - generic [ref=e300] [cursor=pointer]:
          - generic [ref=e301]: 低危
          - generic [ref=e302]: 拥堵事件
          - generic [ref=e303]: G50 K3+500
          - generic [ref=e304]: 16:57
          - generic [ref=e305]: 已关闭
  - generic [ref=e306]:
    - generic [ref=e307] [cursor=pointer]:
      - img "home" [ref=e308]:
        - img [ref=e309]
      - generic [ref=e311]: 总览
    - generic [ref=e312] [cursor=pointer]:
      - img "send" [ref=e313]:
        - img [ref=e314]
      - generic [ref=e316]: 无人机
    - generic [ref=e317] [cursor=pointer]:
      - img "bar-chart" [ref=e318]:
        - img [ref=e319]
      - generic [ref=e321]: 数据
    - generic [ref=e322] [cursor=pointer]:
      - img "setting" [ref=e323]:
        - img [ref=e324]
      - generic [ref=e326]: 设置
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