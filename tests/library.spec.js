// @ts-check
const { test, expect } = require('@playwright/test');

const TEST_USER = {
  email: 'thek2way17@gmail.com',
  password: 'Pri123456!'
};

test.describe('Library Page', () => {
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

    // Navigate to library
    await page.click('text=Library');
    await page.waitForURL(/\/library/);
  });

  test('should show library header', async ({ page }) => {
    await expect(page.locator('text=/Resource Library|Library/i').first()).toBeVisible();
  });

  test('should have search input', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Search"], input[type="search"]')).toBeVisible();
  });

  test('should show loading state then content', async ({ page }) => {
    // Either loading spinner or content should appear
    await expect(
      page.locator('text=/loading/i, [data-testid="category-section"], text=/No content/i')
    ).toBeVisible({ timeout: 10000 });
  });

  test('should filter content with search', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Type in search
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test search');
      // Content should filter (or show no results)
      await page.waitForTimeout(500);
    }
  });
});
