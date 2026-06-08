/**
 * Animasi scroll ringan — menghormati prefers-reduced-motion
 */

let scrollObserver = null;

document.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => document.body.classList.add('page-loaded'));
  initScrollReveal();
});

function initScrollReveal() {
  const elements = document.querySelectorAll('[data-animate]');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          scrollObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
  );

  elements.forEach((el) => scrollObserver.observe(el));
}

function refreshScrollAnimate(root = document) {
  if (!scrollObserver) return;
  root.querySelectorAll('[data-animate]:not(.is-visible)').forEach((el) => {
    scrollObserver.observe(el);
  });
}

window.refreshScrollAnimate = refreshScrollAnimate;
