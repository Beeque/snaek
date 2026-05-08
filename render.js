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

export function renderFrame(ctx, config, snake, particles, collectibles, hazards, asteroidField, floatingTexts) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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
