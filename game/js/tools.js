// VELVET UMBRA — chime coins, smoke vials, ammo, and vision obstruction.
import { CONFIG, PALETTE } from "./config.js";

const TOOLS_TUNING = CONFIG.tuning.tools ?? {};
const NOISE_TUNING = CONFIG.tuning.noise ?? {};
const GUARD_TUNING = CONFIG.tuning.guard ?? {};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function emit(name, detail) {
  if (typeof document !== "undefined" && typeof CustomEvent !== "undefined") {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

/** Resolve either throwChime(player, target) or throwChime(x1, y1, x2, y2). */
function throwArguments(a, b, c, d) {
  if (a && typeof a === "object" && b && typeof b === "object") {
    return { from: { x: Number(a.x), y: Number(a.y) }, target: { x: Number(b.x), y: Number(b.y) } };
  }

  if (typeof a === "number" && typeof b === "number") {
    if (c && typeof c === "object") {
      return { from: { x: a, y: b }, target: { x: Number(c.x), y: Number(c.y) } };
    }
    return { from: { x: a, y: b }, target: { x: Number(c), y: Number(d) } };
  }

  return null;
}

/** True when the segment from (x1,y1) to (x2,y2) crosses a circle. */
function segmentIntersectsCircle(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  let t = 0;
  if (lengthSquared > 0) {
    t = clamp(((cx - x1) * dx + (cy - y1) * dy) / lengthSquared, 0, 1);
  }

  const closestX = x1 + dx * t;
  const closestY = y1 + dy * t;
  const distanceSquared = (closestX - cx) ** 2 + (closestY - cy) ** 2;
  return distanceSquared <= radius * radius;
}

/**
 * Thrown chime coins lure the nearest Custodian to the impact point.
 * Smoke vials burst into gray clouds that block vision for four seconds.
 */
export class ToolsManager {
  /**
   * @param {{chimeAmmo?:number,smokeAmmo?:number,onChime?:Function,onSmoke?:Function,onLure?:Function}} [options]
   */
  constructor(options = {}) {
    this.maxChime = TOOLS_TUNING.chimeCount ?? 5;
    this.maxSmoke = TOOLS_TUNING.smokeCount ?? 2;
    this.chimeAmmo = clamp(options.chimeAmmo ?? this.maxChime, 0, this.maxChime);
    this.smokeAmmo = clamp(options.smokeAmmo ?? this.maxSmoke, 0, this.maxSmoke);

    this.chimeCooldown = 0;
    this.smokeCooldown = 0;
    this.chimeProjectiles = [];
    this.smokeProjectiles = [];
    this.smokeClouds = [];
    this.noisePoints = [];
    this.time = 0;

    this.onChime = options.onChime ?? null;
    this.onSmoke = options.onSmoke ?? null;
    this.onLure = options.onLure ?? null;
  }

  /** Ammo snapshot for HUD rendering. */
  get ammo() {
    return { chime: this.chimeAmmo, smoke: this.smokeAmmo };
  }

  /** HUD aliases. */
  get chimeCount() {
    return this.chimeAmmo;
  }

  get smokeCount() {
    return this.smokeAmmo;
  }

  canThrowChime() {
    return this.chimeAmmo > 0 && this.chimeCooldown <= 0;
  }

  canThrowSmoke() {
    return this.smokeAmmo > 0 && this.smokeCooldown <= 0;
  }

  /**
   * Throw a chime coin. Accepts (player, target) or (x1, y1, x2, y2).
   * @returns {boolean} true when a coin was thrown
   */
  throwChime(a, b, c, d) {
    if (!this.canThrowChime()) return false;

    const args = throwArguments(a, b, c, d);
    if (!args) return false;

    const { from, target } = args;
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const distance = Math.hypot(dx, dy);
    const speed = TOOLS_TUNING.chimeThrowSpeed ?? 420;
    const lifetime = TOOLS_TUNING.chimeLifetime ?? 3.0;

    // Keep the throw inside the coin's flight lifetime.
    const maxDistance = speed * lifetime;
    let landingX = target.x;
    let landingY = target.y;
    if (distance > maxDistance && distance > 0) {
      landingX = from.x + (dx / distance) * maxDistance;
      landingY = from.y + (dy / distance) * maxDistance;
    }

    this.chimeAmmo -= 1;
    this.chimeCooldown = TOOLS_TUNING.chimeCooldown ?? 0.5;

    this.chimeProjectiles.push({
      x: from.x,
      y: from.y,
      targetX: landingX,
      targetY: landingY,
      speed,
      remaining: Math.hypot(landingX - from.x, landingY - from.y),
      life: lifetime,
    });

    emit("chimeThrow", {
      x: from.x,
      y: from.y,
      targetX: landingX,
      targetY: landingY,
      ammo: this.chimeAmmo,
    });

    return true;
  }

  /**
   * Throw a smoke vial. Accepts (player, target) or (x1, y1, x2, y2).
   * @returns {boolean} true when a vial was thrown
   */
  throwSmoke(a, b, c, d) {
    if (!this.canThrowSmoke()) return false;

    const args = throwArguments(a, b, c, d);
    if (!args) return false;

    const { from, target } = args;
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const distance = Math.hypot(dx, dy);
    const speed = TOOLS_TUNING.smokeThrowSpeed ?? 380;
    const throwRange = TOOLS_TUNING.smokeThrowRange ?? 190;

    let landingX = target.x;
    let landingY = target.y;
    if (distance > throwRange && distance > 0) {
      landingX = from.x + (dx / distance) * throwRange;
      landingY = from.y + (dy / distance) * throwRange;
    }

    this.smokeAmmo -= 1;
    this.smokeCooldown = TOOLS_TUNING.smokeCooldown ?? 1.0;

    this.smokeProjectiles.push({
      x: from.x,
      y: from.y,
      targetX: landingX,
      targetY: landingY,
      speed,
      remaining: Math.hypot(landingX - from.x, landingY - from.y),
      life: TOOLS_TUNING.smokeDuration ?? 4.0,
    });

    emit("smokeThrow", {
      x: from.x,
      y: from.y,
      targetX: landingX,
      targetY: landingY,
      ammo: this.smokeAmmo,
    });

    return true;
  }

  /**
   * Advance projectiles/clouds. Pass guards so landed chimes can lure the
   * nearest Custodian immediately; the noisePoints array remains available
   * for guard managers that consume noise events.
   */
  update(dt, guards = []) {
    const safeDt = Math.max(0, dt);
    this.time += safeDt;

    this.chimeCooldown = Math.max(0, this.chimeCooldown - safeDt);
    this.smokeCooldown = Math.max(0, this.smokeCooldown - safeDt);

    const remainingChimes = [];
    for (const projectile of this.chimeProjectiles) {
      projectile.life -= safeDt;
      const step = Math.min(projectile.speed * safeDt, projectile.remaining);

      if (projectile.remaining > 0) {
        const dx = projectile.targetX - projectile.x;
        const dy = projectile.targetY - projectile.y;
        const distance = Math.hypot(dx, dy) || 1;
        projectile.x += (dx / distance) * step;
        projectile.y += (dy / distance) * step;
        projectile.remaining -= step;
      }

      if (projectile.remaining <= 0.001) {
        this.#chimeLanded(projectile.targetX, projectile.targetY, guards);
      } else if (projectile.life <= 0) {
        this.#chimeLanded(projectile.x, projectile.y, guards);
      } else {
        remainingChimes.push(projectile);
      }
    }
    this.chimeProjectiles = remainingChimes;

    const remainingVials = [];
    for (const projectile of this.smokeProjectiles) {
      projectile.life -= safeDt;
      const step = Math.min(projectile.speed * safeDt, projectile.remaining);

      if (projectile.remaining > 0) {
        const dx = projectile.targetX - projectile.x;
        const dy = projectile.targetY - projectile.y;
        const distance = Math.hypot(dx, dy) || 1;
        projectile.x += (dx / distance) * step;
        projectile.y += (dy / distance) * step;
        projectile.remaining -= step;
      }

      if (projectile.remaining <= 0.001) {
        this.#smokeLanded(projectile.targetX, projectile.targetY);
      } else if (projectile.life <= 0) {
        this.#smokeLanded(projectile.x, projectile.y);
      } else {
        remainingVials.push(projectile);
      }
    }
    this.smokeProjectiles = remainingVials;

    const liveClouds = [];
    for (const cloud of this.smokeClouds) {
      cloud.remaining -= safeDt;
      cloud.age += safeDt;
      if (cloud.remaining > 0) liveClouds.push(cloud);
    }
    this.smokeClouds = liveClouds;

    const liveNoise = [];
    for (const noise of this.noisePoints) {
      noise.ttl -= safeDt;
      if (noise.ttl > 0) liveNoise.push(noise);
    }
    this.noisePoints = liveNoise;

    return { chimeProjectiles: this.chimeProjectiles, smokeClouds: this.smokeClouds };
  }

  /** Find and lure the nearest guard within chime lure range. */
  lureNearestGuard(point, guards = []) {
    if (!point || !guards.length) return null;

    const lureRange = TOOLS_TUNING.chimeLureRange ?? 260;
    let nearest = null;
    let nearestDistance = Infinity;

    for (const guard of guards) {
      if (!guard || !Number.isFinite(guard.x) || !Number.isFinite(guard.y)) continue;
      const distance = Math.hypot(guard.x - point.x, guard.y - point.y);
      if (distance <= lureRange && distance < nearestDistance) {
        nearest = guard;
        nearestDistance = distance;
      }
    }

    if (!nearest) return null;

    nearest.state = "suspicious";
    nearest.suspicion = Math.max(
      Number(nearest.suspicion) || 0,
      GUARD_TUNING.suspicionThreshold ?? 0.45
    );
    nearest.noiseTarget = { x: point.x, y: point.y };

    const detail = {
      guard: nearest,
      guardId: nearest.id ?? null,
      x: point.x,
      y: point.y,
    };
    emit("chimeLure", detail);
    if (typeof this.onLure === "function") this.onLure(detail);

    return nearest;
  }

  /** True when any active smoke cloud intersects the sight segment. */
  blocksVision(x1, y1, x2, y2) {
    for (const cloud of this.smokeClouds) {
      if (segmentIntersectsCircle(x1, y1, x2, y2, cloud.x, cloud.y, cloud.radius)) {
        return true;
      }
    }
    return false;
  }

  /** Alias for consumers that prefer the longer name. */
  isVisionBlocked(x1, y1, x2, y2) {
    return this.blocksVision(x1, y1, x2, y2);
  }

  /** True when a point is inside a smoke cloud. */
  isPointInSmoke(x, y) {
    return this.smokeClouds.some(cloud => Math.hypot(x - cloud.x, y - cloud.y) <= cloud.radius);
  }

  /** Reset tools for a new floor or retry. */
  reset() {
    this.chimeAmmo = this.maxChime;
    this.smokeAmmo = this.maxSmoke;
    this.chimeCooldown = 0;
    this.smokeCooldown = 0;
    this.chimeProjectiles = [];
    this.smokeProjectiles = [];
    this.smokeClouds = [];
    this.noisePoints = [];
    this.time = 0;
  }

  #chimeLanded(x, y, guards) {
    const noise = {
      x,
      y,
      strength: NOISE_TUNING.chimeRadius ?? 168,
      ttl: TOOLS_TUNING.chimeLifetime ?? 3.0,
      source: "chime",
    };
    this.noisePoints.push(noise);

    const guard = this.lureNearestGuard(noise, guards);
    const detail = { x, y, guardId: guard?.id ?? null, noise };

    emit("chime", detail);
    if (typeof this.onChime === "function") this.onChime(detail);
  }

  #smokeLanded(x, y) {
    const duration = TOOLS_TUNING.smokeDuration ?? 4.0;
    const cloud = {
      x,
      y,
      radius: TOOLS_TUNING.smokeRadius ?? 72,
      remaining: duration,
      duration,
      age: 0,
    };
    this.smokeClouds.push(cloud);

    const detail = { x, y, radius: cloud.radius, duration };
    emit("smoke", detail);
    if (typeof this.onSmoke === "function") this.onSmoke(detail);
  }

  /** Draw coins, vials, and gray smoke clouds. */
  draw(ctx) {
    if (!ctx) return;

    ctx.save();

    // Chime coins in flight.
    for (const projectile of this.chimeProjectiles) {
      ctx.fillStyle = PALETTE.loot;
      ctx.strokeStyle = PALETTE.lootEdge;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Smoke vials in flight.
    for (const projectile of this.smokeProjectiles) {
      ctx.fillStyle = PALETTE.smoke;
      ctx.strokeStyle = PALETTE.smokeEdge;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Gray smoke puffs.
    for (const cloud of this.smokeClouds) {
      const lifeRatio = clamp(cloud.remaining / cloud.duration, 0, 1);
      ctx.globalAlpha = 0.35 + lifeRatio * 0.65;

      const gradient = ctx.createRadialGradient(cloud.x, cloud.y, 4, cloud.x, cloud.y, cloud.radius);
      gradient.addColorStop(0, PALETTE.smokeSoft);
      gradient.addColorStop(0.55, PALETTE.smokeSoft);
      gradient.addColorStop(1, "rgba(185,194,190,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
      ctx.fill();

      const puffAngle = this.time * 0.7;
      for (let i = 0; i < 6; i++) {
        const angle = puffAngle + (i * Math.PI) / 3;
        const offset = cloud.radius * (0.35 + (i % 3) * 0.13);
        const px = cloud.x + Math.cos(angle) * offset;
        const py = cloud.y + Math.sin(angle) * offset;
        const puffRadius = cloud.radius * (0.16 + (i % 2) * 0.07);

        ctx.fillStyle = PALETTE.smokeSoft;
        ctx.beginPath();
        ctx.arc(px, py, puffRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = PALETTE.smokeEdge;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.radius * 0.72, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
