import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { stadiums, countries } from '../dist/catalog.js';
import { tracks } from '../dist/ambient.js';
import { modelProfiles } from '../dist/model-profiles.js';
import { detailedModels } from '../dist/detailed-models.js';
import * as THREE from '../dist/vendor/three/three.module.js';
import { groundPositions, atlasRegions, regionGeometry } from '../dist/stadium-atlas.js';
for (const file of readdirSync('dist').filter(file => file.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', `dist/${file}`], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(result.stderr || `Syntax check failed: ${file}`);
}
if(!existsSync('dist/assets/earth-regions.json')||!existsSync('dist/assets/earth-land.json')||!existsSync('dist/atlas.css')) throw new Error('Missing globe resources');
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
  const position=groundPositions[s.id];
  if(!position||position.length!==2||!position.every(Number.isFinite)||Math.abs(position[0])>90||Math.abs(position[1])>180) throw new Error(`Invalid atlas coordinate: ${s.id}`);
  if (!modelProfiles[s.id]?.feature) throw new Error(`Missing model profile: ${s.id}`);
  if (!s.story?.length || !s.beginner || !s.moods?.length) throw new Error(`Incomplete stadium content: ${s.id}`);
  if (new URL(s.source).protocol !== 'https:') throw new Error(`Invalid reference URL: ${s.id}`);
}
console.log(`Checks passed: ${stadiums.length} stadiums, ${countries.length} countries, ${Object.keys(tracks).length} audio records, ${Object.keys(detailedModels).length} authored models, 24 atlas positions and detailed architectural profiles.`);

const regions=JSON.parse(readFileSync('dist/assets/earth-regions.json','utf8'));
const earth=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),new THREE.MeshBasicMaterial());earth.updateMatrixWorld();
for(const info of atlasRegions){
 const data=regions.find(r=>r.id===info.id);if(!data)throw Error('Missing region '+info.id);
 const {surface,border}=regionGeometry(data.polygons),positions=surface.getAttribute('position');
 for(let i=0;i<positions.count;i++){
  const v=new THREE.Vector3().fromBufferAttribute(positions,i);
  if(!Number.isFinite(v.length())||Math.abs(v.length()-1.004)>.0001)throw Error('Invalid region surface '+info.id);
 }
 const mesh=new THREE.Mesh(surface,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.updateMatrixWorld();
 const [lat,lon]=info.center.map(d=>d*Math.PI/180),normal=new THREE.Vector3(Math.cos(lat)*Math.cos(lon),Math.sin(lat),-Math.cos(lat)*Math.sin(lon));
 const ray=new THREE.Raycaster(normal.clone().multiplyScalar(3),normal.clone().negate());
 const hits=ray.intersectObjects([earth,mesh]);if(hits[0]?.object!==mesh)throw Error('Region not clickable '+info.id);
 const back=new THREE.Raycaster(normal.clone().multiplyScalar(-3),normal);if(back.intersectObjects([earth,mesh])[0]?.object!==earth)throw Error('Backside region not occluded '+info.id);
 surface.dispose();border.dispose();mesh.material.dispose();
}
for(const s of stadiums)if(atlasRegions.filter(r=>r.countries.includes(s.country)).length!==1)throw Error('Ambiguous region '+s.id);
for(const file of ['earth_atmos_2048.jpg','earth_normal_2048.jpg','earth_specular_2048.jpg'])if(!existsSync('dist/assets/'+file))throw Error('Missing relief texture '+file);
console.log('Regional geometry, front/back hit detection, 24-stadium membership and relief assets passed.');
