/** Lyhyet leijuvat tekstit (pisteet, vahinko). */
export class FloatingTexts {
  constructor() {
    this.items = [];
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {string} text
   * @param {string} color CSS väri
   * @param {number} duration sekuntia
   */
  add(x, y, text, color, duration = 0.85) {
    this.items.push({
      x,
      y,
      text,
      color,
      duration,
      maxDur: duration,
      vy: -42 - Math.random() * 18,
      vx: (Math.random() - 0.5) * 28
    });
  }

  update(dt) {
    this.items.forEach((it) => {
      it.duration -= dt;
      it.x += it.vx * dt;
      it.y += it.vy * dt;
      it.vy *= 1 - 1.2 * dt;
    });
    this.items = this.items.filter((it) => it.duration > 0);
  }

  draw(ctx) {
    if (this.items.length === 0) {
      return;
    }
    ctx.save();
    ctx.font = 'bold 23px system-ui, Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.items.forEach((it) => {
      const tFade = it.maxDur * 0.35;
      let alpha = 1;
      if (it.duration < tFade) {
        alpha = Math.max(0, it.duration / tFade);
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = it.color;
      ctx.shadowColor = 'rgba(255,255,255,0.35)';
      ctx.shadowBlur = 4;
      ctx.fillText(it.text, it.x, it.y);
    });
    ctx.restore();
  }
}
