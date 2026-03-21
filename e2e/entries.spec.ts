import { test, expect } from '@playwright/test';
import { uid, registerViaApi, createEntryViaApi, loginInBrowser } from './helpers';

// ── Create entry (3-step form) ─────────────────────────────────────────────────

test.describe('Create entry', () => {
  test('authenticated user creates an entry through all 3 steps and sees it on the home feed', async ({
    page,
    request,
  }) => {
    const user  = await registerViaApi(request);
    const title = `Lisbon at Dawn ${uid()}`;

    await loginInBrowser(page, user);
    await page.click('a:has-text("+ New Entry")');
    await page.waitForURL('/entry/new');

    // ── Step 1: Basic Info ──────────────────────────────────────────────────
    await expect(page.locator('h2')).toHaveText('Basic Info');

    await page.fill('[placeholder="Golden Hour in Santorini..."]', title);
    await page.fill('[placeholder="Oia, Santorini, Greece"]',      'Lisbon, Portugal');
    await page.fill('input[type="date"]',                          '2024-06-01');

    // Next button is enabled only after all three fields are filled
    const nextBtn = page.locator('button:has-text("Next:")');
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    // ── Step 2: Your Story ──────────────────────────────────────────────────
    await expect(page.locator('h2')).toHaveText('Your Story');

    await page.fill('textarea', 'The city woke slowly, golden light over terracotta rooftops.');
    await page.click('button:has-text("Next:")');

    // ── Step 3: Add Photos (skip upload, save directly) ────────────────────
    await expect(page.locator('h2')).toHaveText('Add Photos');

    await page.click('button:has-text("Save Entry")');

    // After save the app redirects to the home feed
    await page.waitForURL('/');
    await expect(page.locator(`text=${title}`)).toBeVisible();
  });
});

// ── Entry detail navigation ────────────────────────────────────────────────────

test.describe('Entry detail', () => {
  test('user clicks an entry card to view the Entry Detail page', async ({
    page,
    request,
  }) => {
    const user  = await registerViaApi(request);
    const entry = await createEntryViaApi(request, user.token, { title: 'Porto Evenings' });

    await loginInBrowser(page, user);
    await page.goto('/');

    // The EntryCard is an <a> that links to /entry/:id
    await page.click(`a[href="/entry/${entry._id}"]`);

    await page.waitForURL(`/entry/${entry._id}`);
    await expect(page.locator('h1')).toContainText('Porto Evenings');
  });
});

// ── Delete entry ───────────────────────────────────────────────────────────────

test.describe('Delete entry', () => {
  test('author can delete their entry and it disappears from the home feed', async ({
    page,
    request,
  }) => {
    const user  = await registerViaApi(request);
    const entry = await createEntryViaApi(request, user.token, { title: 'Temporary Memory' });

    await loginInBrowser(page, user);
    await page.goto(`/entry/${entry._id}`);

    // Accept the browser confirm dialog
    page.once('dialog', (dialog) => dialog.accept());

    await page.click('button:has-text("Delete Entry")');

    // After deletion the app navigates back to the home feed
    await page.waitForURL('/');
    await expect(page.locator('text=Temporary Memory')).not.toBeVisible();
  });

  test('non-author cannot access another user\'s entry; Delete button is absent', async ({
    page,
    request,
  }) => {
    // User A creates an entry
    const userA  = await registerViaApi(request);
    const entryA = await createEntryViaApi(request, userA.token, { title: 'Private Memory' });

    // User B logs in and navigates directly to User A's entry URL
    const userB = await registerViaApi(request);
    await loginInBrowser(page, userB);

    await page.goto(`/entry/${entryA._id}`);

    // EntryDetail fetches GET /api/entries (returns only User B's entries),
    // can't find entryA._id, so it redirects back to /.
    await page.waitForURL('/');

    // The Delete Entry button is not present anywhere on the home feed
    await expect(page.locator('[data-testid="delete-entry-btn"]')).not.toBeAttached();
  });
});
