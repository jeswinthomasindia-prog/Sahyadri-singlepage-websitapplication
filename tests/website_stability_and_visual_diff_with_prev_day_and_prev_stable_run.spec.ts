import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Sahyadri Consultants - Health (whether website is up or not) & Visual Checks', () => {
  test('Homepage - Uptime, Previous Run & Stable Baseline Visual Check', async ({ page }, testInfo) => {
    // 1. Set standard desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Set custom automated test headers
    await page.setExtraHTTPHeaders({
      'X-Automated-Inspection': 'true',
      'X-Sahyadri-Visual-Check': 'true',
    });

    // Pre-populate consent in localStorage and set flag to avoid consent modal during visual stability check
    await page.addInitScript(() => {
      (window as any).__DISABLE_CONSENT_MODAL__ = true;
      try {
        localStorage.setItem(
          'sahyadri_cookie_consent_v2',
          JSON.stringify({
            consent: { necessary: true, analytics: false, marketing: false },
            expiry: Date.now() + 365 * 24 * 60 * 60 * 1000,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (e) {}
    });

    // 2. HTTP Uptime Check & Full Network Idle Load (with automated inspection flag)
    const response = await page.goto('https://sahyadrico.com/?automated_test=true&disable_consent=1', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    expect(response?.status()).toBe(200);

    // Remove any consent modal element from DOM and restore body scroll
    await page.evaluate(() => {
      const modal = document.getElementById('sahyadri-consent-modal');
      if (modal) modal.remove();
      document.body.style.overflow = '';
    });

    // Ensure web fonts are completely loaded
    await page.evaluate(() => document.fonts.ready);

    // 3. Pause hero videos on Frame 0
    await page.evaluate(() => {
      document.querySelectorAll('video').forEach((v) => {
        v.pause();
        v.currentTime = 0;
      });
    });

    // 4. Force lazy images to eager load
    await page.evaluate(() => {
      document.querySelectorAll('img').forEach((img) => {
        img.setAttribute('loading', 'eager');
        if (img.getAttribute('data-src')) {
          img.src = img.getAttribute('data-src')!;
        }
      });
    });

    // 5. Gradual Auto-Scroll down and back up to trigger lazy components
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 200;
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

    // 6. Safe slider update (prevents JS errors)
    await page.evaluate(() => {
      const swipers = document.querySelectorAll('.swiper-container, .swiper');
      swipers.forEach((s: any) => {
        if (s && s.swiper && typeof s.swiper.update === 'function') {
          s.swiper.update();
        }
      });
    });

    // 7. Inject CSS overrides AFTER scrolling to permanently reveal all sections
    await page.addStyleTag({
      content: `
        /* Force reveal all hidden scroll animations (AOS/GSAP/WOW) */
        [data-aos], .aos-init, .wow, section, div {
          animation: none !important;
          transition: none !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* Ensure document containers maintain full natural height */
        html, body, main, #app, #root {
          overflow: visible !important;
          height: auto !important;
          min-height: 100% !important;
        }

        /* Permanently suppress privacy consent modal & backdrop during visual inspection */
        #sahyadri-consent-modal,
        .sc-modal-backdrop,
        .sc-modal-card {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `,
    });

    // Wait for image network requests/decodes to resolve
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve);
          });
        })
      );
    });

    await page.waitForTimeout(3000);

    // Setup Output Directories
    const snapshotsDir = path.join(process.cwd(), 'snapshots');
    const testResultsDir = path.join(process.cwd(), 'test-results');

    if (!fs.existsSync(snapshotsDir)) {
      fs.mkdirSync(snapshotsDir, { recursive: true });
    }
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }

    const stableBaselinePath = path.join(snapshotsDir, 'stable-baseline.png');
    const prevRunPath = path.join(snapshotsDir, 'prev-run.png');
    const todayRunPath = path.join(snapshotsDir, 'today-run.png');

    // Ensure any consent modal is removed and scroll is normal right before capture
    await page.evaluate(() => {
      const modal = document.getElementById('sahyadri-consent-modal');
      if (modal) modal.remove();
      document.body.style.overflow = '';
    });

    // Capture current full-page screenshot
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

    // Save today's capture to snapshots folder
    fs.writeFileSync(todayRunPath, currentBuffer);

    // ALWAYS save a copy to test-results/ so it is uploaded as a build artifact
    fs.writeFileSync(path.join(testResultsDir, 'current-run-actual.png'), currentBuffer);
    
    // Attach current run image directly to test results report
    await testInfo.attach('current-run-actual', {
      body: currentBuffer,
      contentType: 'image/png',
    });

    // 8. Visual Checks (Passes when diff < 50%, Fails when diff >= 50%)
    await expect(page).toHaveScreenshot('stable-baseline.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1, // 50% pixel tolerance
    });

    await expect(page).toHaveScreenshot('prev-run.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    });
  });
});
