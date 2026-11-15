import { expect, Page } from '@playwright/test';

/** Signs in through the login form and waits until the app shell is shown; waits out the API's login rate limit (429). */
export async function signIn(page: Page, userName: string, password: string): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt++) {
    await page.goto('/login');
    await page.locator('input').nth(0).fill(userName);
    await page.locator('input[type=password]').fill(password);
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/auth/login')),
      page.locator('button[type=submit]').click()
    ]);
    if (response.status() !== 429) break;
    await page.waitForTimeout(10_000);
  }
  await expect(page).not.toHaveURL(/\/login/);
}
