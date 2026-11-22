// VELVET UMBRA — The Bellamonte Gallery Job (Node 22 hand-in program).
// Copies this repository's three-floor game/ and its floor screenshots beside main.ts into
// MAKEFUN_OUTPUT_DIR (default /output), logging every copied file by floor, then writes
// dossier.json with vendor/makefun-game.ts under the scorer's caps.

import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameFloors = 'Grand Hall / Vault Floor / Penthouse';

const screenshotFloor = new Map<string, string>([
  ['1-grand-hall.jpg', 'Grand Hall'],
  ['2-vault-floor.jpg', 'Vault Floor'],
  ['3-penthouse.jpg', 'Penthouse'],
  ['4-heist-complete.jpg', 'Heist Complete'],
]);

function copyTree(source: string, destination: string, floorOf: (name: string) => string): void {
  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const from = join(source, entry.name);
    const to = join(destination, entry.name);
    if (entry.isDirectory()) {
      copyTree(from, to, floorOf);
    } else if (entry.isFile()) {
      copyFileSync(from, to);
      console.log(`VELVET UMBRA — ${floorOf(entry.name)}: ${relative(outputDir, to)}`);
    }
  }
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(here, 'game'), join(outputDir, 'game'), () => gameFloors);

const screenshots = join(here, 'screenshots');
if (!existsSync(screenshots)) throw new Error('VELVET UMBRA: screenshots/ is missing beside main.ts');
copyTree(screenshots, join(outputDir, 'screenshots'), (name) => screenshotFloor.get(name) ?? 'Bellamonte Gallery');

writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
