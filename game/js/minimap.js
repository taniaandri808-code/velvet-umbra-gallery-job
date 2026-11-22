import { CAMERA_TUNING, PALETTE, VISUAL_TUNING } from "./config.js";

function numberOr(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function isCollected(item, state) {
  if (!item) return false;
  if (item.collected || item.picked || item.taken || item.active === false) {
    return true;
  }

  const collected =
    state?.collectedLoot ?? state?.collected ?? state?.pickedLoot ??
    state?.collectedIds ?? state?.pickedIds;

  if (collected instanceof Set) {
    return collected.has(item.id) || collected.has(item);
  }
  if (Array.isArray(collected)) {
    return collected.includes(item.id) || collected.includes(item);
  }
  if (collected && typeof collected === "object") {
    return Boolean(collected[item.id]);
  }
  return false;
}

function guardPosition(guard) {
  if (!guard) return null;
  if (Number.isFinite(Number(guard.x)) && Number.isFinite(Number(guard.y))) {
    return { x: Number(guard.x), y: Number(guard.y) };
  }

  const index = Number.isInteger(guard.currentWaypointIndex)
    ? guard.currentWaypointIndex
    : 0;
  const waypoint = guard.waypoints?.[index] ?? guard.waypoints?.[0];
  return waypoint ?? null;
}

function cameraAngle(camera) {
  const raw = numberOr(camera?.angle ?? camera?.sweepAngle ?? camera?.baseAngle, 0);
  return Math.abs(raw) > Math.PI * 2 ? (raw * Math.PI) / 180 : raw;
}

/** Small canvas map of walls, loot, guards, cameras, exits, and the player. */
export class Minimap {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = options;
  }

  /**
   * Draw from either a level plus positional state, or a single state object
   * containing `level`, `player`, `guards`, `cameras`, `loot`, and `exits`.
   */
  draw(levelOrState, player = null, guards = null, cameras = null, loot = null, exits = null) {
    const canvas = this.canvas;
    if (!canvas || typeof canvas.getContext !== "function") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let level;
    let state;
    if (
      levelOrState &&
      typeof levelOrState === "object" &&
      levelOrState.level &&
      typeof levelOrState.level === "object"
    ) {
      state = levelOrState;
      level = state.level;
    } else {
      level = levelOrState;
      state = { level, player, guards, cameras, loot, exits };
    }

    const mapWidth = numberOr(level?.width, 1280);
    const mapHeight = numberOr(level?.height, 720);
    if (!level || mapWidth <= 0 || mapHeight <= 0) return;

    const width = numberOr(canvas.width, VISUAL_TUNING.minimapWidth || 220);
    const height = numberOr(canvas.height, 130);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = PALETTE.hudAccent;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
    ctx.restore();

    const scale = Math.min(width / mapWidth, height / mapHeight);
    const offsetX = (width - mapWidth * scale) / 2;
    const offsetY = (height - mapHeight * scale) / 2;
    const sx = (x) => offsetX + numberOr(x) * scale;
    const sy = (y) => offsetY + numberOr(y) * scale;

    // Walls.
    const walls = Array.isArray(level.walls) ? level.walls : [];
    ctx.save();
    ctx.fillStyle = PALETTE.wall;
    ctx.globalAlpha = VISUAL_TUNING.minimapWallAlpha ?? 0.9;
    for (const wall of walls) {
      if (!wall) continue;
      ctx.fillRect(
        sx(wall.x),
        sy(wall.y),
        Math.max(1, numberOr(wall.w) * scale),
        Math.max(1, numberOr(wall.h) * scale),
      );
    }
    ctx.restore();

    // Loot dots; collected items disappear.
    const lootItems = Array.isArray(state.loot)
      ? state.loot
      : Array.isArray(state.lootItems)
        ? state.lootItems
        : Array.isArray(level.loot)
          ? level.loot
          : [];

    ctx.save();
    ctx.fillStyle = PALETTE.loot;
    ctx.shadowColor = PALETTE.lootEdge;
    ctx.shadowBlur = 5;
    for (const item of lootItems) {
      if (!item || isCollected(item, state)) continue;
      const radius = item.relic
        ? (VISUAL_TUNING.minimapLootDotRadius ?? 3) + 1
        : VISUAL_TUNING.minimapLootDotRadius ?? 3;
      ctx.beginPath();
      ctx.arc(sx(item.x), sy(item.y), radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Guard dots.
    const guardItems = Array.isArray(state.guards)
      ? state.guards
      : Array.isArray(level.guards)
        ? level.guards
        : [];

    ctx.save();
    for (const guard of guardItems) {
      const position = guardPosition(guard);
      if (!position) continue;
      const alert = guard.state === "alert" || guard.alert === true;
      const suspicious =
        guard.state === "suspicious" ||
        (Number.isFinite(Number(guard.suspicion)) && Number(guard.suspicion) >= 0.45);
      ctx.fillStyle = alert
        ? PALETTE.guardAlert
        : suspicious
          ? PALETTE.hudAccent
          : PALETTE.guard;
      ctx.beginPath();
      ctx.arc(
        sx(position.x),
        sy(position.y),
        VISUAL_TUNING.minimapGuardDotRadius ?? 4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();

    // Camera dots and a small sweep wedge.
    const cameraItems = Array.isArray(state.cameras)
      ? state.cameras
      : Array.isArray(level.cameras)
        ? level.cameras
        : [];

    ctx.save();
    const halfArc = (CAMERA_TUNING.arcRad ?? Math.PI / 3.6) / 2;
    for (const camera of cameraItems) {
      if (!camera) continue;
      const x = sx(camera.x);
      const y = sy(camera.y);
      const alert =
        camera.seesPlayer === true || camera.alert === true || camera.state === "alert";
      const angle = cameraAngle(camera);
      const range = Math.max(
        3,
        numberOr(camera.range, CAMERA_TUNING.radius ?? 140) * scale,
      );

      ctx.globalAlpha = alert ? 0.3 : 0.18;
      ctx.fillStyle = alert ? PALETTE.danger : PALETTE.camera;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, range, angle - halfArc, angle + halfArc);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillStyle = alert ? PALETTE.cameraAlert : PALETTE.camera;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Exit markers.
    const exitItems = Array.isArray(state.exits)
      ? state.exits
      : Array.isArray(level.exits)
        ? level.exits
        : [];

    ctx.save();
    ctx.fillStyle = PALETTE.exit;
    ctx.shadowColor = PALETTE.exitEdge;
    ctx.shadowBlur = 5;
    for (const exit of exitItems) {
      if (!exit) continue;
      const x = sx(exit.x);
      const y = sy(exit.y);
      if (exit.w && exit.h) {
        ctx.fillRect(
          x,
          y,
          Math.max(2, numberOr(exit.w) * scale),
          Math.max(2, numberOr(exit.h) * scale),
        );
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Player dot with violet shadow.
    const playerState = state.player ?? player;
    if (
      playerState &&
      Number.isFinite(Number(playerState.x)) &&
      Number.isFinite(Number(playerState.y))
    ) {
      const x = sx(playerState.x);
      const y = sy(playerState.y);
      ctx.save();
      ctx.fillStyle = PALETTE.playerShadow;
      ctx.beginPath();
      ctx.arc(x, y, (VISUAL_TUNING.minimapPlayerDotRadius ?? 4) + 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.player;
      ctx.beginPath();
      ctx.arc(x, y, VISUAL_TUNING.minimapPlayerDotRadius ?? 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

/** Convenience one-shot minimap renderer. */
export function drawMinimap(canvas, levelOrState, player = null, guards = null, cameras = null, loot = null, exits = null) {
  const minimap = new Minimap(canvas);
  minimap.draw(levelOrState, player, guards, cameras, loot, exits);
  return minimap;
}

export const renderMinimap = drawMinimap;
export { Minimap as MiniMap };
export default Minimap;
