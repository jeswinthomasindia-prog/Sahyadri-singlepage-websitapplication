/**
 * Sahyadri Release & Cache Management System
 * Automatically checks for new versions, handles mandatory/optional updates,
 * and clears client-side cache & service workers.
 */
(function () {
  'use strict';

  const STORAGE_KEY_CURRENT_VERSION = 'sahyadri_installed_version';
  const STORAGE_KEY_DISMISSED_VERSION = 'sahyadri_dismissed_version';
  const VERSION_CHECK_INTERVAL_MS = 15 * 60 * 1000; // Check every 15 minutes

  // Semver comparator: returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
  function compareVersions(v1, v2) {
    if (!v1 || !v2) return v1 ? 1 : (v2 ? -1 : 0);
    const parts1 = String(v1).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
    const parts2 = String(v2).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
    const maxLen = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLen; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  // Inject sleek modern styles for the update modal
  function injectStyles() {
    if (document.getElementById('sahyadri-version-checker-styles')) return;

    const style = document.createElement('style');
    style.id = 'sahyadri-version-checker-styles';
    style.textContent = `
      .svc-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(10, 15, 29, 0.78);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.25rem;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s;
      }
      .svc-modal-backdrop.svc-show {
        opacity: 1;
        visibility: visible;
      }
      .svc-card {
        background: linear-gradient(135deg, rgba(26, 32, 48, 0.95), rgba(15, 20, 32, 0.98));
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 35px rgba(37, 99, 235, 0.2);
        border-radius: 18px;
        max-width: 480px;
        width: 100%;
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        overflow: hidden;
        transform: scale(0.92) translateY(12px);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .svc-modal-backdrop.svc-show .svc-card {
        transform: scale(1) translateY(0);
      }
      .svc-header {
        padding: 1.5rem 1.5rem 1rem 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: flex-start;
        gap: 1rem;
      }
      .svc-icon-wrapper {
        width: 48px;
        height: 48px;
        min-width: 48px;
        border-radius: 12px;
        background: linear-gradient(135deg, #2563eb, #3b82f6);
        box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
      }
      .svc-header-text h3 {
        margin: 0 0 0.35rem 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: -0.01em;
      }
      .svc-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
      }
      .svc-badge {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.2rem 0.6rem;
        border-radius: 9999px;
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
        border: 1px solid rgba(59, 130, 246, 0.4);
      }
      .svc-badge.svc-mandatory {
        background: rgba(239, 68, 68, 0.18);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.4);
        animation: svc-pulse 2s infinite;
      }
      @keyframes svc-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.65; }
      }
      .svc-body {
        padding: 1.25rem 1.5rem;
      }
      .svc-description {
        margin: 0;
        font-size: 0.925rem;
        line-height: 1.55;
        color: #cbd5e1;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        padding: 0.85rem 1rem;
        border-radius: 10px;
        max-height: 160px;
        overflow-y: auto;
      }
      .svc-mandatory-alert {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-top: 0.85rem;
        padding: 0.75rem 0.9rem;
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 10px;
        color: #fca5a5;
        font-size: 0.84rem;
        font-weight: 500;
      }
      .svc-mandatory-alert svg {
        min-width: 18px;
        width: 18px;
        height: 18px;
      }
      .svc-actions {
        padding: 1rem 1.5rem 1.5rem 1.5rem;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.75rem;
      }
      .svc-btn {
        padding: 0.65rem 1.25rem;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        outline: none;
      }
      .svc-btn:focus-visible {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
      }
      .svc-btn-dismiss {
        background: transparent;
        color: #94a3b8;
        border: 1px solid rgba(255, 255, 255, 0.12);
      }
      .svc-btn-dismiss:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.07);
        color: #f1f5f9;
      }
      .svc-btn-dismiss:disabled {
        opacity: 0.35;
        cursor: not-allowed;
        background: rgba(255, 255, 255, 0.02);
        border-color: rgba(255, 255, 255, 0.05);
        color: #64748b;
        pointer-events: none;
      }
      .svc-btn-update {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #ffffff;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
      }
      .svc-btn-update:hover {
        background: linear-gradient(135deg, #1d4ed8, #1e40af);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
      }
      .svc-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #ffffff;
        animation: svc-spin 0.8s linear infinite;
      }
      @keyframes svc-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // Clear all caches, unregister service workers, and hard reload
  async function performUpdate(version) {
    const updateBtn = document.getElementById('svc-update-btn');
    if (updateBtn) {
      updateBtn.disabled = true;
      updateBtn.innerHTML = '<span class="svc-spinner"></span> Updating...';
    }

    try {
      // 1. Clear browser CacheStorage (removes any Workbox / PWA cached pages and assets)
      if ('caches' in window) {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames.map(name => window.caches.delete(name)));
      }

      // 2. Unregister any service workers to guarantee clean state
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
    } catch (err) {
      console.warn('Cache/SW purge notice:', err);
    }

    // 3. Record newly installed version in localStorage
    localStorage.setItem(STORAGE_KEY_CURRENT_VERSION, version);
    sessionStorage.removeItem(STORAGE_KEY_DISMISSED_VERSION);

    // 4. Force browser to reload from server, bypassing memory/disk cache
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('_v_reload', Date.now());
    window.location.replace(currentUrl.toString());
  }

  // Render and show the update popup
  function renderModal(releaseData) {
    injectStyles();

    // Remove existing modal if present
    const existing = document.getElementById('sahyadri-version-modal');
    if (existing) existing.remove();

    const isMandatory = Boolean(releaseData.isMandatory);
    const versionText = releaseData.version ? `v${releaseData.version}` : 'Latest';
    const descriptionText = releaseData.description || 'A new update with enhancements is ready.';
    const titleText = releaseData.title || 'New Release Available';

    const modal = document.createElement('div');
    modal.id = 'sahyadri-version-modal';
    modal.className = 'svc-modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'svc-modal-title');

    modal.innerHTML = `
      <div class="svc-card">
        <div class="svc-header">
          <div class="svc-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <div class="svc-header-text">
            <h3 id="svc-modal-title">${escapeHtml(titleText)}</h3>
            <div class="svc-badges">
              <span class="svc-badge">${escapeHtml(versionText)}</span>
              ${isMandatory ? '<span class="svc-badge svc-mandatory">⚠️ Mandatory Update</span>' : ''}
            </div>
          </div>
        </div>

        <div class="svc-body">
          <p class="svc-description">${escapeHtml(descriptionText)}</p>
          ${isMandatory ? `
            <div class="svc-mandatory-alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>This is a mandatory update. Updating is required to proceed.</span>
            </div>
          ` : ''}
        </div>

        <div class="svc-actions">
          <button type="button" id="svc-dismiss-btn" class="svc-btn svc-btn-dismiss" ${isMandatory ? 'disabled title="Mandatory update cannot be dismissed"' : ''}>
            Avoid for now
          </button>
          <button type="button" id="svc-update-btn" class="svc-btn svc-btn-update">
            Update Now
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Trigger enter animation
    requestAnimationFrame(() => {
      modal.classList.add('svc-show');
    });

    // Handle Update Click
    const updateBtn = document.getElementById('svc-update-btn');
    updateBtn.addEventListener('click', () => {
      performUpdate(releaseData.version);
    });

    // Handle Avoid For Now Click
    const dismissBtn = document.getElementById('svc-dismiss-btn');
    if (!isMandatory) {
      dismissBtn.addEventListener('click', () => {
        sessionStorage.setItem(STORAGE_KEY_DISMISSED_VERSION, releaseData.version);
        modal.classList.remove('svc-show');
        setTimeout(() => modal.remove(), 300);
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Check version.json from server with cache busting
  async function checkForUpdate() {
    try {
      // Allow testing directly via URL parameter: ?test_update=mandatory or ?test_update=optional
      const urlParams = new URLSearchParams(window.location.search);
      const testMode = urlParams.get('test_update');
      if (testMode === 'mandatory') {
        renderModal({
          version: '1.2.0',
          isMandatory: true,
          title: 'Mandatory Update Required',
          description: 'Critical cache and security updates have been applied. Please update to continue.'
        });
        return;
      } else if (testMode === 'optional') {
        renderModal({
          version: '1.2.0',
          isMandatory: false,
          title: 'New Update Available',
          description: 'Enhanced performance, instant edge cache refresh, and updated project showcase.'
        });
        return;
      }

      const response = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) return;

      const releaseData = await response.json();
      if (!releaseData || !releaseData.version) return;

      const installedVersion = localStorage.getItem(STORAGE_KEY_CURRENT_VERSION);

      // If user is visiting for the first time, save current version without prompting
      if (!installedVersion) {
        localStorage.setItem(STORAGE_KEY_CURRENT_VERSION, releaseData.version);
        return;
      }

      // Check if server version is strictly newer than installed version
      const hasNewRelease = compareVersions(releaseData.version, installedVersion) > 0;

      if (hasNewRelease) {
        const isMandatory = Boolean(releaseData.isMandatory);
        const isDismissed = sessionStorage.getItem(STORAGE_KEY_DISMISSED_VERSION) === releaseData.version;

        // If mandatory, always show modal. If optional, show only if not dismissed this session
        if (isMandatory || !isDismissed) {
          renderModal(releaseData);
        }
      }
    } catch (err) {
      // Network failure or offline - fail quietly
      console.debug('Version check skipped (offline/unreachable):', err);
    }
  }

  // Initial check on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkForUpdate);
  } else {
    checkForUpdate();
  }

  // Periodic check in background
  setInterval(checkForUpdate, VERSION_CHECK_INTERVAL_MS);

  // Check when tab regains focus
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdate();
    }
  });

  // Expose clean helper globally for debugging / testing
  window.SahyadriVersionChecker = {
    check: checkForUpdate,
    update: performUpdate,
    simulateNewRelease: (v, mandatory = false, desc = 'Test update release notes.') => {
      renderModal({
        version: v || '9.9.9',
        isMandatory: mandatory,
        title: 'Release Update Available',
        description: desc
      });
    }
  };
})();
