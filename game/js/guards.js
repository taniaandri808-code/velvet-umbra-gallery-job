import { config } from "./config.js";
import { vision } from "./vision.js";

export class Guard {
  constructor(x, y, waypoints) {
    this.x = x;
    this.y = y;
    this.waypoints = waypoints;
    this.currentWaypointIndex = 0;
    this.state = "calm"; // calm, suspicious, alert
    this.suspicion = 0;
    this.noiseTarget = null;
    this.speed = config.guardSpeed;
    this.sneakSpeed = config.guardSneakSpeed;
    this.alertSpeed = config.guardAlertSpeed;
  }

  update(dt, player, noisePoints, alarmLevel) {
    switch (this.state) {
      case "calm":
        this.patrol(dt);
        if (this.checkVision(player)) {
          this.state = "alert";
          this.suspicion = 100;
        } else if (this.checkNoiseProximity(noisePoints)) {
          this.state = "suspicious";
          this.suspicion = 30;
          this.noiseTarget = this.findNearestNoise(noisePoints);
        }
        break;
      case "suspicious":
        this.investigate(dt, noisePoints, player, alarmLevel);
        if (this.checkVision(player)) {
          this.state = "alert";
          this.suspicion = 100;
        }
        break;
      case "alert":
        this.chase(dt, player, alarmLevel);
        if (!this.checkVision(player) && this.distanceTo(player) > config.visionRange) {
          this.state = "calm";
          this.suspicion = 0;
          this.noiseTarget = null;
        }
        break;
    }
  }

  patrol(dt) {
    const wp = this.waypoints[this.currentWaypointIndex];
    const dx = wp.x - this.x;
    const dy = wp.y - this.y;
    const dist = Math.hypot(dx, dy);
    const moveX = (dx / dist) * this.speed * dt;
    const moveY = (dy / dist) * this.speed * dt;
    if (dist < this.speed * dt) {
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
    } else {
      // simple wall collision check using config.walls
      const nx = this.x + moveX;
      const ny = this.y + moveY;
      if (!this.checkWallCollision(nx, ny)) {
        this.x = nx;
        this.y = ny;
      }
    }
  }

  checkVision(player) {
    // using vision cone from vision module; returns true if player within cone and not occluded
    return vision.isInCone(this.x, this.y, this.angle, player.x, player.y, config.walls, config.visionRange);
  }

  checkNoiseProximity(noisePoints) {
    return noisePoints.some(np => Math.hypot(np.x - this.x, np.y - this.y) < config.noiseDetectionRange);
  }

  findNearestNoise(noisePoints) {
    let nearest = null;
    let minDist = Infinity;
    for (const np of noisePoints) {
      const d = Math.hypot(np.x - this.x, np.y - this.y);
      if (d < minDist) { minDist = d; nearest = np; }
    }
    return nearest;
  }

  investigate(dt, noisePoints, player, alarmLevel) {
    if (this.noiseTarget) {
      const dx = this.noiseTarget.x - this.x;
      const dy = this.noiseTarget.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > this.speed * dt) {
        const moveX = (dx / dist) * (this.sneakSpeed * dt);
        const moveY = (dy / dist) * (this.sneakSpeed * dt);
        const nx = this.x + moveX;
        const ny = this.y + moveY;
        if (!this.checkWallCollision(nx, ny)) { this.x = nx; this.y = ny; }
      } else { this.noiseTarget = null; this.state = "calm"; }
    } else {
      // search around, chance to spot player
      if (Math.random() < 0.01 && this.checkVision(player)) {
        this.state = "alert";
        this.suspicion = 100;
      }
    }
  }

  chase(dt, player, alarmLevel) {
    const speed = this.alertSpeed * (1 + alarmLevel * 0.2);
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > speed * dt) {
      this.x += (dx / dist) * speed * dt;
      this.y += (dy / dist) * speed * dt;
    } else {
      // catch player
      this.catchPlayer(player);
    }
    // simple wall collision
    const nx = this.x;
    const ny = this.y;
    if (!this.checkWallCollision(nx, ny)) { this.x = nx; this.y = ny; }
  }

  catchPlayer(player) {
    // player caught - trigger lose state
    const evt = new CustomEvent("caught");
    document.dispatchEvent(evt);
  }

  checkWallCollision(ox, oy) {
    for (const wall of config.walls) {
      if (ox < wall.x + wall.w && ox + config.guardSize > wall.x &&
          oy < wall.y + wall.h && oy + config.guardSize > wall.y) {
        return true;
      }
    }
    return false;
  }
}

export class GuardsManager {
  constructor() { this.guards = []; }
  add(guard) { this.guards.push(guard); }
  update(dt, player, noisePoints, alarmLevel) {
    for (const g of this.guards) { g.update(dt, player, noisePoints, alarmLevel); }
  }
}
