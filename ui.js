export function createActionBar(container, buttons) {
  container.innerHTML = '';
  buttons.forEach((button) => {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'action-button';
    element.title = button.description;
    element.dataset.shortcut = button.shortcut;
    element.innerHTML = `<span class="action-button__index">${button.shortcut}</span>`;
    container.appendChild(element);
  });
}

export function updateHealthBar(percentage) {
  const bar = document.getElementById('health-bar');
  if (bar) {
    bar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
  }
}

export function updateEnergyBar(percentage) {
  const bar = document.getElementById('energy-bar');
  if (bar) {
    bar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
  }
}
