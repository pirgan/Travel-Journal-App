/**
 * AI Entry Enhancer — E2E tests.
 *
 * The AIEntryEnhancer component lives on the Entry Detail page.  It calls
 * GET /api/ai/enhance-entry?body=…&token=…  as a Server-Sent Events stream.
 * All AI network calls are intercepted via page.route() so these tests run
 * without a real Anthropic API key.
 */

import { test, expect } from '@playwright/test';
import {
  registerViaApi,
  createEntryViaApi,
  loginInBrowser,
  ENHANCE_SSE,
  SSE_HEADERS,
} from './helpers';

// Seed an entry and navigate to its detail page before every test.
test.beforeEach(async ({ page, request }) => {
  const user  = await registerViaApi(request);
  const entry = await createEntryViaApi(request, user.token, {
    title: 'Kyoto in Autumn',
    body:  'Maple leaves drifted past the stone lanterns.',
  });

  await loginInBrowser(page, user);
  await page.goto(`/entry/${entry._id}`);
  await page.waitForSelector('h1');
});

// ── Test 1: panel appears and streams text ─────────────────────────────────────

test('AI panel appears with streaming text after clicking Enhance', async ({ page }) => {
  // Intercept the SSE request before clicking so the mock is in place
  await page.route('**/api/ai/enhance-entry**', (route) =>
    route.fulfill({ status: 200, headers: SSE_HEADERS, body: ENHANCE_SSE }),
  );

  // The button starts in its idle state
  const enhanceBtn = page.locator('button:has-text("✦ Enhance with AI")');
  await expect(enhanceBtn).toBeVisible();
  await enhanceBtn.click();

  // The mocked chunks should appear inside the AI Enhance panel
  // (mock responds instantly, so we assert on the stable streamed text
  //  rather than the transient "Enhancing…" button label)
  await expect(page.locator('.whitespace-pre-wrap').last()).toContainText(
    'The golden light',
  );
});

// ── Test 2: Accept button appears after [DONE] ────────────────────────────────

test('clicking Accept is available after the stream completes', async ({ page }) => {
  await page.route('**/api/ai/enhance-entry**', (route) =>
    route.fulfill({ status: 200, headers: SSE_HEADERS, body: ENHANCE_SSE }),
  );

  await page.click('button:has-text("✦ Enhance with AI")');

  // The [DONE] event flips `done` to true, which renders the Accept button
  const acceptBtn = page.locator('button:has-text("Accept")');
  await expect(acceptBtn).toBeVisible();

  // Clicking Accept should not throw (onAccept is optional; no crash expected)
  await acceptBtn.click();
  // Page remains on the same entry detail
  await expect(page).toHaveURL(/\/entry\//);
});

// ── Test 3: enhanced text is displayed in the AI panel ────────────────────────

test('full enhanced text is displayed in the AI Enhance panel', async ({ page }) => {
  await page.route('**/api/ai/enhance-entry**', (route) =>
    route.fulfill({ status: 200, headers: SSE_HEADERS, body: ENHANCE_SSE }),
  );

  await page.click('button:has-text("✦ Enhance with AI")');

  // Wait for both chunks to be concatenated and rendered
  const panel = page.locator('.whitespace-pre-wrap').last();
  await expect(panel).toContainText('The golden light painted the cobblestones amber.');
});

// ── Test 4: original body text is unchanged (Discard / ignore flow) ───────────

test('not accepting leaves the original entry body unchanged', async ({ page }) => {
  await page.route('**/api/ai/enhance-entry**', (route) =>
    route.fulfill({ status: 200, headers: SSE_HEADERS, body: ENHANCE_SSE }),
  );

  // Read the original body from the page before enhancing
  const originalBody = await page
    .locator('p.whitespace-pre-wrap')
    .first()
    .textContent();

  await page.click('button:has-text("✦ Enhance with AI")');
  await expect(page.locator('button:has-text("Accept")')).toBeVisible();

  // Do NOT click Accept — just verify the original body text is still present
  await expect(page.locator('p.whitespace-pre-wrap').first()).toHaveText(
    originalBody!.trim(),
  );
});
