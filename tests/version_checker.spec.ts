import { test, expect } from '@playwright/test';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

let server: http.Server;
let port = 8089;
const DIST_DIR = path.resolve(__dirname, '../dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    try {
      const parsedUrl = new URL(req.url || '/', `http://localhost:${port}`);
      let reqPath = parsedUrl.pathname;
      if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

      const filePath = path.join(DIST_DIR, reqPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(port, () => {
      console.log(`Test server running at http://localhost:${port}`);
      resolve();
    });
  });
});

test.afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test.describe('Sahyadri Version Checker & Release Update Flow', () => {
  const standardReleaseFixture = {
    version: '1.0.2',
    build: 2,
    releaseDate: '2026-10-06',
    title: 'Performance & Cache Release',
    description: 'Seamless automatic edge caching, instant asset updates, and release notifications.',
    isMandatory: false,
  };

  test('1. First-time visitor automatically records current version without showing popup', async ({ page }) => {
    await page.route('**/version.json*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(standardReleaseFixture),
      });
    });

    // Navigate with clean storage
    await page.goto(`http://localhost:${port}/index.html`);

    // Wait for version check to complete
    await page.waitForTimeout(500);

    // Verify modal is NOT shown
    const modal = page.locator('#sahyadri-version-modal');
    await expect(modal).toHaveCount(0);

    // Verify installed version was recorded in localStorage
    const installed = await page.evaluate(() => localStorage.getItem('sahyadri_installed_version'));
    expect(installed).toBe('1.0.2');
  });

  test('2. Existing user with outdated version gets popup and clicks "Avoid for now"', async ({ page }) => {
    await page.route('**/version.json*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(standardReleaseFixture),
      });
    });

    // Seed outdated version 1.0.0 only on initial visit
    await page.addInitScript((initialVersion) => {
      if (!sessionStorage.getItem('__test_seeded_2')) {
        sessionStorage.setItem('__test_seeded_2', 'true');
        localStorage.setItem('sahyadri_installed_version', initialVersion);
      }
    }, '1.0.0');

    await page.goto(`http://localhost:${port}/index.html`);

    // Verify modal appears
    const modal = page.locator('#sahyadri-version-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify version badge and title
    const versionBadge = modal.locator('.svc-badge');
    await expect(versionBadge.first()).toHaveText('v1.0.2');
    await expect(modal.locator('#svc-modal-title')).toHaveText('Performance & Cache Release');

    // Verify dismiss button is enabled and click it
    const dismissBtn = modal.locator('#svc-dismiss-btn');
    await expect(dismissBtn).toBeEnabled();
    await dismissBtn.click();

    // Verify modal disappears
    await expect(modal).toHaveCount(0, { timeout: 3000 });

    // Verify localStorage was NOT updated (still 1.0.0)
    const installed = await page.evaluate(() => localStorage.getItem('sahyadri_installed_version'));
    expect(installed).toBe('1.0.0');

    // Verify sessionStorage recorded dismissed version
    const dismissed = await page.evaluate(() => sessionStorage.getItem('sahyadri_dismissed_version'));
    expect(dismissed).toBe('1.0.2');

    // Reload page in same session - modal should NOT appear again
    await page.reload();
    await page.waitForTimeout(500);
    await expect(page.locator('#sahyadri-version-modal')).toHaveCount(0);
  });

  test('3. Existing user with outdated version clicks "Update Now" and gets upgraded', async ({ page }) => {
    await page.route('**/version.json*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(standardReleaseFixture),
      });
    });

    // Seed outdated version 1.0.0 only once
    await page.addInitScript((initialVersion) => {
      if (!sessionStorage.getItem('__test_seeded_3')) {
        sessionStorage.setItem('__test_seeded_3', 'true');
        localStorage.setItem('sahyadri_installed_version', initialVersion);
      }
    }, '1.0.0');

    await page.goto(`http://localhost:${port}/index.html`);

    const modal = page.locator('#sahyadri-version-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click Update Now button
    const updateBtn = modal.locator('#svc-update-btn');
    await expect(updateBtn).toBeVisible();

    // Listen for navigation triggered by reload
    const navigationPromise = page.waitForURL(/_v_reload/, { timeout: 10000 });
    await updateBtn.click();
    await navigationPromise;

    // After page reload, check that installed version in localStorage is now 1.0.2
    const installed = await page.evaluate(() => localStorage.getItem('sahyadri_installed_version'));
    expect(installed).toBe('1.0.2');

    // Verify modal is NO LONGER shown because user is on latest version
    await page.waitForTimeout(500);
    await expect(page.locator('#sahyadri-version-modal')).toHaveCount(0);
  });

  test('4. Version bump to 1.0.3 triggers update modal and succeeds', async ({ page }) => {
    // Simulate user having current 1.0.2 installed
    await page.addInitScript((initialVersion) => {
      if (!sessionStorage.getItem('__test_seeded_4')) {
        sessionStorage.setItem('__test_seeded_4', 'true');
        localStorage.setItem('sahyadri_installed_version', initialVersion);
      }
    }, '1.0.2');

    // Mock /version.json response to return 1.0.3
    await page.route('**/version.json*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          version: '1.0.3',
          build: 3,
          releaseDate: '2026-10-07',
          title: '360 Tour & AI Assistant Enhancement',
          description: 'Added interactive virtual tour enhancements and streamlined responsiveness.',
          isMandatory: false,
        }),
      });
    });

    await page.goto(`http://localhost:${port}/index.html`);

    const modal = page.locator('#sahyadri-version-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify updated details
    await expect(modal.locator('.svc-badge').first()).toHaveText('v1.0.3');
    await expect(modal.locator('#svc-modal-title')).toHaveText('360 Tour & AI Assistant Enhancement');

    // Click Update Now
    const navigationPromise = page.waitForURL(/_v_reload/, { timeout: 10000 });
    await modal.locator('#svc-update-btn').click();
    await navigationPromise;

    // Verify new version stored
    const installed = await page.evaluate(() => localStorage.getItem('sahyadri_installed_version'));
    expect(installed).toBe('1.0.3');
  });

  test('5. Mandatory update disables "Avoid for now" and forces user to update', async ({ page }) => {
    await page.addInitScript((initialVersion) => {
      if (!sessionStorage.getItem('__test_seeded_5')) {
        sessionStorage.setItem('__test_seeded_5', 'true');
        localStorage.setItem('sahyadri_installed_version', initialVersion);
      }
    }, '1.0.2');

    // Mock mandatory 2.0.0 release
    await page.route('**/version.json*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          version: '2.0.0',
          build: 4,
          releaseDate: '2026-10-08',
          title: 'Critical Security & Architecture Upgrade',
          description: 'Major platform upgrade. Immediate update is required.',
          isMandatory: true,
        }),
      });
    });

    await page.goto(`http://localhost:${port}/index.html`);

    const modal = page.locator('#sahyadri-version-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify mandatory alert notice is displayed
    await expect(modal.locator('.svc-mandatory-alert')).toBeVisible();

    // Verify dismiss button is disabled
    const dismissBtn = modal.locator('#svc-dismiss-btn');
    await expect(dismissBtn).toBeDisabled();

    // User must click Update Now
    const updateBtn = modal.locator('#svc-update-btn');
    const navigationPromise = page.waitForURL(/_v_reload/, { timeout: 10000 });
    await updateBtn.click();
    await navigationPromise;

    // Verify localStorage updated to 2.0.0
    const installed = await page.evaluate(() => localStorage.getItem('sahyadri_installed_version'));
    expect(installed).toBe('2.0.0');
  });
});
