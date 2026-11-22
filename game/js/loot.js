// VELVET UMBRA — loot pickup and relic glow.
import { CONFIG, PALETTE } from "./config.js";

const TOOLS_TUNING = CONFIG.tuning.tools ?? {};
const DEFAULT_PICKUP_RADIUS = TOOLS_TUNING.lootPickupRadius ?? 26;

const TYPE_META = Object.freeze({
  "coin-purse": { label: "Coin Purse", radius: 6 },
  "jewel-reliquary": { label: "Jewel Reliquary", radius: 7 },
  relic: { label: "The Gilded Chorale", radius: 10 },
});

function metaFor(item) {
  if (item.relic || item.type === "relic") return TYPE_META.relic;
  return TYPE_META[item.type] ?? { label: item.label ?? "Loot", radius: 7 };
}

function emit(name, detail) {
  if (typeof document !== "undefined" && typeof CustomEvent !== "undefined") {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

/**
 * Tracks a level's loot items, draws their gold glow, and lets E pick up
 * the nearest uncollected item within the interaction radius.
 */
export class LootManager {
  /**
   * @param {Array<{id:string,type:string,x:number,y:number,value?:number,relic?:boolean}>} items
   * @param {{pickupRadius?:number,onPickup?:Function}} [options]
   */
  constructor(items = [], options = {}) {
    this.items = items.map((item, index) => ({
      ...item,
      collected: Boolean(item.collected),
      glowPhase: item.glowPhase ?? index * 1.7,
      label: item.label ?? metaFor(item).label,
    }));

    this.time = 0;
    this.pickupRadius = options.pickupRadius ?? DEFAULT_PICKUP_RADIUS;
    this.onPickup = options.onPickup ?? null;
  }

  /** Advance glow animation and optionally perform an E-interaction. */
  update(dt, player = null, interactPressed = false) {
    this.time += Math.max(0, dt);

    if (interactPressed && player) {
      return this.pickupNearest(player);
    }
    return null;
  }

  /** Nearest uncollected item within pickup radius, or null. */
  nearest(player) {
    if (!player) return null;

    let nearestItem = null;
    let nearestDistance = Infinity;

    for (const item of this.items) {
      if (item.collected) continue;
      const distance = Math.hypot(item.x - player.x, item.y - player.y);
      if (distance <= this.pickupRadius && distance < nearestDistance) {
        nearestItem = item;
        nearestDistance = distance;
      }
    }

    return nearestItem;
  }

  /** True when the player is close enough to pick up at least one item. */
  canPickup(player) {
    return this.nearest(player) !== null;
  }

  /** Short HUD prompt for the item within reach, or null. */
  prompt(player) {
    const item = this.nearest(player);
    return item ? `E — Take ${item.label}` : null;
  }

  /** Pick up the nearest item. Returns the picked item or null. */
  pickupNearest(player) {
    const item = this.nearest(player);
    if (!item) return null;

    item.collected = true;
    const detail = {
      item,
      id: item.id,
      type: item.type,
      value: item.value ?? 0,
      relic: Boolean(item.relic || item.type === "relic"),
    };

    emit("lootpickup", detail);
    if (typeof this.onPickup === "function") this.onPickup(detail);
    return item;
  }

  reset(items = this.items.map(item => ({ ...item, collected: false }))) {
    this.items = items.map((item, index) => ({
      ...item,
      collected: Boolean(item.collected),
      glowPhase: item.glowPhase ?? index * 1.7,
      label: item.label ?? metaFor(item).label,
    }));
    this.time = 0;
  }

  get totalCount() {
    return this.items.length;
  }

  get collectedCount() {
    return this.items.reduce((count, item) => count + (item.collected ? 1 : 0), 0);
  }

  /** Alias used by the HUD loot counter. */
  get lootCount() {
    return this.collectedCount;
  }

  get remainingCount() {
    return this.totalCount - this.collectedCount;
  }

  get relicItems() {
    return this.items.filter(item => item.relic || item.type === "relic");
  }

  get relicCount() {
    return this.relicItems.length;
  }

  get relicsCollected() {
    return this.relicItems.reduce((count, item) => count + (item.collected ? 1 : 0), 0);
  }

  get allRelicsCollected() {
    return this.relicItems.every(item => item.collected);
  }

  get allLootCollected() {
    return this.items.every(item => item.collected);
  }

  get totalValue() {
    return this.items.reduce((sum, item) => sum + (item.value ?? 0), 0);
  }

  get collectedValue() {
    return this.items.reduce(
      (sum, item) => sum + (item.collected ? (item.value ?? 0) : 0),
      0
    );
  }

  /** Draw uncollected loot, gold glow, and a pulse ring on the nearest item. */
  draw(ctx, player = null) {
    if (!ctx) return;

    const nearestItem = this.nearest(player);
    ctx.save();

    for (const item of this.items) {
      if (item.collected) continue;

      const isRelic = Boolean(item.relic || item.type === "relic");
      const pulse = 0.75 + 0.25 * Math.sin(this.time * (isRelic ? 3.2 : 2.2) + item.glowPhase);
      const glowRadius = isRelic ? 46 : 24;
      const glowStrength = isRelic ? 0.22 + pulse * 0.16 : 0.10 + pulse * 0.10;

      const glow = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, glowRadius);
      glow.addColorStop(0, `rgba(255,210,87,${glowStrength.toFixed(3)})`);
      glow.addColorStop(0.45, PALETTE.lootGlow);
      glow.addColorStop(1, "rgba(255,210,87,0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(item.x, item.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      if (isRelic) {
        // Four slow, rotating glints around the Gilded Chorale.
        const glintAngle = this.time * 0.9 + item.glowPhase;
        ctx.strokeStyle = PALETTE.lootEdge;
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const angle = glintAngle + (i * Math.PI) / 2;
          const inner = glowRadius * 0.55;
          const outer = glowRadius * (0.88 + pulse * 0.10);
          ctx.beginPath();
          ctx.moveTo(item.x + Math.cos(angle) * inner, item.y + Math.sin(angle) * inner);
          ctx.lineTo(item.x + Math.cos(angle) * outer, item.y + Math.sin(angle) * outer);
          ctx.stroke();
        }
      }

      this.#drawItem(ctx, item, isRelic);

      if (item === nearestItem) {
        const ring = glowRadius + 6 + 3 * pulse;
        ctx.strokeStyle = PALETTE.loot;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(item.x, item.y, ring, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  #drawItem(ctx, item, isRelic) {
    const meta = metaFor(item);
    const radius = meta.radius;

    ctx.save();
    ctx.translate(item.x, item.y);

    if (isRelic) {
      // Golden music-box silhouette.
      ctx.fillStyle = PALETTE.loot;
      ctx.strokeStyle = PALETTE.lootEdge;
      ctx.lineWidth = 1.5;
      ctx.fillRect(-radius, -radius * 0.75, radius * 2, radius * 1.5);
      ctx.strokeRect(-radius, -radius * 0.75, radius * 2, radius * 1.5);
      ctx.beginPath();
      ctx.arc(0, -radius * 0.15, radius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.floor;
      ctx.fill();
      ctx.strokeStyle = PALETTE.lootEdge;
      ctx.stroke();
    } else if (item.type === "jewel-reliquary") {
      ctx.fillStyle = PALETTE.loot;
      ctx.strokeStyle = PALETTE.lootEdge;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -radius);
      ctx.lineTo(radius * 0.72, -radius * 0.25);
      ctx.lineTo(radius * 0.45, radius * 0.72);
      ctx.lineTo(-radius * 0.45, radius * 0.72);
      ctx.lineTo(-radius * 0.72, -radius * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = PALETTE.floor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.35, -radius * 0.1);
      ctx.lineTo(radius * 0.35, -radius * 0.1);
      ctx.moveTo(0, -radius * 0.65);
      ctx.lineTo(0, radius * 0.5);
      ctx.stroke();
    } else {
      // Coin purse.
      ctx.fillStyle = PALETTE.loot;
      ctx.strokeStyle = PALETTE.lootEdge;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, radius * 0.18, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -radius * 0.55, radius * 0.55, Math.PI, Math.PI * 2);
      ctx.strokeStyle = PALETTE.lootEdge;
      ctx.stroke();
    }

    ctx.restore();
  }
}
