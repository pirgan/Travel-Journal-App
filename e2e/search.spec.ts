/**
 * Search — E2E tests.
 *
 * Test 1 exercises the existing keyword search (GET /api/entries/search?q=…).
 *
 * Tests 2–4 describe the planned AI-powered natural-language search mode that
 * will be added to SearchResults.jsx.  They are marked test.fixme() so the
 * suite stays green today while clearly communicating what still needs to be
 * built:
 *   • an "✦" sparkle toggle button on the search bar
 *   • a POST /api/ai/nl-search call that returns entries with relevance badges
 *   • an empty-state "Try Keyword Search" fallback link
 */

import { test, expect } from '@playwright/test';
import {
  uid,
  registerViaApi,
  createEntryViaApi,
  loginInBrowser,
} from './helpers';

// ── Test 1: keyword search ─────────────────────────────────────────────────────

test('keyword search filters entries shown in results', async ({ page, request }) => {
  const user = await registerViaApi(request);

  // Seed two entries whose titles are distinct enough to filter independently
  const suffixA = uid();
  const suffixB = uid();

  await createEntryViaApi(request, user.token, {
    title:    `Firenze Sunset ${suffixA}`,
    location: 'Florence, Italy',
    body:     'Renaissance art everywhere.',
  });
  await createEntryViaApi(request, user.token, {
    title:    `Bali Rice Terraces ${suffixB}`,
    location: 'Ubud, Bali',
    body:     'Emerald green steps down the hillside.',
  });

  await loginInBrowser(page, user);

  // Navigate to the search page with a query that matches only the first entry.
  // The server uses MongoDB $text search on title/location/body fields.
  await page.goto(`/search?q=Firenze`);

  // Wait for the result count to settle
  await expect(page.locator('text=/result/')).toBeVisible();

  // Only the Florence entry should be visible; the Bali entry should not
  await expect(page.locator(`text=Firenze Sunset ${suffixA}`)).toBeVisible();
  await expect(page.locator(`text=Bali Rice Terraces ${suffixB}`)).not.toBeVisible();
});

// ── Tests 2–4: AI search mode (not yet implemented) ───────────────────────────

test.fixme(
  'clicking AI sparkle toggle changes search bar styling and placeholder',
  async ({ page, request }) => {
    /**
     * Requires: an "✦" sparkle toggle button added to SearchResults.jsx.
     * When active the input placeholder should change (e.g. to
     * "Ask anything about your trips…") and the ring colour should update.
     */
    const user = await registerViaApi(request);
    await loginInBrowser(page, user);
    await page.goto('/search');

    const toggle = page.locator('[data-testid="ai-search-toggle"]');
    await expect(toggle).toBeVisible();

    // Default (keyword) mode
    await expect(
      page.locator('input[placeholder*="Search places"]'),
    ).toBeVisible();

    await toggle.click();

    // AI mode: placeholder and ring class change
    await expect(
      page.locator('input[placeholder*="Ask anything"]'),
    ).toBeVisible();
    await expect(page.locator('input[class*="ring-forest"]')).toBeVisible();
  },
);

test.fixme(
  'AI search returns results with relevance badges',
  async ({ page, request }) => {
    /**
     * Requires:
     *   • AI search toggle (see above)
     *   • POST /api/ai/nl-search wired up in SearchResults.jsx
     *   • EntryCard or a result wrapper that renders a relevance badge
     *     (e.g. [data-testid="relevance-badge"])
     */
    const user = await registerViaApi(request);
    await createEntryViaApi(request, user.token, {
      title: 'Happy days in Lisbon',
      body:  'Sun, custard tarts, and good vibes.',
    });

    await loginInBrowser(page, user);
    await page.goto('/search');

    // Switch to AI mode and mock the nl-search endpoint
    await page.route('**/api/ai/nl-search**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id:      'mock-id',
            title:    'Happy days in Lisbon',
            location: 'Lisbon',
            date:     new Date().toISOString(),
            body:     'Sun, custard tarts, and good vibes.',
            author:   { name: 'Tester', profilePic: '' },
          },
        ]),
      }),
    );

    await page.click('[data-testid="ai-search-toggle"]');
    await page.fill('input', 'happy trips');
    await page.click('button:has-text("Search")');

    // Results appear and each card has a relevance badge
    await expect(page.locator('[data-testid="relevance-badge"]').first()).toBeVisible();
  },
);

test.fixme(
  'empty AI search state shows "Try Keyword Search" link',
  async ({ page, request }) => {
    /**
     * Requires: AI mode and a dedicated empty-state component that renders
     * a "Try Keyword Search" link when nl-search returns an empty array.
     */
    const user = await registerViaApi(request);
    await loginInBrowser(page, user);
    await page.goto('/search');

    await page.route('**/api/ai/nl-search**', (route) =>
      route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify([]),
      }),
    );

    await page.click('[data-testid="ai-search-toggle"]');
    await page.fill('input', 'something obscure with no results');
    await page.click('button:has-text("Search")');

    // The empty state should offer a fallback to keyword mode
    await expect(page.locator('text=Try Keyword Search')).toBeVisible();
  },
);
