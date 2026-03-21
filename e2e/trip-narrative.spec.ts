/**
 * Trip Narrative — E2E tests.
 *
 * The TripNarrative page lives at /narrative.  Users select journal entries
 * by clicking their cards, then click "Compile N entries" to stream a
 * cohesive story via GET /api/ai/compile-trip?entryIds=…&token=…  (SSE).
 *
 * All AI SSE calls are intercepted with page.route() so the tests run without
 * an Anthropic API key.
 *
 * Note on CompileTripModal / trip name / /trip/:name URL:
 *   The current implementation renders selection inline on /narrative and does
 *   not include a trip-name field or a dynamic URL segment.  The four test
 *   scenarios below are adapted to the actual UI while preserving the intent
 *   of the original spec.  When a CompileTripModal and named-trip routing are
 *   added, update the navigation assertions and add a `tripName` field check.
 */

import { test, expect } from '@playwright/test';
import {
  registerViaApi,
  createEntryViaApi,
  loginInBrowser,
  COMPILE_SSE,
  SSE_HEADERS,
} from './helpers';

// ── shared setup ───────────────────────────────────────────────────────────────

/** Registers a user and seeds two entries, then logs in. */
async function setupTwoEntries({
  page,
  request,
}: Parameters<Parameters<typeof test>[1]>[0]) {
  const user   = await registerViaApi(request);
  const entry1 = await createEntryViaApi(request, user.token, {
    title: 'Rome at Dusk',
    body:  'The Colosseum glowed orange.',
  });
  const entry2 = await createEntryViaApi(request, user.token, {
    title: 'Amalfi Coast',
    body:  'Cliffs plunged into turquoise water.',
  });

  await loginInBrowser(page, user);
  await page.goto('/narrative');
  await page.waitForSelector('h1:has-text("Trip Narrative")');

  return { user, entry1, entry2 };
}

// ── Test 1: select entries and compile ────────────────────────────────────────

test('user selects 2 entries on the narrative page and the story streams in', async ({
  page,
  request,
}) => {
  const { entry1, entry2 } = await setupTwoEntries({ page, request });

  await page.route('**/api/ai/compile-trip**', (route) =>
    route.fulfill({ status: 200, headers: SSE_HEADERS, body: COMPILE_SSE }),
  );

  // Click the selectable wrapper divs (not the inner <a> link)
  await page.click(`[data-testid="entry-select-${entry1._id}"]`);
  await page.click(`[data-testid="entry-select-${entry2._id}"]`);

  // The compile button now reflects 2 selected entries
  await expect(page.locator('button:has-text("Compile 2 entries")')).toBeVisible();

  await page.click('button:has-text("Compile 2 entries")');

  // The mocked SSE chunks should render in the narrative panel
  await expect(page.locator('text=It began with a train ride')).toBeVisible();
  await expect(page.locator('text=through the vineyards')).toBeVisible();
});

// ── Test 2: Generate Story button disabled until entries are selected ──────────

test('Compile button is disabled with 0 entries selected and enables after selection', async ({
  page,
  request,
}) => {
  const { entry1 } = await setupTwoEntries({ page, request });

  // With nothing selected the button should be disabled
  const compileBtn = page.locator('button:has-text("Compile")');
  await expect(compileBtn).toBeDisabled();

  // Select one entry — the button should become enabled
  await page.click(`[data-testid="entry-select-${entry1._id}"]`);
  await expect(page.locator('button:has-text("Compile 1 entries")')).toBeEnabled();

  // Select a second — still enabled and count updated
  const cards = await page.locator('[data-testid^="entry-select-"]').all();
  if (cards.length > 1) {
    await cards[1].click();
    await expect(page.locator('button:has-text("Compile 2 entries")')).toBeEnabled();
  }
});

// ── Test 3: narrative streams to the page ─────────────────────────────────────

test('narrative text streams progressively into the Your Story panel', async ({
  page,
  request,
}) => {
  const { entry1, entry2 } = await setupTwoEntries({ page, request });

  await page.route('**/api/ai/compile-trip**', (route) =>
    route.fulfill({ status: 200, headers: SSE_HEADERS, body: COMPILE_SSE }),
  );

  await page.click(`[data-testid="entry-select-${entry1._id}"]`);
  await page.click(`[data-testid="entry-select-${entry2._id}"]`);
  await page.click('button:has-text("Compile 2 entries")');

  // The "Your Story" heading appears once the narrative state is non-empty
  await expect(page.locator('h2:has-text("Your Story")')).toBeVisible();

  // Full concatenated text from both mocked chunks
  await expect(page.locator('p.whitespace-pre-wrap')).toContainText(
    'It began with a train ride through the vineyards.',
  );
});

// ── Test 4: Download button appears after stream and triggers a file download ──

test('Download .txt button appears after stream completes and triggers a download', async ({
  page,
  request,
}) => {
  const { entry1, entry2 } = await setupTwoEntries({ page, request });

  await page.route('**/api/ai/compile-trip**', (route) =>
    route.fulfill({ status: 200, headers: SSE_HEADERS, body: COMPILE_SSE }),
  );

  await page.click(`[data-testid="entry-select-${entry1._id}"]`);
  await page.click(`[data-testid="entry-select-${entry2._id}"]`);
  await page.click('button:has-text("Compile 2 entries")');

  // The Download button is conditionally rendered only after `done` is true
  // (i.e., after the [DONE] SSE event fires and `done` is set to true).
  const downloadBtn = page.locator('button:has-text("Download ↓")');
  await expect(downloadBtn).toBeVisible();

  // Playwright's download event confirms that a file download was initiated
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    downloadBtn.click(),
  ]);

  expect(download.suggestedFilename()).toBe('trip-narrative.txt');
});
