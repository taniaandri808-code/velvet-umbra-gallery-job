import { ALARM_TUNING, PALETTE } from "./config.js";

const DASH = "\u2014";

/** Format a countdown or elapsed time as mm:ss. */
export function formatTime(seconds) {
  if (typeof seconds === "string" && seconds.includes(":")) return seconds;
  const value = Number(seconds);
  const total = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

/** Pick the alarm colour for the current meter value. */
export function alarmColor(value) {
  const alarm = Number(value);
  if (!Number.isFinite(alarm)) return PALETTE.alarmLow;
  if (alarm >= 70) return PALETTE.alarmHigh;
  if (alarm >= 35) return PALETTE.alarmMid;
  return PALETTE.alarmLow;
}

/** Build the short floor objective shown in the top bar. */
export function objectiveForLevel(level, lootTotal = null, lootCount = null) {
  if (!level) return null;
  const total = lootTotal ?? level.loot?.length ?? 0;
  const collected = lootCount ?? 0;
  const remaining = Math.max(0, total - collected);
  const exitLabel = level.exits?.[0]?.label ?? "the exit";
  if (remaining > 0) return `Collect ${remaining} loot \u00b7 ${exitLabel}`;
  return `Reach ${exitLabel}`;
}

function setText(element, text) {
  if (element && text !== undefined && text !== null) element.textContent = String(text);
}

/** DOM top-bar controller: objective, alarm meter, loot, timer, and prompt. */
export class Hud {
  constructor(root = typeof document !== "undefined" ? document : null) {
    this.root = root;
    this.doc = root && root.ownerDocument ? root.ownerDocument : root;
    this.refs = {};
    this.bound = false;
    this.bind();
  }

  bind() {
    const doc = this.doc;
    if (!doc || typeof doc.querySelector !== "function") return this;

    this.topbar = doc.querySelector(".topbar");
    this.stats = doc.querySelector(".hud-stats") || this.topbar;

    this.refs.levelName = doc.getElementById("level-name");
    this.refs.timer = doc.getElementById("timer");
    this.refs.lootCount = doc.getElementById("loot-count");
    this.refs.alarmFill = doc.getElementById("alarm-fill");
    this.refs.alarmValue = doc.getElementById("alarm-value");
    this.refs.bestTime = doc.getElementById("best-time");
    this.refs.prompt = doc.getElementById("prompt");
    this.refs.objective = doc.getElementById("objective");

    if (!this.refs.objective) this.createObjective();

    const meter = this.refs.alarmFill?.parentElement;
    if (meter) {
      meter.setAttribute("role", "progressbar");
      meter.setAttribute("aria-label", "Alarm meter");
      meter.setAttribute("aria-valuemin", "0");
      meter.setAttribute("aria-valuemax", String(ALARM_TUNING.max));
      meter.setAttribute("aria-valuenow", "0");
    }

    this.bound = true;
    return this;
  }

  createObjective() {
    const doc = this.doc;
    if (!doc || typeof doc.createElement !== "function" || !this.stats) return;

    const stat = doc.createElement("div");
    stat.className = "stat objective-stat";
    stat.style.minWidth = "230px";
    stat.style.maxWidth = "320px";

    const label = doc.createElement("span");
    label.className = "label";
    label.textContent = "Objective";

    const value = doc.createElement("strong");
    value.id = "objective";
    value.textContent = DASH;

    stat.appendChild(label);
    stat.appendChild(value);
    this.stats.insertBefore(stat, this.stats.firstChild);
    this.refs.objective = value;
    this.refs.objectiveStat = stat;
  }

  /** Update the HUD from a game-state snapshot. */
  update(state = {}) {
    const snapshot = state && typeof state === "object" ? state : {};
    const level = snapshot.level ?? null;

    setText(
      this.refs.levelName,
      snapshot.levelName ?? snapshot.floorName ?? level?.name,
    );

    let lootCount =
      snapshot.lootCount ?? snapshot.lootCollected ?? snapshot.collectedCount ?? null;
    if (lootCount == null && Array.isArray(snapshot.collectedLoot)) {
      lootCount = snapshot.collectedLoot.length;
    }
    if (lootCount == null && Array.isArray(snapshot.collectedLootIds)) {
      lootCount = snapshot.collectedLootIds.length;
    }
    if (lootCount == null && Array.isArray(snapshot.pickedLoot)) {
      lootCount = snapshot.pickedLoot.length;
    }

    const lootTotal =
      snapshot.lootTotal ?? snapshot.totalLoot ?? level?.loot?.length ?? null;

    if (lootCount != null || lootTotal != null) {
      const count = lootCount ?? 0;
      setText(
        this.refs.lootCount,
        lootTotal != null ? `${count} / ${lootTotal}` : String(count),
      );
    }

    const alarm = snapshot.alarm ?? snapshot.alarmLevel ?? snapshot.alarmValue;
    if (alarm != null) this.setAlarm(alarm);

    const timer =
      snapshot.timeRemaining ?? snapshot.timer ?? snapshot.timeLeft ?? snapshot.timeSeconds;
    if (timer != null) this.setTimer(timer);

    if (
      "bestTime" in snapshot ||
      "bestSeconds" in snapshot ||
      "best" in snapshot
    ) {
      this.setBest(snapshot.bestTime ?? snapshot.bestSeconds ?? snapshot.best);
    }

    const prompt =
      snapshot.prompt ?? snapshot.interactPrompt ?? snapshot.promptText ??
      snapshot.interact?.prompt;
    if (prompt !== undefined) {
      this.setPrompt(prompt, snapshot.promptVisible !== false);
    }

    const objective =
      snapshot.objective ?? snapshot.objectiveText ??
      (level ? objectiveForLevel(level, lootTotal, lootCount ?? 0) : null);
    setText(this.refs.objective, objective);

    return this;
  }

  setAlarm(value) {
    const numeric = Number(value);
    const max = ALARM_TUNING.max || 100;
    const alarm = Math.max(0, Math.min(max, Number.isFinite(numeric) ? numeric : 0));
    const rounded = Math.round(alarm);

    if (this.refs.alarmFill) {
      this.refs.alarmFill.style.setProperty("--alarm", `${alarm}%`);
      this.refs.alarmFill.dataset.value = String(rounded);
    }

    if (this.refs.alarmValue) {
      setText(this.refs.alarmValue, `${rounded}%`);
      this.refs.alarmValue.style.color = alarmColor(alarm);
    }

    const meter = this.refs.alarmFill?.parentElement;
    if (meter) meter.setAttribute("aria-valuenow", String(rounded));

    return alarm;
  }

  setTimer(value) {
    const text =
      typeof value === "string" && value.includes(":") ? value : formatTime(value);
    setText(this.refs.timer, text);
    return text;
  }

  setBest(value) {
    const text = value == null ? DASH : formatTime(value);
    setText(this.refs.bestTime, text);
    return text;
  }

  setPrompt(text, visible = true) {
    const prompt = this.refs.prompt;
    if (!prompt) return;

    const hasText = text !== null && text !== undefined && String(text).trim() !== "";
    if (!hasText || !visible) {
      prompt.textContent = "";
      prompt.classList.remove("show");
      prompt.hidden = true;
      return;
    }

    prompt.textContent = String(text);
    prompt.hidden = false;
    prompt.classList.add("show");
  }

  clearPrompt() {
    this.setPrompt(null, false);
  }

  hidePrompt() {
    this.setPrompt(null, false);
  }

  refresh(state = {}) {
    return this.update(state);
  }
}

/** Convenience factory for the DOM HUD. */
export function initHud(root = typeof document !== "undefined" ? document : null) {
  return new Hud(root);
}

export const createHud = initHud;

/** Update an existing HUD, or attach one to a supplied DOM root. */
export function updateHud(hudOrRoot, state) {
  const hud =
    hudOrRoot && typeof hudOrRoot.update === "function"
      ? hudOrRoot
      : initHud(hudOrRoot);
  return hud.update(state);
}

export { Hud as HUD };
export default Hud;
