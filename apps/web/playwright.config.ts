import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.PW_PORT ?? 3100);

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    /* Chromium is not downloadable on networks that intercept TLS, so drive the
       locally installed Google Chrome instead. */
    channel: 'chrome',
    headless: true,
  },
  webServer: {
    command: `yarn next dev --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: true,
    timeout: 180_000,
    env: { NEXT_PUBLIC_API_URL: `http://127.0.0.1:${PORT}/api/v1` },
  },
});
