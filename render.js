/**
 * Kevyt utu/plasma: muutama hitaasti liikkuva radial gradient (soft-light).
 */
function drawPlayfieldPlasma(ctx, w, h, timeSec) {
  const t = timeSec;
  const scale = Math.min(w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const blobs = [
    { px: 0.16, py: 0.3, ph: 0.8, sp: 0.11, hue: 228 },
    { px: 0.74, py: 0.24, ph: 2.05, sp: 0.09, hue: 265 },
    { px: 0.52, py: 0.65, ph: 3.35, sp: 0.1, hue: 242 },
    { px: 0.3, py: 0.76, ph: 1.15, sp: 0.085, hue: 218 }
  ];
  for (let i = 0; i < blobs.length; i += 1) {
    const b = blobs[i];
    const gx = w * b.px + Math.sin(t * b.sp + b.ph) * w * 0.065;
    const gy = h * b.py + Math.cos(t * (b.sp * 0.88) + b.ph * 1.2) * h * 0.055;
    const r = scale * (0.38 + 0.05 * Math.sin(t * 0.065 + i));
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
    g.addColorStop(0, `hsla(${b.hue}, 32%, 56%, 0.055)`);
    g.addColorStop(0.5, `hsla(${b.hue + 22}, 24%, 50%, 0.028)`);
    g.addColorStop(1, 'hsla(230, 18%, 42%, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const cx = w * 0.52 + Math.sin(t * 0.042) * w * 0.12;
  const cy = h * 0.46 + Math.cos(t * 0.038) * h * 0.1;
  const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.92);
  g2.addColorStop(0, 'rgba(255, 255, 255, 0.018)');
  g2.addColorStop(0.55, 'rgba(72, 82, 108, 0.032)');
  g2.addColorStop(1, 'rgba(20, 22, 28, 0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawOrbToroidal(ctx, x, y, radius, canvasWidth, canvasHeight, fillStyle, strokeStyle = null) {
  ctx.fillStyle = fillStyle;
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2;
  }
  for (let ix = -1; ix <= 1; ix += 1) {
    for (let iy = -1; iy <= 1; iy += 1) {
      const cx = x + ix * canvasWidth;
      const cy = y + iy * canvasHeight;
      if (cx + radius <= 0 || cx - radius >= canvasWidth || cy + radius <= 0 || cy - radius >= canvasHeight) {
        continue;
      }
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      if (strokeStyle) {
        ctx.stroke();
      }
    }
  }
}

export function drawCollectibles(ctx, config, collectibles) {
  if (!collectibles) {
    return;
  }
  collectibles.getActiveOrbs().forEach((orb) => {
    const pos = collectibles.getOrbDrawPosition(orb);
    const r = collectibles.orbRadius(orb);
    if (orb.type === 'yellow') {
      drawOrbToroidal(ctx, pos.x, pos.y, r, config.canvasWidth, config.canvasHeight, config.pickupYellowColor, config.pickupYellowStroke);
    } else if (orb.type === 'green') {
      drawOrbToroidal(ctx, pos.x, pos.y, r, config.canvasWidth, config.canvasHeight, config.pickupGreenColor, config.pickupGreenStroke);
    } else {
      drawOrbToroidal(ctx, pos.x, pos.y, r, config.canvasWidth, config.canvasHeight, config.pickupBlackColor, '#1a1a1a');
    }
  });
}

function drawSnakeSegmentsToroidal(ctx, snake, canvasWidth, canvasHeight) {
  snake.segments.forEach((segment) => {
    const wx = segment.x;
    const wy = segment.y;
    const r = segment.radius;
    // Raw world coords + torus copies (no per-segment % — avoids float drift and spacing bugs).
    for (let ix = -2; ix <= 2; ix += 1) {
      for (let iy = -2; iy <= 2; iy += 1) {
        const cx = wx + ix * canvasWidth;
        const cy = wy + iy * canvasHeight;
        if (cx + r <= 0 || cx - r >= canvasWidth || cy + r <= 0 || cy - r >= canvasHeight) {
          continue;
        }
        ctx.moveTo(cx + r, cy);
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
      }
    }
  });
}

export function renderFrame(ctx, config, snake, particles, collectibles, hazards, asteroidField, floatingTexts, timeSec = 0) {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, cw, ch);
  drawPlayfieldPlasma(ctx, cw, ch, timeSec);

  ctx.save();
  ctx.filter = 'blur(0.8px)';
  drawCollectibles(ctx, config, collectibles);
  ctx.restore();

  if (hazards) {
    hazards.drawWarning(ctx);
    hazards.drawFireParticles(ctx);
  }

  if (asteroidField) {
    ctx.save();
    asteroidField.draw(ctx);
    ctx.restore();
  }

  ctx.filter = 'blur(1.2px)';
  ctx.fillStyle = config.snakeColor;
  ctx.beginPath();
  drawSnakeSegmentsToroidal(ctx, snake, config.canvasWidth, config.canvasHeight);
  ctx.fill();
  ctx.filter = 'none';

  if (particles) {
    particles.draw(ctx);
  }

  if (floatingTexts) {
    floatingTexts.draw(ctx);
  }
}
