// Gobble Dash — the game loop and state machine.
// One clear job: own the screens (title, playing, paused, caught, escaped),
// run the loop, and hand each frame to the renderer. It holds no art and
// no physics of its own.

import { VIEW_W, VIEW_H, GROUND_Y, FARMER_START_GAP, ESCAPE_DISTANCE_M } from './config.js';
import { mulberry32 } from './random.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createTurkey } from './player.js';
import { createFarmer } from './farmer.js';
import { createWorld, updateWorld } from './world.js';
import {
  drawBackground, drawTurkey, drawFarmer, drawWorld, drawHUD,
  drawTitle, drawPaused, drawCaught, drawEscaped,
} from './render.js';

const BEST_KEY = 'gobble-dash-best';

function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score) {
  try {
    localStorage.setItem(BEST_KEY, String(Math.floor(score)));
  } catch {
    // Storage may be unavailable; the score still counts for this run.
  }
}

function pointInButton(p, b) {
  return b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}

export function startGame(canvas) {
  const ctx = canvas.getContext('2d');
  const params = new URLSearchParams(window.location.search);
  const seed = Number(params.get('seed') || 20261127);
  const rng = mulberry32(seed);

  const input = createInput(canvas);
  const audio = createAudio();
  const turkey = createTurkey();
  const farmer = createFarmer();
  const world = createWorld(rng);

  let state = 'title'; // title | playing | paused | caught | escaped
  let scroll = 0;
  let best = loadBest();
  let button = null;
  let last = performance.now();

  function resetRun() {
    turkey.reset();
    farmer.reset(FARMER_START_GAP);
    world.reset();
    scroll = 0;
    state = 'playing';
    audio.gobble();
  }

  // Screenshot hook: ?shot=title|play|caught|escaped|hide stages a real
  // scene of the game itself, so the maker can capture honest screenshots.
  function applyShot() {
    const shot = params.get('shot');
    if (!shot) return;
    if (shot === 'play' || shot === 'hide') {
      resetRun();
      const stubAudio = { gobble() {}, fanfare() {}, pickup() {}, pie() {}, hit() {}, alarm() {}, caught() {} };
      const stubInput = { hidePressed: () => false };
      // Fast-forward the world with a competent auto-player: jump when an
      // obstacle is close, flap at the apex to stretch the jump over wide
      // obstacles (a puddle is 90 px across — one jump alone lands in it).
      for (let i = 0; i < 300; i++) {
        const fakeDt = 1 / 60;
        const near = world.obstacles.find((o) => o.x > turkey.x + 30 && o.x < turkey.x + 170);
        if (near && turkey.grounded) turkey.tryJump();
        const over = world.obstacles.find((o) => o.x > turkey.x - 20 && o.x < turkey.x + 100);
        if (over && !turkey.grounded && turkey.vy > -150 && turkey.flapsLeft > 0) turkey.tryJump();
        turkey.update(fakeDt, { duckHeld: () => false, burstHeld: () => false }, world.speed());
        farmer.update(fakeDt, false);
        updateWorld(world, fakeDt, turkey, farmer, stubAudio, stubInput);
        scroll += world.speed() * fakeDt;
        if (world.over || world.escaped) break;
      }
      // Stage the chase: the farmer visible at the left edge, the turkey
      // mid-flap over the next obstacle — posed, not left to wherever the
      // fast-forward's last jump happened to land. The farmer's drawn
      // position is derived from his gap, so sync it too.
      farmer.gap = 110;
      farmer.x = 180 - 70 - farmer.gap;
      turkey.y = GROUND_Y - turkey.h - 110;
      turkey.vy = -200;
      turkey.grounded = false;
      turkey.flapPhase = 0.3;
      if (shot === 'hide') {
        const stack = world.haystacks.find((h) => h.x > 100 && h.x < 700);
        if (stack) {
          turkey.x = stack.x + 20;
          turkey.hide(9);
          farmer.startSearch(9);
        }
      }
    } else if (shot === 'caught') {
      resetRun();
      world.lives = 0;
      world.over = true;
      world.overReason = 'CAUGHT BY THE FARMER';
      world.score = 1240;
      world.distanceM = 742;
      world.stageIndex = 1;
      state = 'caught';
    } else if (shot === 'escaped') {
      resetRun();
      world.escaped = true;
      world.score = 2680;
      world.distanceM = ESCAPE_DISTANCE_M;
      world.stageIndex = 2;
      state = 'escaped';
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // A staged screenshot (?shot=…) freezes after staging: the frame the
    // maker captures is the staged one, not a second of unattended play.
    const frozen = params.has('shot');

    if (input.mutePressed()) audio.toggleMute();

    if (!frozen) {
    if (state === 'title') {
      if (input.confirmPressed()) {
        audio.unlock();
        resetRun();
      }
    } else if (state === 'playing') {
      if (input.pausePressed()) {
        state = 'paused';
      } else {
        if (input.jumpPressed()) {
          const kind = turkey.tryJump();
          if (kind === 'jump') audio.jump();
          else if (kind === 'flap') audio.flap();
        }
        const speed = world.speed() * (turkey.burst ? 1.55 : 1);
        turkey.update(dt, input, speed);
        farmer.update(dt, turkey.isHidden());
        updateWorld(world, dt, turkey, farmer, audio, input);
        scroll += speed * dt;
        if (world.over) {
          state = 'caught';
          if (Math.floor(world.score) > best) {
            best = Math.floor(world.score);
            saveBest(best);
          }
        } else if (world.escaped) {
          state = 'escaped';
          if (Math.floor(world.score) > best) {
            best = Math.floor(world.score);
            saveBest(best);
          }
        }
      }
    } else if (state === 'paused') {
      if (input.pausePressed() || input.confirmPressed()) state = 'playing';
    } else if (state === 'caught' || state === 'escaped') {
      if (input.confirmPressed()) {
        const p = input.pointer();
        if (button && pointInButton(p, button)) {
          audio.unlock();
          resetRun();
        } else if (input.jumpPressed()) {
          audio.unlock();
          resetRun();
        }
      }
    }
    } // !frozen

    render();
    input.endFrame();
    requestAnimationFrame(frame);
  }

  function render() {
    ctx.save();
    if (world.shake > 0) {
      ctx.translate((Math.random() - 0.5) * world.shake * 8, (Math.random() - 0.5) * world.shake * 8);
    }
    drawBackground(ctx, world.stageIndex, scroll);
    if (state !== 'title') {
      drawWorld(ctx, world);
      drawFarmer(ctx, farmer);
      drawTurkey(ctx, turkey);
      drawHUD(ctx, world, farmer);
    }
    if (state === 'title') {
      button = drawTitle(ctx, best);
    } else if (state === 'paused') {
      drawPaused(ctx);
    } else if (state === 'caught') {
      button = drawCaught(ctx, world);
    } else if (state === 'escaped') {
      button = drawEscaped(ctx, world);
    }
    ctx.restore();
  }

  applyShot();
  requestAnimationFrame(frame);
}
