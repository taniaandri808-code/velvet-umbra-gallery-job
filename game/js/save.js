import { LEVEL_TUNING } from "./config.js";

const TIMER_SECONDS = LEVEL_TUNING.timerSeconds ?? 180;

/** Best-time thresholds as fractions of the per-floor timer. */
export const RANK_THRESHOLDS = Object.freeze({
  S: Math.round(TIMER_SECONDS * 0.5),
  A: Math.round(TIMER_SECONDS * (2 / 3)),
  B: Math.round(TIMER_SECONDS * (5 / 6)),
});

export const STORAGE_KEY = "velvet-umbra.bestTimes";
export const SAVE_KEY = STORAGE_KEY;

const memory = Object.create(null);

function storageAvailable() {
  try {
    return typeof localStorage !== "undefined" && localStorage;
  } catch {
    return null;
  }
}

function readAll() {
  const store = storageAvailable();
  let raw = null;

  if (store) {
    try {
      raw = store.getItem(STORAGE_KEY);
    } catch {
      raw = null;
    }
  }

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const result = {};
        for (const [levelId, value] of Object.entries(parsed)) {
          const seconds = Number(value);
          if (Number.isFinite(seconds) && seconds >= 0) {
            result[levelId] = seconds;
          }
        }
        return result;
      }
    } catch {
      // Corrupt storage falls back to the in-memory copy below.
    }
  }

  const result = {};
  for (const [levelId, seconds] of Object.entries(memory)) result[levelId] = seconds;
  return result;
}

function writeAll(bestTimes) {
  const store = storageAvailable();
  const raw = JSON.stringify(bestTimes);

  if (store) {
    try {
      store.setItem(STORAGE_KEY, raw);
      return;
    } catch {
      // Fall through to memory when storage is blocked or full.
    }
  }

  for (const key of Object.keys(memory)) delete memory[key];
  Object.assign(memory, bestTimes);
}

function normalizeLevelId(levelId) {
  if (levelId === null || levelId === undefined) return null;
  const id = String(levelId).trim();
  return id || null;
}

/** Return all saved best times keyed by level id. */
export function getBestTimes() {
  return { ...readAll() };
}

export function getBestTime(levelId) {
  const id = normalizeLevelId(levelId);
  if (!id) return null;
  const value = readAll()[id];
  return Number.isFinite(value) ? value : null;
}

/** Save a time only when it improves the level's existing best. */
export function saveBestTime(levelId, seconds) {
  const id = normalizeLevelId(levelId);
  const numeric = Number(seconds);
  if (!id || !Number.isFinite(numeric) || numeric < 0) return null;

  const all = readAll();
  const previous = Number.isFinite(all[id]) ? all[id] : null;
  const rounded = Math.round(numeric * 100) / 100;

  if (previous === null || rounded < previous) {
    all[id] = rounded;
    writeAll(all);
    return rounded;
  }

  return previous;
}

/** Save and return a richer record for win-screen use. */
export function recordBestTime(levelId, seconds) {
  const id = normalizeLevelId(levelId);
  const numeric = Number(seconds);
  if (!id || !Number.isFinite(numeric) || numeric < 0) {
    return { levelId: id, seconds: null, previousBest: null, best: null, improved: false, rank: null };
  }

  const rounded = Math.round(numeric * 100) / 100;
  const previous = getBestTime(id);
  const best = saveBestTime(id, rounded);
  return {
    levelId: id,
    seconds: rounded,
    previousBest: previous,
    best,
    improved: previous === null || rounded < previous,
    rank: rankForTime(rounded),
  };
}

/** S/A/B/C rank from seconds. Thresholds may be an object or a timer value. */
export function rankForTime(seconds, thresholds = RANK_THRESHOLDS) {
  const numeric = Number(seconds);
  if (!Number.isFinite(numeric) || numeric < 0) return null;

  const bounds =
    typeof thresholds === "number"
      ? {
          S: thresholds * 0.5,
          A: thresholds * (2 / 3),
          B: thresholds * (5 / 6),
        }
      : thresholds;

  if (numeric <= bounds.S) return "S";
  if (numeric <= bounds.A) return "A";
  if (numeric <= bounds.B) return "B";
  return "C";
}

export function getRank(seconds, thresholds = RANK_THRESHOLDS) {
  return rankForTime(seconds, thresholds);
}

export function removeBestTime(levelId) {
  const id = normalizeLevelId(levelId);
  if (!id) return false;
  const all = readAll();
  if (!Object.prototype.hasOwnProperty.call(all, id)) return false;
  delete all[id];
  writeAll(all);
  return true;
}

export function clearBestTimes() {
  writeAll({});
}

export const getLevelBest = getBestTime;
export const setBestTime = saveBestTime;
export const getRankForTime = rankForTime;
