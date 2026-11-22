// VELVET UMBRA — alarm meter and lockdown event.
import { CONFIG, PALETTE } from "./config.js";

const ALARM_TUNING = CONFIG.tuning.alarm ?? {};
const GUARD_TUNING = CONFIG.tuning.guard ?? {};
const MAX_ALARM = ALARM_TUNING.max ?? 100;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function emit(name, detail) {
  if (typeof document !== "undefined" && typeof CustomEvent !== "undefined") {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

/**
 * Alarm meter from 0 to 100. Visible guards/cameras raise it; hiding decays it.
 * Reaching 100 fires one "lockdown" event and sets lockedDown until reset.
 */
export class AlarmMeter {
  /**
   * @param {{value?:number,max?:number,lockedDown?:boolean,onLockdown?:Function}} [options]
   */
  constructor(options = {}) {
    this.max = options.max ?? MAX_ALARM;
    this.value = clamp(options.value ?? 0, 0, this.max);
    this.lockedDown = Boolean(options.lockedDown);
    this.seenByGuards = false;
    this.seenByCameras = false;
    this.suspicion = 0;
    this.onLockdown = options.onLockdown ?? null;
  }

  /**
   * Update the meter for one fixed step.
   * @param {number} dt seconds
   * @param {boolean|{guards?:boolean,cameras?:boolean,guard?:boolean,camera?:boolean}} seen
   * @param {number} [suspicion] 0..1, used for the suspicion floor
   * @returns {number} current alarm value
   */
  update(dt, seen = false, suspicion = 0) {
    const safeDt = Math.max(0, dt);
    let guardSeen = false;
    let cameraSeen = false;

    if (typeof seen === "boolean") {
      guardSeen = seen;
    } else if (seen && typeof seen === "object") {
      guardSeen = Boolean(seen.guardSeen ?? seen.guards ?? seen.guard ?? seen.seenByGuards);
      cameraSeen = Boolean(seen.cameraSeen ?? seen.cameras ?? seen.camera ?? seen.seenByCameras);
    }

    this.seenByGuards = guardSeen;
    this.seenByCameras = cameraSeen;
    this.suspicion = clamp(Number(suspicion) || 0, 0, 1);

    if (guardSeen || cameraSeen) {
      let rise = 0;
      if (guardSeen) rise += ALARM_TUNING.guardRisePerSecond ?? 13;
      if (cameraSeen) rise += ALARM_TUNING.cameraRisePerSecond ?? 9;
      this.value = clamp(this.value + rise * safeDt, 0, this.max);

      const suspicionThreshold = GUARD_TUNING.suspicionThreshold ?? 0.45;
      if (this.suspicion >= suspicionThreshold) {
        this.value = Math.max(this.value, ALARM_TUNING.suspicionFloor ?? 12);
      }
    } else {
      const decay = this.lockedDown
        ? ALARM_TUNING.lockdownDecayPerSecond ?? 3
        : ALARM_TUNING.decayPerSecond ?? 7;
      this.value = clamp(this.value - decay * safeDt, 0, this.max);
    }

    if (this.value >= this.max && !this.lockedDown) {
      this.triggerLockdown();
    }

    return this.value;
  }

  /** Record a vision source without advancing time. */
  markSeen(source = "guard") {
    if (source === "camera" || source === "cameras") {
      this.seenByCameras = true;
    } else {
      this.seenByGuards = true;
    }
  }

  /** Clear both vision flags; decay resumes on the next update. */
  markHidden() {
    this.seenByGuards = false;
    this.seenByCameras = false;
  }

  /** Force the 100% lockdown once and notify listeners. */
  triggerLockdown() {
    if (this.lockedDown) return false;

    this.value = this.max;
    this.lockedDown = true;
    const detail = {
      value: this.value,
      max: this.max,
      speedMultiplier: GUARD_TUNING.lockdownSpeedMultiplier ?? 1.4,
      cameraSweepMultiplier: CONFIG.tuning.camera?.lockdownSweepMultiplier ?? 1.6,
    };

    emit("lockdown", detail);
    if (typeof this.onLockdown === "function") this.onLockdown(detail);
    return true;
  }

  /** Reset the meter for a new floor/retry. */
  reset(value = 0) {
    this.value = clamp(value, 0, this.max);
    this.lockedDown = false;
    this.seenByGuards = false;
    this.seenByCameras = false;
    this.suspicion = 0;
  }

  get alarm() {
    return this.value;
  }

  get percent() {
    return Math.round(this.value);
  }

  get isLockedDown() {
    return this.lockedDown;
  }

  get isHigh() {
    return this.value >= this.max * 0.66;
  }

  /** HUD-safe color derived from the meter value. */
  get color() {
    if (this.lockedDown || this.value >= this.max * 0.66) return PALETTE.alarmHigh;
    if (this.value >= this.max * 0.33) return PALETTE.alarmMid;
    return PALETTE.alarmLow;
  }

  /** Optional canvas bar renderer for callers that want the alarm in the world layer. */
  draw(ctx, x, y, width, height) {
    if (!ctx) return;

    const pct = clamp(this.value / this.max, 0, 1);
    ctx.save();
    ctx.fillStyle = PALETTE.hudPanel;
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = this.color;
    ctx.fillRect(x + 2, y + 2, Math.max(0, (width - 4) * pct), Math.max(0, height - 4));

    ctx.strokeStyle = PALETTE.hudText;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    ctx.restore();
  }
}
