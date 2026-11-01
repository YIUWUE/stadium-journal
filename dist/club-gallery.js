const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const clubMarks={bernabeu:['RM','1902','round'],campnou:['FCB','1899','shield'],anfield:['LFC','1892','crest'],allianz:['FCB','1900','round'],sansiro:['ACM','1899','oval'],oldtrafford:['MU','1878','shield'],dortmund:['BVB','1909','round'],paris:['PSG','1970','round'],emirates:['AFC','1886','shield'],juventus:['J','1897','crest'],etihad:['CITY','1894','round'],tottenham:['TH','1882','crest'],stamfordbridge:['CFC','1905','round'],metropolitano:['ATM','1903','shield'],dragao:['FCP','1893','oval'],luz:['SLB','1904','crest'],galatasaray:['GS','1905','oval'],cruyff:['AJAX','1900','round'],feyenoord:['F','1908','round'],celtic:['CELTIC','1888','round'],bombonera:['CABJ','1905','shield'],monumental:['CARP','1901','shield'],maracana:['CRF','1895','crest'],napoli:['N','1926','round']};
export function markSVG(stadium){
 const [letters,year,shape]=clubMarks[stadium.id],outline=shape==='shield'?'M32 16H96L106 28V69Q105 94 64 112Q23 94 22 69V28Z':shape==='crest'?'M64 11 107 32 100 83 64 114 28 83 21 32Z':shape==='oval'?'M64 12C117 12 116 116 64 116S11 12 64 12Z':'M64 12A52 52 0 1 1 63.99 12Z';
 return `<svg class="club-symbol" viewBox="0 0 128 128" aria-hidden="true"><defs><linearGradient id="mark-${stadium.id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${stadium.color}" stop-opacity=".24"/><stop offset="1" stop-color="${stadium.color}" stop-opacity=".02"/></linearGradient></defs><path class="mark-silhouette" d="${outline}" fill="url(#mark-${stadium.id})"/><path class="mark-inner" d="M43 35H85M43 88H85"/><text class="mark-letters" x="64" y="73" text-anchor="middle" style="font-size:${letters.length>4?20:letters.length>3?25:34}px">${letters}</text><text class="mark-year" x="64" y="101" text-anchor="middle">${year}</text><circle cx="64" cy="27" r="2" class="mark-star"/></svg>`;
}

export class ClubGallery{
 constructor(host,{onOpen}={}){
  this.host=host;this.onOpen=onOpen;this.items=[];this.cities={};this.current=null;this.request=0;this.paused=false;
  host.innerHTML=`<div class="club-scene" aria-hidden="true"><img class="club-city-image" alt=""><div class="club-scene-shade"></div><div class="club-colour-halo"></div><div class="club-scene-grain"></div></div><div class="club-stage-top"><span>CHOOSE YOUR COLOURS.</span><span id="club-position">01 / 24</span></div><div class="club-preview"><p id="club-city">MADRID / 西班牙</p><h3 id="club-name">皇家马德里</h3><p class="club-story" id="club-story"></p><button class="club-enter" id="club-enter">走进这座主场 <span>↗</span></button></div><div class="club-watermark" aria-hidden="true">BELONG.</div><div class="club-selection"><div class="club-rail-heading"><span>每一种颜色，都有一份热爱。</span><div><button data-club-step="-1" aria-label="向前浏览球队">←</button><button data-club-step="1" aria-label="向后浏览球队">→</button></div></div><div class="club-rail" id="club-rail" role="group" aria-label="选择球队，点击进入球场"></div><div class="club-rail-foot"><span>↔ 拖动浏览 · 悬停感受 · 点击进入</span><span>24 STORIES, ONE GAME.</span></div></div>`;
  this.rail=host.querySelector('#club-rail');this.image=host.querySelector('.club-city-image');
  host.addEventListener('pointerover',e=>{const b=e.target.closest('[data-club-open]');if(b&&!this.drag?.moved)this.preview(b.dataset.clubOpen);});
  host.addEventListener('focusin',e=>{const b=e.target.closest('[data-club-open]');if(b)this.preview(b.dataset.clubOpen);});
  host.addEventListener('click',e=>{
   if(performance.now()<(this.suppressClickUntil||0)){e.preventDefault();e.stopPropagation();return;}
   const step=e.target.closest('[data-club-step]');if(step){this.step(Number(step.dataset.clubStep));return;}
   const button=e.target.closest('[data-club-open]');if(button){this.preview(button.dataset.clubOpen);this.onOpen?.(button.dataset.clubOpen);}
   if(e.target.closest('#club-enter')&&this.current)this.onOpen?.(this.current);
  });
  this.rail.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;this.drag={x:e.clientX,scroll:this.rail.scrollLeft,moved:false};});
  this.onMove=e=>{if(!this.drag)return;const delta=e.clientX-this.drag.x;if(Math.abs(delta)>7)this.drag.moved=true;if(this.drag.moved){this.rail.classList.add('is-dragging');this.rail.scrollLeft=this.drag.scroll-delta;}};
  this.onUp=()=>{if(!this.drag)return;if(this.drag.moved){this.suppressClickUntil=performance.now()+180;this.previewNearest();}this.drag=null;this.rail.classList.remove('is-dragging');};
  window.addEventListener('pointermove',this.onMove);window.addEventListener('pointerup',this.onUp);window.addEventListener('pointercancel',this.onUp);
  this.rail.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const items=[...this.rail.querySelectorAll('[data-club-open]')],index=items.indexOf(document.activeElement),next=e.key==='Home'?0:e.key==='End'?items.length-1:Math.max(0,Math.min(items.length-1,index+(e.key==='ArrowLeft'?-1:1)));items[next]?.focus({preventScroll:true});items[next]?.scrollIntoView({behavior:this.motion()?'smooth':'auto',block:'nearest',inline:'center'});});
  this.rail.addEventListener('scroll',()=>{clearTimeout(this.scrollTimer);this.scrollTimer=setTimeout(()=>{if(!this.drag&&!this.paused)this.previewNearest();},120);},{passive:true});
  host.addEventListener('pointermove',e=>{if(!this.motion()||this.paused||e.pointerType!=='mouse')return;const box=host.getBoundingClientRect();host.style.setProperty('--scene-x',((e.clientX-box.x)/box.width-.5)*8+'px');host.style.setProperty('--scene-y',((e.clientY-box.y)/box.height-.5)*6+'px');});
 }
 motion(){return !matchMedia('(prefers-reduced-motion: reduce)').matches;}
 setCities(cities){this.cities=cities;if(this.current)this.preview(this.current,true);}
 setStadiums(items,saved,seen){
  this.items=items;const identity=items.map(s=>s.id).join('|');
  if(identity!==this.identity){this.identity=identity;const previousScroll=this.rail.scrollLeft;this.rail.innerHTML=items.map(s=>`<button class="club-choice" data-club-open="${s.id}" style="--club-colour:${s.color}" aria-label="走进${escape(s.club)}的${escape(s.name)}"><span class="club-mark">${markSVG(s)}</span><strong>${escape(s.club.split(' / ')[0])}</strong><small>${escape(s.city)}</small><i class="club-discovered" aria-hidden="true"></i></button>`).join('');this.rail.scrollLeft=previousScroll;}
  for(const b of this.rail.querySelectorAll('[data-club-open]')){b.dataset.saved=String(saved.has(b.dataset.clubOpen));b.dataset.seen=String(!!seen[b.dataset.clubOpen]);}
  if(items.length)this.preview(items.some(s=>s.id===this.current)?this.current:items[0].id);this.host.dataset.clubCount=String(items.length);
 }
 preview(id,force=false){
  const s=this.items.find(s=>s.id===id);if(!s)return;const changed=this.current!==id;this.current=id;this.host.dataset.activeClub=id;this.host.style.setProperty('--active-colour',s.color);
  this.host.querySelector('#club-city').textContent=s.city+' / '+s.country;this.host.querySelector('#club-name').textContent=s.club.split(' / ')[0];this.host.querySelector('#club-story').textContent=s.quote;
  this.host.querySelector('#club-position').textContent=String(this.items.indexOf(s)+1).padStart(2,'0')+' / '+String(this.items.length).padStart(2,'0');
  for(const b of this.rail.querySelectorAll('[data-club-open]')){const selected=b.dataset.clubOpen===id;b.classList.toggle('is-current',selected);b.setAttribute('aria-current',String(selected));}
  const city=this.cities[s.city];if(city&&(changed||force))this.changeImage(city,s.city);
 }
 async changeImage(city,name){
  const token=++this.request;if(this.image.getAttribute('src')===city.src)return;const next=new Image();next.src=city.src;
  try{await next.decode();}catch{if(token===this.request)this.host.dataset.cityImage='unavailable';return;}if(token!==this.request)return;
  const image=this.image;image.getAnimations().forEach(a=>a.cancel());if(this.motion()&&image.getAttribute('src')){try{await image.animate([{opacity:.8},{opacity:0}],{duration:180,fill:'forwards'}).finished;}catch{return;}}
  if(token!==this.request){image.getAnimations().forEach(a=>a.cancel());return;}image.src=city.src;image.alt=city.description||name+'城市景色';image.getAnimations().forEach(a=>a.cancel());if(this.motion())image.animate([{opacity:0},{opacity:.8}],{duration:600});this.host.dataset.cityImage=name;
 }
 previewNearest(){const box=this.rail.getBoundingClientRect(),center=box.x+box.width/2;let best=null;for(const b of this.rail.querySelectorAll('[data-club-open]')){const r=b.getBoundingClientRect(),distance=Math.abs(r.x+r.width/2-center);if(!best||distance<best.distance)best={b,distance};}if(best)this.preview(best.b.dataset.clubOpen);}
 step(delta){const all=[...this.rail.querySelectorAll('[data-club-open]')],i=this.items.findIndex(s=>s.id===this.current),b=all[Math.max(0,Math.min(all.length-1,i+delta))];if(b){this.preview(b.dataset.clubOpen);b.scrollIntoView({behavior:this.motion()?'smooth':'auto',block:'nearest',inline:'center'});}}
 pause(){this.paused=true;}
 resume(){this.paused=false;}
}
