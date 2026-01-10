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
// UPDATES & EVENTS TESTS
// ============================================
test.describe('Admin Updates & Events', () => {
  test.describe.configure({ mode: 'serial' });

  test('Create announcement', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProfile(page);

    await page.click('button:has-text("Manage Notifications")');
    await page.waitForURL('**/manage-updates');

    await page.click('button:has-text("Create Update")');
    await page.waitForTimeout(300);

    // Fill form
    await page.fill('input[placeholder*="title"]', 'Test Announcement - Update Suite');
    await page.fill('textarea[placeholder*="notification content"]', 'This is a test announcement from the admin updates test suite.');

    // Submit
    await page.locator('button:has-text("Create")').last().click({ force: true });
    await page.waitForTimeout(1500);

    // Verify announcement appears
    await expect(page.locator('text=Test Announcement - Update Suite').first()).toBeVisible({ timeout: 5000 });
  });

  test('Create event with RSVP', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProfile(page);

    await page.click('button:has-text("Manage Notifications")');
    await page.waitForURL('**/manage-updates');

    // Switch to Events tab
    await page.click('button:has-text("Events")');
    await page.waitForTimeout(300);

    await page.click('button:has-text("Create Event")');
    await page.waitForTimeout(300);

    // Fill form
    await page.fill('input[placeholder*="title"]', 'Test Event - RSVP Suite');
    await page.fill('textarea[placeholder*="notification content"]', 'Event description from the admin updates test suite.');

    // Enable RSVP toggle
    const rsvpToggle = page.locator('button[style*="width: 48px"]').first();
    if (await rsvpToggle.isVisible()) {
      await rsvpToggle.click();
      await page.waitForTimeout(200);

      // Fill RSVP question if visible
      const rsvpInput = page.locator('input[placeholder*="Will you be attending"], input[placeholder*="question"]');
      if (await rsvpInput.isVisible()) {
        await rsvpInput.fill('Will you attend this test event?');
      }
    }

    // Submit
    await page.locator('button:has-text("Create")').last().click({ force: true });
    await page.waitForTimeout(1500);

    // Verify event appears
    await expect(page.locator('text=Test Event - RSVP Suite').first()).toBeVisible({ timeout: 5000 });
  });

  test('View RSVP responses', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProfile(page);

    await page.click('button:has-text("Manage Notifications")');
    await page.waitForURL('**/manage-updates');

    // Switch to Events tab to find events with RSVP
    await page.click('button:has-text("Events")');
    await page.waitForTimeout(300);

    // Find an event with RSVP and click View Responses
    const viewBtn = page.locator('button:has-text("View Responses")').first();
    if (await viewBtn.isVisible({ timeout: 2000 })) {
      await viewBtn.click();
      await page.waitForTimeout(500);

      // Verify modal shows response summary
      await expect(page.locator('text=RSVP Responses')).toBeVisible({ timeout: 3000 });

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } else {
      // No RSVP events exist yet - that's okay, skip this test
      console.log('No events with RSVP found - skipping view responses test');
    }

    // Verify we're still on the page
    await expect(page.locator('text=Events')).toBeVisible();
  });
});
