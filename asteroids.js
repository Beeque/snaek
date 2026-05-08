import { wrapCanvasCoord } from './snake.js';

function torusDelta(dx, dy, w, h) {
  return {
    dx: dx - Math.round(dx / w) * w,
    dy: dy - Math.round(dy / h) * h
  };
}

function torusDistanceSq(ax, ay, bx, by, w, h) {
  const { dx, dy } = torusDelta(bx - ax, by - ay, w, h);
  return dx * dx + dy * dy;
}

function randRange(a, b) {
  return a + Math.random() * (b - a);
}

function randGrayRgb(minV, maxV) {
  const v = randRange(minV, maxV);
  const g = v + randRange(-4, 6);
  const b = v + randRange(-2, 10);
  return `rgb(${Math.round(v)},${Math.round(g)},${Math.round(b)})`;
}

/**
 * Limittäiset ympyrät niin että keskipisteet ovat ulommassa kaaressa (ketju),
 * ei sisäkkäin — muuten kaikki sulautuu yhdeksi mustaksi möykkyksi.
 */
function makeRockBlobs(n, rMin, rMax) {
  const blobs = [];
  let hitRadius = 0;
  const coreR = randRange(rMin * 0.22, rMax * 0.34);
  blobs.push({ dx: 0, dy: 0, r: coreR, fill: randGrayRgb(14, 26) });
  hitRadius = coreR;

  for (let i = 1; i < n; i += 1) {
    const pick = blobs[Math.floor(Math.random() * blobs.length)];
    const r = randRange(rMin * 0.2, rMax * 0.4);
    /** Osittainen limitys: ~25–45 % halkaisijasta — näkyvät erilliset möykyt. */
    const overlap = randRange(0.25, 0.45) * Math.min(pick.r, r);
    const dist = pick.r + r - overlap;
    const ang = Math.random() * Math.PI * 2;
    const dx = pick.dx + Math.cos(ang) * dist;
    const dy = pick.dy + Math.sin(ang) * dist;
    blobs.push({ dx, dy, r, fill: randGrayRgb(10, 28) });
    const reach = Math.hypot(dx, dy) + r;
    if (reach > hitRadius) hitRadius = reach;
  }

  return { blobs, hitRadius: hitRadius * 0.92 };
}

function intersectsCanvasViewport(cx, cy, pad, cw, ch) {
  return cx + pad > 0 && cx - pad < cw && cy + pad > 0 && cy - pad < ch;
}

/**
 * Asteroids-tyyliin hitaasti kulkevia pyöriviä mustia kiviä.
 */
export class AsteroidField {
  constructor(config) {
    this.config = config;
    this.rocks = [];
    this.spawnTimer = randRange(config.asteroidSpawnIntervalMin, config.asteroidSpawnIntervalMax);
    this.hitCooldown = 0;
  }

  spawnRock() {
    const c = this.config;
    const w = c.canvasWidth;
    const h = c.canvasHeight;
    const m = c.asteroidEdgeMargin;
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;
    const speed = randRange(c.asteroidDriftSpeedMin, c.asteroidDriftSpeedMax);
    const jitter = randRange(-22, 22);

    if (side === 0) {
      x = randRange(m, w - m);
      y = -m - randRange(20, 80);
      vx = jitter * 0.35;
      vy = speed;
    } else if (side === 1) {
      x = randRange(m, w - m);
      y = h + m + randRange(20, 80);
      vx = jitter * 0.35;
      vy = -speed;
    } else if (side === 2) {
      x = -m - randRange(20, 80);
      y = randRange(m, h - m);
      vx = speed;
      vy = jitter * 0.35;
    } else {
      x = w + m + randRange(20, 80);
      y = randRange(m, h - m);
      vx = -speed;
      vy = jitter * 0.35;
    }

    const n = Math.round(randRange(c.asteroidVertMin, c.asteroidVertMax));
    const { blobs, hitRadius } = makeRockBlobs(n, c.asteroidRadiusMin, c.asteroidRadiusMax);

    this.rocks.push({
      x,
      y,
      vx,
      vy,
      angle: Math.random() * Math.PI * 2,
      spin: randRange(-c.asteroidSpinMax, c.asteroidSpinMax),
      blobs,
      hitRadius,
      life: randRange(c.asteroidLifeMin, c.asteroidLifeMax)
    });
  }

  update(dt, snake) {
    const c = this.config;
    const w = c.canvasWidth;
    const h = c.canvasHeight;
    this.hitCooldown = Math.max(0, this.hitCooldown - dt);

    let damage = 0;
    let popup = false;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.rocks.length < c.asteroidMaxAlive) {
      const batch = Math.round(randRange(c.asteroidSpawnBatchMin, c.asteroidSpawnBatchMax));
      for (let b = 0; b < batch && this.rocks.length < c.asteroidMaxAlive; b += 1) {
        this.spawnRock();
      }
      this.spawnTimer = randRange(c.asteroidSpawnIntervalMin, c.asteroidSpawnIntervalMax);
    }

    const maxSeg = Math.min(snake.segments.length, c.asteroidCollisionSegments);

    for (let r = this.rocks.length - 1; r >= 0; r -= 1) {
      const rock = this.rocks[r];
      rock.life -= dt;
      rock.x += rock.vx * dt;
      rock.y += rock.vy * dt;
      rock.angle += rock.spin * dt;

      if (rock.life <= 0) {
        this.rocks.splice(r, 1);
        continue;
      }

      if (this.hitCooldown <= 0) {
        const ox = rock.x;
        const oy = rock.y;
        const hitR = rock.hitRadius + (c.asteroidCollisionPad ?? 0);
        for (let s = 0; s < maxSeg; s += 1) {
          const seg = snake.segments[s];
          const sx = wrapCanvasCoord(seg.x, w);
          const sy = wrapCanvasCoord(seg.y, h);
          const maxD = seg.radius + hitR - (c.pickupOverlapSlack ?? 1);
          const maxD2 = maxD * maxD;
          if (torusDistanceSq(sx, sy, ox, oy, w, h) < maxD2) {
            damage += c.asteroidDamage;
            this.hitCooldown = c.asteroidHitCooldown;
            popup = true;
            break;
          }
        }
      }
    }

    return { damage, popup };
  }

  draw(ctx) {
    const c = this.config;
    const w = c.canvasWidth;
    const h = c.canvasHeight;

    for (let r = 0; r < this.rocks.length; r += 1) {
      const rock = this.rocks[r];
      const pad = rock.hitRadius + 14;

      for (let ix = -1; ix <= 1; ix += 1) {
        for (let iy = -1; iy <= 1; iy += 1) {
          const cx = rock.x + ix * w;
          const cy = rock.y + iy * h;
          if (!intersectsCanvasViewport(cx, cy, pad, w, h)) {
            continue;
          }

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rock.angle);
          const sorted = rock.blobs.slice().sort((a, z) => z.r - a.r);
          for (let i = 0; i < sorted.length; i += 1) {
            const b = sorted[i];
            ctx.beginPath();
            ctx.arc(b.dx, b.dy, b.r, 0, Math.PI * 2);
            ctx.fillStyle = b.fill;
            ctx.fill();
          }
          ctx.restore();
        }
      }
    }
  }
}
