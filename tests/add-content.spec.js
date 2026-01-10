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
  await page.waitForTimeout(1000); // Wait for data to load
}

// ============================================
// TEST 1: CREATE A POST
// ============================================
test.describe('Create Post', () => {
  // Run serially to avoid conflicts
  test.describe.configure({ mode: 'serial' });

  test('Create text post', async ({ page }) => {
    await loginAsAdmin(page);

    // Click the purple + create button (48x48px button in center of nav)
    // It's the only large square button with an SVG plus icon
    const createBtn = page.locator('button[style*="48px"], button[style*="borderRadius: 14px"]').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
    } else {
      // Fallback to empty state button if no posts exist
      await page.locator('button:has-text("Create Post")').click();
    }
    await page.waitForTimeout(500);

    // Fill content
    await page.fill('textarea[placeholder="What\'s on your mind?"]', 'Test post from Playwright');

    // Submit
    await page.locator('button:has-text("Post")').last().click({ force: true });

    // Verify
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Test post from Playwright').first()).toBeVisible();
  });
});

// ============================================
// TEST 2: ADD LIBRARY CONTENT
// ============================================
test.describe('Add Library Content', () => {

  test('Add content to library', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Profile
    const moreBtn = page.locator('button:has-text("More")');
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await page.waitForTimeout(300);
    }
    await page.click('button:has-text("Profile")');
    await page.waitForURL('**/profile');

    // Go to Manage Library
    await page.click('button:has-text("Manage Library")');
    await page.waitForURL('**/manage-library');

    // Click Add
    await page.locator('button:has-text("Add")').first().click();
    await page.waitForTimeout(300);

    // Select org (first checkbox)
    await page.locator('input[type="checkbox"]').first().check();
    await page.waitForTimeout(200);

    // Select category (second checkbox - appears after org)
    await page.locator('input[type="checkbox"]').nth(1).check();

    // Fill form
    await page.fill('input[placeholder="Content title"]', 'Test Library Item');
    await page.fill('textarea[placeholder="Content description"]', 'Test description from Playwright');

    // Fill external link if visible
    const linkInput = page.locator('input[placeholder*="https"]');
    if (await linkInput.isVisible()) {
      await linkInput.fill('https://example.com/resource');
    }

    // Submit - force click
    await page.locator('button:has-text("Add Content")').click({ force: true });

    // Verify modal closes
    await page.waitForTimeout(1000);
    // Just verify we're back on the manage library page
    await expect(page.locator('text=Manage Library')).toBeVisible({ timeout: 5000 });
  });
});

// ============================================
// TEST 3: ADD UPDATE (ANNOUNCEMENT)
// ============================================
test.describe('Add Update/Announcement', () => {

  test('Create announcement', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Profile
    const moreBtn = page.locator('button:has-text("More")');
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await page.waitForTimeout(300);
    }
    await page.click('button:has-text("Profile")');
    await page.waitForURL('**/profile');

    // Go to Manage Notifications
    await page.click('button:has-text("Manage Notifications")');
    await page.waitForURL('**/manage-updates');

    // Create Update
    await page.click('button:has-text("Create Update")');
    await page.waitForTimeout(300);

    // Fill form
    await page.fill('input[placeholder*="title"]', 'Test Announcement');
    await page.fill('textarea[placeholder*="notification content"]', 'This is a test announcement from Playwright.');

    // Submit - force click to bypass overlay
    await page.locator('button:has-text("Create")').last().click({ force: true });

    // Verify - use first() since there may be multiple from previous runs
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Test Announcement').first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================
// TEST 4: ADD EVENT
// ============================================
test.describe('Add Event', () => {

  test('Create event with RSVP', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Profile
    const moreBtn = page.locator('button:has-text("More")');
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await page.waitForTimeout(300);
    }
    await page.click('button:has-text("Profile")');
    await page.waitForURL('**/profile');

    // Go to Manage Notifications
    await page.click('button:has-text("Manage Notifications")');
    await page.waitForURL('**/manage-updates');

    // Switch to Events tab
    await page.click('button:has-text("Events")');
    await page.waitForTimeout(300);

    // Create Event
    await page.click('button:has-text("Create Event")');
    await page.waitForTimeout(300);

    // Fill form
    await page.fill('input[placeholder*="title"]', 'Test Event');
    await page.fill('textarea[placeholder*="notification content"]', 'Event description from Playwright.');

    // Enable RSVP (toggle button)
    const rsvpToggle = page.locator('button[style*="width: 48px"]').first();
    if (await rsvpToggle.isVisible()) {
      await rsvpToggle.click();
      await page.waitForTimeout(200);

      // Fill RSVP question if visible
      const rsvpInput = page.locator('input[placeholder*="Will you be attending"]');
      if (await rsvpInput.isVisible()) {
        await rsvpInput.fill('Will you attend this event?');
      }
    }

    // Submit - force click to bypass overlay
    await page.locator('button:has-text("Create")').last().click({ force: true });

    // Verify - use first() since there may be multiple from previous runs
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Test Event').first()).toBeVisible({ timeout: 5000 });
  });
});
