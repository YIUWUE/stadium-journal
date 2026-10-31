import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { stadiums, countries } from '../dist/catalog.js';
import { tracks } from '../dist/music.js';
for (const file of readdirSync('dist').filter(file => file.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', `dist/${file}`], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(result.stderr || `Syntax check failed: ${file}`);
}
const credits = JSON.parse(readFileSync('dist/assets/credits.json', 'utf8'));
if (new Set(stadiums.map(s => s.id)).size !== stadiums.length) throw new Error('Duplicate stadium identifier');
for (const s of stadiums) {
  if (!existsSync(`dist/assets/${s.id}.jpg`)) throw new Error(`Missing stadium image: ${s.id}`);
  if (!credits[s.id]?.author || !credits[s.id]?.license || !credits[s.id]?.source) throw new Error(`Missing image attribution: ${s.id}`);
  if (!/^[A-Za-z0-9_-]{11}$/.test(tracks[s.id]?.id)) throw new Error(`Missing music source: ${s.id}`);
  if (!s.story?.length || !s.beginner || !s.moods?.length) throw new Error(`Incomplete stadium content: ${s.id}`);
  if (new URL(s.source).protocol !== 'https:') throw new Error(`Invalid reference URL: ${s.id}`);
}
console.log(`Checks passed: ${stadiums.length} stadiums, ${countries.length} countries, ${Object.keys(tracks).length} music sources.`);
