# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Admin Authentication >> should show error with invalid credentials
- Location: e2e/login.spec.ts:28:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - heading "AdminPanel" [level=2] [ref=e4]
      - navigation [ref=e5]:
        - link "Overview" [ref=e6] [cursor=pointer]:
          - /url: /
        - link "Moderation Queue" [ref=e7] [cursor=pointer]:
          - /url: /products
        - generic [ref=e8]: Users
        - generic [ref=e9]: Settings
    - main [ref=e10]:
      - generic [ref=e12]:
        - heading "404" [level=1] [ref=e13]
        - heading "This page could not be found." [level=2] [ref=e15]
  - button "Open Next.js Dev Tools" [ref=e21] [cursor=pointer]:
    - img [ref=e22]
  - alert [ref=e25]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Admin Authentication', () => {
  4  |   test('should login with valid credentials', async ({ page }) => {
  5  |     await page.goto('/login');
  6  | 
  7  |     // Assuming we have these data-testid attributes or we can use placeholder selectors
  8  |     await page.fill('input[type="email"]', 'admin@example.com');
  9  |     await page.fill('input[type="password"]', 'Admin123!');
  10 |     
  11 |     // Intercept the API call to mock the response
  12 |     await page.route('**/api/v1/auth/login', async route => {
  13 |       const json = {
  14 |         success: true,
  15 |         token: 'mock-jwt-token',
  16 |         user: { id: 'admin123', email: 'admin@example.com', role: 'ADMIN' }
  17 |       };
  18 |       await route.fulfill({ json });
  19 |     });
  20 | 
  21 |     await page.click('button[type="submit"]');
  22 | 
  23 |     // Wait for navigation to dashboard
  24 |     await expect(page).toHaveURL('/dashboard');
  25 |     await expect(page.locator('text=Welcome back')).toBeVisible();
  26 |   });
  27 | 
  28 |   test('should show error with invalid credentials', async ({ page }) => {
  29 |     await page.goto('/login');
  30 | 
> 31 |     await page.fill('input[type="email"]', 'admin@example.com');
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  32 |     await page.fill('input[type="password"]', 'wrongpassword');
  33 |     
  34 |     // Intercept the API call to mock the response
  35 |     await page.route('**/api/v1/auth/login', async route => {
  36 |       const json = {
  37 |         success: false,
  38 |         message: 'Invalid credentials'
  39 |       };
  40 |       await route.fulfill({ status: 401, json });
  41 |     });
  42 | 
  43 |     await page.click('button[type="submit"]');
  44 | 
  45 |     // Expect an error message to be visible
  46 |     await expect(page.locator('text=Invalid credentials')).toBeVisible();
  47 |     await expect(page).toHaveURL('/login');
  48 |   });
  49 | });
  50 | 
```