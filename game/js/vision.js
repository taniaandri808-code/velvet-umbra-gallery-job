/**
 * Cast a ray from (ox, oy) in direction (dx, dy) (unit vector) up to maxDist.
 * Returns the distance to the nearest wall, or maxDist if no wall is hit.
 * walls: array of {x, y, w, h} axis-aligned rectangles.
 */
function raycast(ox, oy, dx, dy, maxDist, walls) {
  let nearest = maxDist;
  for (const wall of walls) {
    let tMin = 0, tMax = Infinity;

    // X slab
    if (dx !== 0) {
      let t1 = (wall.x - ox) / dx;
      let t2 = (wall.x + wall.w - ox) / dx;
      if (dx < 0) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
    } else {
      if (ox < wall.x || ox > wall.x + wall.w) continue;
    }

    // Y slab
    if (dy !== 0) {
      let t1 = (wall.y - oy) / dy;
      let t2 = (wall.y + wall.h - oy) / dy;
      if (dy < 0) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
    } else {
      if (oy < wall.y || oy > wall.y + wall.h) continue;
    }

    if (tMin > tMax) continue;

    const hitT = Math.max(tMin, 0);
    if (hitT >= 0 && hitT < nearest) nearest = hitT;
  }
  return nearest;
}

/**
 * Segment–rectangle AABB hit test.
 * Returns true if the segment from (x1,y1) to (x2,y2) intersects rect.
 * rect: {x, y, w, h}
 */
function segmentRectHit(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return false;

  let tMin = 0, tMax = 1;

    // X slab
  if (dx !== 0) {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (dx < 0) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
  } else {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  }

  // Y slab
  if (dy !== 0) {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (dy < 0) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
  } else {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  }

  return tMin <= tMax && tMax >= 0 && tMin <= 1;
}

/**
 * Determine whether a line segment is blocked by any wall.
 * @param {number} x1 - start x
 * @param {number} y1 - start y
 * @param {number} x2 - end x
 * @param {number} y2 - end y
 * @param {Array<{x:number,y:number,w:number,h:number}>} walls
 * @returns {boolean} true if blocked
 */
export function lineBlocked(x1, y1, x2, y2, walls = []) {
  for (const wall of walls) {
    if (segmentRectHit(x1, y1, x2, y2, wall)) return true;
  }
  return false;
}

/**
 * Compute a cone-shaped polygon starting at (x, y).
 * @param {number} x - origin x
 * @param {number} y - origin y
 * @param {number} angle - central angle in radians
 * @param {number} halfFov - half angular width in radians
 * @param {number} range - maximum ray length
 * @param {Array<{x:number,y:number,w:number,h:number}>} walls
 * @returns {Array<{x:number,y:number}>} polygon vertices starting at origin,
 *         followed by sampled points along the arc, in clockwise order.
 */
export function computeConePolygon(x, y, angle, halfFov, range, walls = []) {
  const N = 32; // number of samples around the cone
  const pts = [];

  for (let i = 0; i < N; i++) {
    const a = angle - halfFov + (i / (N - 1)) * 2 * halfFov;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const d = raycast(x, y, dx, dy, range, walls);
    pts.push({ x: x + dx * d, y: y + dy * d });
  }

  // Return polygon: origin first, then arc points.
  return [{ x, y }, ...pts];
}

/**
 * Check whether a point is inside the cone and not blocked by walls.
 * @param {number} px - point x
 * @param {number} py - point y
 * @param {number} cx - cone origin x
 * @param {number} cy - cone origin y
 * @param {number} angle - central angle in radians
 * @param {number} halfFov - half angular width in radians
 * @param {number} range - maximum distance from origin
 * @param {Array<{x:number,y:number,w:number,h:number}>} [walls=[]]
 * @returns {boolean} true if the point is visible inside the cone
 */
export function pointInCone(px, py, cx, cy, angle, halfFov, range, walls = []) {
  const vx = px - cx;
  const vy = py - cy;
  const dist = Math.hypot(vx, vy);
  if (dist > range) return false;
  if (dist === 0) return true; // at the origin

  const pointAngle = Math.atan2(vy, vx);
  // Normalize the angular difference to [-PI, PI]
  let diff = (angle - pointAngle) % (2 * Math.PI);
  if (diff > Math.PI) diff -= 2 * Math.PI;
  if (diff < -Math.PI) diff += 2 * Math.PI;

  if (Math.abs(diff) > halfFov) return false;

  // Check line-of-sight obstruction
  return !lineBlocked(cx, cy, px, py, walls);
}

/**
 * Export all vision functions as a single named export.
 * This allows consumers to do: import { vision } from './vision.js';
 */
export const vision = {
  computeConePolygon,
  pointInCone,
  lineBlocked,
};
