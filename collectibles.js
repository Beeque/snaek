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
    /** Enintään yksi musta ja yksi keltainen kerrallaan; ajastimet hallitsevat spawnin. */
    this.slots = [
      { type: 'black', orb: null, spawnIn: config.pickupBlackInitialDelay },
      { type: 'yellow', orb: null, spawnIn: config.pickupYellowInitialDelay }
    ];
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

  getActiveOrbs() {
    return this.slots.map((s) => s.orb).filter(Boolean);
  }

  placeOrb(orb, snake, otherOrbs) {
    const pos = this.randomFreePosition(snake, otherOrbs);
    orb.baseX = pos.x;
    orb.baseY = pos.y;
    orb.phase = Math.random() * Math.PI * 2;
  }

  randomFreePosition(snake, otherOrbs) {
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
      if (!ok) continue;
      for (let o = 0; o < otherOrbs.length; o += 1) {
        const ob = otherOrbs[o];
        const ox = wrapCanvasCoord(ob.baseX, w);
        const oy = wrapCanvasCoord(ob.baseY, h);
        if (torusDistance(x, y, ox, oy, w, h) < minDist) {
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

  getOrbDrawPosition(orb) {
    const config = this.config;
    const w = config.canvasWidth;
    const h = config.canvasHeight;
    const bob = Math.sin(this.time * config.orbFloatSpeed + orb.phase) * config.orbFloatAmplitude;
    return {
      x: wrapCanvasCoord(orb.baseX, w),
      y: wrapCanvasCoord(orb.baseY + bob, h)
    };
  }

  getOrbCollisionXY(orb) {
    const config = this.config;
    const w = config.canvasWidth;
    const h = config.canvasHeight;
    const bob = Math.sin(this.time * config.orbFloatSpeed + orb.phase) * config.orbFloatAmplitude;
    return {
      x: wrapCanvasCoord(orb.baseX, w),
      y: wrapCanvasCoord(orb.baseY + bob, h)
    };
  }

  orbRadius(orb) {
    return orb.type === 'yellow' ? this.config.pickupYellowRadius : this.config.pickupBlackRadius;
  }

  /**
   * @returns {{ scoreGained: number, energyGained: number }}
   */
  updateAndCollect(dt, snake, boostCountsForScore) {
    const config = this.config;
    this.time += dt;

    const w = config.canvasWidth;
    const h = config.canvasHeight;

    let scoreGained = 0;
    let energyGained = 0;

    const hx = snake.head.x;
    const hy = snake.head.y;
    const headR = snake.segments[0]?.radius ?? config.headRadius;

    for (let si = 0; si < this.slots.length; si += 1) {
      const slot = this.slots[si];

      if (!slot.orb) {
        slot.spawnIn -= dt;
        if (slot.spawnIn <= 0) {
          const others = this.getActiveOrbs();
          slot.orb = this.createOrb(slot.type);
          this.placeOrb(slot.orb, snake, others);
          slot.orb.timeLeft = config.pickupLifetimeSeconds;
        }
        continue;
      }

      slot.orb.timeLeft -= dt;
      if (slot.orb.timeLeft <= 0) {
        slot.orb = null;
        slot.spawnIn = randomSpawnDelay(config);
        continue;
      }

      const orb = slot.orb;
      const { x: ox, y: oy } = this.getOrbCollisionXY(orb);
      const r = this.orbRadius(orb);
      const dist = torusDistance(hx, hy, ox, oy, w, h);
      if (dist >= headR + r - config.pickupOverlapSlack) {
        continue;
      }

      if (orb.type === 'black') {
        snake.grow(config.growSegmentsPerBlack);
        if (boostCountsForScore) {
          scoreGained += config.scorePointsPerBlackBoost;
        }
      } else {
        energyGained += config.yellowEnergyRestore;
      }

      slot.orb = null;
      slot.spawnIn = randomSpawnDelay(config);
    }

    return { scoreGained, energyGained };
  }
}
