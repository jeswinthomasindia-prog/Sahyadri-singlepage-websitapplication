import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Sahyadri Consultants - Health (whether website is up or not) & Visual Checks', () => {

  test('Homepage - Uptime, Previous Run & Stable Baseline Visual Check', async ({ page }) => {
    // 1. HTTP Uptime Check
    const response = await page.goto('https://sahyadrico.com/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // Ensure all web fonts are fully rendered
    await page.evaluate(() => document.fonts.ready);

    // 2. Smooth Auto-Scroll to trigger lazy-loaded assets & project cards
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0); // Scroll back to top
            resolve();
          }
        }, 100);
      });
    });

    await page.waitForTimeout(1000);

    // Freeze CSS animations & hide video frame playback to avoid false diffs
    await page.addStyleTag({
      content: `
        * { animation: none !important; transition: none !important; }
        video { opacity: 0 !important; visibility: hidden !important; }
      `,
    });

    // File Directories & Paths Setup
    const snapshotsDir = path.join(process.cwd(), 'snapshots');
    const stableBaselinePath = path.join(snapshotsDir, 'stable-baseline.png');
    const prevRunPath = path.join(snapshotsDir, 'prev-run.png');
    const todayRunPath = path.join(snapshotsDir, 'today-run.png');

    if (!fs.existsSync(snapshotsDir)) {
      fs.mkdirSync(snapshotsDir, { recursive: true });
    }

    // Capture current live page screenshot
    const currentBuffer = await page.screenshot({ fullPage: true });

    // Initial Run Fallback Logic
    if (!fs.existsSync(stableBaselinePath)) {
      console.log('Initial run: Initializing Stable Baseline snapshot.');
      fs.writeFileSync(stableBaselinePath, currentBuffer);
    }

    if (!fs.existsSync(prevRunPath)) {
      console.log('Initial run: Initializing Previous Run snapshot.');
      fs.writeFileSync(prevRunPath, currentBuffer);
    }

    // Save today's capture to disk
    fs.writeFileSync(todayRunPath, currentBuffer);

    // 3. Visual Check A: Against Stable Baseline
    await expect(page).toHaveScreenshot('stable-baseline.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.03, // 3% pixel tolerance
    });

    // 4. Visual Check B: Against Previous Run Snapshot
    await expect(page).toHaveScreenshot('prev-run.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.03,
    });
  });

});
