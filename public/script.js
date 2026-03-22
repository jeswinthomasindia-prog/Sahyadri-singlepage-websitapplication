function setupCarousel(containerKey, trackId) {
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

  const intervalId = setInterval(() => update('next'), 6500);
  window.addEventListener('resize', () => update('none'));

  return () => clearInterval(intervalId);
}

window.addEventListener('DOMContentLoaded', () => {
  setupCarousel('projects','projectTrack');
  setupCarousel('testimonials','testiTrack');
});
