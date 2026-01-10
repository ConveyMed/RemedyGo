// @ts-check
const { test, expect } = require('@playwright/test');

const TEST_USER = {
  email: 'thek2way17@gmail.com',
  password: 'Pri123456!'
};

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Login
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Wait for auth
    await page.waitForURL(/\/(home|org-onboarding|profile-complete)/, { timeout: 15000 });

    // Skip if on onboarding
    if (page.url().includes('onboarding') || page.url().includes('profile-complete')) {
      test.skip();
    }

    // Navigate to profile
    await page.click('text=Profile');
    await page.waitForURL(/\/profile/);
  });

  test('should show user info', async ({ page }) => {
    // Should show email or name
    await expect(page.locator(`text=${TEST_USER.email}`).or(page.locator('[data-testid="user-info"]'))).toBeVisible({ timeout: 5000 });
  });

  test('should show settings menu', async ({ page }) => {
    // Should have some settings options
    await expect(page.locator('text=/settings|notifications|downloads/i').first()).toBeVisible();
  });

  test('should have sign out button', async ({ page }) => {
    // Should have logout/sign out option
    await expect(page.locator('text=/sign out|log out|logout/i')).toBeVisible();
  });

  test('should navigate to notification settings', async ({ page }) => {
    // Click notification settings
    const notifButton = page.locator('text=/notification/i').first();
    if (await notifButton.isVisible()) {
      await notifButton.click();
      await expect(page).toHaveURL(/\/notification/);
    }
  });

  test('should navigate to downloads', async ({ page }) => {
    // Click downloads
    const downloadsButton = page.locator('text=/downloads/i').first();
    if (await downloadsButton.isVisible()) {
      await downloadsButton.click();
      await expect(page).toHaveURL(/\/downloads/);
    }
  });

  test('should sign out successfully', async ({ page }) => {
    // Click sign out
    await page.locator('text=/sign out|log out|logout/i').click();

    // Should redirect to login
    await expect(page).toHaveURL(/^\/$|\/login/);
  });
});
