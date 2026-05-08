/**
 * Utu/plasma: näkyvät mutta maltilliset värisävyt (screen + source-over).
 * Edellinen soft-light + hyvin matala alpha näkyi vain litteänä harmaana.
 */
function drawPlayfieldPlasma(ctx, w, h, timeSec) {
  const t = Number.isFinite(timeSec) ? timeSec : 0;
  const scale = Math.min(w, h);

  ctx.save();
  const blobs = [
    { px: 0.14, py: 0.27, ph: 0.65, sp: 0.13, hue: 236, size: 0.44 },
    { px: 0.78, py: 0.22, ph: 2.0, sp: 0.1, hue: 278, size: 0.4 },
    { px: 0.48, py: 0.68, ph: 3.2, sp: 0.11, hue: 248, size: 0.46 },
    { px: 0.28, py: 0.78, ph: 1.1, sp: 0.095, hue: 215, size: 0.38 },
    { px: 0.62, py: 0.45, ph: 4.5, sp: 0.085, hue: 262, size: 0.36 }
  ];
  for (let i = 0; i < blobs.length; i += 1) {
    const b = blobs[i];
    const gx = w * b.px + Math.sin(t * b.sp + b.ph) * w * 0.09;
    const gy = h * b.py + Math.cos(t * b.sp * 0.88 + b.ph * 1.15) * h * 0.075;
    const r = scale * b.size * (1 + 0.07 * Math.sin(t * 0.072 + i * 0.8));
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
    g.addColorStop(0, `hsla(${b.hue}, 58%, 58%, 0.26)`);
    g.addColorStop(0.38, `hsla(${b.hue + 28}, 48%, 52%, 0.14)`);
    g.addColorStop(0.72, `hsla(${b.hue}, 38%, 46%, 0.06)`);
    g.addColorStop(1, 'hsla(225, 25%, 42%, 0)');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const cores = [
    { px: 0.33, py: 0.42, ph: 0.3, sp: 0.16 },
    { px: 0.7, py: 0.55, ph: 2.8, sp: 0.14 },
    { px: 0.45, py: 0.18, ph: 5.1, sp: 0.11 }
  ];
  for (let k = 0; k < cores.length; k += 1) {
    const c = cores[k];
    const gx = w * c.px + Math.sin(t * c.sp + c.ph) * w * 0.11;
    const gy = h * c.py + Math.cos(t * (c.sp * 0.75) + c.ph * 1.4) * h * 0.09;
    const rad = scale * (0.14 + k * 0.025);
    const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
    gr.addColorStop(0, 'rgba(210, 225, 255, 0.35)');
    gr.addColorStop(0.45, 'rgba(150, 175, 235, 0.12)');
    gr.addColorStop(1, 'rgba(120, 140, 210, 0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.22;
  const vx = Math.sin(t * 0.031) * w * 0.35 + w * 0.5;
  const vy = Math.cos(t * 0.027) * h * 0.28 + h * 0.48;
  const shade = ctx.createRadialGradient(vx, vy, scale * 0.08, vx, vy, scale * 0.95);
  shade.addColorStop(0, 'rgba(255, 255, 255, 1)');
  shade.addColorStop(0.55, 'rgba(190, 195, 210, 1)');
  shade.addColorStop(1, 'rgba(85, 92, 108, 1)');
  ctx.fillStyle = shade;
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

export function renderFrame(
  ctx,
  config,
  snake,
  particles,
  collectibles,
  hazards,
  asteroidField,
  floatingTexts,
  timeSec = 0,
  worldRotation = 0
) {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, cw, ch);
  ctx.save();
  if (worldRotation !== 0) {
    ctx.translate(cw * 0.5, ch * 0.5);
    ctx.rotate(worldRotation);
    ctx.translate(-cw * 0.5, -ch * 0.5);
  }
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
  ctx.restore();
}
