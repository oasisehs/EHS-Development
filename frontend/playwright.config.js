// @ts-check
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['**/*.spec.js'],
  timeout: 30_000,
  expect: {
    timeout: 8_000
  },
  use: {
    baseURL: 'http://localhost:5000',
    headless: true,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
  ]
});
