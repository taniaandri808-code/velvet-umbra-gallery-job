const DASH = '\u2014';
const SCREEN_IDS = Object.freeze({ title: 'screen-title', win: 'screen-win', lose: 'screen-lose' });
const CONTROLS = Object.freeze([
  ['WASD / Arrows', 'Move'], ['SHIFT', 'Sneak'], ['SPACE', 'Sprint'],
  ['CLICK', 'Chime coin'], ['Q', 'Smoke vial'], ['E', 'Interact'], ['M', 'Mute'],
]);
/** Format seconds as mm:ss for the win card. */
export function formatTime(seconds) {
  if (typeof seconds === 'string' && seconds.includes(':')) return seconds;
  const value = Number(seconds);
  const total = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
/** DOM overlay manager for title, win, lose, and level-intro cards. */
export class Screens {
  constructor(root = typeof document !== 'undefined' ? document : null) {
    this.root = root;
    this.callbacks = {};
    this.intro = null;
    this.refs = {
      title: root?.querySelector('#screen-title') ?? null,
      win: root?.querySelector('#screen-win') ?? null,
      lose: root?.querySelector('#screen-lose') ?? null,
      startBtn: root?.querySelector('#startBtn') ?? null,
      winBtn: root?.querySelector('#winBtn') ?? null,
      retryBtn: root?.querySelector('#retryBtn') ?? null,
      winTime: root?.querySelector('#win-time') ?? null,
      winRank: root?.querySelector('#win-rank') ?? null,
      loseReason: root?.querySelector('#lose-reason') ?? null,
    };
    this.bind();
  }
  bind() {
    this.refs.startBtn?.addEventListener('click', () => this.callbacks.onStart?.());
    this.refs.winBtn?.addEventListener('click', () => this.callbacks.onWinRetry?.());
    this.refs.retryBtn?.addEventListener('click', () => this.callbacks.onRetry?.());
  }
  /** Register gameplay transitions; handlers are optional. */
  setHandlers(handlers = {}) {
    this.callbacks = { ...handlers };
    return this;
  }
  /** Hide every overlay, including the temporary intro card. */
  hideAll() {
    for (const screen of [this.refs.title, this.refs.win, this.refs.lose]) {
      screen?.classList.remove('is-active');
    }
    this.removeIntro();
  }
  /** Activate a named screen from SCREEN_IDS. */
  show(name) {
    const screen = this.refs[name];
    if (!screen) return null;
    this.hideAll();
    screen.classList.add('is-active');
    return screen;
  }
  /** Title card: VELVET UMBRA, subtitle, controls, and START button. */
  showTitle() {
    const screen = this.show('title');
    if (!screen) return null;
    const card = screen.querySelector('.screen-card');
    if (card) {
      const heading = card.querySelector('h1');
      if (heading) heading.innerHTML = 'VELVET <span>UMBRA</span>';
      const subtitle = card.querySelector('.subtitle');
      if (subtitle) subtitle.textContent = 'The Bellamonte Gallery Job';
      this.ensureControls(card);
    }
    this.refs.startBtn?.focus();
    return screen;
  }
  ensureControls(card) {
    if (!card || card.querySelector('.screen-controls')) return;
    const controls = this.root.createElement('div');
    controls.className = 'screen-controls';
    for (const [key, action] of CONTROLS) {
      const line = this.root.createElement('span');
      line.textContent = `${key} \u2014 ${action}`;
      controls.appendChild(line);
    }
    card.insertBefore(controls, card.querySelector('.btn') ?? null);
  }
  /** Win card: elapsed time, letter rank, and RETRY. */
  showWin({ time = 0, rank = DASH, onRetry = null } = {}) {
    if (onRetry) this.callbacks.onWinRetry = onRetry;
    const screen = this.show('win');
    if (!screen) return null;
    if (this.refs.winTime) this.refs.winTime.textContent = formatTime(time);
    if (this.refs.winRank) this.refs.winRank.textContent = String(rank || DASH);
    this.refs.winBtn?.focus();
    return screen;
  }

  /** Lose card: reason text and RETRY action. */
  showLose({ reason = 'The Custodians saw you.', onRetry = null } = {}) {
    if (onRetry) this.callbacks.onRetry = onRetry;
    const screen = this.show('lose');
    if (!screen) return null;
    if (this.refs.loseReason) this.refs.loseReason.textContent = String(reason);
    this.refs.retryBtn?.focus();
    return screen;
  }

  /** Floor-intro card shown before play begins. */
  showIntro({ title = '', subtitle = '', objective = '', onContinue = null } = {}) {
    this.hideAll();
    const stage = this.root?.querySelector('.stage');
    if (!stage) return null;
    const screen = this.root.createElement('section');
    screen.id = 'screen-intro';
    screen.className = 'screen overlay intro-overlay';
    const card = this.root.createElement('div');
    card.className = 'screen-card title-card';
    const eyebrow = this.root.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'Bellamonte Gallery';
    const heading = this.root.createElement('h1');
    heading.textContent = String(title || 'The Bellamonte Gallery');
    const subtitleLine = this.root.createElement('p');
    subtitleLine.className = 'subtitle';
    subtitleLine.textContent = String(subtitle || 'Three floors. One relic. No trace.');
    const objectiveLine = this.root.createElement('p');
    objectiveLine.className = 'brief';
    objectiveLine.textContent = String(objective || 'Collect the loot and reach the getaway van.');
    const button = this.root.createElement('button');
    button.id = 'introBtn';
    button.className = 'btn primary';
    button.textContent = 'ENTER';
    button.addEventListener('click', () => {
      this.removeIntro();
      onContinue?.();
    });
    card.append(eyebrow, heading, subtitleLine, objectiveLine, button);
    screen.appendChild(card);
    stage.appendChild(screen);
    this.intro = screen;
    screen.classList.add('is-active');
    button.focus();
    return screen;
  }

  removeIntro() {
    if (this.intro) {
      this.intro.remove();
      this.intro = null;
    }
  }
}

export const screens = typeof document !== 'undefined' ? new Screens(document) : null;
export const bindScreenHandlers = (handlers = {}) => screens?.setHandlers(handlers) ?? null;
export const showTitleScreen = () => screens?.showTitle() ?? null;
export const showWinScreen = (time = 0, rank = DASH, onRetry = null) =>
  screens?.showWin({ time, rank, onRetry }) ?? null;
export const showLoseScreen = (reason = 'The Custodians saw you.', onRetry = null) =>
  screens?.showLose({ reason, onRetry }) ?? null;
export const showLevelIntro = (level = {}, onContinue = null) =>
  screens?.showIntro({ title: level.name ?? level.title ?? '', subtitle: level.subtitle ?? '', objective: level.objective ?? '', onContinue }) ?? null;
export const hideScreens = () => screens?.hideAll();
