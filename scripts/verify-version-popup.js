const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

let localServer = null;
const port = 8089;
const DIST_DIR = path.resolve(__dirname, '../dist');

const MIME_TYPES = {
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

async function ensureServer() {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
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

    s.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is already active, use existing server
        resolve(null);
      } else {
        throw err;
      }
    });

    s.listen(port, () => {
      localServer = s;
      resolve(s);
    });
  });
}

async function runVisualVerification() {
  console.log('🚀 Starting browser visual verification of Version Checker...');
  await ensureServer();

  const screenshotsDir = path.resolve(__dirname, '../snapshots/version-tests');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('\n--- Test 1: Testing Optional Update Modal (Visual & Buttons) ---');
  await page.goto('http://localhost:8089/index.html?test_update=optional');
  await page.waitForSelector('#sahyadri-version-modal', { state: 'visible' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(screenshotsDir, '1-optional-modal.png') });
  console.log('📸 Captured: 1-optional-modal.png');

  console.log('\n--- Test 2: Testing Mandatory Update Modal (Disabled Dismiss Button) ---');
  await page.goto('http://localhost:8089/index.html?test_update=mandatory');
  await page.waitForSelector('#sahyadri-version-modal', { state: 'visible' });
  await page.waitForTimeout(400);
  const isDismissDisabled = await page.isDisabled('#svc-dismiss-btn');
  console.log('🔒 Dismiss button disabled for mandatory update:', isDismissDisabled);
  await page.screenshot({ path: path.join(screenshotsDir, '2-mandatory-modal.png') });
  console.log('📸 Captured: 2-mandatory-modal.png');

  console.log('\n--- Test 3: Real Outdated User Experience (Avoid for now) ---');
  // Seed route for optional update
  await page.route('**/version.json*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        version: '1.0.2',
        build: 2,
        releaseDate: '2026-10-06',
        title: 'Performance & Cache Release',
        description: 'Seamless automatic edge caching, instant asset updates, and release notifications.',
        isMandatory: false,
      }),
    });
  });

  await page.goto('http://localhost:8089/index.html');
  await page.evaluate(() => {
    localStorage.setItem('sahyadri_installed_version', '1.0.0');
    sessionStorage.clear();
  });
  await page.reload();
  await page.waitForSelector('#sahyadri-version-modal', { state: 'visible' });
  console.log('✅ Modal automatically displayed for outdated user (installed: 1.0.0, available: 1.0.2)');
  await page.screenshot({ path: path.join(screenshotsDir, '3-real-update-modal-prompt.png') });
  console.log('📸 Captured: 3-real-update-modal-prompt.png');

  // Click Avoid for now
  console.log('👉 Clicking "Avoid for now"...');
  await page.click('#svc-dismiss-btn');
  await page.waitForSelector('#sahyadri-version-modal', { state: 'detached' });
  const installedAfterDismiss = await page.evaluate(() => localStorage.getItem('sahyadri_installed_version'));
  const dismissedInSession = await page.evaluate(() => sessionStorage.getItem('sahyadri_dismissed_version'));
  console.log('📌 localStorage version after dismiss (should remain 1.0.0):', installedAfterDismiss);
  console.log('📌 sessionStorage dismissed version (should be 1.0.2):', dismissedInSession);
  await page.screenshot({ path: path.join(screenshotsDir, '4-after-dismiss.png') });
  console.log('📸 Captured: 4-after-dismiss.png');

  console.log('\n--- Test 4: Real Outdated User Experience (Update Now) ---');
  // Clear session dismiss to test Update Now flow
  await page.evaluate(() => {
    sessionStorage.clear();
  });
  await page.reload();
  await page.waitForSelector('#sahyadri-version-modal', { state: 'visible' });
  console.log('👉 Clicking "Update Now"...');

  const navPromise = page.waitForNavigation();
  await page.click('#svc-update-btn');
  await navPromise;

  const installedAfterUpdate = await page.evaluate(() => localStorage.getItem('sahyadri_installed_version'));
  console.log('🎉 localStorage version after update (should be 1.0.2):', installedAfterUpdate);

  await page.waitForTimeout(1000);
  const modalCount = await page.locator('#sahyadri-version-modal').count();
  console.log('🛡️ Modal present on updated page (should be 0):', modalCount);
  await page.screenshot({ path: path.join(screenshotsDir, '5-updated-page-clean.png') });
  console.log('📸 Captured: 5-updated-page-clean.png');

  await browser.close();
  if (localServer) {
    localServer.close();
  }
  console.log('\n✨ All visual verification tests completed successfully!');
}

runVisualVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  if (localServer) localServer.close();
  process.exit(1);
});
