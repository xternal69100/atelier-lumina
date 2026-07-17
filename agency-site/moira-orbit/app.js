const study = document.querySelector('#study');
    const toggle = document.querySelector('#toggle');
    const speedButtons = [...document.querySelectorAll('.speed')];

    toggle.addEventListener('click', () => {
      const paused = study.classList.toggle('paused');
      toggle.textContent = paused ? 'Reprendre' : 'Pause';
      toggle.setAttribute('aria-pressed', String(!paused));
    });

    speedButtons.forEach(button => button.addEventListener('click', () => {
      document.documentElement.style.setProperty('--spin', button.dataset.speed);
      speedButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      if (study.classList.contains('paused')) toggle.click();
    }));
