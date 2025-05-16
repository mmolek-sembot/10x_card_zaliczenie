import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/10xCard/);
  });

  test('should navigate to the create page when clicking the create button', async ({ page }) => {
    await page.goto('/');

    // Find and click the create button (update the selector based on your actual UI)
    await page.getByRole('link', { name: /create/i }).click();

    // Check that we've navigated to the create page
    await expect(page).toHaveURL(/.*\/create/);
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');

    // Check if navigation has proper ARIA landmarks
    const nav = await page.locator('nav');
    await expect(nav).toBeVisible();

    // Verify main content area is accessible
    const main = await page.locator('main');
    await expect(main).toBeVisible();
  });
});
