export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, vx, vy, life, radius, color = '#000000') {
    this.particles.push({
      x,
      y,
      vx,
      vy,
      life,
      maxLife: life,
      radius,
      color
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
      
      this.emit(segment.x, segment.y, vx, vy, life, radius);
    }
  }

  emitBoostParticles(segment, count = 2) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 15 + Math.random() * 25;  // Pienempi nopeus
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 1.2 + Math.random() * 0.8;  // Pidempi elinikä vilkkumiselle
      const radius = segment.radius * 0.08;  // Paljon pienempi

      this.emit(segment.x, segment.y, vx, vy, life, radius, '#FFD700');
    }
  }

  update(dt) {
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 50 * dt;
      return p.life > 0;
    });
  }

  draw(ctx) {
    this.particles.forEach((p) => {
      const alpha = Math.max(0, p.life / p.maxLife);
      // Kultaisille partikkeleille vilkkumisefekti
      let finalAlpha = alpha * 0.6;
      if (p.color === '#FFD700') {
        // Vilkkuminen sin-funktion avulla
        const twinkleFactor = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(Date.now() / 100));
        finalAlpha = alpha * 0.8 * twinkleFactor;
      }
      ctx.globalAlpha = finalAlpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
}
