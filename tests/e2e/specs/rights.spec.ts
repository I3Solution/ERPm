import { expect, test } from '@playwright/test';
import { ADMIN_PASSWORD, USER_PASSWORD } from '../support/env';
import { signIn } from '../support/ui';

// What each seeded account sees in the shell and which routes it may open (labels are the Vietnamese defaults).
const nav = (page: import('@playwright/test').Page, label: string) => page.getByRole('link', { name: label });

test('admin sees the administration menu and can open the organization tree', async ({ page }) => {
  await signIn(page, 'admin', ADMIN_PASSWORD);
  await expect(nav(page, 'Cơ cấu tổ chức')).toBeVisible();
  await expect(nav(page, 'Tài khoản')).toBeVisible();
  await page.goto('/org');
  await expect(page.getByRole('treeitem').filter({ hasText: 'COMPANY_A' })).toBeVisible();
});

test('viewer reads sales data but has no administration menu', async ({ page }) => {
  await signIn(page, 'viewer', USER_PASSWORD);
  await expect(nav(page, 'Đơn bán hàng')).toBeVisible();
  await expect(nav(page, 'Cơ cấu tổ chức')).toHaveCount(0);
  await expect(nav(page, 'Tài khoản')).toHaveCount(0);
  await page.goto('/org');
  await expect(page).toHaveURL(/\/forbidden/);
});

test('limited account is sent to the forbidden page for protected screens', async ({ page }) => {
  await signIn(page, 'limited', USER_PASSWORD);
  await expect(nav(page, 'Đơn bán hàng')).toHaveCount(0);
  for (const route of ['/sales/orders', '/sales/analytics', '/org']) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/forbidden/);
  }
});

test('signing out from the profile menu ends the session', async ({ page }) => {
  await signIn(page, 'viewer', USER_PASSWORD);
  await page.locator('app-dropdown-menu button').first().click();
  await page.getByRole('menuitem', { name: /Đăng xuất/ }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/sales/orders');
  await expect(page).toHaveURL(/\/login/);
});
