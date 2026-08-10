import { defineConfig } from '@playwright/test';
import * as path from 'path';

export default defineConfig({
  testDir: './tests',
  snapshotDir: path.join(__dirname, 'snapshots'),
  snapshotPathTemplate: '{snapshotDir}/{arg}{ext}',
  timeout: 60000, // 60s test timeout
  expect: {
    timeout: 10000,
  },
  use: {
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 800 }, // Fixed desktop viewport
    deviceScaleFactor: 1,
  },
});
