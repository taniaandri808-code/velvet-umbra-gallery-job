// VELVET UMBRA — shared constants, palette, and tuning values.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const CANVAS = Object.freeze({
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  tile: 24,
});

export const STEP_HZ = 60;
export const FIXED_STEP = 1 / STEP_HZ;
export const MAX_FRAME_STEPS = 5;

export const PALETTE = Object.freeze({
  wall: "#16211f",
  floor: "#1d2b28",
  floorGrid: "#243631",

  lamp: "rgba(255,196,90,1)",
  lampSoft: "rgba(255,196,90,0.20)",
  lampCone: "rgba(255,196,90,0.30)",
  lampEdge: "rgba(255,196,90,0.55)",

  danger: "rgba(255,90,70,1)",
  dangerSoft: "rgba(255,90,70,0.20)",
  dangerCone: "rgba(255,90,70,0.30)",
  dangerEdge: "rgba(255,90,70,0.62)",

  player: "#f2e9d8",
  playerShadow: "#6d4d9c",
  playerAura: "rgba(109,77,156,0.30)",

  loot: "#ffd257",
  lootGlow: "rgba(255,210,87,0.26)",
  lootEdge: "rgba(255,210,87,0.55)",

  exit: "#37d9a0",
  exitGlow: "rgba(55,217,160,0.22)",
  exitEdge: "rgba(55,217,160,0.58)",

  smoke: "#b9c2be",
  smokeSoft: "rgba(185,194,190,0.26)",
  smokeEdge: "rgba(185,194,190,0.42)",

  guard: "#b7c5bf",
  guardShadow: "#4c6c64",
  guardAlert: "#ff5a46",

  camera: "#8fb6a7",
  cameraAlert: "#ff5a46",
  cameraLens: "#d7e6de",

  hudText: "#f2e9d8",
  hudMuted: "#9aa5a0",
  hudPanel: "rgba(10,18,17,0.82)",
  hudAccent: "#ffd257",
  hudDanger: "#ff5a46",
  hudSafe: "#37d9a0",

  alarmLow: "#37d9a0",
  alarmMid: "#ffd257",
  alarmHigh: "#ff5a46",

  vignette: "rgba(3,8,7,0.55)",
  black: "#070c0b",
});

export const PLAYER_TUNING = Object.freeze({
  radius: 10,
  walkSpeed: 118,
  sneakSpeed: 58,
  sprintSpeed: 195,
  acceleration: 900,
  friction: 12,
  collideRadius: 10,
});

export const NOISE_TUNING = Object.freeze({
  sneakRadius: 0,
  walkRadius: 44,
  sprintRadius: 112,
  chimeRadius: 168,
  guardHearingRange: 132,
  ringDuration: 0.85,
  ringWidth: 3,
});

export const GUARD_TUNING = Object.freeze({
  radius: 11,
  patrolSpeed: 52,
  investigateSpeed: 88,
  chaseSpeed: 132,
  lockdownSpeedMultiplier: 1.4,
  visionRange: 78,
  visionArcDeg: 60,
  visionArcRad: Math.PI / 3,
  visionInnerRadius: 6,
  visionSegments: 18,
  waypointPause: 1.0,
  suspicionThreshold: 0.45,
  suspicionGainPerSecond: 0.85,
  suspicionDecayPerSecond: 0.50,
  investigateDuration: 2.2,
  alertMemory: 2.5,
  caughtDistance: 18,
});

export const CAMERA_TUNING = Object.freeze({
  radius: 140,
  arcDeg: 50,
  arcRad: (50 * Math.PI) / 180,
  sweepDeg: 80,
  sweepRad: (80 * Math.PI) / 180,
  sweepSpeed: 0.72,
  sweepSegments: 16,
  blinkPeriod: 0.42,
  detectionAlarmPerSecond: 9,
  lockdownSweepMultiplier: 1.6,
  detectionHold: 0.25,
});

export const ALARM_TUNING = Object.freeze({
  max: 100,
  guardRisePerSecond: 13,
  cameraRisePerSecond: 9,
  decayPerSecond: 7,
  lockdownThreshold: 100,
  lockdownDecayPerSecond: 3,
  suspicionFloor: 12,
});

export const TOOLS_TUNING = Object.freeze({
  chimeCount: 5,
  chimeCooldown: 0.5,
  chimeThrowSpeed: 420,
  chimeLureRange: 260,
  chimeLifetime: 3.0,
  smokeCount: 2,
  smokeDuration: 4.0,
  smokeRadius: 72,
  smokeCooldown: 1.0,
  smokeThrowSpeed: 380,
  smokeThrowRange: 190,
  interactRadius: 28,
  lootPickupRadius: 26,
  doorLockpickTime: 2.0,
});

export const LEVEL_TUNING = Object.freeze({
  timerSeconds: 180,
  timerSecondsPerLevel: 180,
  exitRadius: 30,
  vanRadius: 42,
  lootRequiredText: "All relics",
});

export const VISUAL_TUNING = Object.freeze({
  coneFadeInner: 0.58,
  coneFadeOuter: 0.04,
  lampPoolRadius: 140,
  lampPoolFade: 0.18,
  minimapWidth: 220,
  minimapHeight: 124,
  minimapMargin: 18,
  minimapWallAlpha: 0.9,
  minimapLootDotRadius: 3,
  minimapGuardDotRadius: 4,
  minimapPlayerDotRadius: 4,
  hudPanelRadius: 8,
  screenFadeDuration: 0.35,
});

export const INPUT_TUNING = Object.freeze({
  mouseAimRadius: 0,
  keyRepeatGuard: 0.12,
});

export const TUNING = Object.freeze({
  player: PLAYER_TUNING,
  noise: NOISE_TUNING,
  guard: GUARD_TUNING,
  camera: CAMERA_TUNING,
  alarm: ALARM_TUNING,
  tools: TOOLS_TUNING,
  level: LEVEL_TUNING,
  visual: VISUAL_TUNING,
  input: INPUT_TUNING,
});

export const CONFIG = Object.freeze({
  canvas: CANVAS,
  palette: PALETTE,
  tuning: TUNING,
  stepHz: STEP_HZ,
  fixedStep: FIXED_STEP,
  maxFrameSteps: MAX_FRAME_STEPS,
});
