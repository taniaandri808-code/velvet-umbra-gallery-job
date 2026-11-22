const MASTER_GAIN = 0.22;

const EVENT_SOUNDS = Object.freeze({
  click: [{ freq: 620, duration: 0.05, type: "triangle", gain: 0.07 }],
  ui: [{ freq: 620, duration: 0.05, type: "triangle", gain: 0.07 }],
  start: [
    { freq: 440, duration: 0.07, type: "triangle", gain: 0.07 },
    { freq: 660, duration: 0.10, type: "triangle", gain: 0.07, delay: 0.08 },
  ],
  loot: [
    { freq: 880, duration: 0.07, type: "sine", gain: 0.08 },
    { freq: 1180, duration: 0.10, type: "sine", gain: 0.08, delay: 0.07 },
  ],
  pickup: [
    { freq: 880, duration: 0.07, type: "sine", gain: 0.08 },
    { freq: 1180, duration: 0.10, type: "sine", gain: 0.08, delay: 0.07 },
  ],
  relic: [
    { freq: 660, duration: 0.08, type: "sine", gain: 0.08 },
    { freq: 990, duration: 0.08, type: "sine", gain: 0.08, delay: 0.09 },
    { freq: 1320, duration: 0.14, type: "sine", gain: 0.08, delay: 0.18 },
  ],
  alarm: [{ freq: 280, duration: 0.16, type: "sawtooth", gain: 0.05 }],
  alert: [
    { freq: 720, duration: 0.09, type: "square", gain: 0.06 },
    { freq: 520, duration: 0.12, type: "square", gain: 0.06, delay: 0.10 },
  ],
  suspicious: [{ freq: 560, duration: 0.10, type: "triangle", gain: 0.05 }],
  chime: [
    { freq: 1040, duration: 0.16, type: "sine", gain: 0.07 },
    { freq: 1560, duration: 0.14, type: "sine", gain: 0.06, delay: 0.12 },
  ],
  smoke: [{ freq: 220, duration: 0.20, type: "triangle", gain: 0.05 }],
  door: [
    { freq: 180, duration: 0.10, type: "triangle", gain: 0.06 },
    { freq: 260, duration: 0.12, type: "triangle", gain: 0.06, delay: 0.10 },
  ],
  caught: [
    { freq: 320, duration: 0.10, type: "sawtooth", gain: 0.06 },
    { freq: 180, duration: 0.12, type: "sawtooth", gain: 0.06, delay: 0.12 },
    { freq: 110, duration: 0.18, type: "sawtooth", gain: 0.06, delay: 0.26 },
  ],
  lose: [
    { freq: 320, duration: 0.10, type: "sawtooth", gain: 0.06 },
    { freq: 180, duration: 0.12, type: "sawtooth", gain: 0.06, delay: 0.12 },
    { freq: 110, duration: 0.18, type: "sawtooth", gain: 0.06, delay: 0.26 },
  ],
  win: [
    { freq: 523, duration: 0.10, type: "triangle", gain: 0.07 },
    { freq: 659, duration: 0.10, type: "triangle", gain: 0.07, delay: 0.12 },
    { freq: 784, duration: 0.10, type: "triangle", gain: 0.07, delay: 0.24 },
    { freq: 1047, duration: 0.20, type: "triangle", gain: 0.07, delay: 0.36 },
  ],
  victory: [
    { freq: 523, duration: 0.10, type: "triangle", gain: 0.07 },
    { freq: 659, duration: 0.10, type: "triangle", gain: 0.07, delay: 0.12 },
    { freq: 784, duration: 0.10, type: "triangle", gain: 0.07, delay: 0.24 },
    { freq: 1047, duration: 0.20, type: "triangle", gain: 0.07, delay: 0.36 },
  ],
  step: [{ freq: 150, duration: 0.03, type: "square", gain: 0.03 }],
  sprint: [{ freq: 260, duration: 0.05, type: "square", gain: 0.04 }],
  sneak: [{ freq: 110, duration: 0.04, type: "triangle", gain: 0.03 }],
});

/** Tiny WebAudio bleep engine. Mute toggles on M. */
export class AudioManager {
  constructor(options = {}) {
    this.volume = Math.max(0, Math.min(1, Number(options.volume ?? MASTER_GAIN)));
    this.muted = false;
    this.context = null;
    this.master = null;
    this.bound = false;
    this.bind();
  }

  bind() {
    if (this.bound || typeof window === "undefined") return this;

    this._onKeyDown = (event) => {
      if (!event.repeat && event.code === "KeyM") this.toggleMute();
      this.ensureContext();
    };
    this._onGesture = () => this.ensureContext();

    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("pointerdown", this._onGesture, { passive: true });
    window.addEventListener("touchstart", this._onGesture, { passive: true });
    this.bound = true;
    return this;
  }

  ensureContext() {
    if (this.context) {
      if (this.context.state === "suspended") {
        this.context.resume().catch(() => {});
      }
      return this.context;
    }

    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) return null;

    try {
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.context.destination);
      if (this.context.state === "suspended") {
        this.context.resume().catch(() => {});
      }
    } catch {
      this.context = null;
      this.master = null;
    }
    return this.context;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.context) {
      this.master.gain.setValueAtTime(
        this.muted ? 0 : this.volume,
        this.context.currentTime,
      );
    }
    return this.muted;
  }

  setMuted(muted = true) {
    this.muted = Boolean(muted);
    if (this.master && this.context) {
      this.master.gain.setValueAtTime(
        this.muted ? 0 : this.volume,
        this.context.currentTime,
      );
    }
    return this.muted;
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value) || 0));
    if (this.master && this.context && !this.muted) {
      this.master.gain.setValueAtTime(this.volume, this.context.currentTime);
    }
    return this.volume;
  }

  isMuted() {
    return this.muted;
  }

  _scheduleTone(ctx, start, frequency, duration, type, gain, endFrequency = null) {
    const safeDuration = Math.max(0.01, Number(duration) || 0.08);
    const safeFrequency = Math.max(20, Number(frequency) || 440);
    const safeGain = Math.max(0.0001, Number(gain) || 0.05);

    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();

    oscillator.type = type || "sine";
    oscillator.frequency.setValueAtTime(safeFrequency, start);
    if (Number.isFinite(Number(endFrequency))) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(20, Number(endFrequency)),
        start + safeDuration,
      );
    }

    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(
      safeGain,
      start + Math.min(0.015, safeDuration / 3),
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + safeDuration);

    oscillator.connect(envelope);
    envelope.connect(this.master || ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + safeDuration + 0.02);
  }

  bleep(frequency = 440, duration = 0.08, type = "sine", gain = 0.05, endFrequency = null) {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return false;

    const start = ctx.currentTime + 0.001;
    this._scheduleTone(ctx, start, frequency, duration, type, gain, endFrequency);
    return true;
  }

  playEvent(name = "click") {
    const key = String(name ?? "click").toLowerCase();
    const sounds = EVENT_SOUNDS[key] ?? EVENT_SOUNDS.click;
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return false;

    const now = ctx.currentTime + 0.001;
    for (const sound of sounds) {
      this._scheduleTone(
        ctx,
        now + (Number(sound.delay) || 0),
        sound.freq,
        sound.duration,
        sound.type,
        sound.gain,
        sound.endFreq ?? null,
      );
    }
    return true;
  }

  play(input = "click") {
    if (typeof input === "number" || (input && typeof input === "object" && "freq" in input)) {
      const options = typeof input === "number" ? { freq: input } : input;
      return this.bleep(
        options.freq ?? 440,
        options.duration ?? 0.08,
        options.type ?? "sine",
        options.gain ?? 0.05,
        options.endFreq ?? null,
      );
    }
    return this.playEvent(input);
  }

  playBleep(frequency = 440, duration = 0.08, type = "sine", gain = 0.05) {
    return this.bleep(frequency, duration, type, gain);
  }

  playSound(name = "click") {
    return this.playEvent(name);
  }
}

export const audio = new AudioManager();
export const audioEngine = audio;

/** Attach gesture listeners and wake the audio context. */
export function initAudio(options = {}) {
  if (options.volume != null) audio.setVolume(options.volume);
  audio.bind();
  audio.ensureContext();
  return audio;
}

export function toggleMute(manager = audio) {
  return manager.toggleMute();
}

export function setMuted(muted = true, manager = audio) {
  return manager.setMuted(muted);
}

export function playBleep(frequency = 440, duration = 0.08, type = "sine", gain = 0.05, manager = audio) {
  return manager.bleep(frequency, duration, type, gain);
}

export function playSound(name = "click", manager = audio) {
  return manager.playEvent(name);
}

export const bindMuteKey = (manager = audio) => manager.bind();
export const muteAudio = (muted = true, manager = audio) => manager.setMuted(muted);

export { AudioManager as Audio };
export default AudioManager;
