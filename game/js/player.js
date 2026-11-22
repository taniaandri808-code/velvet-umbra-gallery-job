import { config } from "./config.js";
import { vision } from "./vision.js";

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = config.playerSpeed;
    this.sneakSpeed = config.sneakSpeed;
    this.sprintSpeed = config.sprintSpeed;
    this.sneak = false;
    this.sprinting = false;
    this.noise = 0;
  }

  handleInput(keys) {
    let dx = 0, dy = 0;
    const isShift = keys.shift;
    const isSpace = keys.space;

    if (isShift) this.sneak = true;
    else if (isSpace) this.sprinting = true;
    else { this.sneak = false; this.sprinting = false; }

    const speed = this.sneak ? this.sneakSpeed : this.sprinting ? this.sprintSpeed : this.speed;

    if (keys.w || keys.ArrowUp) dy -= 1;
    if (keys.s || keys.ArrowDown) dy += 1;
    if (keys.a || keys.ArrowLeft) dx -= 1;
    if (keys.d || keys.ArrowRight) dx += 1;

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    const nx = this.x + dx * speed;
    const ny = this.y + dy * speed;

    if (!this.checkWallCollision(nx, ny)) {
      this.x = nx;
      this.y = ny;
    }

    if (isSpace && (dx !== 0 || dy !== 0)) {
      this.noise = config.noiseAmount;
      const evt = new CustomEvent("noise", { detail: { x: this.x, y: this.y, strength: this.noise } });
      document.dispatchEvent(evt);
    }
  }

  checkWallCollision(ox, oy) {
    for (const wall of config.walls) {
      if (ox < wall.x + wall.w && ox + config.playerSize > wall.x &&
          oy < wall.y + wall.h && oy + config.playerSize > wall.y) {
        return true;
      }
    }
    return false;
  }
}

