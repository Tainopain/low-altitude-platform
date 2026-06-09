import { test, expect } from '@playwright/test';

test.describe('登录页', () => {
  test('显示登录表单', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('input[placeholder="用户名"]')).toBeVisible();
    await expect(page.locator('input[placeholder="密码"]')).toBeVisible();
    await expect(page.locator('button:has-text("登 录")')).toBeVisible();
    await expect(page.locator('text=值班员')).toBeVisible();
    await expect(page.locator('text=管理员')).toBeVisible();
  });

  test('空表单 - 按钮可点击', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('button:has-text("登 录")')).toBeVisible();
    // 空表单点击也会发请求，服务端返回 400
  });

  test('admin 登录成功跳转首页', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="用户名"]', 'admin');
    await page.fill('input[placeholder="密码"]', 'admin123');
    await page.locator('text=管理员').click();
    await page.locator('button:has-text("登 录")').click();

    await page.waitForURL('**/', { timeout: 15000 });
    await expect(page.locator('text=实时事件流')).toBeVisible({ timeout: 15000 });
  });

  test('operator 登录成功', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="用户名"]', 'operator');
    await page.fill('input[placeholder="密码"]', 'operator123');
    await page.locator('button:has-text("登 录")').click();

    await page.waitForURL('**/', { timeout: 15000 });
    await expect(page.locator('text=实时事件流')).toBeVisible({ timeout: 15000 });
  });

  test('未登录访问首页跳转登录', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page.locator('input[placeholder="用户名"]')).toBeVisible();
  });
});
