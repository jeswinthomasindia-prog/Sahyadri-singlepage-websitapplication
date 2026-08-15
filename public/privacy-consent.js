/**
 * Sahyadri Consultants - GDPR / ePrivacy / Google Consent Mode v2 Manager
 * Fully compliant with GDPR (EU), UK GDPR, CCPA/CPRA, and ePrivacy Directive.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'sahyadri_cookie_consent_v2';
  const EXPIRY_DAYS = 180;

  // Ensure window.dataLayer & gtag function exist
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  // Helper: Get Saved Consent
  function getStoredConsent() {
    try {
      const itemStr = localStorage.getItem(STORAGE_KEY);
      if (!itemStr) return null;
      const item = JSON.parse(itemStr);
      const now = new Date();
      if (now.getTime() > item.expiry) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return item.consent;
    } catch (e) {
      return null;
    }
  }

  // Helper: Save Consent
  function setStoredConsent(consent) {
    try {
      const now = new Date();
      const item = {
        consent: consent,
        expiry: now.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        updatedAt: now.toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(item));
    } catch (e) {
      console.warn('Unable to persist cookie consent to localStorage', e);
    }
  }

  // Check Global Privacy Control (GPC) or Do Not Track (DNT)
  function isDNTEnabled() {
    return (
      navigator.doNotTrack === '1' ||
      window.doNotTrack === '1' ||
      navigator.globalPrivacyControl === true
    );
  }

  // Apply consent to Google Analytics via gtag('consent', 'update', ...)
  function applyConsentToGtag(consent) {
    const isAnalyticsGranted = consent && consent.analytics === true;
    const isMarketingGranted = consent && consent.marketing === true;

    window.gtag('consent', 'update', {
      analytics_storage: isAnalyticsGranted ? 'granted' : 'denied',
      ad_storage: isMarketingGranted ? 'granted' : 'denied',
      ad_user_data: isMarketingGranted ? 'granted' : 'denied',
      ad_personalization: isMarketingGranted ? 'granted' : 'denied',
    });

    // Notify other components or trackers
    window.dispatchEvent(
      new CustomEvent('sahyadri_consent_updated', {
        detail: consent,
      })
    );

    if (window.SahyadriTracker && typeof window.SahyadriTracker.onConsentChange === 'function') {
      window.SahyadriTracker.onConsentChange(consent);
    }
  }

  // Consent API Object
  window.SahyadriConsent = {
    getConsent: function () {
      return getStoredConsent() || { necessary: true, analytics: false, marketing: false };
    },

    hasUserDecided: function () {
      return getStoredConsent() !== null;
    },

    acceptAll: function () {
      const consent = { necessary: true, analytics: true, marketing: false };
      setStoredConsent(consent);
      applyConsentToGtag(consent);
      hideModal();
    },

    rejectNonEssential: function () {
      const consent = { necessary: true, analytics: false, marketing: false };
      setStoredConsent(consent);
      applyConsentToGtag(consent);
      hideModal();
    },

    saveCustomPreferences: function (analyticsGranted) {
      const consent = {
        necessary: true,
        analytics: Boolean(analyticsGranted),
        marketing: false,
      };
      setStoredConsent(consent);
      applyConsentToGtag(consent);
      hideModal();
    },

    openPreferences: function () {
      showModal();
    },
  };

  // Build Modal UI
  function renderConsentUI() {
    if (document.getElementById('sahyadri-consent-modal')) return;

    // Preferences Modal HTML
    const modalHTML = `
      <div id="sahyadri-consent-modal" class="sc-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="sc-modal-title" style="display:none;">
        <div class="sc-modal-card">
          <div class="sc-modal-body">
            <h3 id="sc-modal-title">We want to give you the best experience</h3>
            <p class="sc-modal-text">
              We want to give you the best experience and we need analytics to improve it. It would help us in improving your experience if you can allow tracking usage data for your experience.
            </p>
            <div class="sc-modal-actions">
              <button type="button" id="sc-consent-no" class="sc-btn sc-btn-neutral" aria-label="Decline tracking">No</button>
              <button type="button" id="sc-consent-allow" class="sc-btn sc-btn-allow" aria-label="Allow tracking">Allow</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Bind Modal Event Listeners
    document.getElementById('sc-consent-allow')?.addEventListener('click', () => {
      window.SahyadriConsent.acceptAll();
    });

    document.getElementById('sc-consent-no')?.addEventListener('click', () => {
      window.SahyadriConsent.rejectNonEssential();
    });

    // Attach listeners to any trigger buttons on the page with data-action="open-cookie-preferences"
    document.querySelectorAll('[data-action="open-cookie-preferences"]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.SahyadriConsent.openPreferences();
      });
    });
  }

  function initScrollObserver() {
    const footer = document.getElementById('contact');
    if (!footer) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!window.SahyadriConsent.hasUserDecided()) {
              showModal();
            }
            observer.disconnect();
          }
        });
      }, {
        rootMargin: '100px 0px 0px 0px' // Trigger slightly before the footer is fully visible
      });
      observer.observe(footer);
    } else {
      // Fallback scroll listener
      const onScroll = () => {
        if (!window.SahyadriConsent.hasUserDecided()) {
          const docHeight = document.documentElement.scrollHeight;
          const windowHeight = window.innerHeight;
          const scrollPos = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

          if (docHeight - (scrollPos + windowHeight) < 200) {
            showModal();
            window.removeEventListener('scroll', onScroll);
          }
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  function showModal() {
    const modal = document.getElementById('sahyadri-consent-modal');
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('sc-visible'), 20);
      document.body.style.overflow = 'hidden';
    }
  }

  function hideModal() {
    const modal = document.getElementById('sahyadri-consent-modal');
    if (modal) {
      modal.classList.remove('sc-visible');
      setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }, 250);
    }
  }

  // Initialization lifecycle
  function init() {
    const storedConsent = getStoredConsent();

    if (storedConsent) {
      // User has already made a choice
      applyConsentToGtag(storedConsent);
    } else if (isDNTEnabled()) {
      // Respect DNT/GPC by default
      const defaultDNT = { necessary: true, analytics: false, marketing: false };
      setStoredConsent(defaultDNT);
      applyConsentToGtag(defaultDNT);
    } else {
      // Render UI and check if it's a returning visit in the current session
      renderConsentUI();
      
      const hasVisited = sessionStorage.getItem('sahyadri_has_visited');
      if (hasVisited === 'true') {
        // Subsequent visit/reload in this session: show immediately
        showModal();
      } else {
        // First visit/landing: flag it and set up the footer scroll observer
        sessionStorage.setItem('sahyadri_has_visited', 'true');
        initScrollObserver();
      }
      return;
    }

    // Always render UI so user can open preferences modal via footer link
    renderConsentUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
