(() => {
  'use strict';

  document.documentElement.classList.remove('no-js');

  const EXPECTED = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
  const FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[contenteditable="true"]', '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const digest = async (value) => {
    const bytes = new TextEncoder().encode(value);
    const result = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(result)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  };

  const visibleFocusables = (container) => [...container.querySelectorAll(FOCUSABLE)]
    .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');

  const isolateModalBranch = (modal) => {
    const states = [];
    let branch = modal;
    while (branch?.parentElement) {
      const parent = branch.parentElement;
      [...parent.children].forEach((sibling) => {
        if (sibling === branch) return;
        states.push({
          element: sibling,
          inert: sibling.hasAttribute('inert'),
          ariaHidden: sibling.getAttribute('aria-hidden')
        });
        sibling.setAttribute('inert', '');
        sibling.setAttribute('aria-hidden', 'true');
      });
      if (parent === document.body) break;
      branch = parent;
    }
    return () => states.forEach(({element, inert, ariaHidden}) => {
      if (!inert) element.removeAttribute('inert');
      if (ariaHidden === null) element.removeAttribute('aria-hidden');
      else element.setAttribute('aria-hidden', ariaHidden);
    });
  };

  const focusRevealedContent = (content) => {
    const target = content.querySelector('h1,h2,h3')
      || content.querySelector('a[href],button:not([disabled]),input:not([disabled])');
    if (!target) return;
    const hadTabindex = target.hasAttribute('tabindex');
    if (!hadTabindex) target.setAttribute('tabindex', '-1');
    target.focus({preventScroll: true});
    if (!hadTabindex) {
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), {once: true});
    }
  };

  document.querySelectorAll('[data-lumina-gate]').forEach((shell, index) => {
    const key = shell.dataset.gateId || 'default';
    const mode = shell.dataset.gateMode || 'section';
    const content = shell.querySelector('[data-gate-content]');
    const panel = shell.querySelector('[data-gate-panel]');
    const form = shell.querySelector('[data-gate-form]');
    const input = shell.querySelector('[data-gate-input]');
    const error = shell.querySelector('[data-gate-error]');
    const submit = form?.querySelector('[type="submit"]');
    if (!content || !panel || !form || !input || !error) return;

    let restoreIsolation = () => {};
    let removeKeyboardGuard = () => {};

    const unlock = ({restored = false} = {}) => {
      removeKeyboardGuard();
      restoreIsolation();
      panel.remove();
      content.hidden = false;
      content.removeAttribute('aria-hidden');
      document.documentElement.classList.remove('gate-is-open');
      try { sessionStorage.setItem(`lumina-gate:${key}`, 'open'); } catch (_) {}
      if (!restored) focusRevealedContent(content);
      shell.dispatchEvent(new CustomEvent('lumina:unlocked', {bubbles: true, detail: {restored}}));
    };

    let wasOpen = false;
    try { wasOpen = sessionStorage.getItem(`lumina-gate:${key}`) === 'open'; } catch (_) {}
    if (wasOpen) {
      unlock({restored: true});
      return;
    }

    const title = panel.querySelector('.lumina-gate-title');
    const copy = panel.querySelector('.lumina-gate-copy');
    if (title && !title.id) title.id = `lumina-gate-title-${index + 1}`;
    if (copy && !copy.id) copy.id = `lumina-gate-copy-${index + 1}`;
    if (title) panel.setAttribute('aria-labelledby', title.id);
    if (copy) panel.setAttribute('aria-describedby', copy.id);

    if (mode === 'overlay') {
      panel.classList.add('lumina-gate-overlay');
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      document.documentElement.classList.add('gate-is-open');
      restoreIsolation = isolateModalBranch(panel);

      const keyboardGuard = (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          error.textContent = 'Saisissez le code de présentation pour continuer.';
          input.focus();
          return;
        }
        if (event.key !== 'Tab') return;
        const focusables = visibleFocusables(panel);
        if (!focusables.length) {
          event.preventDefault();
          panel.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === first || !panel.contains(active))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
          event.preventDefault();
          first.focus();
        }
      };
      document.addEventListener('keydown', keyboardGuard, true);
      removeKeyboardGuard = () => document.removeEventListener('keydown', keyboardGuard, true);
      requestAnimationFrame(() => input.focus());
    } else {
      panel.setAttribute('role', 'region');
    }

    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      error.textContent = '';
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value || !window.crypto?.subtle) {
        error.textContent = 'Ce navigateur ne permet pas de vérifier le code.';
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      if (submit) submit.disabled = true;
      try {
        const valid = (await digest(value)) === EXPECTED;
        input.value = '';
        if (valid) {
          error.textContent = '';
          input.removeAttribute('aria-invalid');
          unlock();
        } else {
          error.textContent = 'Code incorrect. Réessayez.';
          input.setAttribute('aria-invalid', 'true');
          input.focus();
        }
      } catch (_) {
        error.textContent = 'La vérification locale a échoué. Rechargez la page.';
        input.setAttribute('aria-invalid', 'true');
        input.focus();
      } finally {
        if (submit?.isConnected) submit.disabled = false;
      }
    });
  });
})();
