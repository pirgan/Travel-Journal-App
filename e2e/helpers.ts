/**
 * Shared helpers for Playwright E2E tests.
 *
 * registerViaApi / createEntryViaApi — fast REST shortcuts so every test
 * doesn't have to click through registration or entry-creation forms just
 * to set up preconditions.
 *
 * loginInBrowser — injects an existing token directly into localStorage so
 * the React AuthProvider sees the user as authenticated without a UI login.
 */

import type { APIRequestContext, Page } from '@playwright/test';

const API_BASE = 'http://localhost:5000/api';

// ── unique-ID helper ──────────────────────────────────────────────────────────

/** Returns a short unique suffix so parallel runs don't share DB documents. */
export const uid = () =>
  `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

// ── types ─────────────────────────────────────────────────────────────────────

export interface TestUser {
  name:     string;
  email:    string;
  password: string;
  token:    string;
  _id:      string;
}

export interface TestEntry {
  _id:      string;
  title:    string;
  location: string;
  date:     string;
  body:     string;
}

// ── API shortcuts ─────────────────────────────────────────────────────────────

/**
 * Registers a fresh user via the REST API.
 * Accepts optional overrides for name / email / password.
 */
export async function registerViaApi(
  request:   APIRequestContext,
  overrides: Partial<Pick<TestUser, 'name' | 'email' | 'password'>> = {},
): Promise<TestUser> {
  const id      = uid();
  const payload = {
    name:     `Tester ${id}`,
    email:    `tester_${id}@example.com`,
    password: 'Password123!',
    ...overrides,
  };

  const res  = await request.post(`${API_BASE}/auth/register`, { data: payload });
  const body = await res.json();

  return {
    name:     payload.name,
    email:    payload.email,
    password: payload.password,
    token:    body.token,
    _id:      body._id,
  };
}

/**
 * Creates a journal entry via the REST API (multipart — no images).
 * Requires a valid JWT token from registerViaApi.
 */
export async function createEntryViaApi(
  request:   APIRequestContext,
  token:     string,
  overrides: Partial<Omit<TestEntry, '_id'>> = {},
): Promise<TestEntry> {
  const id      = uid();
  const payload = {
    title:    `Trip ${id}`,
    location: 'Lisbon, Portugal',
    date:     '2024-06-01',
    body:     'Golden light spilled over the terracotta rooftops.',
    ...overrides,
  };

  const res  = await request.post(`${API_BASE}/entries`, {
    headers:    { Authorization: `Bearer ${token}` },
    multipart:  payload,
  });

  const body = await res.json();
  return { _id: body._id, ...payload };
}

// ── browser auth ──────────────────────────────────────────────────────────────

/**
 * Injects a user's token into the browser's localStorage, then navigates to
 * the home page.  The React AuthProvider reads localStorage on mount, so the
 * app treats the session as authenticated without going through the login UI.
 */
export async function loginInBrowser(page: Page, user: TestUser): Promise<void> {
  // Navigate to /login first — it never redirects, so we can safely mutate
  // localStorage before the React app tries to protect any routes.
  await page.goto('/login');

  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  }, { token: user.token, userData: user });

  // A fresh navigation lets the AuthProvider initialise with the stored user.
  await page.goto('/');
  await page.waitForURL('/');
}

// ── SSE mock bodies ───────────────────────────────────────────────────────────

/** Pre-built SSE body for enhance-entry tests. */
export const ENHANCE_SSE =
  'data: {"chunk":"The golden light"}\n\n' +
  'data: {"chunk":" painted the cobblestones amber."}\n\n' +
  'data: [DONE]\n\n';

/** Pre-built SSE body for compile-trip tests. */
export const COMPILE_SSE =
  'data: {"chunk":"It began with a train ride"}\n\n' +
  'data: {"chunk":" through the vineyards."}\n\n' +
  'data: [DONE]\n\n';

/** Standard SSE response headers. */
export const SSE_HEADERS: Record<string, string> = {
  'Content-Type':  'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection':    'keep-alive',
};
