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
