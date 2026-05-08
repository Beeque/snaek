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
 * Varoitus → partikkelirintama (ei suorakaiteita) → trail seuraa hieman hitaammin.
 */
export class HazardWaveSystem {
  constructor(config) {
    this.config = config;
    this.phase = 'idle';
    this.idleTimer = randRange(config.hazardIdleMin, config.hazardIdleMax);
    this.warningTimer = 0;
    this.direction = 'east';
    this.leadingEdge = 0;
    /** Kaikki tulipartikkelit: kind 'crest' vain visual, 'trail' afterburn + törmäys -1 */
    this.fireParticles = [];
    this.warningSparks = [];
    this.waveHitCd = 0;
    this.emberHitCd = 0;
  }

  resetIdle() {
    const c = this.config;
    this.phase = 'idle';
    this.idleTimer = randRange(c.hazardIdleMin, c.hazardIdleMax);
    this.warningSparks.length = 0;
    this.fireParticles.length = 0;
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
    this.waveHitCd = 0;
    this.emberHitCd = 0;
    this.fireParticles.length = 0;
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

  pushCrestParticle(x, y, vx, vy) {
    const c = this.config;
    this.fireParticles.push({
      x,
      y,
      vx,
      vy,
      life: randRange(c.hazardCrestLifeMin, c.hazardCrestLifeMax),
      maxLife: 0,
      r: randRange(c.hazardCrestRadiusMin, c.hazardCrestRadiusMax),
      hot: Math.random() > 0.4,
      kind: 'crest'
    });
    const p = this.fireParticles[this.fireParticles.length - 1];
    p.maxLife = p.life;
  }

  pushTrailParticle(x, y, vx, vy) {
    const c = this.config;
    this.fireParticles.push({
      x,
      y,
      vx,
      vy,
      life: randRange(c.hazardTrailLifeMin, c.hazardTrailLifeMax),
      maxLife: 0,
      r: randRange(c.hazardTrailRadiusMin, c.hazardTrailRadiusMax),
      hot: Math.random() > 0.5,
      kind: 'trail'
    });
    const p = this.fireParticles[this.fireParticles.length - 1];
    p.maxLife = p.life;
  }

  trimParticlesToMax() {
    const max = this.config.hazardFireParticleMax;
    while (this.fireParticles.length > max) {
      this.fireParticles.shift();
    }
  }

  spawnSweepParticles(dt) {
    const c = this.config;
    const w = c.canvasWidth;
    const h = c.canvasHeight;
    const t = c.hazardWaveThickness;
    const lead = this.leadingEdge;
    const sp = c.hazardSweepSpeed;
    const ratio = c.hazardTrailSpeedRatio;

    const sd = Math.min(dt, c.hazardSpawnDtCap ?? 0.022);
    const nCrest = Math.max(0, Math.round(c.hazardCrestSpawnRate * sd));
    const nTrail = Math.max(0, Math.round(c.hazardTrailSpawnRate * sd));

    for (let i = 0; i < nCrest; i += 1) {
      let x = 0;
      let y = 0;
      let vx = 0;
      let vy = 0;
      if (this.direction === 'east') {
        x = lead + randRange(0, t);
        y = randRange(0, h);
        vx = sp + randRange(-35, 35);
        vy = randRange(-70, 70);
      } else if (this.direction === 'west') {
        x = lead - randRange(0, t);
        y = randRange(0, h);
        vx = -sp + randRange(-35, 35);
        vy = randRange(-70, 70);
      } else if (this.direction === 'south') {
        x = randRange(0, w);
        y = lead + randRange(0, t);
        vx = randRange(-70, 70);
        vy = sp + randRange(-35, 35);
      } else {
        x = randRange(0, w);
        y = lead - randRange(0, t);
        vx = randRange(-70, 70);
        vy = -sp + randRange(-35, 35);
      }
      this.pushCrestParticle(x, y, vx, vy);
    }

    for (let j = 0; j < nTrail; j += 1) {
      let x = 0;
      let y = 0;
      let vx = 0;
      let vy = 0;
      const back = t * randRange(1.2, 2.8);
      if (this.direction === 'east') {
        x = lead - back + randRange(0, t * 0.6);
        y = randRange(0, h);
        vx = sp * ratio + randRange(-28, 28);
        vy = randRange(-65, 65);
      } else if (this.direction === 'west') {
        x = lead + back - randRange(0, t * 0.6);
        y = randRange(0, h);
        vx = -sp * ratio + randRange(-28, 28);
        vy = randRange(-65, 65);
      } else if (this.direction === 'south') {
        x = randRange(0, w);
        y = lead - back + randRange(0, t * 0.6);
        vx = randRange(-65, 65);
        vy = sp * ratio + randRange(-28, 28);
      } else {
        x = randRange(0, w);
        y = lead + back - randRange(0, t * 0.6);
        vx = randRange(-65, 65);
        vy = -sp * ratio + randRange(-28, 28);
      }
      this.pushTrailParticle(x, y, vx, vy);
    }

    this.trimParticlesToMax();
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

  applyWaveDamage(snake) {
    const c = this.config;
    const { rx, ry, rw, rh } = this.sweepBandRect();
    if (this.waveHitCd > 0) {
      return { dmg: 0, popup: false };
    }
    const headSeg = snake.segments[0];
    if (!headSeg) {
      return { dmg: 0, popup: false };
    }
    const sx = wrapCanvasCoord(headSeg.x, c.canvasWidth);
    const sy = wrapCanvasCoord(headSeg.y, c.canvasHeight);
    if (circleRectOverlap(sx, sy, headSeg.radius, rx, ry, rw, rh)) {
      this.waveHitCd = c.hazardWaveHitCooldown;
      return { dmg: c.hazardWaveDamage, popup: true };
    }
    return { dmg: 0, popup: false };
  }

  applyTrailDamage(snake) {
    const c = this.config;
    const w = c.canvasWidth;
    const h = c.canvasHeight;
    if (this.emberHitCd > 0) {
      return { dmg: 0, popup: false };
    }
    const headSeg = snake.segments[0];
    if (!headSeg) {
      return { dmg: 0, popup: false };
    }
    const sx = wrapCanvasCoord(headSeg.x, w);
    const sy = wrapCanvasCoord(headSeg.y, h);
    for (let e = 0; e < this.fireParticles.length; e += 1) {
      const em = this.fireParticles[e];
      if (em.life <= 0 || em.kind !== 'trail') continue;
      const hitR = em.r + (c.hazardTrailCollisionPad ?? 0);
      const maxD = headSeg.radius + hitR - 1;
      const maxD2 = maxD * maxD;
      if (torusDistanceSq(sx, sy, em.x, em.y, w, h) < maxD2) {
        this.emberHitCd = c.hazardEmberHitCooldown;
        return { dmg: c.hazardEmberDamage, popup: true };
      }
    }
    return { dmg: 0, popup: false };
  }

  updateFireParticles(dt) {
    const c = this.config;
    const drag = c.hazardParticleDrag;
    const arr = this.fireParticles;
    let wIdx = 0;
    for (let rIdx = 0; rIdx < arr.length; rIdx += 1) {
      const p = arr[rIdx];
      p.life -= dt;
      if (p.life <= 0) {
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - drag * dt;
      p.vy *= 1 - drag * dt;
      p.x = wrapCanvasCoord(p.x, c.canvasWidth);
      p.y = wrapCanvasCoord(p.y, c.canvasHeight);
      arr[wIdx] = p;
      wIdx += 1;
    }
    arr.length = wIdx;
    this.trimParticlesToMax();
  }

  fireParticlesAlive() {
    return this.fireParticles.some((p) => p.life > 0);
  }

  /**
   * @returns {{ damage: number, wavePopup: boolean, emberPopup: boolean }}
   */
  update(dt, snake) {
    const c = this.config;
    this.waveHitCd = Math.max(0, this.waveHitCd - dt);
    this.emberHitCd = Math.max(0, this.emberHitCd - dt);

    let damage = 0;
    let wavePopup = false;
    let emberPopup = false;

    if (this.phase === 'idle') {
      this.idleTimer -= dt;
      if (this.idleTimer <= 0) {
        this.startWarning();
      }
      return { damage, wavePopup, emberPopup };
    }

    if (this.phase === 'warning') {
      this.warningTimer -= dt;
      if (this.warningTimer <= 0) {
        this.startSweep();
      }
      return { damage, wavePopup, emberPopup };
    }

    if (this.phase === 'sweep') {
      const wv = this.applyWaveDamage(snake);
      damage += wv.dmg;
      if (wv.popup) wavePopup = true;

      this.spawnSweepParticles(dt);
      this.advanceSweep(dt);
      this.updateFireParticles(dt);

      const tr = this.applyTrailDamage(snake);
      damage += tr.dmg;
      if (tr.popup) emberPopup = true;

      if (this.sweepFinished()) {
        this.phase = 'embers';
      }
      return { damage, wavePopup, emberPopup };
    }

    const tr2 = this.applyTrailDamage(snake);
    damage += tr2.dmg;
    if (tr2.popup) emberPopup = true;

    this.updateFireParticles(dt);

    if (!this.fireParticlesAlive()) {
      this.resetIdle();
    }
    return { damage, wavePopup, emberPopup };
  }

  drawWarning(ctx) {
    if (this.phase !== 'warning') {
      return;
    }
    ctx.save();
    ctx.globalAlpha = 0.88;
    this.warningSparks.forEach((sp) => {
      const bob = Math.sin(Date.now() / 200 + sp.phase) * 3;
      ctx.fillStyle = sp.hue === 'red' ? '#ff3322' : '#ff8800';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y + bob, 3 + Math.sin(sp.phase + Date.now() / 150), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawFireParticles(ctx) {
    if (this.fireParticles.length === 0) {
      return;
    }
    const blur = this.config.hazardParticleShadowBlur ?? 0;
    ctx.save();
    if (blur > 0) {
      ctx.shadowColor = '#ff3300';
      ctx.shadowBlur = blur;
    }
    const arr = this.fireParticles;
    const pi2 = Math.PI * 2;
    for (let i = 0; i < arr.length; i += 1) {
      const p = arr[i];
      if (p.life <= 0) continue;
      const a = (p.life / p.maxLife) * (p.kind === 'crest' ? 0.92 : 0.88);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.hot ? '#ff4418' : '#ff9500';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, pi2);
      ctx.fill();
    }
    ctx.restore();
  }
}
