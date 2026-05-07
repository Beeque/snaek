export class InputManager {
  constructor() {
    this.left = false;
    this.right = false;
    this.up = false;
    this.paused = false;
    this.steering = 0;
    this.rapidAccel = 12;
    this.smoothAccel = 8;
    this.attachListeners();
  }

  attachListeners() {
    window.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        this.left = true;
      }
      if (event.key === 'ArrowRight') {
        this.right = true;
      }
      if (event.key === 'ArrowUp') {
        this.up = true;
      }
      if (event.key === ' ') {
        this.paused = !this.paused;
      }
    });

    window.addEventListener('keyup', (event) => {
      if (event.key === 'ArrowLeft') {
        this.left = false;
      }
      if (event.key === 'ArrowRight') {
        this.right = false;
      }
      if (event.key === 'ArrowUp') {
        this.up = false;
      }
    });
  }

  update(dt) {
    const target = this.right ? 1 : this.left ? -1 : 0;
    if (target !== 0) {
      const isNewInput = (target > 0 && this.steering >= 0) || (target < 0 && this.steering <= 0);
      const accel = isNewInput && Math.abs(this.steering) < 0.3 ? this.rapidAccel : this.smoothAccel;
      this.steering += target * accel * dt;
    } else {
      this.steering = 0;
    }

    this.steering = Math.max(-1, Math.min(1, this.steering));
  }

  getSteer() {
    return this.steering;
  }

  isBoostActive() {
    return this.up;
  }

  isPaused() {
    return this.paused;
  }
}
