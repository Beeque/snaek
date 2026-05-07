export class InputManager {
  constructor() {
    this.left = false;
    this.right = false;
    this.steering = 0;
    this.acceleration = 3.2;
    this.drag = 3.6;
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
    });

    window.addEventListener('keyup', (event) => {
      if (event.key === 'ArrowLeft') {
        this.left = false;
      }
      if (event.key === 'ArrowRight') {
        this.right = false;
      }
    });
  }

  update(dt) {
    const target = this.right ? 1 : this.left ? -1 : 0;
    if (target !== 0) {
      this.steering += target * this.acceleration * dt;
    } else if (this.steering !== 0) {
      this.steering -= Math.sign(this.steering) * this.drag * dt;
    }

    if (Math.abs(this.steering) < 0.02) {
      this.steering = 0;
    }

    this.steering = Math.max(-1, Math.min(1, this.steering));
  }

  getSteer() {
    return this.steering;
  }
}
