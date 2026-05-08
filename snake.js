/** Normalizes coordinate to [0, extent). */
export function wrapCanvasCoord(value, extent) {
  let v = value % extent;
  if (v < 0) v += extent;
  return v;
}

/** Shortest difference on a torus (same extent as canvas width/height). */
export function shortestTorusDelta(delta, extent) {
  if (delta > extent / 2) return delta - extent;
  if (delta < -extent / 2) return delta + extent;
  return delta;
}

export class Snake {
  constructor(config) {
    this.config = config;
    this.head = {
      x: config.canvasWidth * 0.5,
      y: config.canvasHeight * 0.5,
      angle: -Math.PI / 2,
      baseAngle: -Math.PI / 2
    };
    this.speed = config.baseSpeed;
    this.turnVelocity = 0;
    this.path = [{ x: this.head.x, y: this.head.y }];
    this.segments = Array.from({ length: config.segmentCount }, (_, index) => ({
      x: this.head.x,
      y: this.head.y,
      radius: config.headRadius * Math.pow(config.radiusFalloff, index)
    }));
  }

  setSpeed(newSpeed) {
    this.speed = newSpeed;
  }

  update(dt, steer) {
    const config = this.config;
    const targetTurn = steer * config.maxTurnSpeed * (Math.PI / 180);
    const deltaTurn = targetTurn - this.turnVelocity;
    const maxChange = config.turnAcceleration * (Math.PI / 180) * dt;
    this.turnVelocity += Math.max(-maxChange, Math.min(maxChange, deltaTurn));
    this.turnVelocity *= 1 - Math.min(0.95, config.turnDrag * dt * 0.25);

    this.head.baseAngle += this.turnVelocity * dt;
    const waveOffset = Math.sin(Date.now() / 1000 * config.waveFrequency * Math.PI * 2) * (config.waveAmplitude * (Math.PI / 180));
    this.head.angle = this.head.baseAngle + waveOffset;

    this.head.x += Math.cos(this.head.angle) * this.speed * dt;
    this.head.y += Math.sin(this.head.angle) * this.speed * dt;

    // Wrap around screen edges (position stays in [0, canvas] for collision/UI)
    if (this.head.x < 0) this.head.x += config.canvasWidth;
    else if (this.head.x > config.canvasWidth) this.head.x -= config.canvasWidth;
    if (this.head.y < 0) this.head.y += config.canvasHeight;
    else if (this.head.y > config.canvasHeight) this.head.y -= config.canvasHeight;

    this.addPathPoint({ x: this.head.x, y: this.head.y });
    if (this.path.length > 800) {
      this.path.length = 800;
    }

    this.updateSegments();
  }

  updateSegments() {
    const config = this.config;
    const spacing = config.segmentSpacing;
    let pathIndex = 0;
    let traveled = 0;

    for (let index = 0; index < this.segments.length; index++) {
      const segment = this.segments[index];
      const targetDistance = index * spacing;
      traveled = 0;
      pathIndex = 0;

      while (pathIndex < this.path.length - 1 && traveled + this.getSegmentDistance(pathIndex) < targetDistance) {
        traveled += this.getSegmentDistance(pathIndex);
        pathIndex += 1;
      }

      const from = this.path[pathIndex];
      const to = this.path[Math.min(pathIndex + 1, this.path.length - 1)];
      const segmentDistance = this.getSegmentDistance(pathIndex) || 1;
      const ratio = Math.min(1, Math.max(0, (targetDistance - traveled) / segmentDistance));

      let dx = to.x - from.x;
      if (Math.abs(dx) > config.canvasWidth / 2) {
        dx = dx > 0 ? dx - config.canvasWidth : dx + config.canvasWidth;
      }
      let dy = to.y - from.y;
      if (Math.abs(dy) > config.canvasHeight / 2) {
        dy = dy > 0 ? dy - config.canvasHeight : dy + config.canvasHeight;
      }

      segment.x = from.x + dx * ratio;
      segment.y = from.y + dy * ratio;

      segment.radius = config.headRadius * Math.pow(config.radiusFalloff, index);
    }
  }

  getSegmentDistance(index) {
    const current = this.path[index];
    const next = this.path[index + 1];
    if (!current || !next) {
      return 0;
    }
    const w = this.config.canvasWidth;
    const h = this.config.canvasHeight;
    const dx = shortestTorusDelta(next.x - current.x, w);
    const dy = shortestTorusDelta(next.y - current.y, h);
    return Math.hypot(dx, dy);
  }

  addPathPoint(point) {
    const config = this.config;
    const w = config.canvasWidth;
    const h = config.canvasHeight;
    const last = this.path[0];
    let dx = point.x - last.x;
    let dy = point.y - last.y;
    dx = shortestTorusDelta(dx, w);
    dy = shortestTorusDelta(dy, h);

    const distance = Math.hypot(dx, dy);
    if (distance < 0.1) {
      return;
    }

    const stepSize = 4;
    const steps = Math.max(1, Math.ceil(distance / stepSize));
    for (let i = 1; i <= steps; i += 1) {
      const ratio = i / steps;
      this.path.unshift({
        x: last.x + dx * ratio,
        y: last.y + dy * ratio
      });
    }
  }
}
