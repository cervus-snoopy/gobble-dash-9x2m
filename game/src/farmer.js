// Gobble Dash — the farmer.
// One clear job: the chaser's AI. He runs behind the turkey, closes in when
// the turkey stumbles, searches when the turkey hides, and grabs the turkey
// when the gap closes. He never teleports: the gap is a real distance.

import { GROUND_Y, FARMER_NEAR_WARN } from './config.js';

export function createFarmer() {
  return {
    gap: 260,
    x: -80,
    state: 'chase', // chase | search | grab
    searchTimer: 0,
    runPhase: 0,
    y: GROUND_Y - 78,

    reset(startGap) {
      this.gap = startGap;
      this.state = 'chase';
      this.searchTimer = 0;
      this.x = -80;
    },

    // The turkey did something bad: the farmer gains ground.
    closeIn(amount) {
      if (this.state === 'search') return;
      this.gap = Math.max(0, this.gap - amount);
    },

    // The turkey did something clever: the farmer loses ground.
    fallBack(amount) {
      this.gap = Math.min(420, this.gap + amount);
    },

    // The turkey vanished into a haystack: the farmer stops, looks around,
    // then gives up and drifts back.
    startSearch(seconds) {
      if (this.state === 'search') return;
      this.state = 'search';
      this.searchTimer = seconds;
    },

    update(dt, turkeyHidden) {
      this.runPhase += dt * 11;
      if (this.state === 'search') {
        this.searchTimer -= dt;
        if (this.searchTimer <= 0) {
          this.state = 'chase';
          this.gap = Math.min(420, this.gap + 60);
        }
        return;
      }
      if (turkeyHidden) {
        this.startSearch(1.4);
        return;
      }
      // The farmer keeps pace: he never gains on his own, he only gains
      // when the turkey stumbles. He drifts back a little when far behind,
      // so a clean run slowly opens the gap again.
      if (this.gap > 300) this.gap = Math.max(300, this.gap - 6 * dt);
      // Screen position: the gap maps to pixels behind the turkey.
      this.x = 180 - 70 - this.gap;
    },

    isNear() {
      return this.gap < FARMER_NEAR_WARN && this.state !== 'search';
    },

    hasCaught() {
      return this.gap <= 0 && this.state !== 'search';
    },

    isSearching() {
      return this.state === 'search';
    },

    hitbox() {
      if (this.x < -120) return null;
      return { x: this.x + 8, y: this.y + 4, w: 52, h: 74 };
    },
  };
}
