import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { stadiums, countries } from '../dist/catalog.js';
import { tracks } from '../dist/ambient.js';
import { modelProfiles } from '../dist/model-profiles.js';
for (const file of readdirSync('dist').filter(file => file.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', `dist/${file}`], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(result.stderr || `Syntax check failed: ${file}`);
}
const credits = JSON.parse(readFileSync('dist/assets/credits.json', 'utf8'));
for (const file of ['three.module.js', 'three.core.js', 'OrbitControls.js', 'LICENSE']) {
  if (!existsSync(`dist/vendor/three/${file}`)) throw new Error(`Missing local 3D dependency: ${file}`);
}
const appSource = readFileSync('dist/app.js', 'utf8') + readFileSync('dist/ambient.js', 'utf8') + readFileSync('dist/index.html', 'utf8');
if (/youtube\.com|youtube-nocookie|iframe_api|<iframe|<video|music-play/.test(appSource)) throw new Error('Video or manual playback UI remains in the current experience');
if (new Set(stadiums.map(s => s.id)).size !== stadiums.length) throw new Error('Duplicate stadium identifier');
for (const s of stadiums) {
  if (!existsSync(`dist/assets/${s.id}.jpg`)) throw new Error(`Missing stadium image: ${s.id}`);
  if (!credits[s.id]?.author || !credits[s.id]?.license || !credits[s.id]?.source) throw new Error(`Missing image attribution: ${s.id}`);
  if (!tracks[s.id]?.original || !tracks[s.id]?.bpm) throw new Error(`Missing original soundscape: ${s.id}`);
  if (!modelProfiles[s.id]?.feature) throw new Error(`Missing model profile: ${s.id}`);
  if (!s.story?.length || !s.beginner || !s.moods?.length) throw new Error(`Incomplete stadium content: ${s.id}`);
  if (new URL(s.source).protocol !== 'https:') throw new Error(`Invalid reference URL: ${s.id}`);
}
console.log(`Checks passed: ${stadiums.length} stadiums, ${countries.length} countries, ${Object.keys(tracks).length} original soundscapes and model profiles.`);
