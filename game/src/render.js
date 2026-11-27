// Gobble Dash — all drawing.
// One clear job: every pixel on screen — backdrops, the turkey, the farmer,
// obstacles, the HUD and the menu screens. No game logic lives here.

import { VIEW_W, VIEW_H, GROUND_Y, PALETTE, STAGES, ESCAPE_DISTANCE_M } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCloud(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ellipse(ctx, x, y, 34 * s, 16 * s);
  ellipse(ctx, x + 26 * s, y + 4 * s, 26 * s, 13 * s);
  ellipse(ctx, x - 26 * s, y + 5 * s, 22 * s, 11 * s);
}

function drawTree(ctx, x, y, s, color, trunk) {
  ctx.fillStyle = trunk;
  ctx.fillRect(x - 4 * s, y - 34 * s, 8 * s, 34 * s);
  ctx.fillStyle = color;
  ellipse(ctx, x, y - 52 * s, 26 * s, 30 * s);
  ellipse(ctx, x - 18 * s, y - 38 * s, 16 * s, 16 * s);
  ellipse(ctx, x + 18 * s, y - 38 * s, 16 * s, 16 * s);
}

function drawBarn(ctx, x, y, s) {
  ctx.fillStyle = PALETTE.barnRed;
  ctx.fillRect(x, y - 120 * s, 150 * s, 120 * s);
  ctx.beginPath();
  ctx.moveTo(x - 10 * s, y - 120 * s);
  ctx.lineTo(x + 75 * s, y - 175 * s);
  ctx.lineTo(x + 160 * s, y - 120 * s);
  ctx.closePath();
  ctx.fillStyle = '#8c2f22';
  ctx.fill();
  ctx.fillStyle = PALETTE.barnTrim;
  ctx.fillRect(x + 60 * s, y - 78 * s, 30 * s, 78 * s);
  ctx.strokeStyle = PALETTE.barnTrim;
  ctx.lineWidth = 3 * s;
  ctx.strokeRect(x + 14 * s, y - 100 * s, 26 * s, 26 * s);
  ctx.strokeRect(x + 110 * s, y - 100 * s, 26 * s, 26 * s);
}

export function drawBackground(ctx, stageIndex, scroll) {
  const st = STAGES[stageIndex];
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, st.skyTop);
  grad.addColorStop(0.55, st.skyMid);
  grad.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Sun and drifting clouds.
  ctx.fillStyle = PALETTE.sun;
  ellipse(ctx, 820, 84, 44, 44);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
  ellipse(ctx, 820, 84, 62, 62);
  drawCloud(ctx, ((200 - scroll * 0.08) % 1100 + 1100) % 1100 - 80, 70, 1, PALETTE.cloud);
  drawCloud(ctx, ((640 - scroll * 0.05) % 1100 + 1100) % 1100 - 80, 130, 0.7, PALETTE.cloud);
  drawCloud(ctx, ((900 - scroll * 0.11) % 1100 + 1100) % 1100 - 80, 46, 0.85, PALETTE.cloud);

  // Rolling hills, two layers for parallax.
  ctx.fillStyle = PALETTE.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, 400);
  for (let x = 0; x <= VIEW_W; x += 40) {
    ctx.lineTo(x, 400 - 26 * Math.sin((x + scroll * 0.3) / 190) - 10);
  }
  ctx.lineTo(VIEW_W, VIEW_H);
  ctx.lineTo(0, VIEW_H);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = PALETTE.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, 440);
  for (let x = 0; x <= VIEW_W; x += 40) {
    ctx.lineTo(x, 440 - 18 * Math.sin((x + scroll * 0.55) / 130) - 6);
  }
  ctx.lineTo(VIEW_W, VIEW_H);
  ctx.lineTo(0, VIEW_H);
  ctx.closePath();
  ctx.fill();

  // Stage dressing: a small barn on the far hill in the farmyard (its base
  // sits on the far hill line, so it reads as distant scenery and never
  // collides visually with the turkey), oven glow in the kitchen.
  if (stageIndex === 0) {
    drawBarn(ctx, 700 - ((scroll * 0.55) % 1400), 402, 0.55);
    drawTree(ctx, 120 - ((scroll * 0.55) % 1400), GROUND_Y, 1, '#c96f2e', '#6b4423');
    drawTree(ctx, 480 - ((scroll * 0.55) % 1400), GROUND_Y, 0.8, '#d97b29', '#6b4423');
  } else if (stageIndex === 2) {
    ctx.fillStyle = 'rgba(255, 123, 36, 0.16)';
    ctx.fillRect(0, GROUND_Y - 190, VIEW_W, 190);
  }

  // Ground.
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = PALETTE.groundTop;
  ctx.fillRect(0, GROUND_Y, VIEW_W, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = -((scroll * 1) % 46); x < VIEW_W; x += 46) {
    ctx.fillRect(x, GROUND_Y + 22, 20, 4);
    ctx.fillRect(x + 12, GROUND_Y + 44, 26, 4);
  }
}

// --- The turkey: a round brown body, a fanned tail, a red waddle of pride.
export function drawTurkey(ctx, turkey) {
  const t = turkey;
  const bob = t.grounded ? Math.sin(t.runPhase) * 2 : 0;
  const x = t.x;
  const y = t.y + bob;
  const blink = t.isInvulnerable() && Math.floor(performance.now() / 90) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.35;

  if (t.isHidden()) {
    // Hidden in a haystack: only a tail feather and two eyes peek out.
    ctx.fillStyle = PALETTE.hay;
    ellipse(ctx, x + 28, GROUND_Y - 26, 46, 30);
    ctx.fillStyle = PALETTE.hayDark;
    ellipse(ctx, x + 10, GROUND_Y - 34, 12, 20);
    ellipse(ctx, x + 28, GROUND_Y - 40, 12, 22);
    ctx.fillStyle = '#1d1d1d';
    ellipse(ctx, x + 18, GROUND_Y - 30, 3, 4);
    ellipse(ctx, x + 30, GROUND_Y - 30, 3, 4);
    ctx.globalAlpha = 1;
    return;
  }

  // Tail fan.
  ctx.fillStyle = PALETTE.turkeyTail;
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.translate(x + 8, y + 30);
    ctx.rotate(i * 0.42 - 0.15);
    ellipse(ctx, -16, -14, 7, 18);
    ctx.restore();
  }
  ctx.fillStyle = '#8a5a2b';
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.translate(x + 8, y + 30);
    ctx.rotate(i * 0.42 - 0.15);
    ellipse(ctx, -16, -26, 3, 6);
    ctx.restore();
  }

  // Body.
  ctx.fillStyle = PALETTE.turkeyBody;
  ellipse(ctx, x + 28, y + 30, 26, 22);
  // Wing, flapping when airborne.
  const wingLift = t.grounded ? Math.sin(t.runPhase) * 3 : -14 - Math.sin(t.flapPhase) * 8;
  ctx.fillStyle = PALETTE.turkeyWing;
  ellipse(ctx, x + 26, y + 28 + wingLift * 0.4, 16, 10);
  // Head and neck.
  ctx.fillStyle = PALETTE.turkeyHead;
  ellipse(ctx, x + 48, y + 8, 9, 12);
  ctx.fillStyle = PALETTE.turkeyBeak;
  ctx.beginPath();
  ctx.moveTo(x + 55, y + 4);
  ctx.lineTo(x + 68, y + 9);
  ctx.lineTo(x + 55, y + 13);
  ctx.closePath();
  ctx.fill();
  // Wattle and eye.
  ctx.fillStyle = PALETTE.turkeyWattle;
  ellipse(ctx, x + 56, y + 16, 4, 7);
  ctx.fillStyle = '#1d1d1d';
  ellipse(ctx, x + 50, y + 5, 2.5, 3.5);
  // Legs: two little orange sticks, running — tucked up when airborne.
  ctx.strokeStyle = '#f4a259';
  ctx.lineWidth = 3;
  const legSwing = t.grounded ? Math.sin(t.runPhase) * 7 : 4;
  const legEndY = t.grounded ? GROUND_Y : y + 54;
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 48);
  ctx.lineTo(x + 20 + legSwing, legEndY);
  ctx.moveTo(x + 34, y + 48);
  ctx.lineTo(x + 34 - legSwing, legEndY);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

// --- The farmer: overalls, a straw hat, a pitchfork, and bad intentions.
export function drawFarmer(ctx, farmer) {
  const f = farmer;
  if (f.x < -120) return;
  const x = f.x;
  const y = f.y;
  const swing = Math.sin(f.runPhase) * 6;
  const searching = f.isSearching();

  // Legs.
  ctx.strokeStyle = PALETTE.farmerOveralls;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x + 26, y + 52);
  ctx.lineTo(x + 26 + swing, GROUND_Y);
  ctx.moveTo(x + 40, y + 52);
  ctx.lineTo(x + 40 - swing, GROUND_Y);
  ctx.stroke();
  // Body: shirt and overalls.
  ctx.fillStyle = PALETTE.farmerShirt;
  ctx.fillRect(x + 14, y + 22, 38, 32);
  ctx.fillStyle = PALETTE.farmerOveralls;
  ctx.fillRect(x + 14, y + 40, 38, 16);
  // Head.
  ctx.fillStyle = PALETTE.farmerSkin;
  ellipse(ctx, x + 33, y + 12, 12, 13);
  // Straw hat.
  ctx.fillStyle = PALETTE.farmerHat;
  ellipse(ctx, x + 33, y + 2, 20, 6);
  ctx.fillRect(x + 21, y - 10, 24, 12);
  // Pitchfork, raised when he is close.
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 52, y + 58);
  ctx.lineTo(x + 58, y - (f.isNear() ? 6 : 2));
  ctx.stroke();
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 58 + i * 5, y - (f.isNear() ? 6 : 2));
    ctx.lineTo(x + 58 + i * 5, y - (f.isNear() ? 20 : 16));
    ctx.stroke();
  }
  // Searching: a question mark above his head.
  if (searching) {
    ctx.font = 'bold 26px sans-serif';
    ctx.strokeStyle = 'rgba(61, 44, 30, 0.9)';
    ctx.lineWidth = 5;
    ctx.strokeText('?', x + 22, y - 22);
    ctx.fillStyle = '#fff3e0';
    ctx.fillText('?', x + 22, y - 22);
  }
  // Shout when he is near (kept on screen even at the left edge, with a
  // dark outline so it reads over pale scenery like the barn door).
  if (f.isNear()) {
    ctx.font = 'bold 15px sans-serif';
    ctx.strokeStyle = 'rgba(61, 44, 30, 0.9)';
    ctx.lineWidth = 4;
    ctx.strokeText('COME BACK HERE!', Math.max(4, x - 30), y - 18);
    ctx.fillStyle = '#fff3e0';
    ctx.fillText('COME BACK HERE!', Math.max(4, x - 30), y - 18);
  }
}

// --- Obstacles, pickups and haystacks.
export function drawWorld(ctx, world) {
  for (const h of world.haystacks) {
    ctx.fillStyle = PALETTE.hay;
    ctx.beginPath();
    ctx.moveTo(h.x, h.y + h.h);
    ctx.quadraticCurveTo(h.x + h.w / 2, h.y - 22, h.x + h.w, h.y + h.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.hayDark;
    ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(h.x + (h.w * i) / 4, h.y + h.h - 6);
      ctx.quadraticCurveTo(h.x + (h.w * i) / 4, h.y + 8, h.x + (h.w * i) / 4 + 4, h.y + 2);
      ctx.stroke();
    }
    if (h.used) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('USED', h.x + 22, h.y - 8);
    }
  }

  for (const ob of world.obstacles) {
    if (ob.kind === 'fence') {
      ctx.fillStyle = PALETTE.fence;
      ctx.fillRect(ob.x, ob.y, 5, ob.h);
      ctx.fillRect(ob.x + ob.w - 5, ob.y, 5, ob.h);
      ctx.fillRect(ob.x, ob.y + 8, ob.w, 6);
      ctx.fillRect(ob.x, ob.y + 26, ob.w, 6);
    } else if (ob.kind === 'haybale') {
      ctx.fillStyle = PALETTE.hay;
      ellipse(ctx, ob.x + ob.w / 2, ob.y + ob.h / 2, ob.w / 2, ob.h / 2);
      ctx.strokeStyle = PALETTE.hayDark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(ob.x + ob.w / 2, ob.y + ob.h / 2, ob.w / 2 - 6, ob.h / 2 - 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (ob.kind === 'crate') {
      ctx.fillStyle = '#b5773a';
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = '#6b4423';
      ctx.lineWidth = 3;
      ctx.strokeRect(ob.x + 2, ob.y + 2, ob.w - 4, ob.h - 4);
      ctx.beginPath();
      ctx.moveTo(ob.x, ob.y);
      ctx.lineTo(ob.x + ob.w, ob.y + ob.h);
      ctx.moveTo(ob.x + ob.w, ob.y);
      ctx.lineTo(ob.x, ob.y + ob.h);
      ctx.stroke();
    } else if (ob.kind === 'puddle') {
      ctx.fillStyle = '#7fb3d5';
      ellipse(ctx, ob.x + ob.w / 2, ob.y + ob.h / 2, ob.w / 2, ob.h / 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ellipse(ctx, ob.x + ob.w / 2 - 14, ob.y + ob.h / 2 - 2, 16, 3);
    } else if (ob.kind === 'table') {
      ctx.fillStyle = '#7a4a21';
      ctx.fillRect(ob.x, ob.y, ob.w, 10);
      ctx.fillRect(ob.x + 6, ob.y + 10, 8, ob.h - 10);
      ctx.fillRect(ob.x + ob.w - 14, ob.y + 10, 8, ob.h - 10);
      ctx.fillStyle = '#f7ede2';
      ellipse(ctx, ob.x + ob.w / 2, ob.y - 4, 22, 7);
      ctx.fillStyle = '#d62828';
      ellipse(ctx, ob.x + ob.w / 2 - 12, ob.y - 10, 6, 6);
    } else if (ob.kind === 'oven') {
      ctx.fillStyle = PALETTE.oven;
      roundRect(ctx, ob.x, ob.y, ob.w, ob.h, 6);
      ctx.fill();
      ctx.fillStyle = PALETTE.ovenGlow;
      roundRect(ctx, ob.x + 14, ob.y + 14, ob.w - 28, 26, 4);
      ctx.fill();
      ctx.fillStyle = '#2b2b30';
      ctx.fillRect(ob.x + 14, ob.y + 46, ob.w - 28, 5);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('450°F', ob.x + 28, ob.y + 60);
    } else if (ob.kind === 'knife') {
      ctx.fillStyle = PALETTE.knife;
      ctx.beginPath();
      ctx.moveTo(ob.x + 4, ob.y);
      ctx.lineTo(ob.x + ob.w - 4, ob.y);
      ctx.lineTo(ob.x + ob.w / 2 + 3, ob.y + ob.h - 12);
      ctx.lineTo(ob.x + ob.w / 2, ob.y + ob.h);
      ctx.lineTo(ob.x + ob.w / 2 - 3, ob.y + ob.h - 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.knifeHandle;
      ctx.fillRect(ob.x + 4, ob.y - 16, ob.w - 8, 18);
    }
  }

  for (const p of world.pickups) {
    const bobY = Math.sin(p.bob) * 4;
    if (p.kind === 'corn') {
      ctx.fillStyle = '#ffd166';
      ellipse(ctx, p.x, p.y + bobY, 10, 14);
      ctx.fillStyle = '#f4a259';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + bobY - 14);
      ctx.lineTo(p.x - 6, p.y + bobY - 26);
      ctx.lineTo(p.x + 6, p.y + bobY - 26);
      ctx.closePath();
      ctx.fill();
    } else if (p.kind === 'gravy') {
      ctx.fillStyle = '#f7ede2';
      ellipse(ctx, p.x, p.y + bobY, 14, 8);
      ctx.fillStyle = '#c98f4e';
      ellipse(ctx, p.x, p.y + bobY - 2, 11, 5);
    } else {
      ctx.fillStyle = '#e07a5f';
      ctx.beginPath();
      ctx.moveTo(p.x - 14, p.y + bobY + 8);
      ctx.lineTo(p.x + 14, p.y + bobY + 8);
      ctx.lineTo(p.x, p.y + bobY - 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f7ede2';
      ellipse(ctx, p.x, p.y + bobY + 8, 14, 4);
    }
  }

  // Floating score texts.
  ctx.textAlign = 'center';
  for (const t of world.floatingTexts) {
    ctx.globalAlpha = Math.max(0, t.life);
    ctx.fillStyle = t.color;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// --- HUD: score, distance, lives, stage, farmer meter.
export function drawHUD(ctx, world, farmer) {
  ctx.fillStyle = PALETTE.hudBg;
  roundRect(ctx, 12, 10, 330, 64, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`SCORE ${Math.floor(world.score)}`, 24, 36);
  ctx.font = '16px sans-serif';
  ctx.fillText(`${Math.floor(world.distanceM)} m  •  ${STAGES[world.stageIndex].name}`, 24, 60);
  // Hearts.
  for (let i = 0; i < 3; i++) {
    const hx = 356 + i * 30;
    ctx.fillStyle = i < world.lives ? '#e63946' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(hx, 34);
    ctx.bezierCurveTo(hx - 9, 24, hx - 18, 34, hx, 46);
    ctx.bezierCurveTo(hx + 18, 34, hx + 9, 24, hx, 34);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`🌽 ${world.corn}`, 452, 36);

  // Farmer meter: how close the grab is.
  const meterW = 200;
  const frac = 1 - farmer.gap / 420;
  ctx.fillStyle = PALETTE.hudBg;
  roundRect(ctx, VIEW_W - meterW - 24, 10, meterW + 12, 64, 10);
  ctx.fill();
  ctx.fillStyle = farmer.isNear() ? PALETTE.danger : PALETTE.hudAccent;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(farmer.isSearching() ? 'FARMER: SEARCHING…' : 'FARMER', VIEW_W - meterW - 12, 32);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(VIEW_W - meterW - 12, 42, meterW, 12);
  ctx.fillStyle = farmer.isNear() ? PALETTE.danger : PALETTE.safe;
  ctx.fillRect(VIEW_W - meterW - 12, 42, meterW * Math.max(0, Math.min(1, frac)), 12);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '12px sans-serif';
  ctx.fillText('ESCAPE 1800 m', VIEW_W - meterW - 12, 68);

  // Stage progress bar along the bottom.
  const prog = Math.min(1, world.distanceM / ESCAPE_DISTANCE_M);
  ctx.fillStyle = 'rgba(61,44,30,0.6)';
  ctx.fillRect(0, VIEW_H - 10, VIEW_W, 10);
  ctx.fillStyle = PALETTE.hudAccent;
  ctx.fillRect(0, VIEW_H - 10, VIEW_W * prog, 10);
  ctx.fillStyle = '#fff3e0';
  ctx.beginPath();
  ctx.arc(VIEW_W * prog, VIEW_H - 5, 7, 0, Math.PI * 2);
  ctx.fill();
}

// --- Screens: title, pause, caught, escaped.
function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(43, 30, 20, 0.88)';
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = PALETTE.hudAccent;
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 16);
  ctx.stroke();
}

function button(ctx, x, y, w, h, label) {
  ctx.fillStyle = PALETTE.hudAccent;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#3d2c1e';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 8);
  ctx.textAlign = 'left';
  return { x, y, w, h };
}

export function drawTitle(ctx, best) {
  ctx.fillStyle = 'rgba(43, 30, 20, 0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 180, 70, 600, 400);
  ctx.fillStyle = PALETTE.hudAccent;
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GOBBLE DASH', 480, 160);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Escape the Thanksgiving table!', 480, 196);
  ctx.font = '17px sans-serif';
  ctx.fillText('One turkey. One farmer. Zero stuffing.', 480, 226);
  ctx.fillText('Run the farmyard, sneak the barn, dodge the kitchen —', 480, 258);
  ctx.fillText('and reach the forest gate before the farmer grabs you.', 480, 282);
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = PALETTE.hudAccent;
  ctx.fillText('SPACE / CLICK — jump & flap (twice!)    ↓ — duck & hide in hay', 480, 322);
  ctx.fillText('SHIFT — sprint    P — pause    M — mute', 480, 348);
  if (best > 0) {
    ctx.fillStyle = PALETTE.hudText;
    ctx.fillText(`BEST SCORE: ${best}`, 480, 382);
  }
  ctx.textAlign = 'left';
  return button(ctx, 360, 400, 240, 52, '▶  START RUN');
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43, 30, 20, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 330, 200, 300, 140);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', 480, 258);
  ctx.font = '16px sans-serif';
  ctx.fillText('Press P or click to keep running', 480, 292);
  ctx.textAlign = 'left';
}

export function drawCaught(ctx, world) {
  ctx.fillStyle = 'rgba(60, 10, 10, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 180, 90, 600, 360);
  ctx.fillStyle = '#ff6b6b';
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOU ARE DINNER', 480, 180);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '20px sans-serif';
  ctx.fillText(world.overReason || 'The farmer got you.', 480, 220);
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`SCORE ${Math.floor(world.score)}   •   ${Math.floor(world.distanceM)} m`, 480, 262);
  ctx.font = '17px sans-serif';
  ctx.fillText('The table is set. The gravy boat is waiting.', 480, 296);
  ctx.fillText('Tip: hide in a haystack when the farmer closes in.', 480, 322);
  ctx.textAlign = 'left';
  return button(ctx, 360, 360, 240, 52, '↻  RUN AGAIN');
}

export function drawEscaped(ctx, world) {
  ctx.fillStyle = 'rgba(20, 50, 25, 0.5)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 180, 90, 600, 360);
  ctx.fillStyle = '#8dff9e';
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FREE RANGE AT LAST!', 480, 180);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '20px sans-serif';
  ctx.fillText('You outran the farmer, the knives and the oven.', 480, 220);
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`SCORE ${Math.floor(world.score)}   •   ${Math.floor(world.distanceM)} m`, 480, 262);
  ctx.font = '17px sans-serif';
  ctx.fillText('Somewhere, a forest. No gravy boats. No carving knives.', 480, 296);
  ctx.fillText('The turkey lives to gobble another day.', 480, 322);
  ctx.textAlign = 'left';
  return button(ctx, 360, 360, 240, 52, '↻  RUN AGAIN');
}
