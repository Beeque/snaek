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

export function renderFrame(ctx, config, snake, particles) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.filter = 'blur(1.2px)';
  ctx.fillStyle = config.snakeColor;
  ctx.beginPath();
  drawSnakeSegmentsToroidal(ctx, snake, config.canvasWidth, config.canvasHeight);
  ctx.fill();
  ctx.filter = 'none';

  if (particles) {
    particles.draw(ctx);
  }
}
