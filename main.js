import { GAME_CONFIG } from './config.js';
import { InputManager } from './input.js';
import { Snake } from './snake.js';
import { renderFrame } from './render.js';
import { createActionBar } from './ui.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const actionBar = document.getElementById('action-bar');

const input = new InputManager();
const snake = new Snake(GAME_CONFIG);
createActionBar(actionBar, GAME_CONFIG.actionButtons);

function resizeCanvas() {
  canvas.width = GAME_CONFIG.canvasWidth;
  canvas.height = GAME_CONFIG.canvasHeight;
}

let lastTimestamp = null;
function animate(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = Math.min(0.033, (timestamp - lastTimestamp) / 1000);
  lastTimestamp = timestamp;

  input.update(delta);
  snake.update(delta, input.getSteer());
  renderFrame(ctx, GAME_CONFIG, snake);

  requestAnimationFrame(animate);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
  resizeCanvas();
  requestAnimationFrame(animate);
});
