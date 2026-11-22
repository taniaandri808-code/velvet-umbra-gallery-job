// VELVET UMBRA — entrypoint: state machine, fixed-step loop, and render orchestration.
import {CANVAS_WIDTH, CANVAS_HEIGHT, PALETTE, PLAYER_TUNING, NOISE_TUNING, GUARD_TUNING, CAMERA_TUNING, ALARM_TUNING, TOOLS_TUNING, LEVEL_TUNING, VISUAL_TUNING, FIXED_STEP, MAX_FRAME_STEPS} from "./config.js";
import {LEVELS} from "./levels.js";import {initInput, consumeClick, isDown, getMousePos} from "./input.js";import {computeConePolygon, pointInCone} from "./vision.js";import {LootManager} from "./loot.js";import {AlarmMeter} from "./alarm.js";import {ToolsManager} from "./tools.js";import {Hud} from "./hud.js";import {Minimap} from "./minimap.js";import {Screens} from "./screens.js";import {audio, initAudio} from "./audio.js";import {getBestTime, recordBestTime, rankForTime} from "./save.js";
const STATES = Object.freeze({ TITLE: "TITLE", PLAYING: "PLAYING", WIN: "WIN", LOSE: "LOSE" });
const canvas = document.getElementById("game") ?? document.createElement("canvas");
const stage = canvas.closest(".stage") ?? document.querySelector(".stage");
if (!canvas.parentElement && stage) stage.appendChild(canvas);
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const compatConfig = {playerSpeed: PLAYER_TUNING.walkSpeed * FIXED_STEP, sneakSpeed: PLAYER_TUNING.sneakSpeed * FIXED_STEP, sprintSpeed: PLAYER_TUNING.sprintSpeed * FIXED_STEP, noiseAmount: NOISE_TUNING.sprintRadius, playerSize: PLAYER_TUNING.collideRadius, guardSpeed: GUARD_TUNING.patrolSpeed, guardSneakSpeed: GUARD_TUNING.investigateSpeed, guardAlertSpeed: GUARD_TUNING.chaseSpeed, noiseDetectionRange: NOISE_TUNING.guardHearingRange, visionRange: GUARD_TUNING.visionRange, guardSize: GUARD_TUNING.radius, walls: []};
globalThis.__VELVET_CONFIG__ = compatConfig;
async function loadCompat(path) { const url = new URL(path, import.meta.url); const source = await fetch(url).then(r => r.text()); const visionUrl = new URL("./vision.js", import.meta.url).href; const patched = source.replace(/import\s*\{\s*config\s*\}\s*from\s*["']\.\/config\.js["'];?/, "const config = globalThis.__VELVET_CONFIG__;").replace(/import\s*\{\s*vision\s*\}\s*from\s*["']\.\/vision\.js["'];?/, `import { vision } from "${visionUrl}";`); return import(URL.createObjectURL(new Blob([patched], { type: "text/javascript" }))); }
let Player, Guard, GuardsManager, Camera, ui, hud, minimap;
let state = STATES.TITLE, currentLevel = null, levelIndex = 0;
let player = null, guards = null, cameras = [], loot = null, alarm = null, tools = null;
let timerRemaining = LEVEL_TUNING.timerSecondsPerLevel, exitProgress = 0, exitUnlocked = false, sprintNoiseTimer = 0, prevE = false, prevQ = false, lastTimestamp = 0, accumulator = 0;
function fitCanvas() {
  canvas.width = CANVAS_WIDTH; canvas.height = CANVAS_HEIGHT; const rect = stage?.getBoundingClientRect() ?? { width: innerWidth, height: innerHeight }; const scale = Math.min(rect.width / CANVAS_WIDTH, rect.height / CANVAS_HEIGHT);
  canvas.style.width = `${Math.max(1, Math.round(CANVAS_WIDTH * scale))}px`; canvas.style.height = `${Math.max(1, Math.round(CANVAS_HEIGHT * scale))}px`; if (stage) { stage.style.display = "grid"; stage.style.placeItems = "center"; }
}
function visionWalls(level) { return [...level.walls, ...level.cover.filter(c => c.solid)]; }
function loadLevel(index) {
  currentLevel = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, index))];
  levelIndex = index;
  const walls = visionWalls(currentLevel);
  compatConfig.walls = walls;
  timerRemaining = LEVEL_TUNING.timerSecondsPerLevel;
  exitProgress = 0; exitUnlocked = false; sprintNoiseTimer = 0;
  prevE = prevQ = false; accumulator = 0;
  player = new Player(currentLevel.spawn.x, currentLevel.spawn.y);
  guards = new GuardsManager();
  for (const def of currentLevel.guards) {
    const wp = def.waypoints[0];
    const guard = new Guard(wp.x, wp.y, def.waypoints);
    guard.id = def.id;
    guard.angle = Math.atan2(def.waypoints[1].y - wp.y, def.waypoints[1].x - wp.x);
    guard.distanceTo = p => Math.hypot(p.x - guard.x, p.y - guard.y);
    guard.checkVision = p => pointInCone(p.x, p.y, guard.x, guard.y, guard.angle,
      GUARD_TUNING.visionArcRad / 2, GUARD_TUNING.visionRange, walls) &&
      !tools.isVisionBlocked(guard.x, guard.y, p.x, p.y);
    guards.add(guard);
  }
  cameras = currentLevel.cameras.map(def => {
    const cam = new Camera(def.x, def.y, CAMERA_TUNING.radius, CAMERA_TUNING.sweepSpeed);
    cam.id = def.id;
    cam.angle = def.angle; cam.sweepMin = def.sweepMin; cam.sweepMax = def.sweepMax; cam.dir = 1;
    cam.seesPlayer = false;
    return cam;
  });
  loot = new LootManager(currentLevel.loot);
  alarm = new AlarmMeter({ onLockdown: () => audio.playEvent("alarm") });
  tools = new ToolsManager({
    onChime: () => audio.playEvent("chime"),
    onSmoke: () => audio.playEvent("smoke"),
    onLure: () => audio.playEvent("suspicious"),
  });
  hud = hud ?? new Hud(document);
  minimap = minimap ?? new Minimap(document.getElementById("minimap"));
  state = STATES.PLAYING;
  ui.hideAll();
  hud.update({ level: currentLevel, lootCount: 0, lootTotal: loot.totalCount,
    alarm: 0, timeRemaining: timerRemaining, bestTime: getBestTime(currentLevel.id),
    prompt: null });
}
function nearestExit() {
  let best = null, bestDist = Infinity;
  for (const exit of currentLevel?.exits ?? []) {
    const cx = exit.x + (exit.w ?? 0) / 2, cy = exit.y + (exit.h ?? 0) / 2;
    const dist = Math.hypot(player.x - cx, player.y - cy);
    if (dist < bestDist) { best = exit; bestDist = dist; }
  }
  return best ? { exit: best, dist: bestDist } : null;
}
function loseGame(reason) { if (state !== STATES.PLAYING) return; state = STATES.LOSE; ui.showLose({ reason }); audio.playEvent("caught"); }
function finishFloor(elapsed) {
  const record = recordBestTime(currentLevel.id, elapsed);
  if (levelIndex + 1 < LEVELS.length) loadLevel(levelIndex + 1);
  else { state = STATES.WIN; ui.showWin({ time: elapsed, rank: record.rank ?? rankForTime(elapsed) }); audio.playEvent("win"); }
}
function update(dt) {
  timerRemaining -= dt;
  if (timerRemaining <= 0) { loseGame("The gallery clock ran out."); return; }
  const keys = {
    w: isDown("KeyW"), s: isDown("KeyS"), a: isDown("KeyA"), d: isDown("KeyD"),
    ArrowUp: isDown("ArrowUp"), ArrowDown: isDown("ArrowDown"),
    ArrowLeft: isDown("ArrowLeft"), ArrowRight: isDown("ArrowRight"),
    shift: isDown("ShiftLeft") || isDown("ShiftRight"), space: isDown("Space"),
  };
  player.handleInput(keys);
  const moving = keys.w || keys.s || keys.a || keys.d || keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight;
  if (player.sprinting && moving) {
    sprintNoiseTimer -= dt;
    if (sprintNoiseTimer <= 0) {
      tools.noisePoints.push({ x: player.x, y: player.y, strength: NOISE_TUNING.sprintRadius,
        ttl: NOISE_TUNING.ringDuration, source: "sprint" });
      sprintNoiseTimer = 0.4;
    }
  } else sprintNoiseTimer = 0;
  const eDown = isDown("KeyE");
  const ePressed = eDown && !prevE;
  prevE = eDown;
  if (ePressed && loot.canPickup(player)) {
    const item = loot.pickupNearest(player);
    audio.playEvent(item?.relic ? "relic" : "pickup");
  }
  if (consumeClick() && tools.canThrowChime()) {
    if (tools.throwChime(player, getMousePos())) audio.playEvent("click");
  }
  const qDown = isDown("KeyQ");
  if (qDown && !prevQ && tools.canThrowSmoke()) {
    if (tools.throwSmoke(player, getMousePos())) audio.playEvent("smoke");
  }
  prevQ = qDown;
  tools.update(dt, guards.guards);
  loot.update(dt, player, false);
  for (const g of guards.guards) {
    const target = g.state === "alert" ? player : (g.noiseTarget ?? g.waypoints[g.currentWaypointIndex]);
    if (target) g.angle = Math.atan2(target.y - g.y, target.x - g.x);
  }
  guards.update(dt, player, tools.noisePoints, alarm.value / 100);
  if (state !== STATES.PLAYING) return;
  const camHalf = CAMERA_TUNING.arcRad / 2;
  const camSpeed = alarm.lockedDown ? CAMERA_TUNING.lockdownSweepMultiplier : 1;
  for (const cam of cameras) {
    cam.angle += cam.dir * cam.sweepSpeed * camSpeed * dt;
    if (cam.angle >= cam.sweepMax) { cam.angle = cam.sweepMax; cam.dir = -1; }
    else if (cam.angle <= cam.sweepMin) { cam.angle = cam.sweepMin; cam.dir = 1; }
    cam.seesPlayer = pointInCone(player.x, player.y, cam.x, cam.y, cam.angle, camHalf,
      cam.range, compatConfig.walls) && !tools.isVisionBlocked(cam.x, cam.y, player.x, player.y);
  }
  const seenGuard = guards.guards.some(g => g.checkVision(player));
  const seenCamera = cameras.some(c => c.seesPlayer);
  const suspicion = Math.max(0, ...guards.guards.map(g => (g.suspicion ?? 0) / 100));
  alarm.update(dt, { guards: seenGuard, cameras: seenCamera }, suspicion);
  const elapsed = LEVEL_TUNING.timerSecondsPerLevel - timerRemaining;
  const exitInfo = nearestExit();
  let prompt = loot.prompt(player);
  if (exitInfo) {
    const { exit, dist } = exitInfo;
    const reach = exit.type === "van" ? LEVEL_TUNING.vanRadius : LEVEL_TUNING.exitRadius;
    if (dist <= reach + 20) {
      if (loot.remainingCount > 0) prompt = `Collect ${loot.remainingCount} loot \u00b7 ${exit.label}`;
      else if (exit.type === "van") prompt = eDown ? `E \u2014 Escape in ${exit.label}` : `Reach ${exit.label} and press E`;
      else if (!exitUnlocked) prompt = `Hold E \u2014 Lockpick ${exit.label} (${Math.max(0, TOOLS_TUNING.doorLockpickTime - exitProgress).toFixed(1)}s)`;
      else prompt = `E \u2014 Enter ${exit.label}`;
    }
    if (loot.remainingCount === 0) {
      if (exit.type === "van" && dist <= LEVEL_TUNING.vanRadius && eDown) finishFloor(elapsed);
      if (exit.type === "door") {
        if (eDown) exitProgress += dt; else exitProgress = 0;
        if (exitProgress >= TOOLS_TUNING.doorLockpickTime) exitUnlocked = true;
        if (exitUnlocked && dist <= LEVEL_TUNING.exitRadius) finishFloor(elapsed);
      }
    }
  }
  if (state !== STATES.PLAYING) return;
  hud.update({ level: currentLevel, levelName: currentLevel.name, lootCount: loot.collectedCount,
    lootTotal: loot.totalCount, alarm: alarm.value, timeRemaining: timerRemaining,
    bestTime: getBestTime(currentLevel.id), prompt });
}
function drawCone(x, y, angle, half, range, walls, danger = false) {
  const poly = computeConePolygon(x, y, angle, half, range, walls);
  const grad = ctx.createRadialGradient(x, y, GUARD_TUNING.visionInnerRadius, x, y, range);
  grad.addColorStop(0, danger ? PALETTE.dangerEdge : PALETTE.lampEdge);
  grad.addColorStop(0.6, danger ? PALETTE.dangerCone : PALETTE.lampCone);
  grad.addColorStop(1, "rgba(255,196,90,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath(); ctx.fill();
}
const ctx = canvas.getContext("2d");
function renderWorld(level) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = PALETTE.floorGrid; ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_WIDTH; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); }
  for (let y = 0; y < CANVAS_HEIGHT; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); }
  for (const light of level.lights) {
    const grad = ctx.createRadialGradient(light.x, light.y, 8, light.x, light.y, light.radius);
    grad.addColorStop(0, `rgba(255,196,90,${(0.22 * light.intensity).toFixed(3)})`);
    grad.addColorStop(0.65, PALETTE.lampSoft);
    grad.addColorStop(1, "rgba(255,196,90,0)");
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = PALETTE.wall; ctx.strokeStyle = "#2f4742"; ctx.lineWidth = 1;
  for (const wall of level.walls) { ctx.fillRect(wall.x, wall.y, wall.w, wall.h); ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w - 1, wall.h - 1); }
  ctx.fillStyle = "#263834";
  for (const c of level.cover) { ctx.fillRect(c.x, c.y, c.w, c.h); ctx.strokeStyle = PALETTE.lampEdge; ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1); }
  for (const exit of level.exits) {
    const cx = exit.x + (exit.w ?? 0) / 2, cy = exit.y + (exit.h ?? 0) / 2;
    const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 52);
    grad.addColorStop(0, PALETTE.exitGlow); grad.addColorStop(1, "rgba(55,217,160,0)");
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.exit; ctx.fillRect(exit.x, exit.y, exit.w ?? 20, exit.h ?? 20);
    ctx.fillStyle = PALETTE.hudText; ctx.font = "11px Georgia"; ctx.fillText(exit.label, exit.x - 8, exit.y - 6);
  }
}
function render() {
  const level = currentLevel ?? LEVELS[0];
  renderWorld(level);
  const walls = visionWalls(level);
  if (state === STATES.PLAYING || state === STATES.WIN || state === STATES.LOSE) {
    for (const g of guards.guards) drawCone(g.x, g.y, g.angle, GUARD_TUNING.visionArcRad / 2, GUARD_TUNING.visionRange, walls, g.state !== "calm");
    for (const cam of cameras) drawCone(cam.x, cam.y, cam.angle, CAMERA_TUNING.arcRad / 2, cam.range, walls, cam.seesPlayer);
    loot.draw(ctx, player); tools.draw(ctx);
    for (const g of guards.guards) {
      ctx.fillStyle = PALETTE.guardShadow; ctx.beginPath(); ctx.arc(g.x + 2, g.y + 2, GUARD_TUNING.radius + 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = g.state === "alert" ? PALETTE.guardAlert : PALETTE.guard; ctx.beginPath(); ctx.arc(g.x, g.y, GUARD_TUNING.radius, 0, Math.PI * 2); ctx.fill();
    }
    for (const cam of cameras) {
      ctx.fillStyle = cam.seesPlayer ? PALETTE.cameraAlert : PALETTE.camera; ctx.beginPath(); ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PALETTE.cameraLens; ctx.beginPath(); ctx.arc(cam.x, cam.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = PALETTE.playerAura; ctx.beginPath(); ctx.arc(player.x, player.y, PLAYER_TUNING.radius + 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.playerShadow; ctx.beginPath(); ctx.arc(player.x + 2, player.y + 3, PLAYER_TUNING.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.player; ctx.beginPath(); ctx.arc(player.x, player.y, PLAYER_TUNING.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#070c0b"; ctx.lineWidth = 2.5; ctx.stroke();
    const px = Math.cos(player.facing ?? 0), py = Math.sin(player.facing ?? 0);
    ctx.strokeStyle = PALETTE.playerShadow; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(player.x + px * (PLAYER_TUNING.radius + 2), player.y + py * (PLAYER_TUNING.radius + 2));
    ctx.lineTo(player.x + px * (PLAYER_TUNING.radius + 9), player.y + py * (PLAYER_TUNING.radius + 9)); ctx.stroke();
    if (player.sprinting) { ctx.strokeStyle = PALETTE.lampEdge; ctx.lineWidth = NOISE_TUNING.ringWidth; ctx.beginPath(); ctx.arc(player.x, player.y, NOISE_TUNING.sprintRadius * 0.45, 0, Math.PI * 2); ctx.stroke(); }
  }
  const vignette = ctx.createRadialGradient(640, 360, 260, 640, 360, 760);
  vignette.addColorStop(0, "rgba(3,8,7,0)"); vignette.addColorStop(1, PALETTE.vignette);
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (minimap && level) minimap.draw(level, player, guards?.guards ?? [], cameras, loot?.items ?? level.loot, level.exits);
}
function tick(now) {
  if (!lastTimestamp) lastTimestamp = now;
  const frameDt = Math.min((now - lastTimestamp) / 1000, MAX_FRAME_STEPS * FIXED_STEP);
  lastTimestamp = now;
  if (state === STATES.PLAYING) {
    accumulator += frameDt;
    let steps = 0;
    while (accumulator >= FIXED_STEP && steps < MAX_FRAME_STEPS) { update(FIXED_STEP); accumulator -= FIXED_STEP; steps++; }
  }
  render();
  requestAnimationFrame(tick);
}
async function boot() {
  const [playerMod, guardMod, cameraMod] = await Promise.all([
    loadCompat("./player.js"), loadCompat("./guards.js"), loadCompat("./cameras.js"),
  ]);
  Player = playerMod.Player; Guard = guardMod.Guard; GuardsManager = guardMod.GuardsManager; Camera = cameraMod.Camera;
  ui = new Screens(document);
  hud = new Hud(document);
  minimap = new Minimap(document.getElementById("minimap"));
  initInput(canvas);
  initAudio();
  fitCanvas();
  window.addEventListener("resize", fitCanvas);
  document.addEventListener("caught", () => loseGame("A Custodian caught you."));
  ui.setHandlers({
    onStart: () => { audio.playEvent("start"); loadLevel(0); },
    onRetry: () => loadLevel(currentLevel ? levelIndex : 0),
    onWinRetry: () => loadLevel(0),
  });
  const params = new URLSearchParams(location.search);
  const shot = params.get("shot");
  const requested = Number(params.get("level")) || 1;
  const index = Math.max(0, Math.min(LEVELS.length - 1, requested - 1));
  if (shot === "play") loadLevel(index);
  else if (shot === "win") {
    loadLevel(index === 2 || params.has("level") ? index : 2);
    state = STATES.WIN;
    ui.showWin({ time: 95, rank: "A" });
  } else if (shot === "lose") {
    loadLevel(index); alarm.value = 86;
    guards.guards.forEach(g => { g.state = "alert"; g.suspicion = 100; });
    state = STATES.LOSE;
    ui.showLose({ reason: "The Custodians saw you." });
  } else {
    ui.showTitle();
    hud.update({ level: LEVELS[0], levelName: LEVELS[0].name, lootCount: 0, lootTotal: LEVELS[0].loot.length,
      alarm: 0, timeRemaining: LEVEL_TUNING.timerSecondsPerLevel, bestTime: getBestTime(LEVELS[0].id), prompt: null });
  }
  requestAnimationFrame(tick);
}
boot();
