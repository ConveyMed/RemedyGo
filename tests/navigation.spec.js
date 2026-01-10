// @ts-check
const { test, expect } = require('@playwright/test');

const TEST_USER = {
  email: 'thek2way17@gmail.com',
  password: 'Pri123456!'
};

// Helper to login
async function login(page) {
  await page.goto('/');
  await page.fill('input[placeholder="Email"]', TEST_USER.email);
  await page.fill('input[placeholder="Password"]', TEST_USER.password);
  await page.locator('button:has-text("Sign In")').click();
  await page.waitForURL('**/home', { timeout: 15000 });
}

test.describe('Main Navigation (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should show bottom navigation after login', async ({ page }) => {
    // Check for bottom nav element
    await expect(page.locator('nav')).toBeVisible();
    // Check nav has Home and Library buttons
    await expect(page.locator('nav >> text=Home')).toBeVisible();
    await expect(page.locator('nav >> text=Library')).toBeVisible();
  });

  test('should navigate to Library', async ({ page }) => {
    // Click Library in nav
    await page.locator('nav >> text=Library').click();
    await expect(page).toHaveURL(/\/library/);
  });

  test('should navigate to Training', async ({ page }) => {
    // Click Training in nav
    await page.locator('nav >> text=Training').click();
    await expect(page).toHaveURL(/\/training/);
  });

  test('should navigate to Profile', async ({ page }) => {
    // Profile is in expanded nav - need to click More first
    const moreBtn = page.locator('nav >> text=More');
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await page.waitForTimeout(300); // Wait for expand animation
    }

    // Click Profile in nav
    await page.locator('nav >> text=Profile').click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test('should navigate to Chat', async ({ page }) => {
    // Chat is in expanded nav - need to click More first
    const moreBtn = page.locator('nav >> text=More');
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await page.waitForTimeout(300);
    }

    // Click Chat in nav (may not exist if disabled)
    const chatBtn = page.locator('nav >> text=Chat');
    if (await chatBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chatBtn.click();
      await expect(page).toHaveURL(/\/chat/);
    } else {
      // Chat disabled by admin, skip
      test.skip();
    }
  });
});
