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
      const speed = 80 + Math.random() * 120;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 0.2 + Math.random() * 0.25;
      const radius = segment.radius * 0.25;

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
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
}
