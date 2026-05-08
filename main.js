import { GAME_CONFIG } from './config.js';
import { InputManager } from './input.js';
import { Snake } from './snake.js';
import { ParticleSystem } from './particles.js';
import { renderFrame } from './render.js';
import { Collectibles } from './collectibles.js';
import { updateHealthBar, updateEnergyBar, updateScoreDisplay } from './ui.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const input = new InputManager();
const snake = new Snake(GAME_CONFIG);
const particles = new ParticleSystem();
const collectibles = new Collectibles(GAME_CONFIG);
let currentEnergy = GAME_CONFIG.maxEnergy;
let score = 0;

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

    const boostingForScore = input.isBoostActive() && currentEnergy > 0;
    const pickup = collectibles.updateAndCollect(delta, snake, boostingForScore);
    score += pickup.scoreGained;
    if (pickup.energyGained > 0) {
      currentEnergy = Math.min(GAME_CONFIG.maxEnergy, currentEnergy + pickup.energyGained);
    }

    snake.segments.forEach((segment, index) => {
      particles.emitFromSnake(segment, GAME_CONFIG);
      if (input.isBoostActive()) {
        // Kultaiset partikkelit emitoidaan enimmäkseen madon keskiosasta/hännästä
        const middlePoint = Math.floor(snake.segments.length / 2);
        if (index >= middlePoint) {
          // Enemmän partikkeleita hännästä
          particles.emitBoostParticles(segment, GAME_CONFIG, 1);
        } else if (index < 6 && Math.random() < 0.3) {
          // Harvemmin myös päästä (30% todennäköisyys)
          particles.emitBoostParticles(segment, GAME_CONFIG, 1);
        }
      }
    });
  }
  
  particles.update(delta);
  
  renderFrame(ctx, GAME_CONFIG, snake, particles, collectibles);

  const energyPercent = (currentEnergy / GAME_CONFIG.maxEnergy) * 100;
  updateHealthBar(100);
  updateEnergyBar(energyPercent);
  updateScoreDisplay(score);

  requestAnimationFrame(animate);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
  resizeCanvas();
  requestAnimationFrame(animate);
});
