import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4174',
    headless: true,
    channel: 'chromium',
    launchOptions: {
      executablePath: '/run/current-system/sw/bin/chromium',
    },
  },
  webServer: {
    command: 'bun run preview',
    port: 4174,
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
