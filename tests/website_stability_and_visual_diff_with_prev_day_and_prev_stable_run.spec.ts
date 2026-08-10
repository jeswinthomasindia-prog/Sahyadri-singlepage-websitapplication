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

    // 3. Force load lazy videos (e.g., preload="none") & freeze on Frame 0
    await page.evaluate(async () => {
      const videos = Array.from(document.querySelectorAll('video'));

      await Promise.all(
        videos.map((v) => {
          // Force lazy-loaded video elements to start fetching
          if (v.getAttribute('preload') === 'none') {
            v.setAttribute('preload', 'auto');
            v.load();
          }

          // Force load poster image as a fallback
          const poster = v.getAttribute('poster');
          if (poster) {
            const img = new Image();
            img.src = poster;
          }

          // Pause video at frame 0 once metadata is ready
          return new Promise<void>((resolve) => {
            if (v.readyState >= 1) { // HAVE_METADATA or higher
              v.pause();
              v.currentTime = 0;
              resolve();
            } else {
              v.addEventListener('loadedmetadata', () => {
                v.pause();
                v.currentTime = 0;
                resolve();
              }, { once: true });

              // Fallback timeout in case video network request stalls
              setTimeout(resolve, 2500);
            }
          });
        })
      );
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
