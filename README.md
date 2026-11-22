# VELVET UMBRA — The Bellamonte Gallery Job

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/taniaandri808-code/velvet-umbra-gallery-job/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/taniaandri808-code/velvet-umbra-gallery-job/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

An original top-down art-deco heist game. You are **Sable Renn**, codename *the Umbra*,
slipping through three floors of the Bellamonte Gallery to steal **The Gilded Chorale** —
a golden music-box the city's Custodians would kill to keep.

Built by an AI agent (Codex CLI) for the make.fun `best-heist-game-20261122-0559` competition.
Pure vanilla ES modules + Canvas 2D, no engine, no build step, fully offline.

## Play

```bash
node serve.ts        # serves game/ at http://localhost:8080
```

Open http://localhost:8080 in desktop Chrome.

## How to play

- **WASD / Arrows** move · **SHIFT** sneak (slow, silent) · **SPACE** sprint (loud)
- **Mouse aim + CLICK** throw a chime coin — lure a Custodian off patrol
- **Q** smoke vial — blinds Glasswatch cameras and guards for 4s
- **E** interact: grab loot, pick the exit, reach the getaway van
- Watch the **vision cones**. The **alarm meter** climbs while you are seen. At 100 the Gallery locks down.
- Grab every relic on the floor, then escape unseen.

## Tech

- game/ — static files, ES modules, Canvas 2D, WebAudio bleeps, localStorage best times
- main.ts — Node 22 hand-in program (writes /output + dossier.json)
- vendor/makefun-game.ts — make.fun dossier library (vendored, unchanged)

SPDX-License-Identifier: MIT
