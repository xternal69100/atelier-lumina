(() => {
  'use strict';
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('#main-nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) { menuButton.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
    });
  }

  const form = document.querySelector('#booking-form');
  if (!form) return;
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
})();
