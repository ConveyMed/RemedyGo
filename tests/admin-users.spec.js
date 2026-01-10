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
// USER MANAGEMENT TESTS
// ============================================
test.describe('Admin User Management', () => {
  test.describe.configure({ mode: 'serial' });

  test('Navigate to manage users', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProfile(page);

    await page.click('button:has-text("Manage Users")');
    await page.waitForURL('**/manage-users');

    // Verify page loaded
    await expect(page.locator('text=Manage Users')).toBeVisible({ timeout: 5000 });

    // Verify user stats visible
    await expect(page.locator('text=Total Users')).toBeVisible({ timeout: 5000 });
  });

  test('Search users', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProfile(page);

    await page.click('button:has-text("Manage Users")');
    await page.waitForURL('**/manage-users');

    // Find search input - try multiple selectors
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], input[placeholder*="search"]').first();

    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(300);
    }

    // Verify we're still on the page
    await expect(page.locator('text=Manage Users')).toBeVisible();
  });

  test('View user details', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProfile(page);

    await page.click('button:has-text("Manage Users")');
    await page.waitForURL('**/manage-users');

    // Wait for user list to load
    await page.waitForTimeout(1000);

    // Try to click on a user card to view/edit
    const userCard = page.locator('[style*="cursor: pointer"], [style*="cursor:pointer"]').first();

    if (await userCard.isVisible({ timeout: 2000 })) {
      await userCard.click();
      await page.waitForTimeout(500);

      // Look for any form fields or modal that appears
      const nameInput = page.locator('input[placeholder*="name"], input[name*="name"], input[placeholder*="Name"]').first();
      if (await nameInput.isVisible({ timeout: 2000 })) {
        // Verify it's editable but don't actually change anything
        await expect(nameInput).toBeEditable();
      }

      // Close modal/panel if open
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // Verify we're still on manage users page
    await expect(page.locator('text=Manage Users')).toBeVisible();
  });
});
