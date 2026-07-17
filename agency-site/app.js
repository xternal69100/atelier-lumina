(() => {
  'use strict';
  const stage = document.querySelector('#moira-stage');
  const toggle = document.querySelector('#moira-toggle');
  if (!stage || !toggle) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const syncPreference = () => {
    if (reduced.matches) {
      stage.classList.add('is-paused');
      toggle.disabled = true;
      toggle.textContent = 'Mouvement réduit';
      toggle.setAttribute('aria-pressed', 'false');
    } else {
      toggle.disabled = false;
      toggle.textContent = stage.classList.contains('is-paused') ? 'Relancer le fil' : 'Suspendre le fil';
      toggle.setAttribute('aria-pressed', String(!stage.classList.contains('is-paused')));
    }
  };

  toggle.addEventListener('click', () => {
    const paused = stage.classList.toggle('is-paused');
    toggle.textContent = paused ? 'Relancer le fil' : 'Suspendre le fil';
    toggle.setAttribute('aria-pressed', String(!paused));
  });

  syncPreference();
  reduced.addEventListener?.('change', syncPreference);
})();