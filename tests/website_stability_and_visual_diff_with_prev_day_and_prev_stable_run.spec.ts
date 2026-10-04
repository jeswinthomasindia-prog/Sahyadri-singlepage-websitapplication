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

    // 6. Safe slider update & carousel freeze at slide 0 (prevents slide shifts and height changes)
    await page.evaluate(() => {
      // Clear any running interval timers
      const highestId = window.setInterval(() => {}, 9999);
      for (let i = 0; i <= highestId; i++) {
        window.clearInterval(i);
      }

      // Reset all carousel tracks to first slide (slide 0)
      ['projectTrack', 'testiTrack', 'awardsTrack'].forEach((id) => {
        const track = document.getElementById(id);
        if (track) {
          track.style.transform = 'translateX(0px)';
          track.style.transition = 'none';
        }
      });

      // Reset BeerSlider handle to center
      const beerSlider = document.querySelector('.beer-slider');
      if (beerSlider) {
        const handle = beerSlider.querySelector('.beer-handle') as HTMLElement;
        if (handle) handle.style.left = '50%';
      }

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
      
      // Ensure all carousels remain pinned at slide 0
      ['projectTrack', 'testiTrack', 'awardsTrack'].forEach((id) => {
        const track = document.getElementById(id);
        if (track) {
          track.style.transform = 'translateX(0px)';
          track.style.transition = 'none';
        }
      });
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

    // 8. Visual Checks: Robust comparison supporting dimension tolerance & pixel threshold
    // Allows minor cross-platform height differences (e.g. 1px-50px from font metrics)
    // and checks pixel diff ratio against configurable threshold (default: 15% tolerance)
    await compareVisualStability({
      page,
      baselinePath: stableBaselinePath,
      currentBuffer,
      snapshotName: 'stable-baseline',
      maxAllowedHeightDiff: 50, // Allows up to 50px cross-platform height variance
      maxDiffRatio: 0.15, // 15% pixel difference tolerance
      testInfo,
    });

    await compareVisualStability({
      page,
      baselinePath: prevRunPath,
      currentBuffer,
      snapshotName: 'prev-run',
      maxAllowedHeightDiff: 50,
      maxDiffRatio: 0.15,
      testInfo,
    });
  });
});

/**
 * Robust in-browser canvas visual comparison helper.
 * - Compares two PNG buffers using Chromium's hardware-accelerated canvas API.
 * - Tolerates slight cross-platform dimension variations (subpixel font heights).
 * - Highlights differing pixels in red on a diff canvas and attaches it to the report.
 * - Asserts that pixel difference ratio is within acceptable threshold.
 */
async function compareVisualStability({
  page,
  baselinePath,
  currentBuffer,
  snapshotName,
  maxAllowedHeightDiff = 50,
  maxDiffRatio = 0.15,
  testInfo,
}: {
  page: any;
  baselinePath: string;
  currentBuffer: Buffer;
  snapshotName: string;
  maxAllowedHeightDiff?: number;
  maxDiffRatio?: number;
  testInfo: any;
}) {
  if (!fs.existsSync(baselinePath)) {
    console.log(`[Visual Check: ${snapshotName}] Baseline does not exist. Initializing baseline.`);
    fs.writeFileSync(baselinePath, currentBuffer);
    return;
  }

  const baselineBuffer = fs.readFileSync(baselinePath);
  const baselineBase64 = baselineBuffer.toString('base64');
  const currentBase64 = currentBuffer.toString('base64');

  const result = await page.evaluate(
    async ({
      b1Base64,
      b2Base64,
      maxDiffRatio,
      maxAllowedHeightDiff,
    }: {
      b1Base64: string;
      b2Base64: string;
      maxDiffRatio: number;
      maxAllowedHeightDiff: number;
    }) => {
      function loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load image into canvas for comparison'));
          img.src = src;
        });
      }

      const [imgBaseline, imgCurrent] = await Promise.all([
        loadImage('data:image/png;base64,' + b1Base64),
        loadImage('data:image/png;base64,' + b2Base64),
      ]);

      const widthDiff = Math.abs(imgBaseline.width - imgCurrent.width);
      const heightDiff = Math.abs(imgBaseline.height - imgCurrent.height);

      const commonWidth = Math.min(imgBaseline.width, imgCurrent.width);
      const commonHeight = Math.min(imgBaseline.height, imgCurrent.height);

      const canvas1 = document.createElement('canvas');
      canvas1.width = commonWidth;
      canvas1.height = commonHeight;
      const ctx1 = canvas1.getContext('2d')!;
      ctx1.drawImage(imgBaseline, 0, 0);
      const data1 = ctx1.getImageData(0, 0, commonWidth, commonHeight).data;

      const canvas2 = document.createElement('canvas');
      canvas2.width = commonWidth;
      canvas2.height = commonHeight;
      const ctx2 = canvas2.getContext('2d')!;
      ctx2.drawImage(imgCurrent, 0, 0);
      const data2 = ctx2.getImageData(0, 0, commonWidth, commonHeight).data;

      // Diff canvas for generating visual diff artifact
      const diffCanvas = document.createElement('canvas');
      diffCanvas.width = commonWidth;
      diffCanvas.height = commonHeight;
      const diffCtx = diffCanvas.getContext('2d')!;
      const diffImgData = diffCtx.createImageData(commonWidth, commonHeight);
      const diffData = diffImgData.data;

      let diffPixels = 0;
      const totalPixels = commonWidth * commonHeight;

      // Compare RGBA channels (threshold of 15 allows for minor anti-aliasing / compression noise)
      for (let i = 0; i < data1.length; i += 4) {
        const dr = Math.abs(data1[i] - data2[i]);
        const dg = Math.abs(data1[i + 1] - data2[i + 1]);
        const db = Math.abs(data1[i + 2] - data2[i + 2]);

        if (dr > 15 || dg > 15 || db > 15) {
          diffPixels++;
          // Highlight mismatched pixel in red
          diffData[i] = 255;
          diffData[i + 1] = 0;
          diffData[i + 2] = 0;
          diffData[i + 3] = 255;
        } else {
          // Keep faint context of original pixel
          diffData[i] = data2[i];
          diffData[i + 1] = data2[i + 1];
          diffData[i + 2] = data2[i + 2];
          diffData[i + 3] = 40;
        }
      }

      diffCtx.putImageData(diffImgData, 0, 0);
      const diffBase64 = diffCanvas.toDataURL('image/png').split(',')[1];
      const diffRatio = diffPixels / totalPixels;

      return {
        baselineDims: { width: imgBaseline.width, height: imgBaseline.height },
        currentDims: { width: imgCurrent.width, height: imgCurrent.height },
        heightDiff,
        widthDiff,
        diffPixels,
        totalPixels,
        diffRatio,
        passed: widthDiff === 0 && heightDiff <= maxAllowedHeightDiff && diffRatio <= maxDiffRatio,
        diffBase64: diffPixels > 0 ? diffBase64 : null,
      };
    },
    { b1Base64: baselineBase64, b2Base64: currentBase64, maxDiffRatio, maxAllowedHeightDiff }
  );

  console.log(`\n🔍 [Visual Check: ${snapshotName}]`);
  console.log(`   Baseline: ${result.baselineDims.width}x${result.baselineDims.height} | Current: ${result.currentDims.width}x${result.currentDims.height}`);
  console.log(`   Height Diff: ${result.heightDiff}px (Allowed tolerance: <= ${maxAllowedHeightDiff}px)`);
  console.log(`   Pixel Diff:  ${result.diffPixels.toLocaleString()} / ${result.totalPixels.toLocaleString()} (${(result.diffRatio * 100).toFixed(3)}%, Threshold: <= ${(maxDiffRatio * 100)}%)`);
  console.log(`   Result:      ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);

  if (result.diffBase64) {
    const diffBuffer = Buffer.from(result.diffBase64, 'base64');
    const diffFilePath = path.join(process.cwd(), 'test-results', `${snapshotName}-diff.png`);
    fs.writeFileSync(diffFilePath, diffBuffer);
    await testInfo.attach(`${snapshotName}-diff`, {
      body: diffBuffer,
      contentType: 'image/png',
    });
  }

  expect(
    result.passed,
    `Visual comparison failed for ${snapshotName}: Height difference was ${result.heightDiff}px (allowed <= ${maxAllowedHeightDiff}px) or pixel difference was ${(result.diffRatio * 100).toFixed(2)}% (threshold <= ${(maxDiffRatio * 100)}%).`
  ).toBe(true);
}

