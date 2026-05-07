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
