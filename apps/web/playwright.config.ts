import { defineConfig } from '@playwright/test'

export default defineConfig({
  webServer: {
    command: 'pnpm dev',
    port: 3001,
    reuseExistingServer: true,
    timeout: 120_000
  },
  testDir: './tests'
})

