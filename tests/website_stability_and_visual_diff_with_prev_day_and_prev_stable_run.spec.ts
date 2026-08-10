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

    // 3. Force lazy images to eager load without breaking sources
    await page.evaluate(() => {
      document.querySelectorAll('img').forEach((img) => {
        img.setAttribute('loading', 'eager');
        const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
        if (dataSrc) {
          img.src = dataSrc;
        }
      });
    });

    // 4. Smooth natural scroll down to trigger observers
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
            resolve();
          }
        }, 80);
      });
    });

    // 5. Target video elements on-demand & cleanly render frame 0
    const videoLocators = page.locator('video');
    const videoCount = await videoLocators.count();

    for (let i = 0; i < videoCount; i++) {
      const video = videoLocators.nth(i);

      // Scroll video into view so lazy loading triggers
      await video.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);

      await video.evaluate(async (v: HTMLVideoElement) => {
        // Resolve lazy attributes on child source tags
        v.querySelectorAll('source').forEach((source) => {
          const sSrc = source.getAttribute('data-src') || source.getAttribute('data-lazy-src');
          if (sSrc && !source.src) source.src = sSrc;
        });

        const vSrc = v.getAttribute('data-src') || v.getAttribute('data-lazy-src');
        if (vSrc && !v.src) v.src = vSrc;

        if (!v.src && !v.currentSrc && !v.querySelector('source[src]')) return;

        v.muted = true;
        v.playsInline = true;

        if (v.readyState < 2) {
          v.load();
          await new Promise((resolve) => {
            const onDataReady = () => {
              v.removeEventListener('loadeddata', onDataReady);
              v.removeEventListener('canplay', onDataReady);
              v.removeEventListener('error', onDataReady);
              resolve(true);
            };
            v.addEventListener('loadeddata', onDataReady);
            v.addEventListener('canplay', onDataReady);
            v.addEventListener('error', onDataReady);
            setTimeout(resolve, 3000);
          });
        }

        // Pause cleanly at frame 0
        v.pause();
        v.currentTime = 0;
      });
    }

    // 6. Neutralize AOS scroll-animation attributes safely WITHOUT breaking CSS layout transforms
    await page.evaluate(() => {
      document.querySelectorAll('[data-aos], .aos-init, .wow').forEach((el) => {
        el.removeAttribute('data-aos');
        el.classList.remove('aos-init', 'aos-animate', 'wow');
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.visibility = 'visible';
      });
    });

    // Reset scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // 7. Refresh sliders and trigger resize re-calculations
    await page.evaluate(() => {
      const swipers = document.querySelectorAll('.swiper-container, .swiper');
      swipers.forEach((s: any) => {
        if (s && s.swiper && typeof s.swiper.update === 'function') {
          s.swiper.update();
        }
      });
      window.dispatchEvent(new Event('resize'));
    });

    // Ensure image loads and decodes finish
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

    await page.waitForTimeout(1500);

    // Snapshot Management & File Paths Setup
    const snapshotsDir = path.join(process.cwd(), 'snapshots');
    const stableBaselinePath = path.join(snapshotsDir, 'stable-baseline.png');
    const prevRunPath = path.join(snapshotsDir, 'prev-run.png');
    const todayRunPath = path.join(snapshotsDir, 'today-run.png');

    if (!fs.existsSync(snapshotsDir)) {
      fs.mkdirSync(snapshotsDir, { recursive: true });
    }

    // Capture full-page screenshot
    const currentBuffer = await page.screenshot({ fullPage: true });

    if (!fs.existsSync(stableBaselinePath)) {
      console.log('Initial run: Initializing Stable Baseline snapshot.');
      fs.writeFileSync(stableBaselinePath, currentBuffer);
    }
    if (!fs.existsSync(prevRunPath)) {
      console.log('Initial run: Initializing Previous Run snapshot.');
      fs.writeFileSync(prevRunPath, currentBuffer);
    }

    fs.writeFileSync(todayRunPath, currentBuffer);

    // 8. Visual Checks
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
