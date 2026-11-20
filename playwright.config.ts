import { defineConfig, devices } from '@playwright/test';

const baseUrl = 'http://127.0.0.1:4174';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: baseUrl,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/screenshots.spec.ts',
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: '**/screenshots.spec.ts',
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: '**/screenshots.spec.ts',
    },
    {
      name: 'screenshots',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/screenshots.spec.ts',
    },
  ],
  webServer: {
    command:
      'pnpm run db:migrate:local && pnpm run db:seed:local && pnpm run build && pnpm exec astro preview --ignore-lock --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
