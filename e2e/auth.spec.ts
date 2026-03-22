import { test, expect } from '@playwright/test';
import { uid, registerViaApi, loginInBrowser } from './helpers';

// ── POST /register ─────────────────────────────────────────────────────────────

test.describe('Registration', () => {
  test('user registers with name / email / password and lands on home feed', async ({ page }) => {
    const id = uid();

    await page.goto('/register');
    await expect(page.locator('h1')).toHaveText('Create account');

    await page.fill('input[type="text"]',     `Test User ${id}`);
    await page.fill('input[type="email"]',    `user_${id}@example.com`);
    await page.fill('input[type="password"]', 'Password123!');

    await page.click('button[type="submit"]');

    // After successful registration the app navigates to the home feed
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toHaveText('Your Journal');
  });
});

// ── POST /login ────────────────────────────────────────────────────────────────

test.describe('Login', () => {
  test('registered user logs in and sees home feed', async ({ page, request }) => {
    // Register via the API so this test is independent of the registration UI
    const user = await registerViaApi(request);

    await page.goto('/login');
    await expect(page.locator('h1')).toHaveText('Welcome back');

    await page.fill('input[type="email"]',    user.email);
    await page.fill('input[type="password"]', user.password);

    await page.click('button[type="submit"]');

    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toHaveText('Your Journal');
  });
});

// ── Logout ─────────────────────────────────────────────────────────────────────

test.describe('Logout', () => {
  test('user logs out and is redirected to /login', async ({ page, request }) => {
    const user = await registerViaApi(request);
    await loginInBrowser(page, user);

    // Navigate to Profile and sign out from there
    await page.goto('/profile');
    await page.click('button:has-text("Sign out")');

    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });
});

// ── Protected routes ───────────────────────────────────────────────────────────

test.describe('Protected routes', () => {
  test('accessing / without a token redirects to /login', async ({ page }) => {
    // Navigate directly — no token in localStorage, ProtectedRoute should redirect
    await page.goto('/');

    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });
});
