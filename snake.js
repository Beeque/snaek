/** Normalizes coordinate to [0, extent). */
export function wrapCanvasCoord(value, extent) {
  let v = value % extent;
  if (v < 0) v += extent;
  return v;
}

export class Snake {
  constructor(config) {
    this.config = config;
    const halfW = config.canvasWidth * 0.5;
    const halfH = config.canvasHeight * 0.5;
    this.head = {
      x: halfW,
      y: halfH,
      /** Continuous position for path + segments (not wrapped). */
      worldX: halfW,
      worldY: halfH,
      angle: -Math.PI / 2,
      baseAngle: -Math.PI / 2
    };
    this.speed = config.baseSpeed;
    this.turnVelocity = 0;
    this.path = [{ x: this.head.worldX, y: this.head.worldY }];
    this.segments = Array.from({ length: config.segmentCount }, (_, index) => ({
      x: this.head.worldX,
      y: this.head.worldY,
      radius: config.headRadius * Math.pow(config.radiusFalloff, index)
    }));
  }

  setSpeed(newSpeed) {
    this.speed = newSpeed;
  }

  /** Adds tail segments at the current tail position; radii refresh next updateSegments. */
  grow(count = 1) {
    const config = this.config;
    const tail = this.segments[this.segments.length - 1];
    for (let k = 0; k < count; k += 1) {
      const index = this.segments.length;
      this.segments.push({
        x: tail.x,
        y: tail.y,
        radius: config.headRadius * Math.pow(config.radiusFalloff, index)
      });
    }
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

    this.head.worldX += Math.cos(this.head.angle) * this.speed * dt;
    this.head.worldY += Math.sin(this.head.angle) * this.speed * dt;

    this.head.x = wrapCanvasCoord(this.head.worldX, config.canvasWidth);
    this.head.y = wrapCanvasCoord(this.head.worldY, config.canvasHeight);

    this.addPathPoint({ x: this.head.worldX, y: this.head.worldY });
    if (this.path.length > 800) {
      this.path.length = 800;
    }

    this.rebaseWorldNearOrigin();
    this.updateSegments();
  }

  /**
   * Shift all world coordinates by whole periods so numbers stay small.
   * Keeps float math stable and lets the renderer use raw world coords + torus copies.
   */
  rebaseWorldNearOrigin() {
    const w = this.config.canvasWidth;
    const h = this.config.canvasHeight;
    const ox = Math.floor(this.head.worldX / w) * w;
    const oy = Math.floor(this.head.worldY / h) * h;
    if (ox === 0 && oy === 0) {
      return;
    }
    this.head.worldX -= ox;
    this.head.worldY -= oy;
    for (let i = 0; i < this.path.length; i += 1) {
      this.path[i].x -= ox;
      this.path[i].y -= oy;
    }
    for (let i = 0; i < this.segments.length; i += 1) {
      this.segments[i].x -= ox;
      this.segments[i].y -= oy;
    }
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

      const dx = to.x - from.x;
      const dy = to.y - from.y;

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
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    return Math.hypot(dx, dy);
  }

  addPathPoint(point) {
    const last = this.path[0];
    const dx = point.x - last.x;
    const dy = point.y - last.y;

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
