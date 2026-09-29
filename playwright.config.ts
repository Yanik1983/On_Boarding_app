import { defineConfig } from '@playwright/test'

// End-to-end tests run against the built single file (npm run build first), opened from disk.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 240_000,
  expect: { timeout: 20_000 },
  reporter: 'list',
  use: {
    browserName: 'chromium',
    viewport: { width: 1600, height: 900 },
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
})
