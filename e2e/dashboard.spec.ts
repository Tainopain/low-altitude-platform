import { test, expect } from '@playwright/test';
import { login, waitForMap, waitForEventStream } from './helpers';

test.describe('大屏总览 Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('KPI 区域渲染', async ({ page }) => {
    await expect(page.getByText('今日事件').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('在线无人机').first()).toBeVisible({ timeout: 5000 });
  });

  test('Header 显示平台名', async ({ page }) => {
    await expect(page.locator('text=低空平台')).toBeVisible({ timeout: 5000 });
  });

  test('事件流渲染', async ({ page }) => {
    await waitForEventStream(page);
    const count = await page.locator('text=详情').count();
    expect(count).toBeGreaterThan(0);
  });

  test('事件筛选正常工作', async ({ page }) => {
    await waitForEventStream(page);
    // Use Segmented control by title
    await page.getByTitle('高危').click();
    await page.waitForTimeout(500);
    await page.getByTitle('全部').click();
    await page.waitForTimeout(300);
    expect(await page.locator('text=详情').count()).toBeGreaterThan(0);
  });

  test('紧凑/详情切换', async ({ page }) => {
    await waitForEventStream(page);
    const switchEl = page.locator('.ant-switch');
    if (await switchEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      await switchEl.click();
      await page.waitForTimeout(400);
      await switchEl.click();
      await page.waitForTimeout(400);
    }
  });

  test('地图容器加载', async ({ page }) => {
    await waitForMap(page);
    await expect(page.locator('#amap-container')).toBeVisible();
  });

  test('地图图例显示', async ({ page }) => {
    await waitForMap(page);
    await expect(page.getByText('G50 高速')).toBeVisible({ timeout: 8000 });
  });

  test('无人机面板可展开', async ({ page }) => {
    // 面板可能折叠，先找展开按钮
    const unfoldBtn = page.locator('.anticon-menu-unfold');
    if (await unfoldBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await unfoldBtn.click();
      await page.waitForTimeout(500);
    }
    // 面板展开后应有无人机信息
    await expect(page.locator('text=DJI-001')).toBeVisible({ timeout: 8000 });
  });

  test('键盘快捷键不崩溃', async ({ page }) => {
    await page.keyboard.press('2');
    await page.waitForTimeout(300);
    await page.keyboard.press('1');
    await page.waitForTimeout(300);
  });
});
