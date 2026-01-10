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
// CONTENT CREATION TESTS
// ============================================
test.describe('Admin Content Creation', () => {
  test.describe.configure({ mode: 'serial' });

  test('Create text post', async ({ page }) => {
    await loginAsAdmin(page);

    // Click create button (48x48 purple + button)
    const createBtn = page.locator('button[style*="48px"], button[style*="borderRadius: 14px"]').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
    } else {
      await page.locator('button:has-text("Create Post")').click();
    }
    await page.waitForTimeout(500);

    // Fill content
    await page.fill('textarea[placeholder="What\'s on your mind?"]', 'Test post from Playwright - Content Suite');

    // Submit
    await page.locator('button:has-text("Post")').last().click({ force: true });

    // Verify
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Test post from Playwright - Content Suite').first()).toBeVisible();
  });

  test('Create post with link', async ({ page }) => {
    await loginAsAdmin(page);

    // Open modal
    const createBtn = page.locator('button[style*="48px"], button[style*="borderRadius: 14px"]').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
    } else {
      await page.locator('button:has-text("Create Post")').click();
    }
    await page.waitForTimeout(500);

    // Fill content
    await page.fill('textarea[placeholder="What\'s on your mind?"]', 'Check out this resource - Link Test');

    // Add link
    await page.locator('button:has-text("Link")').click();
    await page.waitForTimeout(300);
    await page.fill('input[placeholder="Paste URL..."]', 'https://example.com/resource');
    await page.fill('input[placeholder="Name (e.g. Training Video)"]', 'Example Resource');

    // Click Add button in the link form
    await page.locator('button:has-text("Add")').first().click();
    await page.waitForTimeout(300);

    // Submit post
    await page.locator('button:has-text("Post")').last().click({ force: true });
    await page.waitForTimeout(2000);

    // Verify post appears
    await expect(page.locator('text=Check out this resource - Link Test').first()).toBeVisible();
  });

  test('Add library content', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProfile(page);

    await page.click('button:has-text("Manage Library")');
    await page.waitForURL('**/manage-library');

    // Click Add button
    await page.locator('button:has-text("Add")').first().click();
    await page.waitForTimeout(300);

    // Select org & category
    await page.locator('input[type="checkbox"]').first().check();
    await page.waitForTimeout(200);
    await page.locator('input[type="checkbox"]').nth(1).check();

    // Fill form
    await page.fill('input[placeholder="Content title"]', 'Test Library Item - Admin Suite');
    await page.fill('textarea[placeholder="Content description"]', 'Test description from admin content tests');

    // External link (optional)
    const linkInput = page.locator('input[placeholder*="https"]');
    if (await linkInput.isVisible()) {
      await linkInput.fill('https://example.com/library-resource');
    }

    // Submit
    await page.locator('button:has-text("Add Content")').click({ force: true });
    await page.waitForTimeout(1000);

    // Verify we're still on manage library page (modal closed)
    await expect(page.locator('text=Manage Library')).toBeVisible();
  });

  test('Add training content', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProfile(page);

    await page.click('button:has-text("Manage Training")');
    await page.waitForURL('**/manage-training');

    // Click Add button
    await page.locator('button:has-text("Add")').first().click();
    await page.waitForTimeout(300);

    // Select org & category
    await page.locator('input[type="checkbox"]').first().check();
    await page.waitForTimeout(200);
    await page.locator('input[type="checkbox"]').nth(1).check();

    // Fill form - training uses "Training title" placeholder
    await page.fill('input[placeholder="Training title"]', 'Test Training Module - Admin Suite');
    await page.fill('textarea[placeholder="Training description"]', 'Training description from admin tests');

    // Video link (specific to training)
    const videoInput = page.locator('input[placeholder*="https"]').first();
    if (await videoInput.isVisible()) {
      await videoInput.fill('https://youtube.com/watch?v=testVideo');
    }

    // Submit - try multiple selectors
    const submitBtn = page.locator('button:has-text("Add Content"), button:has-text("Add Training")');
    await submitBtn.first().click({ force: true });
    await page.waitForTimeout(1000);

    // Verify we're still on manage training page
    await expect(page.locator('text=Manage Training')).toBeVisible();
  });
});
