import * as THREE from './vendor/three/three.module.js';
import {OrbitControls} from './vendor/three/OrbitControls.js';

// Geographic positions guide exploration, not navigation.
export const groundPositions={bernabeu:[40.453,-3.688],campnou:[41.381,2.123],anfield:[53.431,-2.961],allianz:[48.219,11.625],sansiro:[45.478,9.124],oldtrafford:[53.463,-2.291],dortmund:[51.493,7.452],paris:[48.841,2.253],emirates:[51.555,-.109],juventus:[45.110,7.641],etihad:[53.483,-2.200],tottenham:[51.604,-.067],stamfordbridge:[51.482,-.191],metropolitano:[40.436,-3.599],dragao:[41.162,-8.584],luz:[38.753,-9.185],galatasaray:[41.103,28.991],cruyff:[52.314,4.941],feyenoord:[51.894,4.523],celtic:[55.850,-4.206],bombonera:[-34.636,-58.365],monumental:[-34.545,-58.450],maracana:[-22.912,-43.230],napoli:[40.828,14.193]};
export const atlasRegions=[
 {id:'GBR',name:'英伦',en:'BRITAIN',countries:['英格兰','苏格兰'],center:[53,-2]},
 {id:'ESP',name:'西班牙',en:'SPAIN',countries:['西班牙'],center:[40,-3]},
 {id:'DEU',name:'德国',en:'GERMANY',countries:['德国'],center:[51,10]},
 {id:'ITA',name:'意大利',en:'ITALY',countries:['意大利'],center:[43,12]},
 {id:'FRA',name:'法国',en:'FRANCE',countries:['法国'],center:[47,2]},
 {id:'PRT',name:'葡萄牙',en:'PORTUGAL',countries:['葡萄牙'],center:[39.5,-8]},
 {id:'NLD',name:'荷兰',en:'NETHERLANDS',countries:['荷兰'],center:[52.2,5.2]},
 {id:'TUR',name:'土耳其',en:'TÜRKIYE',countries:['土耳其'],center:[39,33]},
 {id:'ARG',name:'阿根廷',en:'ARGENTINA',countries:['阿根廷'],center:[-34,-61]},
 {id:'BRA',name:'巴西',en:'BRAZIL',countries:['巴西'],center:[-15,-48]}
];
const vector=([lat,lon],radius=1)=>{const p=lat*Math.PI/180,t=lon*Math.PI/180;return new THREE.Vector3(Math.cos(p)*Math.cos(t),Math.sin(p),-Math.cos(p)*Math.sin(t)).multiplyScalar(radius);};
const safe=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const motion=()=>!matchMedia('(prefers-reduced-motion: reduce)').matches;

// Subdivision keeps the country surface on the sphere rather than cutting across it.
export function regionGeometry(polygons){
 const positions=[],normals=[],edges=[];
 const triangle=(a,b,c,depth=0)=>{
  const dist=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y);
  if(depth<7&&Math.max(dist(a,b),dist(b,c),dist(c,a))>2){
   const ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);
   triangle(a,ab,ca,depth+1);triangle(ab,b,bc,depth+1);triangle(ca,bc,c,depth+1);triangle(ab,bc,ca,depth+1);return;
  }
  for(const p of [a,b,c]){const n=vector([p.y,p.x]);positions.push(...n.clone().multiplyScalar(1.004).toArray());normals.push(...n.toArray());}
 };
 for(const polygon of polygons){
  const rings=polygon.map(ring=>ring.slice(0,-1).map(([lon,lat])=>new THREE.Vector2(lon,lat))),points=rings.flat();
  for(const face of THREE.ShapeUtils.triangulateShape(rings[0],rings.slice(1)))triangle(...face.map(i=>points[i]));
  for(const ring of rings)for(let i=0;i<ring.length;i++){
   const a=ring[i],b=ring[(i+1)%ring.length],steps=Math.ceil(a.distanceTo(b)/.6);
   for(let j=0;j<steps;j++)for(const k of [j/steps,(j+1)/steps]){const p=a.clone().lerp(b,k);edges.push(...vector([p.y,p.x],1.006).toArray());}
  }
 }
 const surface=new THREE.BufferGeometry();surface.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));surface.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
 const border=new THREE.BufferGeometry();border.setAttribute('position',new THREE.Float32BufferAttribute(edges,3));return{surface,border};
}

export class StadiumAtlas{
 constructor(host,{onOpen}={}){
  this.host=host;this.onOpen=onOpen;this.stadiums=[];this.active=true;this.visible=true;this.selected=null;this.regionMeshes=[];this.regionGroups=new Map();this.disposed=false;
  host.innerHTML=`<div class="atlas-space"><div class="atlas-topline"><span><i></i> THE HOME GROUND ATLAS</span><span id="atlas-coordinate">46° N / 7° E</span></div><div class="atlas-render" id="atlas-render"></div><div class="atlas-vignette"></div><div class="atlas-heading"><span>ONE WORLD. ENDLESS BELONGING.</span><p>世界的某一处，<br>是你的主场。</p></div><div class="atlas-region-caption" id="atlas-region-caption" hidden><span></span><strong></strong><small></small></div><div class="atlas-controls" role="group" aria-label="星图视角"><button data-atlas-region="europe" class="active">欧洲</button><button data-atlas-region="south">南美</button><button data-atlas-region="world">全球</button><span></span><button data-atlas-zoom="in" aria-label="放大主场星图">＋</button><button data-atlas-zoom="out" aria-label="缩小主场星图">−</button></div><div class="atlas-instructions"><span>↔</span> 拖拽旋转 <i>·</i> 轻触发光区域，寻找主场</div><div class="atlas-projection" aria-hidden="true"><i></i> <span id="atlas-signal">24</span> GROUNDS / ONE PLANET</div></div><aside class="atlas-directory"><div class="atlas-directory-heading"><span>EXPLORE THE REGIONS</span><b id="atlas-list-count">24 GROUNDS</b></div><div class="atlas-preview"><span id="atlas-preview-country">点亮一片热爱</span><h3 id="atlas-preview-name">从世界，<br>到一座主场。</h3><p id="atlas-preview-club">选择地图上的发光区域。</p></div><div class="atlas-region-list" id="atlas-region-list" role="group" aria-label="选择发光区域"></div><div class="atlas-index-title"><span id="atlas-index-title">全部主场</span><button data-atlas-all hidden>全部区域 ↗</button></div><div class="atlas-index" id="atlas-index" aria-label="星图球场索引"></div><p class="atlas-directory-note">每一片光，都有一座值得奔赴的主场。</p></aside>`;
  this.renderHost=host.querySelector('#atlas-render');this.caption=host.querySelector('#atlas-region-caption');
  host.addEventListener('click',e=>{
   const view=e.target.closest('[data-atlas-region]');if(view)this.region(view.dataset.atlasRegion);
   const zoom=e.target.closest('[data-atlas-zoom]');if(zoom)this.zoom(zoom.dataset.atlasZoom==='in'?.84:1.18);
   const area=e.target.closest('[data-atlas-area]');if(area)this.selectRegion(area.dataset.atlasArea);
   if(e.target.closest('[data-atlas-all]'))this.selectRegion(null);
   const jump=e.target.closest('[data-atlas-open]');if(jump)this.open(jump.dataset.atlasOpen);
  });
  host.addEventListener('pointerover',e=>{const target=e.target.closest('[data-atlas-open]');if(target)this.preview(target.dataset.atlasOpen);const area=e.target.closest('[data-atlas-area]');if(area)this.highlight(area.dataset.atlasArea);});
  host.addEventListener('pointerout',e=>{if(e.target.closest('[data-atlas-area]')&&!e.relatedTarget?.closest('[data-atlas-area]'))this.highlight(null);});
  host.addEventListener('focusin',e=>{const target=e.target.closest('[data-atlas-open]');if(target){this.preview(target.dataset.atlasOpen);if(!this.restoring&&target.closest('.atlas-index'))this.focusGround(target.dataset.atlasOpen);}const area=e.target.closest('[data-atlas-area]');if(area)this.highlight(area.dataset.atlasArea);});
  host.addEventListener('focusout',e=>{if(e.target.closest('[data-atlas-area]'))this.highlight(null);});
  try{this.init();}catch(error){host.classList.add('atlas-static');this.renderHost.innerHTML='<p class="atlas-offline">从区域索引，开启你的主场旅程。</p>';console.warn('Globe rendering unavailable:',error.message);}
  this.intersection=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;this.loop();},{rootMargin:'150px'});this.intersection.observe(host);this.onVisibility=()=>this.loop();document.addEventListener('visibilitychange',this.onVisibility);
 }
 init(){
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0x000000,0);this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;this.renderHost.append(this.renderer.domElement);
  const canvas=this.renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','可旋转的区域主场地球，拖拽旋转，滚轮缩放，点击发光区域选择球场；也可使用旁边的区域索引');
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(32,1,.1,100);this.camera.position.copy(vector([46,7],this.defaultDistance()));this.scene.add(this.camera);
  this.scene.add(new THREE.AmbientLight('#99b4d7',.6));
  const key=new THREE.DirectionalLight('#e9f1ff',2.1);key.position.set(-3,4,4);this.camera.add(key);
  const fill=new THREE.DirectionalLight('#6b97c9',.65);fill.position.set(4,-1,2);this.camera.add(fill);
  const rim=new THREE.DirectionalLight('#6698ce',1.6);rim.position.set(-3,1,-2);this.camera.add(rim);
  const material=new THREE.MeshPhongMaterial({color:'#9cabb8',shininess:20,specular:'#1c2b40',normalScale:new THREE.Vector2(.48,.48)});
  material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float atlasLum=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(atlasLum*.72,atlasLum*.89,atlasLum),.62);`);};
  this.earth=new THREE.Mesh(new THREE.SphereGeometry(1,192,128),material);this.scene.add(this.earth);
  const loader=new THREE.TextureLoader(),settings=[['map','earth_atmos_2048.jpg',true],['normalMap','earth_normal_2048.jpg',false],['specularMap','earth_specular_2048.jpg',false]];
  settings.forEach(([slot,file,srgb])=>loader.load('./assets/'+file,t=>{if(this.disposed){t.dispose();return;}if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=this.renderer.capabilities.getMaxAnisotropy();material[slot]=t;material.needsUpdate=true;if(slot==='map')this.host.dataset.mapReady='satellite';this.draw();}));
  const air=new THREE.Mesh(new THREE.SphereGeometry(1.018,96,64),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.BackSide,uniforms:{glow:{value:new THREE.Color('#87b2ec')}},vertexShader:'varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 n;varying vec3 v;uniform vec3 glow;void main(){float a=pow(1.-abs(dot(n,v)),5.);gl_FragColor=vec4(glow,a*.26);}'}));this.scene.add(air);
  this.controls=new OrbitControls(this.camera,canvas);this.controls.enableDamping=true;this.controls.dampingFactor=.075;this.controls.enablePan=false;this.controls.minDistance=1.55;this.controls.maxDistance=5.8;this.controls.rotateSpeed=.4;this.controls.zoomSpeed=.65;this.controls.autoRotate=false;
  this.controls.addEventListener('start',()=>{this.tween=null;this.dragging=true;this.highlight(null);this.host.classList.add('atlas-interacting');});
  this.controls.addEventListener('end',()=>{this.dragging=false;this.host.classList.remove('atlas-interacting');});
  this.controls.addEventListener('change',()=>{this.updateLabels();if(document.hidden||!this.visible)this.draw();});
  this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
  canvas.addEventListener('pointerdown',e=>{this.down={x:e.clientX,y:e.clientY};});
  canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||e.buttons)return;const region=this.hitRegion(e);this.highlight(region?.id||null,e);canvas.style.cursor=region?'pointer':'grab';});
  canvas.addEventListener('pointerleave',()=>{this.highlight(null);this.down=null;});
  canvas.addEventListener('pointerup',e=>{if(this.down&&Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)<7){const region=this.hitRegion(e);if(region)this.selectRegion(region.id);}this.down=null;});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home','Escape'].includes(e.key))return;e.preventDefault();if(['+','='].includes(e.key))return this.zoom(.85);if(e.key==='-')return this.zoom(1.18);if(e.key==='Home')return this.region('europe');if(e.key==='Escape')return this.selectRegion(null);const spherical=new THREE.Spherical().setFromVector3(this.camera.position);spherical.theta+=e.key==='ArrowLeft'?-.12:e.key==='ArrowRight'?.12:0;spherical.phi=THREE.MathUtils.clamp(spherical.phi+(e.key==='ArrowUp'?-.12:e.key==='ArrowDown'?.12:0),.1,3.04);this.moveTo(new THREE.Vector3().setFromSpherical(spherical));});
  fetch('./assets/earth-regions.json').then(r=>{if(!r.ok)throw Error('regions');return r.json();}).then(regions=>{if(this.disposed)return;this.buildRegions(regions);this.syncRegions();this.host.dataset.regionsReady='true';this.draw();}).catch(()=>{this.host.dataset.regionsReady='unavailable';});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.renderHost);this.resize();this.host.dataset.atlasReady='true';this.loop();
 }
 defaultDistance(){return this.renderHost.clientWidth<500?4.25:3.05;}
 buildRegions(regions){
  for(const data of regions){const info=atlasRegions.find(r=>r.id===data.id);if(!info)continue;const {surface,border}=regionGeometry(data.polygons),mesh=new THREE.Mesh(surface,new THREE.MeshBasicMaterial({color:'#dbba78',toneMapped:false,transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})),line=new THREE.LineSegments(border,new THREE.LineBasicMaterial({color:'#ebce91',transparent:true,opacity:.55,depthWrite:false}));mesh.userData.region=info;this.scene.add(mesh,line);this.regionMeshes.push({mesh,line,info,value:0});}
 }
 hitRegion(e){
  if(!this.camera)return null;const r=this.renderHost.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);
  const hits=this.raycaster.intersectObjects([this.earth,...this.regionMeshes.filter(r=>r.mesh.visible).map(r=>r.mesh)],false);return hits.find(h=>h.distance<=hits[0].distance+.012&&h.object.userData.region)?.object.userData.region||null;
 }
 syncRegions(){for(const r of this.regionMeshes){r.mesh.visible=r.line.visible=this.regionGroups.has(r.info.id);}}
 setStadiums(stadiums,saved,seen){
  this.stadiums=stadiums;this.saved=saved;this.seen=seen;this.regionGroups=new Map(atlasRegions.map(r=>[r.id,stadiums.filter(s=>r.countries.includes(s.country))]).filter(([,members])=>members.length));
  if(!this.regionGroups.has(this.activeRegion))this.activeRegion=null;if(!stadiums.some(s=>s.id===this.selected))this.selected=null;this.hoverRegion=null;if(this.activeRegion)this.regionPreview(atlasRegions.find(r=>r.id===this.activeRegion));else if(!this.selected)this.resetPreview();this.syncRegions();this.renderRegionList();this.renderIndex();
  this.host.querySelector('#atlas-list-count').textContent=String(stadiums.length).padStart(2,'0')+' GROUNDS';this.host.querySelector('#atlas-signal').textContent=String(stadiums.length).padStart(2,'0');
  if(stadiums.length&&stadiums.length<8&&!this.flightCamera)this.focusGround(stadiums[0].id);this.updateLabels();
 }
 renderRegionList(){const focused=document.activeElement?.dataset.atlasArea;this.host.querySelector('#atlas-region-list').innerHTML=[...this.regionGroups].map(([id,members])=>{const r=atlasRegions.find(r=>r.id===id);return`<button data-atlas-area="${id}" aria-pressed="${id===this.activeRegion}" aria-label="探索${r.name}，${members.length}座球场"><i></i><span>${r.name}</span><b>${String(members.length).padStart(2,'0')}</b></button>`;}).join('');if(focused)this.host.querySelector(`[data-atlas-area="${focused}"]`)?.focus({preventScroll:true});}
 renderIndex(){
  const members=this.regionGroups.get(this.activeRegion)||this.stadiums,r=atlasRegions.find(r=>r.id===this.activeRegion);this.host.querySelector('#atlas-index-title').textContent=r?r.name+' / '+members.length+' 座主场':'全部主场 / '+members.length;
  this.host.querySelector('[data-atlas-all]').hidden=!r;
  this.host.querySelector('#atlas-index').innerHTML=members.map(s=>`<button class="atlas-index-item" data-atlas-open="${s.id}" aria-label="飞入${s.name}"><i style="--pin-color:${s.color}"></i><span>${safe(s.club.split(' / ')[0])}<small>${safe(s.city)} · ${safe(s.name)}</small></span><b>${this.saved.has(s.id)?'♥':this.seen[s.id]?'✳':'↗'}</b></button>`).join('');
 }
 selectRegion(id){
  if(id&&!this.regionGroups.has(id))return;this.activeRegion=id;this.selected=null;this.highlight(null);this.renderRegionList();this.renderIndex();this.host.dataset.activeRegion=id||'all';
  const r=atlasRegions.find(r=>r.id===id);if(r){this.regionPreview(r);this.moveTo(vector(r.center,this.renderHost.clientWidth<500?3.65:2.7));}else this.resetPreview();
 }
 regionPreview(r){const members=this.regionGroups.get(r.id);if(!members)return;this.host.querySelector('#atlas-preview-country').textContent=r.en+' / '+String(members.length).padStart(2,'0')+' GROUNDS';this.host.querySelector('#atlas-preview-name').textContent=r.name;this.host.querySelector('#atlas-preview-club').textContent=[...new Set(members.map(s=>s.city))].join(' · ');this.host.style.setProperty('--selected-club','#d5ba84');}
 resetPreview(){this.host.querySelector('#atlas-preview-country').textContent='点亮一片热爱';this.host.querySelector('#atlas-preview-name').innerHTML='从世界，<br>到一座主场。';this.host.querySelector('#atlas-preview-club').textContent='选择地图上的发光区域。';}
 highlight(id,event){
  if(id&&!this.regionGroups.has(id))id=null;this.hoverRegion=id;this.host.dataset.hoverRegion=id||'';
  this.host.querySelectorAll('[data-atlas-area]').forEach(b=>b.classList.toggle('is-hovered',b.dataset.atlasArea===id));
  this.caption.hidden=!id||!event;if(id){const r=atlasRegions.find(r=>r.id===id);this.regionPreview(r);if(event){const box=this.renderHost.getBoundingClientRect();this.caption.style.left=Math.max(12,Math.min(box.width-160,event.clientX-box.left+17))+'px';this.caption.style.top=Math.max(70,Math.min(box.height-145,event.clientY-box.top-38))+'px';this.caption.querySelector('span').textContent=r.en;this.caption.querySelector('strong').textContent=r.name;this.caption.querySelector('small').textContent=this.regionGroups.get(id).length+' 座主场 · 点击探索';}}
  else if(this.activeRegion)this.regionPreview(atlasRegions.find(r=>r.id===this.activeRegion));else if(!this.selected)this.resetPreview();
 }
 preview(id){const s=this.stadiums.find(s=>s.id===id);if(!s)return;this.selected=id;this.host.querySelector('#atlas-preview-country').textContent=s.country+' / '+s.city;this.host.querySelector('#atlas-preview-name').textContent=s.name;this.host.querySelector('#atlas-preview-club').textContent=s.club;this.host.style.setProperty('--selected-club',s.color);this.hoverRegion=null;}
 open(id){this.preview(id);this.onOpen?.(id);}
 focusGround(id){if(this.camera)this.moveTo(vector(groundPositions[id],this.renderHost.clientWidth<500?3.65:2.7));}
 region(region){this.host.querySelectorAll('[data-atlas-region]').forEach(b=>b.classList.toggle('active',b.dataset.atlasRegion===region));this.highlight(null);this.moveTo(vector(region==='south'?[-23,-52]:[46,7],region==='world'?(this.renderHost.clientWidth<500?5.6:4.2):this.defaultDistance()));}
 zoom(scale){if(this.camera)this.moveTo(this.camera.position.clone().setLength(THREE.MathUtils.clamp(this.camera.position.length()*scale,1.55,5.8)));}
 moveTo(target){if(!this.camera)return;if(!motion()||document.hidden){this.camera.position.copy(target);this.controls.update();this.updateLabels();this.draw();return;}this.tween={from:this.camera.position.clone(),to:target,start:performance.now()};this.loop();}
 resize(){if(!this.renderer)return;const w=this.renderHost.clientWidth,h=this.renderHost.clientHeight;if(!w||!h)return;const mobile=w<500;if(this.mobileSize!==undefined&&this.mobileSize!==mobile){this.camera.position.multiplyScalar(mobile?4.25/3.05:3.05/4.25);this.tween=null;}this.mobileSize=mobile;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.updateLabels();this.draw();}
 updateLabels(){if(!this.camera)return;const v=this.camera.position,lat=Math.asin(v.y/v.length())*180/Math.PI,lon=-Math.atan2(v.z,v.x)*180/Math.PI;this.host.querySelector('#atlas-coordinate').textContent=Math.abs(lat).toFixed(0)+'° '+(lat>=0?'N':'S')+' / '+Math.abs(lon).toFixed(0)+'° '+(lon>=0?'E':'W');this.host.dataset.camera=v.toArray().map(x=>x.toFixed(3)).join(',');}
 animateRegions(){for(const r of this.regionMeshes){const active=r.info.id===(this.hoverRegion||this.activeRegion);r.value=THREE.MathUtils.lerp(r.value,active?1:0,motion()?.1:1);r.mesh.material.opacity=.16+r.value*.25;r.line.material.opacity=.37+r.value*.48;}}
 fly(id){if(!this.camera)return;this.flightCamera??=this.camera.position.clone();this.moveTo(vector(groundPositions[id],1.6));clearTimeout(this.flightTimer);this.flightTimer=setTimeout(()=>this.pause(),600);}
 draw(){if(this.renderer&&this.scene&&this.camera){this.animateRegions();this.renderer.render(this.scene,this.camera);}}
 pause(){clearTimeout(this.flightTimer);this.active=false;this.renderer?.setAnimationLoop(null);}
 resume(){clearTimeout(this.flightTimer);if(this.flightCamera){this.camera.position.copy(this.flightCamera);this.flightCamera=null;this.tween=null;this.controls.update();this.updateLabels();}this.active=true;this.loop();}
 loop(){if(!this.renderer)return;if(!this.active||!this.visible||document.hidden){this.renderer.setAnimationLoop(null);return;}this.renderer.setAnimationLoop(()=>{if(this.tween){const t=Math.min(1,(performance.now()-this.tween.start)/1000),k=1-(1-t)**3,from=this.tween.from.clone().normalize(),to=this.tween.to.clone().normalize(),q=new THREE.Quaternion().setFromUnitVectors(from,to),partial=new THREE.Quaternion().slerp(q,k);this.camera.position.copy(from.applyQuaternion(partial)).multiplyScalar(THREE.MathUtils.lerp(this.tween.from.length(),this.tween.to.length(),k));if(t===1)this.tween=null;}this.controls.update();this.animateRegions();this.renderer.render(this.scene,this.camera);this.updateLabels();});}
 dispose(){this.disposed=true;this.pause();this.intersection.disconnect();this.resizeObserver?.disconnect();this.controls?.dispose();this.scene?.traverse(o=>{o.geometry?.dispose();if(o.material){for(const key of ['map','normalMap','specularMap'])o.material[key]?.dispose();o.material.dispose();}});this.renderer?.dispose();document.removeEventListener('visibilitychange',this.onVisibility);}
}
