/**
 * Sahyadri Consultants - Stable Baseline Snapshot Generator
 * 
 * Captures a full-page snapshot of the homepage with the exact same rendering
 * configuration as the nightly visual stability test (Playwright):
 * - Desktop viewport (1920x1080)
 * - Custom headers (X-Automated-Inspection, X-Sahyadri-Visual-Check)
 * - Privacy consent modal completely suppressed
 * - Web fonts fully loaded
 * - Hero videos paused at frame 0
 * - Lazy images eager loaded
 * - Smooth scroll down & up to trigger lazy UI / Swiper sliders
 * - AOS / GSAP animation overrides
 * - 3s layout settling delay
 * - Saves directly to `snapshots/stable-baseline.png`
 * 
 * Usage:
 *   node scripts/capture-stable-baseline.js
 *   node scripts/capture-stable-baseline.js http://localhost:8000/?automated_test=true&disable_consent=1
 *   npm run baseline
 */

const fs = require('fs');
const path = require('path');

// Try resolving playwright from current or parent/global node_modules
let playwright;
try {
  playwright = require('playwright');
} catch (e) {
  try {
    playwright = require('@playwright/test');
  } catch (err) {
    console.error('❌ Could not locate Playwright module. Run: npm install playwright or npm install @playwright/test');
    process.exit(1);
  }
}

const { chromium } = playwright;

// Parse target URL from arguments, defaulting to live production URL
const args = process.argv.slice(2);
let targetUrl = 'https://sahyadrico.com/?automated_test=true&disable_consent=1';

if (args.length > 0) {
  if (args[0] === '--local') {
    targetUrl = 'http://localhost:8000/?automated_test=true&disable_consent=1';
  } else if (!args[0].startsWith('--')) {
    targetUrl = args[0];
  }
}

// Ensure automated_test query param is present
try {
  const parsed = new URL(targetUrl);
  if (!parsed.searchParams.has('automated_test')) {
    parsed.searchParams.set('automated_test', 'true');
  }
  if (!parsed.searchParams.has('disable_consent')) {
    parsed.searchParams.set('disable_consent', '1');
  }
  targetUrl = parsed.toString();
} catch (e) {
  // If invalid URL structure, proceed as-is
}

const snapshotsDir = path.join(process.cwd(), 'snapshots');
const targetFile = path.join(snapshotsDir, 'stable-baseline.png');

async function captureBaseline() {
  console.log('='.repeat(65));
  console.log('📸  Sahyadri Consultants: Capture Stable Baseline Snapshot');
  console.log('='.repeat(65));
  console.log(`🌐 Target URL:   ${targetUrl}`);
  console.log(`📂 Output File:  ${path.relative(process.cwd(), targetFile)}`);
  console.log('─'.repeat(65));

  // Ensure snapshots directory exists
  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir, { recursive: true });
  }

  // Backup existing baseline if it exists
  const backupFile = path.join(snapshotsDir, 'stable-baseline.backup.png');
  if (fs.existsSync(targetFile)) {
    try {
      fs.copyFileSync(targetFile, backupFile);
      console.log(`💾 Previous baseline temporarily backed up to ${path.basename(backupFile)}`);
    } catch (e) {
      // Non-critical
    }
  }

  console.log('🚀 Launching headless Chromium browser...');
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'X-Sahyadri-Automated-Test': 'true',
        'X-Automated-Inspection': 'true',
        'X-Sahyadri-Visual-Check': 'true',
      },
    });

    const page = await context.newPage();

    // 1. Suppress privacy consent modal via init script & localStorage
    console.log('🛡️  Injecting consent suppression flags & headers...');
    await page.addInitScript(() => {
      window.__DISABLE_CONSENT_MODAL__ = true;
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

    // 2. Navigate to URL
    console.log(`⏳ Navigating to ${targetUrl} (networkidle wait)...`);
    const response = await page.goto(targetUrl, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    const status = response ? response.status() : 'unknown';
    console.log(`📡 Response HTTP Status: ${status}`);

    // Remove any consent modal element from DOM and restore body scroll
    await page.evaluate(() => {
      const modal = document.getElementById('sahyadri-consent-modal');
      if (modal) modal.remove();
      document.body.style.overflow = '';
    });

    // 3. Wait for web fonts
    console.log('🔤 Waiting for document fonts ready...');
    await page.evaluate(() => document.fonts.ready);

    // 4. Pause hero videos at frame 0
    console.log('⏸️  Pausing background videos...');
    await page.evaluate(() => {
      document.querySelectorAll('video').forEach((v) => {
        v.pause();
        v.currentTime = 0;
      });
    });

    // 5. Force lazy images to eager load
    console.log('🖼️  Forcing lazy-load images to eager...');
    await page.evaluate(() => {
      document.querySelectorAll('img').forEach((img) => {
        img.setAttribute('loading', 'eager');
        if (img.getAttribute('data-src')) {
          img.src = img.getAttribute('data-src');
        }
      });
    });

    // 6. Scroll down and back up to trigger any intersection observers
    console.log('📜 Scrolling page to trigger lazy components & Swipers...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 250;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 80);
      });
    });

    // 7. Freeze and reset all carousels to first slide (prevents slide shifts and height changes)
    console.log('🎠 Freezing and resetting all carousels to slide 0...');
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
        const handle = beerSlider.querySelector('.beer-handle');
        if (handle) handle.style.left = '50%';
      }

      const swipers = document.querySelectorAll('.swiper-container, .swiper');
      swipers.forEach((s) => {
        if (s && s.swiper && typeof s.swiper.update === 'function') {
          s.swiper.update();
        }
      });
    });

    // 8. Inject CSS overrides (animation freeze & modal suppression)
    console.log('🎨 Applying visual stabilization CSS...');
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

        /* Permanently suppress privacy consent modal & backdrop */
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

    // 9. Wait for images to decode
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

    // 10. Wait 3 seconds for complete stabilization
    console.log('⏳ Waiting 3s for final rendering layout stabilization...');
    await page.waitForTimeout(3000);

    // Final purge of any modal
    await page.evaluate(() => {
      const modal = document.getElementById('sahyadri-consent-modal');
      if (modal) modal.remove();
      document.body.style.overflow = '';
    });

    // 11. Capture fullPage screenshot
    console.log('📷 Capturing full-page snapshot...');
    await page.screenshot({
      path: targetFile,
      fullPage: true,
    });

    const stats = fs.statSync(targetFile);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    // Remove temporary backup on success
    if (fs.existsSync(backupFile)) {
      try {
        fs.unlinkSync(backupFile);
      } catch (e) {}
    }

    console.log('─'.repeat(65));
    console.log('✅ STABLE BASELINE CAPTURE SUCCESSFUL!');
    console.log(`📁 File: ${targetFile}`);
    console.log(`📊 Size: ${sizeInMB} MB (${stats.size.toLocaleString()} bytes)`);
    console.log('─'.repeat(65));
    console.log('👉 Next Steps for Manual Verification:');
    console.log('   1. Inspect the image locally to verify the layout and appearance:');
    console.log(`      Start-Process "${targetFile}"`);
    console.log('   2. Verify git status:');
    console.log('      git status');
    console.log('   3. When satisfied, commit and push:');
    console.log('      git add snapshots/stable-baseline.png');
    console.log('      git commit -m "chore(baseline): update stable baseline snapshot"');
    console.log('      git push origin main');
    console.log('='.repeat(65));
  } catch (error) {
    console.error('❌ Failed to capture baseline snapshot:', error);
    // If backup exists and target was damaged, restore backup
    const backupFile = path.join(snapshotsDir, 'stable-baseline.backup.png');
    if (fs.existsSync(backupFile) && (!fs.existsSync(targetFile) || fs.statSync(targetFile).size === 0)) {
      fs.copyFileSync(backupFile, targetFile);
      console.log('🔄 Restored previous stable baseline from backup.');
    }
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureBaseline();
