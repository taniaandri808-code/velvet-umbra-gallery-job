# VELVET UMBRA — The Bellamonte Gallery Job (design spec)

Original top-down 2D canvas heist game. Fictional art-deco city: Bellamonte.
Thief (player): Sable Renn, codename "the Umbra". Guards: Custodians. Cameras: Glasswatch eyes.
Heist target relic: The Gilded Chorale (golden music-box). Other loot: coin purses, jewel reliquaries.

## Palette (original, art-deco night)
- Wall fill #16211f (deep pine teal), floor #1d2b28, floor grid lines #243631
- Lamplight / cones: warm gold rgba(255,196,90,*) ; danger cone tint rgba(255,90,70,*) when suspicious
- Player: pale ivory #f2e9d8 capsule with violet shadow #6d4d9c
- Loot: gold #ffd257 with glow; exit: emerald #37d9a0 ; smoke: gray puff
- HUD: ivory text on dark translucent panels, gold accents

## Mechanics
- WASD/Arrows move. SHIFT sneak (slow, silent). SPACE sprint (fast, loud: noise ring).
- Mouse aim + CLICK: throw chime coin (lures nearest guard to investigate noise point; costs 1 of 5).
- Q: smoke vial (blocks vision for 4s; costs 1 of 2).
- E: interact (pick up loot, lockpick exit door 2s hold, exit at getaway van).
- Guards: patrol waypoints; vision cone (lighting-aware, occluded by walls, ~70px range, 60deg arc) rendered with radial fade; state calm/suspicious(?)/alert; suspicious -> investigate noise; sees player fully lit -> ALERT: chase; touch -> CAUGHT (lose).
- Alarm meter 0-100: rises when seen, decays when hidden; at 100 lockdown (guards faster, extra camera sweep).
- Cameras: fixed Glasswatch eyes, sweeping cones, blink red when they see you (alarm rises).
- Levels: 3 floors of the Bellamonte Gallery: 1) Grand Hall, 2) Vault Floor, 3) Penthouse. Each: walls, cover crates/sofas, lamplit pools, loot items, exit.
- Win: all relics + reach getaway van on the last level. Lose: caught or timer 0 (3 min per level).
- Screens: title (game name, subtitle, controls, START), play, win (time + rank S/A/B/C), lose (reason, RETRY).
- Saves: localStorage best times per level.
- Minimap bottom-right: walls, loot dots, guard dots, exit, player.

## Architecture (game/ ES modules, one job per file)
index.html loads css/style.css and type=module js/main.js. All refs relative, no network.
- js/config.js    constants, palette, tuning
- js/levels.js    level data (walls rects, cover, lights, loot, guards waypoints, cameras, exits)
- js/input.js     keyboard+mouse state
- js/vision.js    cone geometry + wall occlusion (raycast to polygon), visibility helpers
- js/player.js    movement, sneak/sprint, noise rings
- js/guards.js    patrol, vision cone checks, suspicion, chase, caught
- js/cameras.js   sweeping camera cones
- js/loot.js      loot pickup, relic glow
- js/alarm.js     alarm meter, lockdown
- js/tools.js     chime coin throw + smoke vial
- js/hud.js       top bar, alarm meter, loot count, timer, prompts
- js/minimap.js   minimap render
- js/screens.js   title/win/lose overlays
- js/audio.js     WebAudio bleeps (mute M)
- js/save.js      localStorage best times
- js/main.js      game state machine, fixed-step loop, render orchestration (entrypoint; must be written/revised by codex sessions)

Canvas 1280x720 internal, letterboxed. HUD is DOM overlay. Look: lamplight pools via radial gradients, cone = path polygon with gradient fill, subtle vignette.
