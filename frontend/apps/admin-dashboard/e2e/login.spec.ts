import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Assuming we have these data-testid attributes or we can use placeholder selectors
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'Admin123!');
    
    // Intercept the API call to mock the response
    await page.route('**/api/v1/auth/login', async route => {
      const json = {
        success: true,
        token: 'mock-jwt-token',
        user: { id: 'admin123', email: 'admin@example.com', role: 'ADMIN' }
      };
      await route.fulfill({ json });
    });

    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Intercept the API call to mock the response
    await page.route('**/api/v1/auth/login', async route => {
      const json = {
        success: false,
        message: 'Invalid credentials'
      };
      await route.fulfill({ status: 401, json });
    });

    await page.click('button[type="submit"]');

    // Expect an error message to be visible
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
