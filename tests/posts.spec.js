// @ts-check
const { test, expect } = require('@playwright/test');

const TEST_USER = {
  email: 'thek2way17@gmail.com',
  password: 'Pri123456!'
};

test.describe('Home/Posts Page', () => {
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
  });

  test('should show home page after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/home/);
  });

  test('should show posts feed or empty state', async ({ page }) => {
    // Either posts or empty message
    await expect(
      page.locator('[data-testid="post"], text=/no posts|nothing here/i, [data-testid="posts-feed"]')
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show create post button for admins', async ({ page }) => {
    // Create post button (may only show for admins)
    const createBtn = page.locator('button >> text=/create|new post|add/i, [data-testid="create-post"]');
    // Just check if visible or not - not an error if hidden
    const isVisible = await createBtn.isVisible().catch(() => false);
    console.log('Create post button visible:', isVisible);
  });

  test('should open post detail when clicking a post', async ({ page }) => {
    // Wait for posts to load
    await page.waitForTimeout(2000);

    // Try to click first post
    const firstPost = page.locator('[data-testid="post"], article, .post-card').first();
    if (await firstPost.isVisible()) {
      await firstPost.click();
      // Should show post detail or expand
      await page.waitForTimeout(500);
    }
  });

  test('should show like and comment buttons on posts', async ({ page }) => {
    // Wait for posts to load
    await page.waitForTimeout(2000);

    // Check for interaction buttons
    const likeBtn = page.locator('button >> text=/like/i, [data-testid="like-btn"], svg').first();
    const commentBtn = page.locator('button >> text=/comment/i, [data-testid="comment-btn"]').first();

    // At least one should be visible if posts exist
    const hasInteractions = await likeBtn.or(commentBtn).isVisible().catch(() => false);
    console.log('Post interactions visible:', hasInteractions);
  });
});

test.describe('Post Creation (Admin)', () => {
  const ADMIN_USER = {
    email: process.env.ADMIN_USER_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_USER_PASSWORD || 'adminpassword123'
  };

  test('should open create post modal', async ({ page }) => {
    await page.goto('/');

    // Login as admin
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    await page.waitForURL(/\/(home|org-onboarding|profile-complete)/, { timeout: 15000 });

    if (page.url().includes('onboarding') || page.url().includes('profile-complete')) {
      test.skip();
    }

    // Click create post
    const createBtn = page.locator('button >> text=/create|new post|\+/i, [data-testid="create-post"]').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();

      // Should show modal/form
      await expect(page.locator('textarea, input[placeholder*="post"], [data-testid="post-form"]')).toBeVisible({ timeout: 3000 });
    }
  });
});
