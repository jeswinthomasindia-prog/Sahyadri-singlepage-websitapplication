/**
 * Sahyadri Consultants - Real-Time Interaction & Engagement Tracker (GA4)
 * Comprehensive, privacy-compliant tracking for all major interactions on the Home Page.
 */

(function () {
  'use strict';

  // Ensure window.dataLayer & gtag function exist
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  const TRACKER_CONFIG = {
    debug: localStorage.getItem('debug_analytics') === 'true',
    pageName: 'home_page',
  };

  /**
   * Safe GA4 Event Dispatcher
   * @param {string} eventName
   * @param {Object} eventParams
   */
  function trackEvent(eventName, eventParams = {}) {
    const enrichedParams = {
      page_location: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title,
      timestamp_epoch: Date.now(),
      ...eventParams,
    };

    if (TRACKER_CONFIG.debug) {
      console.log(`[GA4 Track Realtime]: %c${eventName}`, 'color: #ff8b00; font-weight: bold;', enrichedParams);
    }

    try {
      window.gtag('event', eventName, enrichedParams);
    } catch (err) {
      if (TRACKER_CONFIG.debug) {
        console.error('[GA4 Track Error]:', err);
      }
    }
  }

  // Public Tracker API
  window.SahyadriTracker = {
    trackEvent: trackEvent,
    setDebug: function (enabled) {
      TRACKER_CONFIG.debug = Boolean(enabled);
      localStorage.setItem('debug_analytics', TRACKER_CONFIG.debug ? 'true' : 'false');
      console.log(`[Sahyadri Tracker] Debug mode set to: ${TRACKER_CONFIG.debug}`);
    },
    onConsentChange: function (consent) {
      trackEvent('consent_state_change', {
        analytics_granted: consent && consent.analytics === true,
        consent_type: 'user_action',
      });
    },
  };

  /**
   * Setup Real-Time Tracking for Home Page Elements
   */
  function initHomeTracking() {
    // -------------------------------------------------------------
    // 1. Hero Section Interactions
    // -------------------------------------------------------------
    // "See Our Work" button
    document.querySelectorAll('.hero-content .btn').forEach((btn) => {
      const text = btn.textContent.trim().toLowerCase();
      if (text.includes('see our work')) {
        btn.addEventListener('click', () => {
          trackEvent('cta_click', {
            cta_name: 'see_our_work',
            cta_location: 'hero',
            target_section: '#projects',
          });
        });
      }
    });

    // AI Assistant Buttons in Hero and Header
    document.querySelectorAll('.assistant-nav-link, .mobile-assistant-btn').forEach((el) => {
      el.addEventListener('click', () => {
        const isMobile = el.classList.contains('mobile-assistant-btn') || el.closest('.mobile-menu');
        trackEvent('ai_assistant_intent', {
          cta_name: 'talk_to_sahya',
          cta_location: isMobile ? 'mobile_menu_or_hero' : 'header_nav',
          destination: el.getAttribute('href') || 'login.html',
        });
      });
    });

    // Login Buttons
    document.querySelectorAll('.login-btn, .mobile-login-btn').forEach((el) => {
      el.addEventListener('click', () => {
        const isMobile = el.classList.contains('mobile-login-btn') || el.closest('.mobile-menu');
        trackEvent('login_intent', {
          cta_location: isMobile ? 'mobile_menu_or_hero' : 'header_nav',
          destination: el.getAttribute('href') || 'login.html',
        });
      });
    });

    // Immersive Mode Audio Toggle
    const immersiveBtn = document.getElementById('immersiveToggle');
    if (immersiveBtn) {
      immersiveBtn.addEventListener('click', () => {
        const heroVideo = document.getElementById('heroVideo');
        // Check state after toggle
        setTimeout(() => {
          const isMuted = heroVideo ? heroVideo.muted : true;
          trackEvent('immersive_mode_toggle', {
            action: isMuted ? 'muted' : 'unmuted',
            media_type: 'hero_video',
            sound_active: !isMuted,
          });
        }, 50);
      });
    }

    // Scroll Down Indicator Arrow
    document.querySelectorAll('.scroll-indicator').forEach((el) => {
      el.addEventListener('click', () => {
        trackEvent('scroll_indicator_click', {
          cta_location: 'hero_bottom',
          target_section: '#projects',
        });
      });
    });

    // Hero Social and Telephone Links
    document.querySelectorAll('.hero-social-container a').forEach((link) => {
      link.addEventListener('click', () => {
        const href = link.getAttribute('href') || '';
        const isMobileContainer = link.closest('.mobile-hero-social') !== null;
        let platform = 'unknown';
        if (href.startsWith('tel:')) platform = 'phone';
        else if (href.includes('youtube.com')) platform = 'youtube';
        else if (href.includes('instagram.com')) platform = 'instagram';
        else if (href.includes('threads.com')) platform = 'threads';
        else if (href.includes('facebook.com')) platform = 'facebook';
        else if (href.includes('wa.me') || href.includes('whatsapp')) platform = 'whatsapp';

        trackEvent('contact_channel_click', {
          channel: platform,
          destination_url: href,
          location: isMobileContainer ? 'hero_mobile' : 'hero_desktop',
        });
      });
    });

    // -------------------------------------------------------------
    // 2. Navigation & Header Interactions
    // -------------------------------------------------------------
    // Brand Logo
    document.querySelector('.brand')?.addEventListener('click', () => {
      trackEvent('navigation_click', {
        link_text: 'brand_logo',
        destination: '#',
        nav_type: 'topbar_brand',
      });
    });

    // Header standard navigation links
    document.querySelectorAll('.nav > a:not(.assistant-nav-link):not(.login-btn)').forEach((link) => {
      link.addEventListener('click', () => {
        trackEvent('navigation_click', {
          link_text: link.textContent.trim(),
          destination: link.getAttribute('href') || '',
          nav_type: 'desktop_header',
        });
      });
    });

    // Dropdown links (both desktop and mobile)
    document.querySelectorAll('.dropdown-menu a').forEach((link) => {
      link.addEventListener('click', () => {
        trackEvent('dropdown_navigation_click', {
          menu_item: link.textContent.trim(),
          destination: link.getAttribute('href') || '',
        });
      });
    });

    // Mobile Hamburger Menu Toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', () => {
        setTimeout(() => {
          const mobileMenu = document.getElementById('mobileMenu');
          const isOpen = mobileMenu && mobileMenu.classList.contains('active');
          trackEvent('mobile_menu_toggle', {
            action: isOpen ? 'open' : 'close',
          });
        }, 50);
      });
    }

    // -------------------------------------------------------------
    // 3. Featured Projects Section & Carousel
    // -------------------------------------------------------------
    // Projects Carousel Navigation Buttons
    document.querySelectorAll('.projects-controls .control-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const direction = btn.dataset.direction || 'unknown';
        trackEvent('carousel_navigate', {
          carousel_name: 'projects',
          direction: direction,
          method: 'button',
        });
      });
    });

    // Project Cards Click
    document.querySelectorAll('#projectTrack .carousel-item').forEach((item) => {
      const link = item.querySelector('a.card-link');
      const title = item.querySelector('h4')?.textContent.trim() || 'Unknown Project';
      const category = item.querySelector('.project-category-tag')?.textContent.trim() || 'General';

      if (link) {
        link.addEventListener('click', () => {
          trackEvent('project_view_click', {
            project_name: title,
            project_category: category,
            project_url: link.getAttribute('href') || '',
          });
        });
      }
    });

    // "See Our Other Projects" button
    document.querySelectorAll('.other-projects-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        trackEvent('cta_click', {
          cta_name: 'see_our_other_projects',
          cta_location: 'projects_section',
          destination: btn.getAttribute('href') || 'other-projects.html',
        });
      });
    });

    // -------------------------------------------------------------
    // 4. About Us Section
    // -------------------------------------------------------------
    const aboutLink = document.querySelector('#about a.section-link');
    if (aboutLink) {
      aboutLink.addEventListener('click', () => {
        trackEvent('section_navigation_click', {
          section_name: 'about_us',
          destination: aboutLink.getAttribute('href') || 'about.html',
        });
      });
    }

    // -------------------------------------------------------------
    // 5. Ultra Modern Company Section
    // -------------------------------------------------------------
    const ultraModernLink = document.querySelector('#ultra-modern a.section-link');
    if (ultraModernLink) {
      ultraModernLink.addEventListener('click', () => {
        trackEvent('section_navigation_click', {
          section_name: 'ultra_modern_company',
          destination: ultraModernLink.getAttribute('href') || 'ultra-modern-company.html',
        });
      });
    }

    // -------------------------------------------------------------
    // 6. Awards & Recognitions Carousel
    // -------------------------------------------------------------
    document.querySelectorAll('.awards-controls .control-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        trackEvent('carousel_navigate', {
          carousel_name: 'awards',
          direction: btn.dataset.direction || 'unknown',
          method: 'button',
        });
      });
    });

    document.querySelectorAll('#awardsTrack .carousel-item a.card-link').forEach((link) => {
      link.addEventListener('click', () => {
        const awardTitle = link.querySelector('h4')?.textContent.trim() || 'Award Item';
        trackEvent('award_view_click', {
          award_title: awardTitle,
          destination: link.getAttribute('href') || 'awards.html',
        });
      });
    });

    // -------------------------------------------------------------
    // 7. Transformations Before / After Slider
    // -------------------------------------------------------------
    const slider1 = document.getElementById('slider1');
    if (slider1) {
      let hasTrackedSliderDrag = false;
      const trackSliderInteraction = () => {
        if (!hasTrackedSliderDrag) {
          hasTrackedSliderDrag = true;
          trackEvent('transformation_slider_interact', {
            slider_id: 'slider1',
            action: 'drag_compare',
          });
        }
      };
      slider1.addEventListener('mousedown', trackSliderInteraction, { passive: true });
      slider1.addEventListener('touchstart', trackSliderInteraction, { passive: true });
    }

    const transformationsLink = document.querySelector('#transformations a.section-link');
    if (transformationsLink) {
      transformationsLink.addEventListener('click', () => {
        trackEvent('section_navigation_click', {
          section_name: 'transformations',
          destination: transformationsLink.getAttribute('href') || 'transformations.html',
        });
      });
    }

    // -------------------------------------------------------------
    // 8. Experience Projects in 360° Section
    // -------------------------------------------------------------
    const experience360Link = document.querySelector('#experience-360 a.section-link');
    if (experience360Link) {
      experience360Link.addEventListener('click', () => {
        trackEvent('section_navigation_click', {
          section_name: 'experience_360',
          destination: experience360Link.getAttribute('href') || 'experience-projects-360.html',
        });
      });
    }

    const preview360Video = document.getElementById('preview360Video');
    if (preview360Video) {
      preview360Video.addEventListener('play', () => {
        trackEvent('video_interaction', {
          video_id: 'preview360Video',
          action: 'preview_play',
        });
      }, { once: true });
    }

    // -------------------------------------------------------------
    // 9. One Ecosystem Section
    // -------------------------------------------------------------
    document.querySelectorAll('.ecosystem-grid a.ecosystem-link').forEach((cardLink) => {
      cardLink.addEventListener('click', () => {
        const heading = cardLink.querySelector('h4')?.textContent.trim() || 'Ecosystem Partner';
        const partnerKey = heading.toLowerCase().includes('well')
          ? 'well_and_dwell_interiors'
          : 'sahyadri_properties';

        trackEvent('ecosystem_card_click', {
          ecosystem_partner: partnerKey,
          partner_title: heading,
          destination: cardLink.getAttribute('href') || '',
        });
      });
    });

    // -------------------------------------------------------------
    // 10. Testimonials Carousel
    // -------------------------------------------------------------
    document.querySelectorAll('.testimonials-controls .control-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        trackEvent('carousel_navigate', {
          carousel_name: 'testimonials',
          direction: btn.dataset.direction || 'unknown',
          method: 'button',
        });
      });
    });

    document.querySelectorAll('#testiTrack a.testimonial-link').forEach((link) => {
      link.addEventListener('click', () => {
        const person = link.querySelector('.person')?.textContent.trim() || 'Testimonial Client';
        trackEvent('testimonial_view_click', {
          client_name: person,
          destination: link.getAttribute('href') || 'testimonials.html',
        });
      });
    });

    // -------------------------------------------------------------
    // 11. Floating WhatsApp & Footer Interactions
    // -------------------------------------------------------------
    document.querySelectorAll('.whatsapp-float').forEach((el) => {
      el.addEventListener('click', () => {
        trackEvent('whatsapp_click', {
          source: 'floating_action_button',
          contact_number: '+919074497780',
          destination: el.getAttribute('href') || '',
        });
      });
    });

    // Footer Phone & Email
    document.querySelectorAll('footer#contact p').forEach((p) => {
      const text = p.textContent.trim();
      if (text.includes('Email:')) {
        p.style.cursor = 'pointer';
        p.addEventListener('click', () => {
          trackEvent('contact_channel_click', {
            channel: 'email',
            location: 'footer',
            value: 'sahyadriconsultantsindia@gmail.com',
          });
        });
      } else if (text.includes('Phone:')) {
        p.style.cursor = 'pointer';
        p.addEventListener('click', () => {
          trackEvent('contact_channel_click', {
            channel: 'phone',
            location: 'footer',
            value: '+919074497780',
          });
        });
      }
    });

    // Footer Social Media Links
    document.querySelectorAll('footer#contact .social-links a').forEach((link) => {
      link.addEventListener('click', () => {
        const href = link.getAttribute('href') || '';
        let platform = 'unknown';
        if (href.includes('youtube.com')) platform = 'youtube';
        else if (href.includes('instagram.com')) platform = 'instagram';
        else if (href.includes('threads.com')) platform = 'threads';
        else if (href.includes('facebook.com')) platform = 'facebook';
        else if (href.includes('wa.me') || href.includes('whatsapp')) platform = 'whatsapp';

        trackEvent('contact_channel_click', {
          channel: platform,
          destination_url: href,
          location: 'footer_social',
        });
      });
    });

    // Footer Quick Links
    document.querySelectorAll('footer#contact .footer-grid div:nth-child(2) a').forEach((quickLink) => {
      quickLink.addEventListener('click', () => {
        trackEvent('footer_link_click', {
          link_text: quickLink.textContent.trim(),
          destination: quickLink.getAttribute('href') || '',
        });
      });
    });

    // -------------------------------------------------------------
    // 12. Touch Swipe Carousel Tracking
    // -------------------------------------------------------------
    ['projectTrack', 'testiTrack', 'awardsTrack'].forEach((trackId) => {
      const track = document.getElementById(trackId);
      if (!track) return;
      let startX = 0;
      track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
      }, { passive: true });

      track.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;
        if (Math.abs(diffX) > 50) {
          const direction = diffX > 0 ? 'next' : 'prev';
          const carouselName = trackId.replace('Track', '');
          trackEvent('carousel_swipe', {
            carousel_name: carouselName,
            direction: direction,
            method: 'touch_swipe',
          });
        }
      }, { passive: true });
    });

    // -------------------------------------------------------------
    // 13. Scroll Depth Milestones (25%, 50%, 75%, 90%, 100%)
    // -------------------------------------------------------------
    const scrollMilestones = [25, 50, 75, 90, 100];
    const reachedMilestones = new Set();

    function checkScrollDepth() {
      const scrollY = window.scrollY || window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrollPercent = Math.min(100, Math.round((scrollY / docHeight) * 100));

      scrollMilestones.forEach((milestone) => {
        if (scrollPercent >= milestone && !reachedMilestones.has(milestone)) {
          reachedMilestones.add(milestone);
          trackEvent('scroll_depth', {
            percent: milestone,
            milestone_label: `${milestone}%`,
          });
        }
      });
    }

    let scrollThrottleTimer = null;
    window.addEventListener('scroll', () => {
      if (!scrollThrottleTimer) {
        scrollThrottleTimer = setTimeout(() => {
          checkScrollDepth();
          scrollThrottleTimer = null;
        }, 200);
      }
    }, { passive: true });

    // -------------------------------------------------------------
    // 14. Section Engagement via IntersectionObserver (> 1.5s in view)
    // -------------------------------------------------------------
    if ('IntersectionObserver' in window) {
      const trackedSections = document.querySelectorAll('section[id], footer#contact');
      const sectionTimers = new Map();
      const engagedSections = new Set();

      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.id || 'footer';
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            if (!engagedSections.has(sectionId) && !sectionTimers.has(sectionId)) {
              const timerId = setTimeout(() => {
                engagedSections.add(sectionId);
                trackEvent('section_engagement', {
                  section_id: sectionId,
                  engagement_duration_ms: 1500,
                });
                sectionTimers.delete(sectionId);
              }, 1500);
              sectionTimers.set(sectionId, timerId);
            }
          } else {
            if (sectionTimers.has(sectionId)) {
              clearTimeout(sectionTimers.get(sectionId));
              sectionTimers.delete(sectionId);
            }
          }
        });
      }, {
        threshold: [0.3],
      });

      trackedSections.forEach((sec) => sectionObserver.observe(sec));
    }
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeTracking);
  } else {
    initHomeTracking();
  }
})();
