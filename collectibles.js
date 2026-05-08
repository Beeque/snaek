import { wrapCanvasCoord } from './snake.js';

function torusDelta(dx, dy, w, h) {
  return {
    dx: dx - Math.round(dx / w) * w,
    dy: dy - Math.round(dy / h) * h
  };
}

export function torusDistance(ax, ay, bx, by, w, h) {
  const { dx, dy } = torusDelta(bx - ax, by - ay, w, h);
  return Math.hypot(dx, dy);
}

function randomSpawnDelay(config) {
  const min = config.pickupRespawnDelayMin;
  const max = config.pickupRespawnDelayMax;
  return min + Math.random() * (max - min);
}

export class Collectibles {
  constructor(config) {
    this.config = config;
    this.time = 0;
    /** Yksi pallo kerrallaan. */
    this.orb = null;
    this.spawnIn = config.pickupInitialSpawnDelay;
  }

  createOrb(type) {
    return {
      type,
      baseX: 0,
      baseY: 0,
      phase: Math.random() * Math.PI * 2,
      timeLeft: 0
    };
  }

  pickRandomType() {
    const b = this.config.pickupSpawnWeightBlack;
    const y = this.config.pickupSpawnWeightYellow;
    const g = this.config.pickupSpawnWeightGreen;
    const sum = b + y + g;
    const r = Math.random() * sum;
    if (r < b) return 'black';
    if (r < b + y) return 'yellow';
    return 'green';
  }

  getActiveOrbs() {
    return this.orb ? [this.orb] : [];
  }

  placeOrb(orb, snake) {
    const pos = this.randomFreePosition(snake);
    orb.baseX = pos.x;
    orb.baseY = pos.y;
    orb.phase = Math.random() * Math.PI * 2;
  }

  randomFreePosition(snake) {
    const config = this.config;
    const w = config.canvasWidth;
    const h = config.canvasHeight;
    const margin = config.pickupSpawnMargin;
    const minDist = config.pickupSpawnMinDistFromSnake;

    for (let attempt = 0; attempt < 28; attempt += 1) {
      const x = margin + Math.random() * (w - 2 * margin);
      const y = margin + Math.random() * (h - 2 * margin);
      let ok = true;
      for (let s = 0; s < snake.segments.length; s += 1) {
        const seg = snake.segments[s];
        const sx = wrapCanvasCoord(seg.x, w);
        const sy = wrapCanvasCoord(seg.y, h);
        if (torusDistance(x, y, sx, sy, w, h) < minDist) {
          ok = false;
          break;
        }
      }
      if (ok) {
        return { x, y };
      }
    }
    return { x: w * 0.5, y: h * 0.5 };
  }

  getOrbFloatOffset(orb) {
    const c = this.config;
    const t = this.time;
    const dy = Math.sin(t * c.orbFloatSpeedPrimary + orb.phase) * c.orbFloatAmplitudeY;
    const dx = Math.cos(t * c.orbFloatSpeedSecondary + orb.phase * 1.71) * c.orbFloatAmplitudeX;
    return { dx, dy };
  }

  getOrbDrawPosition(orb) {
    const w = this.config.canvasWidth;
    const h = this.config.canvasHeight;
    const { dx, dy } = this.getOrbFloatOffset(orb);
    return {
      x: wrapCanvasCoord(orb.baseX + dx, w),
      y: wrapCanvasCoord(orb.baseY + dy, h)
    };
  }

  getOrbCollisionXY(orb) {
    const w = this.config.canvasWidth;
    const h = this.config.canvasHeight;
    const { dx, dy } = this.getOrbFloatOffset(orb);
    return {
      x: wrapCanvasCoord(orb.baseX + dx, w),
      y: wrapCanvasCoord(orb.baseY + dy, h)
    };
  }

  orbRadius(orb) {
    const c = this.config;
    if (orb.type === 'yellow') return c.pickupYellowRadius;
    if (orb.type === 'green') return c.pickupGreenRadius;
    return c.pickupBlackRadius;
  }

  lifetimeSeconds() {
    const v = this.config.pickupLifetimeSeconds;
    return typeof v === 'number' && !Number.isNaN(v) ? v : 12;
  }

  /**
   * @param blackOrbScoreEnergy Mustan pallon pisteet = tämä energiamäärä (kun boost voimassa); muuten null.
   * @returns {{ scoreGained: number, energyGained: number, healthGained: number, ateBlack: boolean, ateYellow: boolean, ateGreen: boolean }}
   */
  updateAndCollect(dt, snake, blackOrbScoreEnergy) {
    const config = this.config;
    this.time += dt;

    const w = config.canvasWidth;
    const h = config.canvasHeight;

    let scoreGained = 0;
    let energyGained = 0;
    let healthGained = 0;
    let ateBlack = false;
    let ateYellow = false;
    let ateGreen = false;

    const hx = snake.head.x;
    const hy = snake.head.y;
    const headR = snake.segments[0]?.radius ?? config.headRadius;
    const lifeTotal = this.lifetimeSeconds();

    if (!this.orb) {
      this.spawnIn -= dt;
      if (this.spawnIn <= 0) {
        this.orb = this.createOrb(this.pickRandomType());
        this.placeOrb(this.orb, snake);
        this.orb.timeLeft = lifeTotal;
      }
      return { scoreGained, energyGained, healthGained, ateBlack, ateYellow, ateGreen };
    }

    this.orb.timeLeft -= dt;
    if (this.orb.timeLeft <= 0) {
      this.orb = null;
      this.spawnIn = randomSpawnDelay(config);
      return { scoreGained, energyGained, healthGained, ateBlack, ateYellow, ateGreen };
    }

    const orb = this.orb;
    const { x: ox, y: oy } = this.getOrbCollisionXY(orb);
    const r = this.orbRadius(orb);
    const dist = torusDistance(hx, hy, ox, oy, w, h);
    if (dist < headR + r - config.pickupOverlapSlack) {
      if (orb.type === 'black') {
        ateBlack = true;
        snake.grow(config.growSegmentsPerBlack);
        if (typeof blackOrbScoreEnergy === 'number' && blackOrbScoreEnergy > 0) {
          scoreGained += Math.round(blackOrbScoreEnergy);
        }
      } else if (orb.type === 'yellow') {
        ateYellow = true;
        energyGained += config.yellowEnergyRestore;
      } else {
        ateGreen = true;
        healthGained += config.greenHealthRestore;
      }

      this.orb = null;
      this.spawnIn = randomSpawnDelay(config);
    }

    return { scoreGained, energyGained, healthGained, ateBlack, ateYellow, ateGreen };
  }
}
