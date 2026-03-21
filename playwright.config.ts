import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:       './e2e',
  timeout:       40_000,
  expect:        { timeout: 10_000 },
  fullyParallel: false, // avoid DB race conditions between tests
  retries:       process.env.CI ? 1 : 0,
  reporter:      'list',

  use: {
    baseURL:           'http://localhost:5173',
    trace:             'on-first-retry',
    screenshot:        'only-on-failure',
    actionTimeout:     10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use:  { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command:              'npm run dev',
      cwd:                  './server',
      port:                 5000,
      reuseExistingServer:  !process.env.CI,
      timeout:              30_000,
    },
    {
      command:              'npm run dev',
      cwd:                  './client',
      port:                 5173,
      reuseExistingServer:  !process.env.CI,
      timeout:              30_000,
    },
  ],
});
