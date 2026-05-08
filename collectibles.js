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

export class Collectibles {
  constructor(config, snake) {
    this.config = config;
    this.orbs = [];
    this.time = 0;
    this.fillInitialSpawns(snake);
  }

  fillInitialSpawns(snake) {
    const { pickupBlackCount, pickupYellowCount } = this.config;
    for (let i = 0; i < pickupBlackCount; i += 1) {
      const orb = this.createOrb('black');
      this.respawnOrb(orb, snake);
      this.orbs.push(orb);
    }
    for (let i = 0; i < pickupYellowCount; i += 1) {
      const orb = this.createOrb('yellow');
      this.respawnOrb(orb, snake);
      this.orbs.push(orb);
    }
  }

  createOrb(type) {
    return {
      type,
      baseX: 0,
      baseY: 0,
      phase: Math.random() * Math.PI * 2
    };
  }

  respawnOrb(orb, snake) {
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

    for (let attempt = 0; attempt < 24; attempt += 1) {
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

  /** Screen position including bob motion (wrapped). */
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

  /** Collision uses same position as drawn (bob included). */
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

    for (let i = 0; i < this.orbs.length; i += 1) {
      const orb = this.orbs[i];
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

      this.respawnOrb(orb, snake);
    }

    return { scoreGained, energyGained };
  }
}
