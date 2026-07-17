(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');
  if (reduced) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    });
  }, {threshold:.14, rootMargin:'0px 0px -8%'});
  document.querySelectorAll('[data-reveal]').forEach((node) => observer.observe(node));
  document.querySelectorAll('[data-parallax]').forEach((node) => {
    node.addEventListener('pointermove', (event) => {
      const box = node.getBoundingClientRect();
      node.style.setProperty('--px', ((event.clientX - box.left) / box.width - .5).toFixed(3));
      node.style.setProperty('--py', ((event.clientY - box.top) / box.height - .5).toFixed(3));
    });
    node.addEventListener('pointerleave', () => { node.style.setProperty('--px', 0); node.style.setProperty('--py', 0); });
  });
})();
