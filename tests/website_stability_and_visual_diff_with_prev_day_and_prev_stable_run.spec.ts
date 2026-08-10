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

    // 3. Force lazy images to eager load
    await page.evaluate(() => {
      document.querySelectorAll('img').forEach((img) => {
        img.setAttribute('loading', 'eager');
        if (img.getAttribute('data-src')) {
          img.src = img.getAttribute('data-src')!;
        }
      });
    });

    // 4. Scroll through page to trigger standard section lazy observers
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 400;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 50);
      });
    });

    // 5. Target video elements on-demand when scrolled into view (saves bandwidth & fixes white screens)
    const videoLocators = page.locator('video');
    const videoCount = await videoLocators.count();

    for (let i = 0; i < videoCount; i++) {
      const video = videoLocators.nth(i);

      // Scroll video into view so lazy loading triggers naturally
      await video.scrollIntoViewIfNeeded();

      await page.evaluate(async (v) => {
        // 1. Resolve data-src on child <source> elements if present
        v.querySelectorAll('source').forEach((source) => {
          const sourceDataSrc = source.getAttribute('data-src');
          if (sourceDataSrc && !source.src) {
            source.src = sourceDataSrc;
          }
        });

        // 2. Resolve custom lazy-loading attributes on the <video> element
        const dataSrc = v.getAttribute('data-src');
        if (dataSrc && !v.src) {
          v.src = dataSrc;
        }

        // Skip video tags without any source attached
        if (!v.src && !v.currentSrc && !v.querySelector('source[src]')) return;

        // Strip autoplay to prevent videos from continuing during snapshot
        v.removeAttribute('autoplay');

        // Force fetch media if loading hasn't initiated yet
        if (v.readyState === 0) {
          v.load();
        }

        // Wait until first frame data is loaded
        if (v.readyState < 2) { // HAVE_CURRENT_DATA or higher
          await new Promise((resolve) => {
            const onDataReady = () => {
              v.removeEventListener('loadeddata', onDataReady);
              v.removeEventListener('error', onDataReady);
              resolve(true);
            };
            v.addEventListener('loadeddata', onDataReady);
            v.addEventListener('error', onDataReady);
            setTimeout(resolve, 3000); // Safety fallback timeout
          });
        }

        v.pause();

        // Wait for frame seek completion to prevent white/blank frames
        if (v.currentTime !== 0) {
          await new Promise((resolve) => {
            v.addEventListener('seeked', resolve, { once: true });
            v.currentTime = 0;
            setTimeout(resolve, 1000);
          });
        }
      }, video);
    }

    // Scroll back to top after triggering visual elements
    await page.evaluate(() => window.scrollTo(0, 0));

    // 6. Safe slider update (prevents JS errors)
    await page.evaluate(() => {
      const swipers = document.querySelectorAll('.swiper-container, .swiper');
      swipers.forEach((s: any) => {
        if (s && s.swiper && typeof s.swiper.update === 'function') {
          s.swiper.update();
        }
      });
    });

    // 7. Inject CSS overrides to reveal all animated elements permanently
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
      `,
    });

    // Wait for remaining image network requests and decoding to resolve
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

    await page.waitForTimeout(1000);

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
