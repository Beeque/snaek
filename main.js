import { GAME_CONFIG } from './config.js';
import { InputManager } from './input.js';
import { Snake } from './snake.js';
import { ParticleSystem } from './particles.js';
import { renderFrame } from './render.js';
import { createActionBar, updateHealthBar, updateEnergyBar } from './ui.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const actionBar = document.getElementById('action-bar');

const input = new InputManager();
const snake = new Snake(GAME_CONFIG);
const particles = new ParticleSystem();
let currentEnergy = GAME_CONFIG.maxEnergy;
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
  
  if (!input.isPaused()) {
    let effectiveSpeed = GAME_CONFIG.baseSpeed;
    if (input.isBoostActive() && currentEnergy > 0) {
      effectiveSpeed *= GAME_CONFIG.boostMultiplier;
      currentEnergy -= GAME_CONFIG.boostEnergyDrain * delta;
      currentEnergy = Math.max(0, currentEnergy);
    } else {
      currentEnergy += GAME_CONFIG.energyRegenRate * delta;
      currentEnergy = Math.min(GAME_CONFIG.maxEnergy, currentEnergy);
    }
    
    snake.setSpeed(effectiveSpeed);
    snake.update(delta, input.getSteer());
    
    snake.segments.forEach((segment, index) => {
      particles.emitFromSnake(segment, GAME_CONFIG);
      if (input.isBoostActive() && index < 6) {
        particles.emitBoostParticles(segment, 1);
      }
    });
  }
  
  particles.update(delta);
  
  renderFrame(ctx, GAME_CONFIG, snake, particles);
  
  const energyPercent = (currentEnergy / GAME_CONFIG.maxEnergy) * 100;
  updateHealthBar(100);
  updateEnergyBar(energyPercent);

  requestAnimationFrame(animate);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
  resizeCanvas();
  requestAnimationFrame(animate);
});
