(() => {
  'use strict';

  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('#main-nav');
  if (menuButton && nav) {
    const label = menuButton.querySelector('.sr-only');
    const closeMenu = () => {
      menuButton.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      if (label) label.textContent = 'Ouvrir le menu';
    };
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
      if (label) label.textContent = open ? 'Ouvrir le menu' : 'Fermer le menu';
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries, activeObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          activeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
  }

  const form = document.querySelector('#booking-form');
  if (form) {
    const showError = (control, message) => {
      control.setAttribute('aria-invalid', message ? 'true' : 'false');
      const field = control.closest('.field');
      if (field) field.querySelector('.field-error').textContent = message;
    };
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = form.elements['first-name'];
      const email = form.elements.email;
      const goal = form.querySelector('input[name="goal"]:checked');
      showError(name, name.value.trim() ? '' : 'Indiquez votre prénom.');
      showError(email, email.validity.valid && email.value.trim() ? '' : 'Indiquez un email valide.');
      form.querySelector('.group-error').textContent = goal ? '' : 'Choisissez une priorité.';
      if (!name.value.trim() || !email.validity.valid || !email.value.trim() || !goal) {
        form.querySelector('[aria-invalid="true"], input[name="goal"]')?.focus();
        return;
      }
      form.reset();
      const success = document.querySelector('#booking-success');
      success.hidden = false;
      success.focus();
    });
  }

  const copyButton = document.querySelector('[data-copy-message]');
  if (copyButton) {
    const source = document.getElementById(copyButton.dataset.copySource);
    const status = document.querySelector('.copy-status');
    copyButton.addEventListener('click', async () => {
      if (!source) return;
      let copied = false;
      try {
        await navigator.clipboard.writeText(source.value);
        copied = true;
      } catch (error) {
        source.focus();
        source.select();
        copied = document.execCommand('copy');
      }
      if (status) status.textContent = copied ? 'Message copié localement. Aucun envoi n’a été effectué.' : 'Copie non disponible : sélectionnez le texte et copiez-le manuellement.';
    });
  }
})();
