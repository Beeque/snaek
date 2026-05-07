export function renderFrame(ctx, config, snake) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = config.snakeColor;
  ctx.beginPath();
  snake.segments.forEach((segment, index) => {
    ctx.moveTo(segment.x + segment.radius, segment.y);
    ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
  });
  ctx.fill();
}
