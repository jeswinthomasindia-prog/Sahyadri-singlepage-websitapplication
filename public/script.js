function setupCarousel(containerKey, trackId, interval = 6500) {
  const track = document.getElementById(trackId);
  const slides = Array.from(track.children);
  let current = 0;

  function update(factor) {
    if (factor === 'next') current = (current + 1) % slides.length;
    else if (factor === 'prev') current = (current - 1 + slides.length) % slides.length;
    const width = slides[0].getBoundingClientRect().width + 16;
    track.style.transform = `translateX(-${current * width}px)`;
  }

  const controls = document.querySelectorAll(`[data-target='${containerKey}']`);
  controls.forEach(btn => btn.addEventListener('click', () => update(btn.dataset.direction)));

  const intervalId = setInterval(() => update('next'), interval);
  window.addEventListener('resize', () => update('none'));

  return () => clearInterval(intervalId);
}

window.addEventListener('DOMContentLoaded', () => {
  setupCarousel('projects','projectTrack');
  setupCarousel('testimonials','testiTrack');
  setupCarousel('awards','awardsTrack', 16250); // 2.5x slower than 6500ms
});

