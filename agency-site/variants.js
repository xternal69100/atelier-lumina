(() => {
  'use strict';

  document.querySelectorAll('[data-version-switcher]').forEach((switcher) => {
    const buttons = [...switcher.querySelectorAll('[data-version-button]')];
    const stage = switcher.querySelector('[data-version-stage]');
    const image = switcher.querySelector('[data-version-image]');
    const label = switcher.querySelector('[data-version-label]');
    const status = switcher.querySelector('[data-version-status]');
    const god = switcher.dataset.god || 'Figure';
    if (!buttons.length || !stage || !image || !label || !status) return;

    const selectVersion = (button, announce = true) => {
      buttons.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
      const source = button.dataset.src;
      const versionLabel = button.dataset.label;
      image.src = source;
      image.width = Number(button.dataset.width);
      image.height = Number(button.dataset.height);
      image.alt = button.dataset.alt;
      stage.href = source;
      stage.setAttribute('aria-label', `Ouvrir en grand ${god}, ${button.textContent.trim()}`);
      label.textContent = versionLabel;
      if (announce) status.textContent = `${god} — ${button.textContent.trim()} sélectionnée.`;
    };

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => selectVersion(button));
      button.addEventListener('keydown', (event) => {
        let target = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = buttons[(index + 1) % buttons.length];
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = buttons[(index - 1 + buttons.length) % buttons.length];
        if (event.key === 'Home') target = buttons[0];
        if (event.key === 'End') target = buttons[buttons.length - 1];
        if (!target) return;
        event.preventDefault();
        target.focus();
        selectVersion(target);
      });
    });

    selectVersion(buttons.find((button) => button.getAttribute('aria-pressed') === 'true') || buttons[0], false);
  });
})();
