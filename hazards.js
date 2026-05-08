import { wrapCanvasCoord } from './snake.js';

function torusDelta(dx, dy, w, h) {
  return {
    dx: dx - Math.round(dx / w) * w,
    dy: dy - Math.round(dy / h) * h
  };
}

function torusDistance(ax, ay, bx, by, w, h) {
  const { dx, dy } = torusDelta(bx - ax, by - ay, w, h);
  return Math.hypot(dx, dy);
}

function circleRectOverlap(cx, cy, cr, rx, ry, rw, rh) {
  const nx = Math.max(rx, Math.min(cx, rx + rw));
  const ny = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < cr * cr;
}

function randRange(a, b) {
  return a + Math.random() * (b - a);
}

/**
 * Reunavarjoitus → pyyhkäisevä rintama → afterburn-partikkelit.
 */
export class HazardWaveSystem {
  constructor(config) {
    this.config = config;
    this.phase = 'idle';
    this.idleTimer = randRange(config.hazardIdleMin, config.hazardIdleMax);
    this.warningTimer = 0;
    this.direction = 'east';
    /** Johtava reunan koordinaatti (x pystyaalloille, y vaaka-aalloille). */
    this.leadingEdge = 0;
    this.embers = [];
    this.warningSparks = [];
    this.invuln = 0;
  }

  resetIdle() {
    const c = this.config;
    this.phase = 'idle';
    this.idleTimer = randRange(c.hazardIdleMin, c.hazardIdleMax);
    this.warningSparks.length = 0;
    this.embers.length = 0;
  }

  pickDirection() {
    const dirs = ['east', 'west', 'south', 'north'];
    return dirs[Math.floor(Math.random() * dirs.length)];
  }

  startWarning() {
    const c = this.config;
    this.phase = 'warning';
    this.direction = this.pickDirection();
    this.warningTimer = c.hazardWarningSeconds;
    this.warningSparks.length = 0;
    const w = c.canvasWidth;
    const h = c.canvasHeight;
    const n = c.hazardWarningSparkCount;
    for (let i = 0; i < n; i += 1) {
      let x = 0;
      let y = 0;
      if (this.direction === 'east') {
        x = randRange(0, 28);
        y = randRange(0, h);
      } else if (this.direction === 'west') {
        x = randRange(w - 28, w);
        y = randRange(0, h);
      } else if (this.direction === 'south') {
        x = randRange(0, w);
        y = randRange(0, 28);
      } else {
        x = randRange(0, w);
        y = randRange(h - 28, h);
      }
      this.warningSparks.push({
        x,
        y,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.45 ? 'red' : 'orange'
      });
    }
  }

  startSweep() {
    const c = this.config;
    const w = c.canvasWidth;
    const h = c.canvasHeight;
    const t = c.hazardWaveThickness;
    this.phase = 'sweep';
    this.invuln = 0;
    if (this.direction === 'east') {
      this.leadingEdge = -t;
    } else if (this.direction === 'west') {
      this.leadingEdge = w + t;
    } else if (this.direction === 'south') {
      this.leadingEdge = -t;
    } else {
      this.leadingEdge = h + t;
    }
  }

  spawnEmbers() {
    const c = this.config;
    const w = c.canvasWidth;
    const h = c.canvasHeight;
    const n = c.hazardEmberCount;
    this.embers.length = 0;
    for (let i = 0; i < n; i += 1) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      let vx = 0;
      let vy = 0;
      const base = c.hazardEmberDriftSpeed;
      if (this.direction === 'east') {
        vx = -randRange(base * 0.4, base * 1.4);
        vy = randRange(-55, 55);
      } else if (this.direction === 'west') {
        vx = randRange(base * 0.4, base * 1.4);
        vy = randRange(-55, 55);
      } else if (this.direction === 'south') {
        vy = -randRange(base * 0.4, base * 1.4);
        vx = randRange(-55, 55);
      } else {
        vy = randRange(base * 0.4, base * 1.4);
        vx = randRange(-55, 55);
      }
      const life = randRange(c.hazardEmberLifeMin, c.hazardEmberLifeMax);
      const hot = Math.random() > 0.55;
      this.embers.push({
        x,
        y,
        vx,
        vy,
        life,
        maxLife: life,
        r: randRange(c.hazardEmberRadiusMin, c.hazardEmberRadiusMax),
        hot
      });
    }
  }

  sweepBandRect() {
    const c = this.config;
    const w = c.canvasWidth;
    const h = c.canvasHeight;
    const t = c.hazardWaveThickness;
    const lead = this.leadingEdge;
    if (this.direction === 'east') {
      return { rx: lead, ry: 0, rw: t, rh: h };
    }
    if (this.direction === 'west') {
      return { rx: lead - t, ry: 0, rw: t, rh: h };
    }
    if (this.direction === 'south') {
      return { rx: 0, ry: lead, rw: w, rh: t };
    }
    return { rx: 0, ry: lead - t, rw: w, rh: t };
  }

  sweepFinished() {
    const c = this.config;
    const w = c.canvasWidth;
    const h = c.canvasHeight;
    const t = c.hazardWaveThickness;
    const lead = this.leadingEdge;
    if (this.direction === 'east') return lead > w + t;
    if (this.direction === 'west') return lead < -t;
    if (this.direction === 'south') return lead > h + t;
    return lead < -t;
  }

  advanceSweep(dt) {
    const c = this.config;
    const sp = c.hazardSweepSpeed * dt;
    if (this.direction === 'east') {
      this.leadingEdge += sp;
    } else if (this.direction === 'west') {
      this.leadingEdge -= sp;
    } else if (this.direction === 'south') {
      this.leadingEdge += sp;
    } else {
      this.leadingEdge -= sp;
    }
  }

  applyWaveDamage(snake, damageAcc) {
    const c = this.config;
    const { rx, ry, rw, rh } = this.sweepBandRect();
    let add = 0;
    if (this.invuln > 0) {
      return damageAcc;
    }
    for (let i = 0; i < snake.segments.length; i += 1) {
      const seg = snake.segments[i];
      const sx = wrapCanvasCoord(seg.x, c.canvasWidth);
      const sy = wrapCanvasCoord(seg.y, c.canvasHeight);
      if (circleRectOverlap(sx, sy, seg.radius, rx, ry, rw, rh)) {
        add += c.hazardWaveDamage;
        break;
      }
    }
    if (add > 0) {
      this.invuln = c.hazardDamageCooldown;
    }
    return damageAcc + add;
  }

  applyEmberDamage(snake, damageAcc) {
    const c = this.config;
    const w = c.canvasWidth;
    const h = c.canvasHeight;
    if (this.invuln > 0 || this.embers.length === 0) {
      return damageAcc;
    }
    let hit = false;
    for (let e = 0; e < this.embers.length; e += 1) {
      const em = this.embers[e];
      if (em.life <= 0) continue;
      for (let s = 0; s < snake.segments.length; s += 1) {
        const seg = snake.segments[s];
        const sx = wrapCanvasCoord(seg.x, w);
        const sy = wrapCanvasCoord(seg.y, h);
        const d = torusDistance(sx, sy, em.x, em.y, w, h);
        if (d < seg.radius + em.r - 1) {
          hit = true;
          break;
        }
      }
      if (hit) break;
    }
    if (hit) {
      this.invuln = c.hazardDamageCooldown;
      return damageAcc + c.hazardEmberDamage;
    }
    return damageAcc;
  }

  /**
   * @returns {number} Vahinkoa terveyteen (yhteensä tältä framelta).
   */
  update(dt, snake) {
    const c = this.config;
    this.invuln = Math.max(0, this.invuln - dt);
    let damage = 0;

    if (this.phase === 'idle') {
      this.idleTimer -= dt;
      if (this.idleTimer <= 0) {
        this.startWarning();
      }
      return damage;
    }

    if (this.phase === 'warning') {
      this.warningTimer -= dt;
      if (this.warningTimer <= 0) {
        this.startSweep();
      }
      return damage;
    }

    if (this.phase === 'sweep') {
      damage = this.applyWaveDamage(snake, damage);
      this.advanceSweep(dt);
      if (this.sweepFinished()) {
        this.spawnEmbers();
        this.phase = 'embers';
      }
      return damage;
    }

    // embers
    damage = this.applyEmberDamage(snake, damage);
    let alive = 0;
    for (let i = 0; i < this.embers.length; i += 1) {
      const em = this.embers[i];
      em.life -= dt;
      if (em.life <= 0) continue;
      alive += 1;
      em.x += em.vx * dt;
      em.y += em.vy * dt;
      em.vx *= 1 - c.hazardEmberDrag * dt;
      em.vy *= 1 - c.hazardEmberDrag * dt;
      em.x = wrapCanvasCoord(em.x, c.canvasWidth);
      em.y = wrapCanvasCoord(em.y, c.canvasHeight);
    }
    if (alive === 0) {
      this.resetIdle();
    }
    return damage;
  }

  drawBackdrop(ctx) {
    const c = this.config;
    const w = c.canvasWidth;
    const h = c.canvasHeight;

    if (this.phase === 'warning') {
      const pulse = 0.35 + 0.35 * Math.sin(Date.now() / 120 + this.warningTimer * 8);
      ctx.save();
      ctx.globalAlpha = pulse * 0.55;
      if (this.direction === 'east') {
        const g = ctx.createLinearGradient(0, 0, 52, 0);
        g.addColorStop(0, 'rgba(220,40,20,0.95)');
        g.addColorStop(1, 'rgba(255,140,40,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 52, h);
      } else if (this.direction === 'west') {
        const g = ctx.createLinearGradient(w, 0, w - 52, 0);
        g.addColorStop(0, 'rgba(220,40,20,0.95)');
        g.addColorStop(1, 'rgba(255,140,40,0)');
        ctx.fillStyle = g;
        ctx.fillRect(w - 52, 0, 52, h);
      } else if (this.direction === 'south') {
        const g = ctx.createLinearGradient(0, 0, 0, 52);
        g.addColorStop(0, 'rgba(220,40,20,0.95)');
        g.addColorStop(1, 'rgba(255,140,40,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, 52);
      } else {
        const g = ctx.createLinearGradient(0, h, 0, h - 52);
        g.addColorStop(0, 'rgba(220,40,20,0.95)');
        g.addColorStop(1, 'rgba(255,140,40,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, h - 52, w, 52);
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.85;
      this.warningSparks.forEach((sp) => {
        const bob = Math.sin(Date.now() / 200 + sp.phase) * 3;
        ctx.fillStyle = sp.hue === 'red' ? '#ff3322' : '#ff8800';
        ctx.beginPath();
        ctx.arc(sp.x, sp.y + bob, 3 + Math.sin(sp.phase + Date.now() / 150), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    if (this.phase === 'sweep') {
      const { rx, ry, rw, rh } = this.sweepBandRect();
      ctx.save();
      ctx.globalAlpha = 0.72;
      const grd = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
      grd.addColorStop(0, 'rgba(255,60,30,0.95)');
      grd.addColorStop(0.45, 'rgba(255,160,40,0.85)');
      grd.addColorStop(1, 'rgba(255,220,120,0.35)');
      ctx.fillStyle = grd;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = 'rgba(255,255,220,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2);
      ctx.restore();
    }
  }

  drawEmbers(ctx) {
    if (this.phase !== 'embers') {
      return;
    }
    ctx.save();
    this.embers.forEach((em) => {
      if (em.life <= 0) return;
      const a = (em.life / em.maxLife) * 0.9;
      ctx.globalAlpha = a;
      ctx.fillStyle = em.hot ? '#ff4418' : '#ff9500';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(em.x, em.y, em.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}
