// Gobble Dash — configuration: canvas, physics, tuning, palette.
// One clear job: every number the game balances on lives here, so tuning
// never means hunting through gameplay code.

export const VIEW_W = 960;
export const VIEW_H = 540;
export const GROUND_Y = 470;

export const TURKEY_X = 180;
export const GRAVITY = 2300;
export const JUMP_VELOCITY = -820;
export const DOUBLE_FLAP_VELOCITY = -700;
export const MAX_FALL = 1200;

export const BASE_SPEED = 265;
export const SPEED_PER_STAGE = 26;
export const BURST_SPEED = 150;
export const BURST_SECONDS = 1.6;

export const MAX_LIVES = 3;
export const FARMER_START_GAP = 260;
export const FARMER_CATCH_GAP = 0;
export const FARMER_HIT_PENALTY = 75;
export const FARMER_CORN_BONUS = 9;
export const FARMER_HIDE_BONUS = 55;
export const FARMER_NEAR_WARN = 130;

export const CORN_SCORE = 10;
export const GRAVY_SCORE = 25;
export const PIE_SCORE = 50;
export const STAGE_BONUS = 150;
export const METER_POINTS = 1;

export const STAGE_LENGTH_M = 600;
export const ESCAPE_DISTANCE_M = 1800;
export const PX_PER_METER = 32;

// The three stages of the escape: farmyard, barn, kitchen. Each stage names
// its own obstacles, its backdrop tint and how crowded the run gets.
export const STAGES = [
  {
    name: 'FARMYARD',
    subtitle: 'Dawn — the farmer is up',
    skyTop: '#f7b267',
    skyMid: '#f4845f',
    obstacles: ['fence', 'haybale', 'puddle'],
    spawnEvery: [1.15, 0.85],
    speedBonus: 0,
  },
  {
    name: 'BARN',
    subtitle: 'The knives are out',
    skyTop: '#e07a5f',
    skyMid: '#c96f4a',
    obstacles: ['fence', 'haybale', 'crate', 'knife'],
    spawnEvery: [0.95, 0.68],
    speedBonus: 1,
  },
  {
    name: 'KITCHEN',
    subtitle: 'The oven is preheating',
    skyTop: '#d96c4f',
    skyMid: '#8d4a3a',
    obstacles: ['fence', 'crate', 'knife', 'oven', 'table'],
    spawnEvery: [0.8, 0.55],
    speedBonus: 2,
  },
];

export const STAGE_NAMES = STAGES.map((s) => s.name);

// Autumn palette: burnt orange, corn yellow, barn red, cream, deep brown.
export const PALETTE = {
  skyTop: '#f7b267',
  skyMid: '#f4845f',
  skyBottom: '#f7ede2',
  sun: '#ffd166',
  cloud: '#fff3e0',
  hillFar: '#c98f4e',
  hillNear: '#a4713b',
  ground: '#8a5a2b',
  groundTop: '#b5773a',
  barnRed: '#b3402e',
  barnTrim: '#f7ede2',
  fence: '#6b4423',
  hay: '#e9c46a',
  hayDark: '#c9a227',
  knife: '#d9dee3',
  knifeHandle: '#3d2c1e',
  oven: '#4a4a52',
  ovenGlow: '#ff7b24',
  turkeyBody: '#8d5a2b',
  turkeyWing: '#6f4520',
  turkeyTail: '#b5773a',
  turkeyHead: '#e07a5f',
  turkeyWattle: '#d62828',
  turkeyBeak: '#f4a259',
  farmerShirt: '#4a7c59',
  farmerOveralls: '#3d5a80',
  farmerSkin: '#e8b98a',
  farmerHat: '#7a5c2e',
  hudBg: 'rgba(61, 44, 30, 0.82)',
  hudText: '#fff3e0',
  hudAccent: '#ffd166',
  danger: '#d62828',
  safe: '#70a35a',
};
