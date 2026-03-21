import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // MongoMemoryServer can take up to 30 s to download binaries on first run
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: 'forks',
  },
});
