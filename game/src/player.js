// Gobble Dash — the turkey.
// One clear job: the player character's physics, animation state and hitbox.
// It knows nothing about obstacles or the farmer; the world asks it questions.

import {
  GROUND_Y, GRAVITY, JUMP_VELOCITY, DOUBLE_FLAP_VELOCITY, MAX_FALL,
  TURKEY_X,
} from './config.js';

export function createTurkey() {
  return {
    x: TURKEY_X,
    y: GROUND_Y - 52,
    vy: 0,
    w: 56,
    h: 52,
    grounded: true,
    flapsLeft: 2,
    ducking: false,
    hiding: false,
    hideTimer: 0,
    invulnerable: 0,
    runPhase: 0,
    flapPhase: 0,
    burst: 0,

    reset() {
      this.y = GROUND_Y - 52;
      this.vy = 0;
      this.grounded = true;
      this.flapsLeft = 2;
      this.ducking = false;
      this.hiding = false;
      this.hideTimer = 0;
      this.invulnerable = 0;
      this.runPhase = 0;
      this.burst = 0;
    },

    // One jump from the ground, one extra flap in the air: a turkey flies
    // badly, but it flies. Returns true when a jump actually happened.
    tryJump() {
      if (this.hiding) return false;
      if (this.grounded) {
        this.vy = JUMP_VELOCITY;
        this.grounded = false;
        this.flapsLeft = 1;
        return 'jump';
      }
      if (this.flapsLeft > 0) {
        this.vy = DOUBLE_FLAP_VELOCITY;
        this.flapsLeft -= 1;
        this.flapPhase = 0;
        return 'flap';
      }
      return false;
    },

    update(dt, input, speed) {
      this.runPhase += dt * (speed / 28);
      if (!this.grounded) this.flapPhase += dt * 14;
      if (this.invulnerable > 0) this.invulnerable -= dt;
      if (this.hideTimer > 0) {
        this.hideTimer -= dt;
        if (this.hideTimer <= 0) this.hiding = false;
      }
      this.ducking = input.duckHeld() && this.grounded && !this.hiding;

      // Burst: a short sprint, with a cooldown the world enforces via speed.
      this.burst = input.burstHeld() ? 1 : 0;

      this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);
      this.y += this.vy * dt;
      const floor = GROUND_Y - this.h;
      if (this.y >= floor) {
        this.y = floor;
        this.vy = 0;
        this.grounded = true;
        this.flapsLeft = 2;
      } else {
        this.grounded = false;
      }
    },

    hide(seconds) {
      this.hiding = true;
      this.hideTimer = seconds;
      this.vy = 0;
      this.y = GROUND_Y - this.h;
      this.grounded = true;
    },

    hurt(seconds) {
      this.invulnerable = seconds;
    },

    isHidden() {
      return this.hiding;
    },

    isInvulnerable() {
      return this.invulnerable > 0;
    },

    // The hitbox shrinks when ducking and vanishes when hidden.
    hitbox() {
      if (this.hiding) return null;
      const h = this.ducking ? this.h * 0.62 : this.h;
      return {
        x: this.x + 6,
        y: this.y + (this.h - h),
        w: this.w - 12,
        h,
      };
    },
  };
}
