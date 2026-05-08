import { GAME_CONFIG } from './config.js';
import { InputManager } from './input.js';
import { Snake } from './snake.js';
import { ParticleSystem } from './particles.js';
import { renderFrame } from './render.js';
import { Collectibles } from './collectibles.js';
import { HazardWaveSystem } from './hazards.js';
import { AsteroidField } from './asteroids.js';
import { FloatingTexts } from './floatingTexts.js';
import { updateHealthBar, updateEnergyBar, updateScoreDisplay } from './ui.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const motionEnableBtn = document.getElementById('motion-enable-btn');

const input = new InputManager();
const snake = new Snake(GAME_CONFIG);
const particles = new ParticleSystem();
const collectibles = new Collectibles(GAME_CONFIG);
const hazards = new HazardWaveSystem(GAME_CONFIG);
const asteroidField = new AsteroidField(GAME_CONFIG);
const floatingTexts = new FloatingTexts();
let currentEnergy = GAME_CONFIG.maxEnergy;
let currentHealth = GAME_CONFIG.maxHealth;
let score = 0;
let mobileRotateReferenceAngle = snake.head.baseAngle;
let wasMotionEnabled = false;
let displayedWorldRotation = 0;

function shortestAngleDelta(target, current) {
  let d = target - current;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

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
  const motionWorldRotate = input.isMotionEnabled();
  if (motionWorldRotate && !wasMotionEnabled) {
    mobileRotateReferenceAngle = snake.head.baseAngle;
    displayedWorldRotation = 0;
  }
  wasMotionEnabled = motionWorldRotate;
  
  if (!input.isPaused() && currentHealth > 0) {
    const maxE = GAME_CONFIG.maxEnergy;
    const energyFrac = currentEnergy / maxE;
    const energyEnoughForBoost = currentEnergy > 0 && energyFrac >= GAME_CONFIG.boostMinEnergyFraction;
    const requestedBoost = input.getBoostAmount();
    const boostAmount = energyEnoughForBoost ? requestedBoost : 0;
    const boostActive = boostAmount > 0 && currentEnergy > 0;

    let effectiveSpeed = GAME_CONFIG.baseSpeed;
    if (boostActive) {
      const dynBoostMul = 1 + (GAME_CONFIG.boostMultiplier - 1) * boostAmount;
      effectiveSpeed *= dynBoostMul;
      currentEnergy -= GAME_CONFIG.boostEnergyDrain * boostAmount * delta;
      currentEnergy = Math.max(0, currentEnergy);
    } else {
      currentEnergy += GAME_CONFIG.energyRegenRate * delta;
      currentEnergy = Math.min(maxE, currentEnergy);
    }
    
    const steerInput = input.getSteer();
    snake.setSpeed(effectiveSpeed);
    snake.update(delta, steerInput);

    const blackOrbScoreEnergy = boostActive ? currentEnergy : null;
    const pickup = collectibles.updateAndCollect(delta, snake, blackOrbScoreEnergy);
    score += pickup.scoreGained;
    if (pickup.energyGained > 0) {
      currentEnergy = Math.min(GAME_CONFIG.maxEnergy, currentEnergy + pickup.energyGained);
    }
    if (pickup.healthGained > 0) {
      currentHealth = Math.min(GAME_CONFIG.maxHealth, currentHealth + pickup.healthGained);
    }
    if (pickup.ateBlack && pickup.scoreGained > 0) {
      floatingTexts.add(snake.head.x, snake.head.y - 28, `+${pickup.scoreGained}`, '#0a0a0a', 0.9);
    }
    if (pickup.ateYellow && pickup.energyGained > 0) {
      floatingTexts.add(snake.head.x, snake.head.y - 24, `+${Math.round(pickup.energyGained)}`, '#6b4e0a', 0.85);
    }
    if (pickup.ateGreen && pickup.healthGained > 0) {
      floatingTexts.add(snake.head.x, snake.head.y - 30, `+${pickup.healthGained}`, '#0f6b2e', 0.9);
    }

    const hz = hazards.update(delta, snake);
    currentHealth = Math.max(0, currentHealth - hz.damage);
    if (hz.wavePopup) {
      floatingTexts.add(snake.head.x, snake.head.y - 32, `-${GAME_CONFIG.hazardWaveDamage}`, '#b01010', 1);
    }
    if (hz.emberPopup) {
      floatingTexts.add(snake.head.x, snake.head.y - 20, `-${GAME_CONFIG.hazardEmberDamage}`, '#c42828', 0.75);
    }

    const ast = asteroidField.update(delta, snake);
    currentHealth = Math.max(0, currentHealth - ast.damage);
    if (ast.popup) {
      floatingTexts.add(snake.head.x, snake.head.y - 26, `-${GAME_CONFIG.asteroidDamage}`, '#882222', 0.85);
    }

    asteroidField.emitDebrisParticles(particles, delta);

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
  
  floatingTexts.update(delta);
  particles.update(delta);
  
  let targetWorldRotation = 0;
  if (motionWorldRotate) {
    targetWorldRotation = -(snake.head.baseAngle - mobileRotateReferenceAngle);
    const rotateMaxRad = ((GAME_CONFIG.mobileWorldRotateMaxDeg ?? 0) * Math.PI) / 180;
    if (rotateMaxRad > 0) {
      targetWorldRotation = Math.max(-rotateMaxRad, Math.min(rotateMaxRad, targetWorldRotation));
    }
  }
  const rotateResponse = Math.max(0.1, GAME_CONFIG.mobileWorldRotateResponse ?? 2.4);
  const follow = 1 - Math.exp(-rotateResponse * delta);
  displayedWorldRotation += shortestAngleDelta(targetWorldRotation, displayedWorldRotation) * follow;
  renderFrame(
    ctx,
    GAME_CONFIG,
    snake,
    particles,
    collectibles,
    hazards,
    asteroidField,
    floatingTexts,
    timestamp / 1000,
    displayedWorldRotation
  );

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
  if (input.isMotionAvailable()) {
    if (input.needsMotionGesture()) {
      if (motionEnableBtn) {
        motionEnableBtn.hidden = false;
        motionEnableBtn.addEventListener('click', async () => {
          const ok = await input.enableMotionControls();
          if (ok) {
            motionEnableBtn.hidden = true;
          }
        });
      }
    } else {
      input.enableMotionControls();
      if (motionEnableBtn) {
        motionEnableBtn.hidden = true;
      }
    }
  }
  requestAnimationFrame(animate);
});
