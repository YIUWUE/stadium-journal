import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { stadiums, countries } from '../dist/catalog.js';
import { tracks } from '../dist/ambient.js';
import { modelProfiles } from '../dist/model-profiles.js';
import { detailedModels } from '../dist/detailed-models.js';
import {clubMarks} from '../dist/club-gallery.js';
import {clubStories} from '../dist/story-data.js';
for (const file of readdirSync('dist').filter(file => file.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', `dist/${file}`], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(result.stderr || `Syntax check failed: ${file}`);
}
if(!existsSync('dist/club-experience.css')) throw new Error('Missing club experience stylesheet');
const credits = JSON.parse(readFileSync('dist/assets/credits.json', 'utf8'));
for (const file of ['three.module.js', 'three.core.js', 'OrbitControls.js', 'LICENSE']) {
  if (!existsSync(`dist/vendor/three/${file}`)) throw new Error(`Missing local 3D dependency: ${file}`);
}
const appSource = readdirSync('dist').filter(file=>file.endsWith('.js')).map(file=>readFileSync('dist/'+file,'utf8')).join('\n') + readFileSync('dist/index.html', 'utf8');
if (/youtube\.com|youtube-nocookie|iframe_api|<video|music-play/.test(appSource)) throw new Error('Video or manual playback UI remains in the current experience');
if (new Set(stadiums.map(s => s.id)).size !== stadiums.length) throw new Error('Duplicate stadium identifier');
for (const s of stadiums) {
  if (!existsSync(`dist/assets/${s.id}.jpg`)) throw new Error(`Missing stadium image: ${s.id}`);
  if (!credits[s.id]?.author || !credits[s.id]?.license || !credits[s.id]?.source) throw new Error(`Missing image attribution: ${s.id}`);
  const track=tracks[s.id];
  if (!track?.name || !track.sourceUrl || !track.credit) throw new Error(`Missing home-team audio metadata: ${s.id}`);
  if (track.src && (new URL(track.src).protocol!=='https:' || !/\.(mp3|m4a)(?:\?|$)/.test(track.src))) throw new Error(`Invalid pure-audio source: ${s.id}`);
  const model=detailedModels[s.id];
  if(model && (!model.author || !model.uid || !model.faces || new URL(model.embed).hostname!=='sketchfab.com')) throw new Error(`Invalid authored model metadata: ${s.id}`);
  if (!modelProfiles[s.id]?.feature) throw new Error(`Missing model profile: ${s.id}`);
  if (!s.story?.length || !s.beginner || !s.moods?.length) throw new Error(`Incomplete stadium content: ${s.id}`);
  if (new URL(s.source).protocol !== 'https:') throw new Error(`Invalid reference URL: ${s.id}`);
  const story=clubStories[s.id];
  if(!story?.title||!story.intro||story.chapters?.length!==3||story.timeline?.length!==4||story.sources?.length<2)throw new Error(`Incomplete club story: ${s.id}`);
  const storyChars=[story.intro,...story.chapters.flatMap(chapter=>chapter.paragraphs)].join('').length;
  if(storyChars<500)throw new Error(`Club story is too short: ${s.id}`);
  for(const chapter of story.chapters){
    if(!chapter.label||!chapter.title||chapter.paragraphs.length!==2||chapter.paragraphs.some(p=>p.length<50)||!chapter.sources.length||chapter.sources.some(i=>!Number.isInteger(i)||!story.sources[i]))throw new Error(`Incomplete chapter or citation: ${s.id}`);
  }
  if(story.timeline.some(item=>!item.year||!item.event)||story.sources.some(source=>!source.label||new URL(source.url).protocol!=='https:'))throw new Error(`Invalid timeline or historical source: ${s.id}`);
}
if(Object.keys(clubStories).length!==stadiums.length)throw new Error('Story and stadium coverage differ');
for(const [id,names]of [['sansiro',['AC 米兰','国际米兰']],['maracana',['弗拉门戈','弗鲁米嫩塞']]]){
  const paragraphs=clubStories[id].chapters.flatMap(c=>c.paragraphs).join('');
  if(names.some(name=>!paragraphs.includes(name)))throw new Error(`Shared home is missing a club: ${id}`);
}
console.log('Story checks passed: 24 distinct features, 72 chapters, 96 timeline events and valid historical citations; both shared grounds include both clubs.');
console.log(`Checks passed: ${stadiums.length} stadiums, ${countries.length} countries, ${Object.keys(tracks).length} audio records, ${Object.keys(detailedModels).length} authored models, 24 club identities and detailed architectural profiles.`);

const cityCredits=JSON.parse(readFileSync('dist/assets/city-credits.json','utf8'));
for(const stadium of stadiums){
 if(!clubMarks[stadium.id]||clubMarks[stadium.id].length!==3)throw Error('Missing club identity '+stadium.id);
 const city=cityCredits[stadium.city];
 if(!city?.src?.startsWith('assets/cities/')||!existsSync('dist/'+city.src)||!city.author||!city.license||!city.licenseUrl||!city.source)throw Error('Missing city image or attribution: '+stadium.city);
 if(new URL(city.source).protocol!=='https:'||new URL(city.licenseUrl).protocol!=='https:')throw Error('Invalid city source: '+stadium.city);
}
const index=readFileSync('dist/index.html','utf8'),app=readFileSync('dist/app.js','utf8');
if(/atlas-stage|country-map|stadium-atlas|country-atlas/.test(index+app))throw Error('Old map flow remains active');
if(!index.includes('arrival-hero')||!index.includes('club-stage'))throw Error('Missing opening or one-screen selection');
console.log('Atmospheric opening, direct club selection and licensed city images cover all 24 stadiums.');
