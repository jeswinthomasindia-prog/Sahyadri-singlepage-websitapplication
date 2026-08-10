import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Sahyadri Consultants - Health (whether website is up or not) & Visual Checks', () => {
  test('Homepage - Uptime, Previous Run & Stable Baseline Visual Check', async ({ page }) => {
    // 1. Set standard desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 2. HTTP Uptime Check & Full Network Idle Load
    const response = await page.goto('https://sahyadrico.com/', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    expect(response?.status()).toBe(200);

    // Ensure web fonts are completely loaded
    await page.evaluate(() => document.fonts.ready);

    // 3. Pause all hero videos on Frame 0 (renders the video cover without frame shifts)
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

    // 5. Gradual Auto-Scroll to trigger scroll observers & dynamic components
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
        }, 120);
      });
    });

    // 6. Force slider recalculation & selective reveal styling
    await page.evaluate(() => {
      // Trigger resize event so Swiper/Slick recalculates dimensions
      window.dispatchEvent(new Event('resize'));

      // If Swiper instance exists, force update
      const swipers = document.querySelectorAll('.swiper-container, .swiper');
      swipers.forEach((s: any) => {
        if (s.swiper) s.swiper.update();
      });
    });

    await page.addStyleTag({
      content: `
        /* Unfreeze scroll reveals (AOS/GSAP/WOW) WITHOUT touching slider transforms */
        [data-aos], .aos-init, .wow {
          animation: none !important;
          transition: none !important;
          opacity: 1 !important;
          visibility: visible !important;
          transform: none !important;
        }

        /* Prevent 100vh hero sections from expanding infinitely in fullPage screenshot */
        .hero, header {
          max-height: 1080px !important;
        }

        /* Allow natural document flow */
        html, body {
          overflow: visible !important;
          height: auto !important;
        }
      `,
    });

    // Wait for all image decoding to complete
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

    // File Directories & Paths Setup
    const snapshotsDir = path.join(process.cwd(), 'snapshots');
    const stableBaselinePath = path.join(snapshotsDir, 'stable-baseline.png');
    const prevRunPath = path.join(snapshotsDir, 'prev-run.png');
    const todayRunPath = path.join(snapshotsDir, 'today-run.png');

    if (!fs.existsSync(snapshotsDir)) {
      fs.mkdirSync(snapshotsDir, { recursive: true });
    }

    // Capture full page screenshot
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

    // 7. Visual Checks
    await expect(page).toHaveScreenshot('stable-baseline.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.03, // 3% pixel tolerance
    });

    await expect(page).toHaveScreenshot('prev-run.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.03,
    });
  });
});
