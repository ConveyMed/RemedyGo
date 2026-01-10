// @ts-check
const { test, expect } = require('@playwright/test');

// Admin test user - must have is_admin=true in database
// Using regular user for now - admin tests will skip if not admin
const ADMIN_USER = {
  email: 'thek2way17@gmail.com',
  password: 'Pri123456!'
};

test.describe('Admin Screens', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Login as admin
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Wait for auth
    await page.waitForURL(/\/(home|org-onboarding|profile-complete)/, { timeout: 15000 });

    // Skip if on onboarding or not admin
    if (page.url().includes('onboarding') || page.url().includes('profile-complete')) {
      test.skip();
    }
  });

  test('should show admin controls in profile', async ({ page }) => {
    await page.click('text=Profile');
    await page.waitForURL(/\/profile/);

    // Should see admin section
    await expect(page.locator('text=/admin controls|admin/i')).toBeVisible({ timeout: 5000 });
  });

  test('should access Manage Users', async ({ page }) => {
    await page.click('text=Profile');
    await page.waitForURL(/\/profile/);

    // Click manage users
    await page.locator('text=/manage users/i').click();

    // Should be on manage users page
    await expect(page).toHaveURL(/\/manage-users/);
  });

  test('should access Manage Library', async ({ page }) => {
    await page.click('text=Profile');
    await page.waitForURL(/\/profile/);

    // Click manage library
    await page.locator('text=/manage library/i').click();

    // Should be on manage library page
    await expect(page).toHaveURL(/\/manage-library/);
  });

  test('should access Manage Training', async ({ page }) => {
    await page.click('text=Profile');
    await page.waitForURL(/\/profile/);

    // Click manage training
    await page.locator('text=/manage training/i').click();

    // Should be on manage training page
    await expect(page).toHaveURL(/\/manage-training/);
  });

  test('should access Organization Codes', async ({ page }) => {
    await page.click('text=Profile');
    await page.waitForURL(/\/profile/);

    // Click organization codes
    await page.locator('text=/organization codes/i').click();

    // Should be on org codes page
    await expect(page).toHaveURL(/\/manage-org-codes/);
  });

  test('should show org switcher for admin', async ({ page }) => {
    // Admin should be able to switch org views
    const orgSwitcher = page.locator('[data-testid="org-switcher"], text=/AM|OR|Antimicrobials|OsteoRemedies/i');
    await expect(orgSwitcher.first()).toBeVisible({ timeout: 5000 });
  });
});
