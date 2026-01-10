// @ts-check
const { test, expect } = require('@playwright/test');

const TEST_USER = {
  email: 'thek2way17@gmail.com',
  password: 'Pri123456!'
};

test.describe('Authentication', () => {
  test('should show login page by default', async ({ page }) => {
    await page.goto('/');

    // Should see login form
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/');

    // Click sign up button
    await page.locator('button:has-text("Sign up")').click();

    // Should be on signup page
    await expect(page).toHaveURL(/\/signup/);
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/');

    // Fill in invalid credentials
    await page.fill('input[placeholder="Email"]', 'invalid@test.com');
    await page.fill('input[placeholder="Password"]', 'wrongpassword');

    // Submit
    await page.locator('button:has-text("Sign In")').click();

    // Wait for alert or error (the app uses alert())
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('failed');
      await dialog.accept();
    });
  });

  test('should show forgot password button', async ({ page }) => {
    await page.goto('/');

    // Should have forgot password button
    await expect(page.locator('button:has-text("Forgot password")')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/');

    // Fill in valid credentials
    await page.fill('input[placeholder="Email"]', TEST_USER.email);
    await page.fill('input[placeholder="Password"]', TEST_USER.password);

    // Submit
    await page.locator('button:has-text("Sign In")').click();

    // Should redirect to home (or onboarding/profile-complete)
    await page.waitForURL(/\/(home|org-onboarding|profile-complete)/, { timeout: 15000 });
  });
});
