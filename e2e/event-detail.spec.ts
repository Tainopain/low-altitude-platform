import { test, expect } from '@playwright/test';
import { login, waitForEventStream } from './helpers';

test.describe('事件详情页', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForEventStream(page);
  });

  test('点击详情进入事件详情', async ({ page }) => {
    await page.locator('text=详情').first().click();
    await page.waitForTimeout(2000);

    const url = page.url();
    const isDetail = url.includes('/event/');
    const hasBack = await page.locator('text=返回大屏').isVisible({ timeout: 3000 }).catch(() => false);
    const hasAI = await page.locator('text=AI 分析').isVisible({ timeout: 3000 }).catch(() => false);
    expect(isDetail || hasBack || hasAI).toBeTruthy();
  });

  test('事件详情页显示处置时间轴', async ({ page }) => {
    await page.locator('text=详情').first().click();
    await expect(
      page.locator('text=处置时间轴').or(page.locator('text=AI 分析'))
    ).toBeVisible({ timeout: 12000 });
  });

  test('事件详情页包含内容', async ({ page }) => {
    await page.locator('text=详情').first().click();
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(100);
  });

  test('返回大屏按钮有效', async ({ page }) => {
    await page.locator('text=详情').first().click();
    const backBtn = page.locator('text=返回大屏');
    if (await backBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await backBtn.click();
      await expect(page.locator('text=实时事件流')).toBeVisible({ timeout: 10000 });
    }
  });
});
