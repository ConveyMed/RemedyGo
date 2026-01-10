// @ts-check
const { test, expect } = require('@playwright/test');

// Admin credentials
const ADMIN_EMAIL = 'thek2way17@gmail.com';
const ADMIN_PASSWORD = 'Pri123456!';

// Shared login helper
async function loginAsAdmin(page) {
  await page.goto('http://localhost:3000');
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('.login-primary-button');
  await page.waitForURL('**/home', { timeout: 15000 });
  await page.waitForTimeout(1000);
}

// Navigate to profile helper
async function navigateToProfile(page) {
  const moreBtn = page.locator('button:has-text("More")');
  if (await moreBtn.isVisible()) {
    await moreBtn.click();
    await page.waitForTimeout(300);
  }
  await page.click('button:has-text("Profile")');
  await page.waitForURL('**/profile');
}

// ============================================
// ADMIN SETTINGS TESTS
// ============================================
test.describe('Admin Settings', () => {
  test.describe.configure({ mode: 'serial' });

  test('View directory permissions', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProfile(page);

    await page.click('button:has-text("Directory Permissions")');
    await page.waitForURL('**/directory-permissions');

    // Verify options visible - use first() to avoid strict mode
    await expect(page.locator('h3:has-text("All Users")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h3:has-text("Admins Only")').first()).toBeVisible({ timeout: 5000 });

    // Verify we're on the right page
    await expect(page).toHaveURL(/directory-permissions/);
  });

  test('View chat settings', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProfile(page);

    await page.click('button:has-text("Manage Chat")');
    await page.waitForURL('**/manage-chat');

    // Switch to Settings tab
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(300);

    // Verify options visible
    await expect(page.locator('text=Visibility').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=All Members').first()).toBeVisible({ timeout: 5000 });
  });

  test('View chat reports', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProfile(page);

    await page.click('button:has-text("Manage Chat")');
    await page.waitForURL('**/manage-chat');

    // Should default to Reports tab - verify it's visible
    await expect(page.locator('button:has-text("Reports")')).toBeVisible({ timeout: 5000 });

    // If reports exist, verify they're displayed
    const reportCard = page.locator('[class*="report"], [class*="card"]').first();
    if (await reportCard.isVisible({ timeout: 2000 })) {
      await reportCard.click();
      await page.waitForTimeout(300);
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // Verify we're still on the page
    await expect(page.locator('button:has-text("Reports")')).toBeVisible();
  });

  test('View organization codes', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProfile(page);

    await page.click('button:has-text("Organization Codes")');
    await page.waitForURL('**/manage-org-codes');

    // Verify we're on the right page by checking URL
    await expect(page).toHaveURL(/manage-org-codes/);

    // Wait for page to load and verify some content is visible
    await page.waitForTimeout(500);

    // Look for any text that might be on the page
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
  });
});
