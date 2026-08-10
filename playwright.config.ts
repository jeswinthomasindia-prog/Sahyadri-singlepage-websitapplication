import { defineConfig } from '@playwright/test';
import * as path from 'path';

export default defineConfig({
  testDir: './tests',
  snapshotDir: path.join(__dirname, 'snapshots'),
  snapshotPathTemplate: '{snapshotDir}/{arg}{ext}',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 800 },
    // Custom Desktop User-Agent to prevent 403 Forbidden bot blocks
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },
});
