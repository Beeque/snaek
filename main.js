import { GAME_CONFIG } from './config.js';
import { InputManager } from './input.js';
import { Snake } from './snake.js';
import { ParticleSystem } from './particles.js';
import { renderFrame } from './render.js';
import { Collectibles } from './collectibles.js';
import { HazardWaveSystem } from './hazards.js';
import { updateHealthBar, updateEnergyBar, updateScoreDisplay } from './ui.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const input = new InputManager();
const snake = new Snake(GAME_CONFIG);
const particles = new ParticleSystem();
const collectibles = new Collectibles(GAME_CONFIG);
const hazards = new HazardWaveSystem(GAME_CONFIG);
let currentEnergy = GAME_CONFIG.maxEnergy;
let currentHealth = GAME_CONFIG.maxHealth;
let score = 0;
/** Boost pysyy vain jos nuolta pidetään ja energiaa tarpeeksi; uusi painallus kun energia loppui tai jäi alle kynnyksen. */
let boostEngaged = false;

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
  
  if (!input.isPaused() && currentHealth > 0) {
    const maxE = GAME_CONFIG.maxEnergy;
    const energyFrac = currentEnergy / maxE;
    const energyEnoughForBoost = currentEnergy > 0 && energyFrac >= GAME_CONFIG.boostMinEnergyFraction;

    if (!input.isBoostKeyHeld()) {
      boostEngaged = false;
    } else if (!energyEnoughForBoost) {
      boostEngaged = false;
    } else if (input.isBoostPressedEdge()) {
      boostEngaged = true;
    }

    const boostActive = boostEngaged && input.isBoostKeyHeld() && energyEnoughForBoost && currentEnergy > 0;

    let effectiveSpeed = GAME_CONFIG.baseSpeed;
    if (boostActive) {
      effectiveSpeed *= GAME_CONFIG.boostMultiplier;
      currentEnergy -= GAME_CONFIG.boostEnergyDrain * delta;
      currentEnergy = Math.max(0, currentEnergy);
    } else {
      currentEnergy += GAME_CONFIG.energyRegenRate * delta;
      currentEnergy = Math.min(maxE, currentEnergy);
    }
    
    snake.setSpeed(effectiveSpeed);
    snake.update(delta, input.getSteer());

    const blackOrbScoreEnergy = boostActive ? currentEnergy : null;
    const pickup = collectibles.updateAndCollect(delta, snake, blackOrbScoreEnergy);
    score += pickup.scoreGained;
    if (pickup.energyGained > 0) {
      currentEnergy = Math.min(GAME_CONFIG.maxEnergy, currentEnergy + pickup.energyGained);
    }

    const hazardDamage = hazards.update(delta, snake);
    currentHealth = Math.max(0, currentHealth - hazardDamage);

    particles.emitFromPickupOrbs(collectibles, GAME_CONFIG, delta);

    snake.segments.forEach((segment, index) => {
      particles.emitFromSnake(segment, GAME_CONFIG);
      if (boostActive) {
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
  
  renderFrame(ctx, GAME_CONFIG, snake, particles, collectibles, hazards);

  const energyPercent = (currentEnergy / GAME_CONFIG.maxEnergy) * 100;
  const healthPercent = (currentHealth / GAME_CONFIG.maxHealth) * 100;
  updateHealthBar(healthPercent);
  updateEnergyBar(energyPercent);
  updateScoreDisplay(score);

  requestAnimationFrame(animate);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
  resizeCanvas();
  requestAnimationFrame(animate);
});
