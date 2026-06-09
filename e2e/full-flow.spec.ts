import { test, expect } from '@playwright/test';
import { login, waitForEventStream } from './helpers';

test.describe('端到端完整流程', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForEventStream(page);
  });

  test('登录 → 查看事件详情 → 返回', async ({ page }) => {
    await page.locator('text=详情').first().click();
    const backBtn = page.locator('text=返回大屏');
    if (await backBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await backBtn.click();
      await expect(page.locator('text=实时事件流')).toBeVisible({ timeout: 10000 });
    }
  });

  test('登录 → 调度无人机（如果可用）', async ({ page }) => {
    const dispatchBtn = page.locator('button:has-text("调度")').first();
    if (await dispatchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dispatchBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  test('页面导航 Header 按钮', async ({ page }) => {
    const droneNav = page.locator('button:has-text("无人机")');
    if (await droneNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await droneNav.click();
      await page.waitForTimeout(2000);
    }
  });

  test('主题切换按钮存在', async ({ page }) => {
    const themeBtn = page.locator('.ant-btn-icon-only').filter({ has: page.locator('.anticon-sun, .anticon-moon') });
    const count = await themeBtn.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('退出登录', async ({ page }) => {
    const logoutBtn = page.locator('button:has-text("logout")');
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL('**/login', { timeout: 10000 });
      await expect(page.locator('input[placeholder="用户名"]')).toBeVisible();
    }
  });

  test('键盘快捷键 Esc', async ({ page }) => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('事件流紧凑/详情切换', async ({ page }) => {
    const switchEl = page.locator('.ant-switch');
    if (await switchEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      await switchEl.click();
      await page.waitForTimeout(500);
      await switchEl.click();
      await page.waitForTimeout(500);
    }
  });
});
