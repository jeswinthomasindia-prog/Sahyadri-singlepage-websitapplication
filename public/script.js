function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  mobileMenu.classList.toggle('active');
}

function closeMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  mobileMenu.classList.remove('active');
}

function toggleMobileDropdown(element) {
  const dropdown = element.parentElement;
  dropdown.classList.toggle('active');
  event.preventDefault();
}

// Close mobile menu when navigation items are clicked (except dropdown toggles)
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu-nav a');
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', function() {
      // Don't close menu if it's a dropdown toggle
      if (!this.classList.contains('dropdown-toggle')) {
        closeMobileMenu();
      }
    });
  });
  
  // Close mobile menu when dropdown items are clicked
  const dropdownItems = document.querySelectorAll('.dropdown-menu a');
  dropdownItems.forEach(item => {
    item.addEventListener('click', function() {
      closeMobileMenu();
    });
  });
});

function setupCarousel(containerKey, trackId, interval = 6500) {
  const track = document.getElementById(trackId);
  if (!track) {
    console.warn(`Carousel track with ID '${trackId}' not found`);
    return;
  }
  const slides = Array.from(track.children);
  if (slides.length === 0) {
    console.warn(`No slides found in carousel track '${trackId}'`);
    return;
  }
  let current = 0;

  function update(factor) {
    if (factor === 'next') current = (current + 1) % slides.length;
    else if (factor === 'prev') current = (current - 1 + slides.length) % slides.length;
    const width = slides[0].getBoundingClientRect().width + 16;
    track.style.transform = `translateX(-${current * width}px)`;
  }

  const controls = document.querySelectorAll(`[data-target='${containerKey}']`);
  controls.forEach(btn => btn.addEventListener('click', () => update(btn.dataset.direction)));

  // Touch swipe functionality
  let startX = 0;
  let endX = 0;
  let isDragging = false;

  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    endX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    
    const diffX = startX - endX;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        update('next'); // Swipe left - go to next
      } else {
        update('prev'); // Swipe right - go to previous
      }
    }
  }, { passive: true });

  // Mouse drag support for tablets
  track.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    isDragging = true;
    track.style.cursor = 'grabbing';
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    endX = e.clientX;
  });

  track.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    track.style.cursor = 'grab';
    
    const diffX = startX - endX;
    const threshold = 50;
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        update('next');
      } else {
        update('prev');
      }
    }
  });

  track.addEventListener('mouseleave', (e) => {
    isDragging = false;
    track.style.cursor = 'grab';
  });

  track.style.cursor = 'grab';

  const intervalId = setInterval(() => update('next'), interval);
  window.addEventListener('resize', () => update('none'));

  return () => clearInterval(intervalId);
}

window.addEventListener('DOMContentLoaded', () => {
  // Only setup carousels if their elements exist
  if (document.getElementById('projectTrack')) {
    setupCarousel('projects','projectTrack');
  }
  if (document.getElementById('testiTrack')) {
    setupCarousel('testimonials','testiTrack');
  }
  if (document.getElementById('awardsTrack')) {
    setupCarousel('awards','awardsTrack', 10000); // 10 seconds timing
  }
  
  // Initialize BeerSlider for Transformations section
  const slider = document.getElementById('slider');
  if (slider) {
    new BeerSlider(document.getElementById('slider'));
  }
});

function toggleImmersiveMode() {
  const video = document.getElementById('heroVideo');
  const btn = document.getElementById('immersiveToggle');
  if (video && btn) {
    if (video.muted) {
      video.muted = false;
      btn.classList.remove('muted');
      btn.classList.add('unmuted');
    } else {
      video.muted = true;
      btn.classList.remove('unmuted');
      btn.classList.add('muted');
    }
  }
}


