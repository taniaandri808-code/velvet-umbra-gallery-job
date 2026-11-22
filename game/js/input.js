export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

/** Currently pressed keys: KeyboardEvent.code -> true. */
export const keys = new Map();

export const mouse = {
  x: 0,
  y: 0,
  canvasX: 0,
  canvasY: 0,
  inside: false,
  down: false,
  clickPending: false,
};

/**
 * Convert client coordinates to the canvas's internal 1280×720 space.
 * Works when the canvas is letterboxed/scaled by CSS.
 * @param {HTMLCanvasElement} canvas
 * @param {number} clientX
 * @param {number} clientY
 * @returns {{x:number,y:number,inside:boolean}}
 */
export function canvasPoint(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width);
  const y = (clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
  const inside =
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom;
  return { x, y, inside };
}

/**
 * Attach keyboard + mouse listeners to a canvas element.
 * Mouse coordinates are scaled to the canvas internal resolution of 1280×720.
 * @param {HTMLCanvasElement} canvas
 */
export function initInput(canvas) {
  canvas.addEventListener('pointermove', e => {
    const p = canvasPoint(canvas, e.clientX, e.clientY);
    mouse.x = mouse.canvasX = p.x;
    mouse.y = mouse.canvasY = p.y;
    mouse.inside = p.inside;
  });

  canvas.addEventListener('pointerleave', () => {
    mouse.inside = false;
  });

  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const p = canvasPoint(canvas, e.clientX, e.clientY);
    mouse.x = mouse.canvasX = p.x;
    mouse.y = mouse.canvasY = p.y;
    mouse.inside = p.inside;
    mouse.down = true;
    mouse.clickPending = true;
  });

  canvas.addEventListener('pointerup', () => {
    mouse.down = false;
  });

  canvas.addEventListener('pointercancel', () => {
    mouse.down = false;
    mouse.clickPending = false;
  });

  window.addEventListener('keydown', e => {
    keys.set(e.code, true);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', e => {
    keys.delete(e.code);
  });

  window.addEventListener('blur', () => {
    keys.clear();
    mouse.down = false;
  });
}

/**
 * Consume a pending click. Returns true once per mouse press,
 * then resets the flag. Call once each frame.
 * @returns {boolean}
 */
export function consumeClick() {
  if (mouse.clickPending) {
    mouse.clickPending = false;
    return true;
  }
  return false;
}

/**
 * Check whether a given key code is currently pressed.
 * @param {string} code – e.g. 'KeyW', 'Space', 'ArrowUp'
 * @returns {boolean}
 */
export function isDown(code) {
  return keys.has(code);
}

/**
 * Return a copy of the current mouse position in internal 1280×720 coordinates.
 * @returns {{x:number,y:number}}
 */
export function getMousePos() {
  return { x: mouse.x, y: mouse.y };
}
