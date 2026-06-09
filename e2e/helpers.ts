import { Page } from '@playwright/test';

/** 登录并等待跳转到首页 */
export async function login(page: Page, role: 'admin' | 'operator' = 'admin') {
  await page.goto('/login');
  await page.waitForSelector('input[placeholder="用户名"]', { timeout: 10000 });

  await page.fill('input[placeholder="用户名"]', role);
  await page.fill('input[placeholder="密码"]', role === 'admin' ? 'admin123' : 'operator123');

  if (role === 'admin') {
    await page.locator('text=管理员').click();
  }

  await page.locator('button:has-text("登 录")').click();
  await page.waitForURL('**/', { timeout: 15000 });
  await page.waitForTimeout(2000);
}

/** 等待地图加载 */
export async function waitForMap(page: Page) {
  await page.waitForTimeout(4000);
}

/** 等待事件流加载 */
export async function waitForEventStream(page: Page) {
  await page.waitForSelector('text=详情', { timeout: 15000 });
  await page.waitForTimeout(500);
}

/** 通过 API 获取事件 ID 并导航到详情页 */
export async function goToEventDetail(page: Page): Promise<boolean> {
  const eventId = await page.evaluate(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const res = await fetch('/api/events', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return null;
      const events = await res.json();
      return events?.[0]?.id || null;
    } catch { return null; }
  });

  if (!eventId) return false;

  await page.goto(`/event/${eventId}`);
  await page.waitForTimeout(3000);
  return true;
}
