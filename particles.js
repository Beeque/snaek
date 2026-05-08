import { wrapCanvasCoord } from './snake.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
    /** Vakaa emit-taajuus pickup-partikkeleille (ei pelkkää random * dt). */
    this._pickupParticleCarry = 0;
  }

  emit(x, y, vx, vy, life, radius, color = '#000000', grav = null, kind = null, sparkle = null) {
    this.particles.push({
      x,
      y,
      vx,
      vy,
      life,
      maxLife: life,
      radius,
      color,
      grav,
      kind,
      sparkle
    });
  }

  emitFromSnake(segment, config) {
    if (Math.random() > 0.7) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 40;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 0.3 + Math.random() * 0.3;
      const radius = segment.radius * 0.5;
      const x = wrapCanvasCoord(segment.x, config.canvasWidth);
      const y = wrapCanvasCoord(segment.y, config.canvasHeight);
      this.emit(x, y, vx, vy, life, radius);
    }
  }

  emitFromPickupOrbs(collectibles, config, dt) {
    const orbs = collectibles.getActiveOrbs();
    if (orbs.length === 0) {
      return;
    }
    const orb = orbs[0];
    const rate =
      orb.type === 'yellow'
        ? config.orbParticleRateYellow
        : orb.type === 'green'
          ? config.orbParticleRateGreen
          : config.orbParticleRateBlack;
    this._pickupParticleCarry += rate * dt;
    while (this._pickupParticleCarry >= 1) {
      this._pickupParticleCarry -= 1;
      const { x, y } = collectibles.getOrbCollisionXY(orb);
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 22;
      const vx = Math.cos(angle) * speed;
      const vyOff = orb.type === 'yellow' ? 14 : orb.type === 'green' ? 10 : 8;
      const vy = Math.sin(angle) * speed - vyOff;
      const life = 0.45 + Math.random() * 0.55;
      if (orb.type === 'yellow') {
        const r = config.orbParticleRadiusYellow + Math.random() * 1;
        this.emit(x, y, vx, vy, life, r, '#FFD700', 18, 'pickup');
      } else if (orb.type === 'green') {
        const r = config.orbParticleRadiusGreen + Math.random() * 0.9;
        const shade = Math.random() > 0.4 ? '#34d17c' : '#27ae60';
        this.emit(x, y, vx * 0.92, vy * 0.92, life, r, shade, 20, 'pickup');
      } else {
        const r = config.orbParticleRadiusBlack + Math.random() * 0.9;
        const shade = Math.random() > 0.45 ? '#696969' : '#585858';
        this.emit(x, y, vx * 0.9, vy * 0.9, life, r, shade, 24, 'pickup');
      }
    }
  }

  emitBoostParticles(segment, config, count = 2) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 15 + Math.random() * 25;  // Pienempi nopeus
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 1.2 + Math.random() * 0.8;  // Pidempi elinikä vilkkumiselle
      const radius = segment.radius * 0.08;  // Paljon pienempi

      const x = wrapCanvasCoord(segment.x, config.canvasWidth);
      const y = wrapCanvasCoord(segment.y, config.canvasHeight);
      this.emit(x, y, vx, vy, life, radius, '#FFD700');
    }
  }

  update(dt) {
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.grav ?? 50) * dt;
      return p.life > 0;
    });
  }

  draw(ctx) {
    this.particles.forEach((p) => {
      const alpha = Math.max(0, p.life / p.maxLife);
      // Kultaisille partikkeleille vilkkumisefekti
      let finalAlpha = alpha * 0.6;
      if (p.kind === 'pickup') {
        finalAlpha = alpha * 0.88;
      } else if (p.kind === 'asteroidDebris') {
        finalAlpha = alpha * 0.5;
      } else if (p.kind === 'asteroidSpark') {
        const sp = p.sparkle?.speed ?? 10;
        const ph = p.sparkle?.phase ?? 0;
        const twinkleFactor = 0.28 + 0.72 * (0.5 + 0.5 * Math.sin(Date.now() / 1000 * sp + ph));
        finalAlpha = alpha * 0.92 * twinkleFactor;
      } else if (p.color === '#FFD700') {
        // Vilkkuminen sin-funktion avulla
        const twinkleFactor = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(Date.now() / 100));
        finalAlpha = alpha * 0.8 * twinkleFactor;
      }
      ctx.globalAlpha = finalAlpha;
      if (p.kind === 'asteroidSpark') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}
