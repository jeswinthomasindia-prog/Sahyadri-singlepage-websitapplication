/**
 * Build Script for Sahyadri Static Assets
 * 1. Reads release metadata from version.json
 * 2. Empties and prepares the `dist/` directory
 * 3. Copies all assets from `public/` to `dist/`
 * 4. Injects version query parameters (?v=X.Y.Z) into local CSS and JS references across all HTML files
 * 5. Ensures version-checker.js is registered on every HTML page
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const VERSION_FILE = path.join(ROOT_DIR, 'version.json');

function loadVersionData() {
  if (!fs.existsSync(VERSION_FILE)) {
    console.warn(`[BUILD WARNING] ${VERSION_FILE} not found. Defaulting to 1.0.0`);
    return { version: '1.0.0' };
  }
  try {
    const raw = fs.readFileSync(VERSION_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[BUILD ERROR] Failed to parse version.json:`, err);
    process.exit(1);
  }
}

function copyDirectoryRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function isLocalResource(url) {
  if (!url) return false;
  // External URLs (http://, https://, //) or data URIs
  if (/^(?:https?:)?\/\//i.test(url) || /^data:/i.test(url)) {
    return false;
  }
  return true;
}

function addVersionParam(url, version) {
  if (!isLocalResource(url)) return url;
  const [basePath, existingQuery] = url.split('?');
  const params = new URLSearchParams(existingQuery || '');
  params.set('v', version);
  return `${basePath}?${params.toString()}`;
}

function processHtmlFile(filePath, version) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Version CSS links: <link ... href="...css" ...>
  content = content.replace(
    /(<link\b[^>]*\bhref=["'])([^"']+\.css(?:\?[^"']*)?)(["'][^>]*>)/gi,
    (match, prefix, href, suffix) => {
      if (!isLocalResource(href)) return match;
      return `${prefix}${addVersionParam(href, version)}${suffix}`;
    }
  );

  // 2. Version JS scripts: <script ... src="...js" ...>
  content = content.replace(
    /(<script\b[^>]*\bsrc=["'])([^"']+\.js(?:\?[^"']*)?)(["'][^>]*>)/gi,
    (match, prefix, src, suffix) => {
      if (!isLocalResource(src)) return match;
      return `${prefix}${addVersionParam(src, version)}${suffix}`;
    }
  );

  // 3. Ensure version-checker.js is included
  if (!content.includes('version-checker.js')) {
    const scriptTag = `  <script src="version-checker.js?v=${version}" defer></script>\n`;
    if (content.includes('</body>')) {
      content = content.replace('</body>', `${scriptTag}</body>`);
    } else if (content.includes('</head>')) {
      content = content.replace('</head>', `${scriptTag}</head>`);
    } else {
      content += `\n${scriptTag}`;
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

function build() {
  console.log('🚀 Starting Sahyadri production asset build...');
  const versionData = loadVersionData();
  const version = versionData.version || '1.0.0';
  console.log(`📦 Release version: v${version}`);

  // 1. Clean dist directory
  if (fs.existsSync(DIST_DIR)) {
    console.log('🧹 Cleaning existing dist/ directory...');
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // 2. Copy all public assets to dist
  console.log('📂 Copying assets from public/ to dist/...');
  copyDirectoryRecursive(PUBLIC_DIR, DIST_DIR);

  // 3. Also ensure version.json is in dist
  fs.copyFileSync(VERSION_FILE, path.join(DIST_DIR, 'version.json'));

  // 4. Transform all HTML files in dist
  const distFiles = fs.readdirSync(DIST_DIR);
  let htmlCount = 0;
  for (const file of distFiles) {
    if (file.endsWith('.html')) {
      const fullPath = path.join(DIST_DIR, file);
      processHtmlFile(fullPath, version);
      htmlCount++;
    }
  }

  console.log(`✨ Successfully processed ${htmlCount} HTML files with ?v=${version}`);
  console.log('✅ Build complete! Output located at:', DIST_DIR);
}

build();
