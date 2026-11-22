// VELVET UMBRA — three floors of the Bellamonte Gallery.

export const GRAND_HALL = Object.freeze({
  id: "grand-hall",
  name: "Grand Hall",
  subtitle: "Marble, chandeliers, and the first quiet steps.",
  width: 1280,
  height: 720,
  spawn: Object.freeze({ x: 88, y: 624 }),

  walls: Object.freeze([
    Object.freeze({ x: 0, y: 0, w: 1280, h: 24 }),
    Object.freeze({ x: 0, y: 696, w: 1280, h: 24 }),
    Object.freeze({ x: 0, y: 24, w: 24, h: 672 }),
    Object.freeze({ x: 1256, y: 24, w: 24, h: 672 }),
    Object.freeze({ x: 240, y: 120, w: 260, h: 24 }),
    Object.freeze({ x: 240, y: 120, w: 24, h: 180 }),
    Object.freeze({ x: 800, y: 96, w: 24, h: 270 }),
    Object.freeze({ x: 800, y: 366, w: 260, h: 24 }),
    Object.freeze({ x: 430, y: 442, w: 220, h: 24 }),
    Object.freeze({ x: 1060, y: 380, w: 24, h: 180 }),
  ]),

  cover: Object.freeze([
    Object.freeze({ id: "gh-crate-1", type: "crate", x: 330, y: 260, w: 54, h: 54, solid: true }),
    Object.freeze({ id: "gh-crate-2", type: "crate", x: 930, y: 220, w: 58, h: 58, solid: true }),
    Object.freeze({ id: "gh-sofa-1", type: "sofa", x: 500, y: 600, w: 128, h: 30, solid: true }),
    Object.freeze({ id: "gh-crate-3", type: "crate", x: 690, y: 500, w: 56, h: 56, solid: true }),
    Object.freeze({ id: "gh-sofa-2", type: "sofa", x: 1030, y: 610, w: 116, h: 30, solid: true }),
  ]),

  lights: Object.freeze([
    Object.freeze({ id: "gh-chandelier", x: 640, y: 360, radius: 220, intensity: 1.0 }),
    Object.freeze({ id: "gh-lamp-west", x: 250, y: 250, radius: 120, intensity: 0.85 }),
    Object.freeze({ id: "gh-lamp-east", x: 1030, y: 520, radius: 130, intensity: 0.9 }),
    Object.freeze({ id: "gh-lamp-north", x: 700, y: 140, radius: 90, intensity: 0.7 }),
  ]),

  loot: Object.freeze([
    Object.freeze({ id: "gh-purse-1", type: "coin-purse", x: 380, y: 330, value: 100 }),
    Object.freeze({ id: "gh-purse-2", type: "coin-purse", x: 1040, y: 460, value: 100 }),
    Object.freeze({ id: "gh-reliquary-1", type: "jewel-reliquary", x: 560, y: 545, value: 250 }),
  ]),

  guards: Object.freeze([
    Object.freeze({
      id: "gh-guard-1",
      waypoints: Object.freeze([
        Object.freeze({ x: 300, y: 210 }),
        Object.freeze({ x: 650, y: 210 }),
        Object.freeze({ x: 650, y: 520 }),
        Object.freeze({ x: 300, y: 520 }),
      ]),
    }),
    Object.freeze({
      id: "gh-guard-2",
      waypoints: Object.freeze([
        Object.freeze({ x: 1010, y: 250 }),
        Object.freeze({ x: 1010, y: 540 }),
        Object.freeze({ x: 860, y: 540 }),
        Object.freeze({ x: 860, y: 250 }),
      ]),
    }),
  ]),

  cameras: Object.freeze([
    Object.freeze({
      id: "gh-camera-1",
      x: 180,
      y: 180,
      angle: Math.PI / 4,
      sweepMin: Math.PI / 8,
      sweepMax: (5 * Math.PI) / 8,
    }),
    Object.freeze({
      id: "gh-camera-2",
      x: 1130,
      y: 170,
      angle: (3 * Math.PI) / 4,
      sweepMin: (5 * Math.PI) / 8,
      sweepMax: (3 * Math.PI) / 2,
    }),
  ]),

  exits: Object.freeze([
    Object.freeze({ id: "gh-service-door", type: "door", x: 1190, y: 640, w: 46, h: 46, label: "Service Door" }),
  ]),
});

export const VAULT_FLOOR = Object.freeze({
  id: "vault-floor",
  name: "Vault Floor",
  subtitle: "Lockboxes, reliquaries, and a narrow vault corridor.",
  width: 1280,
  height: 720,
  spawn: Object.freeze({ x: 74, y: 110 }),

  walls: Object.freeze([
    Object.freeze({ x: 0, y: 0, w: 1280, h: 24 }),
    Object.freeze({ x: 0, y: 696, w: 1280, h: 24 }),
    Object.freeze({ x: 0, y: 24, w: 24, h: 672 }),
    Object.freeze({ x: 1256, y: 24, w: 24, h: 672 }),
    Object.freeze({ x: 280, y: 120, w: 400, h: 24 }),
    Object.freeze({ x: 280, y: 120, w: 24, h: 300 }),
    Object.freeze({ x: 680, y: 120, w: 24, h: 300 }),
    Object.freeze({ x: 280, y: 420, w: 400, h: 24 }),
    Object.freeze({ x: 800, y: 180, w: 24, h: 380 }),
    Object.freeze({ x: 800, y: 560, w: 300, h: 24 }),
    Object.freeze({ x: 460, y: 520, w: 220, h: 24 }),
    Object.freeze({ x: 1100, y: 300, w: 24, h: 160 }),
  ]),

  cover: Object.freeze([
    Object.freeze({ id: "vf-crate-1", type: "crate", x: 320, y: 240, w: 52, h: 52, solid: true }),
    Object.freeze({ id: "vf-crate-2", type: "crate", x: 520, y: 300, w: 56, h: 56, solid: true }),
    Object.freeze({ id: "vf-crate-3", type: "crate", x: 920, y: 240, w: 54, h: 54, solid: true }),
    Object.freeze({ id: "vf-sofa-1", type: "sofa", x: 890, y: 640, w: 120, h: 30, solid: true }),
    Object.freeze({ id: "vf-crate-4", type: "crate", x: 1160, y: 500, w: 56, h: 56, solid: true }),
  ]),

  lights: Object.freeze([
    Object.freeze({ id: "vf-lamp-vault", x: 480, y: 270, radius: 160, intensity: 1.0 }),
    Object.freeze({ id: "vf-lamp-west", x: 150, y: 470, radius: 110, intensity: 0.8 }),
    Object.freeze({ id: "vf-lamp-east", x: 1040, y: 400, radius: 130, intensity: 0.9 }),
    Object.freeze({ id: "vf-lamp-south", x: 610, y: 620, radius: 100, intensity: 0.75 }),
  ]),

  loot: Object.freeze([
    Object.freeze({ id: "vf-reliquary-1", type: "jewel-reliquary", x: 360, y: 360, value: 250 }),
    Object.freeze({ id: "vf-reliquary-2", type: "jewel-reliquary", x: 610, y: 340, value: 250 }),
    Object.freeze({ id: "vf-purse-1", type: "coin-purse", x: 950, y: 500, value: 100 }),
  ]),

  guards: Object.freeze([
    Object.freeze({
      id: "vf-guard-1",
      waypoints: Object.freeze([
        Object.freeze({ x: 360, y: 180 }),
        Object.freeze({ x: 600, y: 180 }),
        Object.freeze({ x: 600, y: 380 }),
        Object.freeze({ x: 360, y: 380 }),
      ]),
    }),
    Object.freeze({
      id: "vf-guard-2",
      waypoints: Object.freeze([
        Object.freeze({ x: 880, y: 230 }),
        Object.freeze({ x: 880, y: 520 }),
        Object.freeze({ x: 1040, y: 520 }),
        Object.freeze({ x: 1040, y: 230 }),
      ]),
    }),
    Object.freeze({
      id: "vf-guard-3",
      waypoints: Object.freeze([
        Object.freeze({ x: 180, y: 620 }),
        Object.freeze({ x: 450, y: 620 }),
        Object.freeze({ x: 450, y: 480 }),
        Object.freeze({ x: 180, y: 480 }),
      ]),
    }),
  ]),

  cameras: Object.freeze([
    Object.freeze({
      id: "vf-camera-1",
      x: 250,
      y: 170,
      angle: Math.PI / 2,
      sweepMin: Math.PI / 5,
      sweepMax: (7 * Math.PI) / 10,
    }),
    Object.freeze({
      id: "vf-camera-2",
      x: 760,
      y: 460,
      angle: 0,
      sweepMin: -Math.PI / 4,
      sweepMax: Math.PI / 4,
    }),
    Object.freeze({
      id: "vf-camera-3",
      x: 1200,
      y: 100,
      angle: Math.PI,
      sweepMin: (3 * Math.PI) / 4,
      sweepMax: (5 * Math.PI) / 4,
    }),
  ]),

  exits: Object.freeze([
    Object.freeze({ id: "vf-stair-door", type: "door", x: 60, y: 660, w: 48, h: 48, label: "Stairwell Door" }),
  ]),
});

export const PENTHOUSE = Object.freeze({
  id: "penthouse",
  name: "Penthouse",
  subtitle: "The Gilded Chorale waits beneath the glass roof.",
  width: 1280,
  height: 720,
  spawn: Object.freeze({ x: 110, y: 90 }),

  walls: Object.freeze([
    Object.freeze({ x: 0, y: 0, w: 1280, h: 24 }),
    Object.freeze({ x: 0, y: 696, w: 1280, h: 24 }),
    Object.freeze({ x: 0, y: 24, w: 24, h: 672 }),
    Object.freeze({ x: 1256, y: 24, w: 24, h: 672 }),
    Object.freeze({ x: 180, y: 140, w: 300, h: 24 }),
    Object.freeze({ x: 180, y: 140, w: 24, h: 220 }),
    Object.freeze({ x: 480, y: 140, w: 24, h: 220 }),
    Object.freeze({ x: 180, y: 360, w: 300, h: 24 }),
    Object.freeze({ x: 620, y: 100, w: 24, h: 280 }),
    Object.freeze({ x: 620, y: 380, w: 280, h: 24 }),
    Object.freeze({ x: 900, y: 380, w: 24, h: 240 }),
    Object.freeze({ x: 240, y: 540, w: 220, h: 24 }),
    Object.freeze({ x: 1110, y: 120, w: 24, h: 180 }),
  ]),

  cover: Object.freeze([
    Object.freeze({ id: "ph-crate-1", type: "crate", x: 300, y: 230, w: 50, h: 50, solid: true }),
    Object.freeze({ id: "ph-crate-2", type: "crate", x: 760, y: 220, w: 56, h: 56, solid: true }),
    Object.freeze({ id: "ph-sofa-1", type: "sofa", x: 650, y: 630, w: 130, h: 30, solid: true }),
    Object.freeze({ id: "ph-sofa-2", type: "sofa", x: 1080, y: 650, w: 110, h: 30, solid: true }),
    Object.freeze({ id: "ph-crate-3", type: "crate", x: 380, y: 610, w: 56, h: 56, solid: true }),
  ]),

  lights: Object.freeze([
    Object.freeze({ id: "ph-glass-roof", x: 780, y: 300, radius: 230, intensity: 1.0 }),
    Object.freeze({ id: "ph-lamp-west", x: 270, y: 250, radius: 110, intensity: 0.8 }),
    Object.freeze({ id: "ph-lamp-south", x: 560, y: 610, radius: 120, intensity: 0.85 }),
    Object.freeze({ id: "ph-lamp-east", x: 1160, y: 480, radius: 100, intensity: 0.75 }),
  ]),

  loot: Object.freeze([
    Object.freeze({ id: "ph-gilded-chorale", type: "relic", x: 800, y: 250, value: 500, relic: true }),
    Object.freeze({ id: "ph-reliquary-1", type: "jewel-reliquary", x: 430, y: 460, value: 250 }),
    Object.freeze({ id: "ph-purse-1", type: "coin-purse", x: 1050, y: 600, value: 100 }),
  ]),

  guards: Object.freeze([
    Object.freeze({
      id: "ph-guard-1",
      waypoints: Object.freeze([
        Object.freeze({ x: 680, y: 180 }),
        Object.freeze({ x: 860, y: 180 }),
        Object.freeze({ x: 860, y: 340 }),
        Object.freeze({ x: 680, y: 340 }),
      ]),
    }),
    Object.freeze({
      id: "ph-guard-2",
      waypoints: Object.freeze([
        Object.freeze({ x: 1000, y: 180 }),
        Object.freeze({ x: 1000, y: 540 }),
        Object.freeze({ x: 1180, y: 540 }),
        Object.freeze({ x: 1180, y: 180 }),
      ]),
    }),
    Object.freeze({
      id: "ph-guard-3",
      waypoints: Object.freeze([
        Object.freeze({ x: 300, y: 460 }),
        Object.freeze({ x: 520, y: 460 }),
        Object.freeze({ x: 520, y: 640 }),
        Object.freeze({ x: 300, y: 640 }),
      ]),
    }),
  ]),

  cameras: Object.freeze([
    Object.freeze({
      id: "ph-camera-1",
      x: 220,
      y: 200,
      angle: Math.PI / 3,
      sweepMin: Math.PI / 12,
      sweepMax: (2 * Math.PI) / 3,
    }),
    Object.freeze({
      id: "ph-camera-2",
      x: 720,
      y: 120,
      angle: Math.PI / 2,
      sweepMin: Math.PI / 6,
      sweepMax: (5 * Math.PI) / 6,
    }),
    Object.freeze({
      id: "ph-camera-3",
      x: 1220,
      y: 560,
      angle: Math.PI,
      sweepMin: (2 * Math.PI) / 3,
      sweepMax: (7 * Math.PI) / 6,
    }),
  ]),

  exits: Object.freeze([
    Object.freeze({ id: "ph-getaway-van", type: "van", x: 1120, y: 610, w: 96, h: 54, label: "Getaway Van" }),
  ]),
});

export const LEVELS = Object.freeze([GRAND_HALL, VAULT_FLOOR, PENTHOUSE]);
