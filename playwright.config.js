import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'mkdir -p server/data && npm run dev --prefix server',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      env: {
        LMS_TEST_DB: 'data/lms-e2e.sqlite',
      },
    },
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
