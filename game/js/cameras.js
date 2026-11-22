import { config } from "./config.js";

export class Camera {
  constructor(x, y, range, sweepSpeed) {
    this.x = x;
    this.y = y;
    this.range = range;
    this.angle = 0;
    this.sweepSpeed = sweepSpeed;
    this.seesPlayer = false;
  }

  update(dt, player) {
    this.angle = (this.angle + this.sweepSpeed * dt) % 360;
    // check if player in cone
    this.seesPlayer = vision.isInCone(this.x, this.y, this.angle, player.x, player.y, config.walls, this.range);
  }

  draw(ctx) {
    // draw sweeping cone using config colors
    const endX = this.x + Math.cos((this.angle * Math.PI / 180)) * this.range;
    const endY = this.y + Math.sin((this.angle * Math.PI / 180)) * this.range;
    // simple triangle fill
    ctx.fillStyle = this.seesPlayer ? "rgba(255,90,70,0.4)" : "rgba(255,196,90,0.2)";
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(endX, endY);
    ctx.lineTo(this.x + (Math.cos((this.angle - 30) * Math.PI / 180)) * this.range, this.y + (Math.sin((this.angle - 30) * Math.PI / 180)) * this.range);
    ctx.lineTo(this.x + (Math.cos((this.angle + 30) * Math.PI / 180)) * this.range, this.y + (Math.sin((this.angle + 30) * Math.PI / 180)) * this.range);
    ctx.closePath();
    ctx.fill();
  }
}
