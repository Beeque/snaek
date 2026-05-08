export class InputManager {
  constructor() {
    this.left = false;
    this.right = false;
    this.up = false;
    this.paused = false;
    this.steering = 0;
    this.rapidAccel = 22;
    this.smoothAccel = 16;
    this.wasUpLastFrame = false;
    this.boostPressedEdge = false;
    this.motionEnabled = false;
    this.motionSupported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
    this.tiltGamma = 0;
    this.tiltDeadzoneDeg = 3;
    this.maxSteerTiltDeg = 32;
    this.boostStartTiltDeg = 17;
    this.maxBoostTiltDeg = 46;
    this.mobileSteering = 0;
    this.mobileBoostAmount = 0;
    this._orientationHandler = null;
    this.attachListeners();
    this.initDeviceOrientation();
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

  initDeviceOrientation() {
    if (!this.motionSupported) {
      return;
    }
    this._orientationHandler = (event) => {
      const gamma = Number.isFinite(event.gamma) ? event.gamma : 0;
      this.tiltGamma = gamma;
    };
  }

  async enableMotionControls() {
    if (!this.motionSupported || !this._orientationHandler) {
      return false;
    }
    if (this.motionEnabled) {
      return true;
    }
    try {
      const req = window.DeviceOrientationEvent?.requestPermission;
      if (typeof req === 'function') {
        const permission = await req.call(window.DeviceOrientationEvent);
        if (permission !== 'granted') {
          return false;
        }
      }
      window.addEventListener('deviceorientation', this._orientationHandler);
      this.motionEnabled = true;
      return true;
    } catch {
      return false;
    }
  }

  isMotionAvailable() {
    return this.motionSupported;
  }

  isMotionEnabled() {
    return this.motionEnabled;
  }

  needsMotionGesture() {
    return typeof window.DeviceOrientationEvent?.requestPermission === 'function';
  }

  update(dt) {
    this.boostPressedEdge = this.up && !this.wasUpLastFrame;

    const target = this.right ? 1 : this.left ? -1 : 0;
    if (target !== 0) {
      const isNewInput = (target > 0 && this.steering >= 0) || (target < 0 && this.steering <= 0);
      const accel = isNewInput && Math.abs(this.steering) < 0.35 ? this.rapidAccel : this.smoothAccel;
      this.steering += target * accel * dt;
    } else {
      this.steering = 0;
    }

    this.steering = Math.max(-1, Math.min(1, this.steering));
    if (this.motionEnabled && target === 0) {
      const absTilt = Math.abs(this.tiltGamma);
      if (absTilt <= this.tiltDeadzoneDeg) {
        this.mobileSteering = 0;
      } else {
        const sign = this.tiltGamma >= 0 ? 1 : -1;
        const steerMag = Math.min(1, (absTilt - this.tiltDeadzoneDeg) / (this.maxSteerTiltDeg - this.tiltDeadzoneDeg));
        this.mobileSteering = sign * steerMag;
      }
      this.steering = this.mobileSteering;

      if (absTilt <= this.boostStartTiltDeg) {
        this.mobileBoostAmount = 0;
      } else {
        this.mobileBoostAmount = Math.min(
          1,
          (absTilt - this.boostStartTiltDeg) / (this.maxBoostTiltDeg - this.boostStartTiltDeg)
        );
      }
    } else {
      this.mobileBoostAmount = 0;
    }

    this.wasUpLastFrame = this.up;
  }

  getSteer() {
    return this.steering;
  }

  /** Nuoli ylös on pohjassa (raaka näppäin). */
  isBoostKeyHeld() {
    return this.up;
  }

  isBoostPressedEdge() {
    return this.boostPressedEdge;
  }

  getBoostAmount() {
    const keyBoost = this.up ? 1 : 0;
    return Math.max(keyBoost, this.mobileBoostAmount);
  }

  isPaused() {
    return this.paused;
  }
}
