// Gobble Dash — the world: spawning, collisions, score, stages.
// One clear job: everything that is not the turkey or the farmer — the
// obstacles, the corn, the stage clock and the rules that end a run.

import {
  GROUND_Y, STAGES, STAGE_LENGTH_M, ESCAPE_DISTANCE_M, PX_PER_METER,
  CORN_SCORE, GRAVY_SCORE, PIE_SCORE, STAGE_BONUS, METER_POINTS,
  FARMER_HIT_PENALTY, FARMER_CORN_BONUS, FARMER_HIDE_BONUS, MAX_LIVES,
} from './config.js';
import { range, rangeInt, pick, chance } from './random.js';

const OBSTACLE_DEFS = {
  fence: { w: 26, h: 46, y: GROUND_Y - 46, score: 0, kind: 'fence' },
  haybale: { w: 64, h: 52, y: GROUND_Y - 52, score: 0, kind: 'haybale' },
  crate: { w: 58, h: 58, y: GROUND_Y - 58, score: 0, kind: 'crate' },
  puddle: { w: 90, h: 12, y: GROUND_Y - 12, score: 0, kind: 'puddle' },
  table: { w: 120, h: 54, y: GROUND_Y - 54, score: 0, kind: 'table' },
  oven: { w: 96, h: 64, y: GROUND_Y - 64, score: 0, kind: 'oven' },
  knife: { w: 22, h: 74, y: -90, score: 0, kind: 'knife' },
};

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function createWorld(rng) {
  const world = {
    rng,
    distanceM: 0,
    score: 0,
    corn: 0,
    lives: MAX_LIVES,
    stageIndex: 0,
    stageBonusPaid: [false, false, false],
    obstacles: [],
    pickups: [],
    haystacks: [],
    spawnTimer: 0.9,
    knifeTimer: 2.2,
    floatingTexts: [],
    escaped: false,
    over: false,
    overReason: '',
    shake: 0,

    reset() {
      this.distanceM = 0;
      this.score = 0;
      this.corn = 0;
      this.lives = MAX_LIVES;
      this.stageIndex = 0;
      this.stageBonusPaid = [false, false, false];
      this.obstacles = [];
      this.pickups = [];
      this.haystacks = [];
      this.spawnTimer = 0.9;
      this.knifeTimer = 2.2;
      this.floatingTexts = [];
      this.escaped = false;
      this.over = false;
      this.overReason = '';
      this.shake = 0;
    },

    stage() {
      return STAGES[this.stageIndex];
    },

    speed() {
      const st = this.stage();
      return 265 + this.stageIndex * 26 + st.speedBonus * 8;
    },

    spawnObstacle(x) {
      const st = this.stage();
      const kind = pick(this.rng, st.obstacles);
      const def = OBSTACLE_DEFS[kind];
      const ob = { kind, x, w: def.w, h: def.h, y: def.y, hit: false, passed: false };
      if (kind === 'knife') {
        ob.vy = 0;
        ob.falling = false;
        ob.y = -90;
      }
      this.obstacles.push(ob);
      return ob;
    },

    spawnPickup(x, y, kind) {
      this.pickups.push({ kind, x, y, taken: false, bob: this.rng() * 6.28 });
    },

    spawnHaystack(x) {
      this.haystacks.push({ x, w: 84, h: 66, y: GROUND_Y - 66, used: false });
    },

    addText(x, y, text, color) {
      this.floatingTexts.push({ x, y, text, color: color || '#fff3e0', life: 1.1 });
    },
  };

  return world;
}

// The per-frame update lives outside createWorld so the file stays readable
// in two halves: state above, rules below.
export function updateWorld(world, dt, turkey, farmer, audio, input) {
  if (world.over || world.escaped) return;

  const speed = world.speed() * (turkey.burst ? 1.55 : 1);
  const dx = speed * dt;
  // Distance in meters: pixels travelled / pixels-per-meter. A full escape
  // is 1800 m, about three and a half minutes of running.
  world.distanceM = Math.min(world.distanceM + dx / PX_PER_METER, ESCAPE_DISTANCE_M + 1);

  // Stage progression.
  const nextStage = Math.min(2, Math.floor(world.distanceM / STAGE_LENGTH_M));
  if (nextStage !== world.stageIndex) {
    world.stageIndex = nextStage;
    if (!world.stageBonusPaid[nextStage]) {
      world.stageBonusPaid[nextStage] = true;
      world.score += STAGE_BONUS;
      world.addText(turkey.x + 40, 180, `STAGE ${nextStage + 1}: ${STAGES[nextStage].name}  +${STAGE_BONUS}`, '#ffd166');
      audio.gobble();
    }
  }

  if (world.distanceM >= ESCAPE_DISTANCE_M) {
    world.escaped = true;
    audio.fanfare();
    return;
  }

  // Spawning.
  const st = world.stage();
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    world.spawnTimer = range(world.rng, st.spawnEvery[1], st.spawnEvery[0]);
    const x = 1000 + range(world.rng, 0, 120);
    world.spawnObstacle(x);
    if (chance(world.rng, 0.55)) {
      world.spawnPickup(x + range(world.rng, 60, 170), GROUND_Y - rangeInt(world.rng, 90, 170), 'corn');
    }
    if (chance(world.rng, 0.14)) {
      world.spawnPickup(x + 200, GROUND_Y - 130, 'gravy');
    }
    if (chance(world.rng, 0.06)) {
      world.spawnPickup(x + 260, GROUND_Y - 150, 'pie');
    }
    if (chance(world.rng, 0.22)) {
      world.spawnHaystack(x + range(world.rng, 240, 380));
    }
  }

  // Falling knives: they drop when the turkey runs under them.
  world.knifeTimer -= dt;
  for (const ob of world.obstacles) {
    if (ob.kind !== 'knife') continue;
    if (!ob.falling && Math.abs(ob.x - turkey.x) < 120 && ob.y < 0) {
      ob.falling = true;
      ob.vy = 60;
    }
    if (ob.falling) {
      ob.vy += 2600 * dt;
      ob.y += ob.vy * dt;
      if (ob.y > GROUND_Y - ob.h) ob.y = GROUND_Y - ob.h;
    }
  }

  // Move everything left.
  for (const ob of world.obstacles) ob.x -= dx;
  for (const p of world.pickups) { p.x -= dx; p.bob += dt * 5; }
  for (const h of world.haystacks) h.x -= dx;
  world.obstacles = world.obstacles.filter((o) => o.x > -160);
  world.pickups = world.pickups.filter((p) => p.x > -60);
  world.haystacks = world.haystacks.filter((h) => h.x > -140);

  // Hiding: duck into a haystack and the farmer loses you.
  const hb = turkey.hitbox();
  if (hb && input.hidePressed()) {
    for (const h of world.haystacks) {
      if (!h.used && Math.abs(h.x + h.w / 2 - (turkey.x + 28)) < 70 && turkey.grounded) {
        h.used = true;
        turkey.hide(1.5);
        farmer.startSearch(1.4);
        farmer.fallBack(FARMER_HIDE_BONUS);
        world.addText(h.x + 10, h.y - 24, 'HIDDEN!', '#70a35a');
        audio.pickup();
        break;
      }
    }
  }

  // Collisions with obstacles.
  if (hb && !turkey.isInvulnerable()) {
    for (const ob of world.obstacles) {
      if (ob.hit) continue;
      const box = { x: ob.x + 3, y: ob.y + 2, w: ob.w - 6, h: ob.h - 4 };
      if (ob.kind === 'puddle') {
        // A puddle only trips a running turkey; a jumping one sails over.
        if (turkey.grounded && overlaps(hb, box)) {
          ob.hit = true;
          hurtTurkey(world, turkey, farmer, audio, 'TRIPPED!');
        }
        continue;
      }
      if (overlaps(hb, box)) {
        ob.hit = true;
        hurtTurkey(world, turkey, farmer, audio, 'OUCH!');
      }
    }
  }

  // Pickups.
  if (hb) {
    for (const p of world.pickups) {
      if (p.taken) continue;
      const box = { x: p.x - 14, y: p.y - 14, w: 28, h: 28 };
      if (overlaps(hb, box)) {
        p.taken = true;
        if (p.kind === 'corn') {
          world.corn += 1;
          world.score += CORN_SCORE;
          farmer.fallBack(FARMER_CORN_BONUS);
          world.addText(p.x, p.y - 18, `+${CORN_SCORE}`, '#ffd166');
          audio.pickup();
        } else if (p.kind === 'gravy') {
          world.score += GRAVY_SCORE;
          world.addText(p.x, p.y - 18, `+${GRAVY_SCORE} GRAVY!`, '#ffd166');
          audio.pickup();
        } else {
          world.score += PIE_SCORE;
          world.addText(p.x, p.y - 18, `+${PIE_SCORE} PIE!`, '#ffd166');
          audio.pie();
        }
      }
    }
  }
  world.pickups = world.pickups.filter((p) => !p.taken);

  // The farmer grabs the turkey.
  const fb = farmer.hitbox();
  if (fb && hb && overlaps(hb, fb)) {
    endRun(world, turkey, farmer, audio, 'CAUGHT BY THE FARMER');
  }
  if (farmer.hasCaught()) {
    endRun(world, turkey, farmer, audio, 'CAUGHT BY THE FARMER');
  }

  // Farmer proximity alarm.
  if (farmer.isNear() && !world._alarmOn) {
    world._alarmOn = true;
    audio.alarm();
  } else if (!farmer.isNear()) {
    world._alarmOn = false;
  }

  // Floating score texts.
  for (const t of world.floatingTexts) {
    t.y -= 34 * dt;
    t.life -= dt;
  }
  world.floatingTexts = world.floatingTexts.filter((t) => t.life > 0);

  // Score trickles in with distance: one point per meter run.
  world.score += (dx / PX_PER_METER) * METER_POINTS;

  if (world.shake > 0) world.shake -= dt * 3;
}

function hurtTurkey(world, turkey, farmer, audio, text) {
  world.lives -= 1;
  world.shake = 1;
  turkey.hurt(1.6);
  farmer.closeIn(FARMER_HIT_PENALTY);
  world.addText(turkey.x + 20, turkey.y - 30, text, '#ff6b6b');
  audio.hit();
  if (world.lives <= 0) {
    endRun(world, turkey, farmer, audio, 'OUT OF LIVES — DINNER IS SERVED');
  }
}

function endRun(world, turkey, farmer, audio, reason) {
  if (world.over) return;
  world.over = true;
  world.overReason = reason;
  audio.caught();
}
