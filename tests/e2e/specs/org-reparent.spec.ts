import { expect, test } from '@playwright/test';
import { Api } from '../support/api';
import { ADMIN_PASSWORD } from '../support/env';
import { signIn } from '../support/ui';

// B4: moving a branch under another parent from the organization screen, and the server refusing a cycle.
const parentCode = async (admin: Api, code: string) => {
  const flat = await admin.get<any[]>('/branches');
  const node = flat.find(b => b.code === code);
  return flat.find(b => b.id === node.parentId)?.code;
};

test('admin moves a store to another branch in the org tree', async ({ page }) => {
  const admin = await Api.login('admin', ADMIN_PASSWORD);
  const hanoi = (await admin.get<any[]>('/branches')).find(b => b.code === 'CA_HN');
  await admin.post('/branches', { code: 'B4_STORE', name: 'B4 Store', parentId: hanoi.id, orgUnitType: 2, taxCode: null });
  expect(await parentCode(admin, 'B4_STORE')).toBe('CA_HN');

  await signIn(page, 'admin', ADMIN_PASSWORD);
  await page.goto('/org');
  await page.getByRole('treeitem').filter({ hasText: 'CA_HN' }).first().locator('.org-toggle').click();
  await page.getByRole('treeitem').filter({ hasText: 'B4_STORE' }).first().locator('[tabindex="0"]').first().click();
  await page.getByRole('button', { name: 'Chỉnh sửa' }).click();
  await page.locator('app-form-control').filter({ hasText: 'Cấp trên' }).locator('[role=combobox]').click();
  await page.getByRole('treeitem', { name: /^Ho Chi Minh CA_HCM$/ }).click();
  await page.getByRole('button', { name: 'Lưu' }).click();

  await expect.poll(() => parentCode(admin, 'B4_STORE')).toBe('CA_HCM');
  // Leave the shared seed as found: seed.spec expects exactly one store under Ha Noi.
  await admin.del(`/branches/${(await admin.get<any[]>('/branches')).find(x => x.code === 'B4_STORE').id}`);
});

test('server refuses to move a branch under its own descendant', async () => {
  const admin = await Api.login('admin', ADMIN_PASSWORD);
  const flat = await admin.get<any[]>('/branches');
  const hanoi = flat.find(b => b.code === 'CA_HN');
  const store = flat.find(b => b.code === 'CA_HN_01');
  await expect(admin.put(`/branches/${hanoi.id}`, { code: hanoi.code, name: hanoi.name, parentId: store.id, isActive: true })).rejects.toThrow(/400|409|422/);
  expect(await parentCode(admin, 'CA_HN')).toBe('COMPANY_A');
});
