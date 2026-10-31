import * as THREE from './vendor/three/three.module.js';
import {OrbitControls} from './vendor/three/OrbitControls.js';
import {modelProfiles} from './model-profiles.js';

const TAU=Math.PI*2;
function point(t,a,b,n=4){const c=Math.cos(t),s=Math.sin(t);return new THREE.Vector3(Math.sign(c)*Math.abs(c)**(2/n)*a,0,Math.sign(s)*Math.abs(s)**(2/n)*b);}
function material(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.62,metalness:.14,...extra});}
function mesh(parent,geometry,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent,x,y,z,w,h,d,mat){return mesh(parent,new THREE.BoxGeometry(w,h,d),mat,x,y,z);}
function beam(parent,a,b,r,mat){const v=b.clone().sub(a);const m=mesh(parent,new THREE.CylinderGeometry(r,r,v.length(),7),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;}
function band(parent,a,b,a2,b2,y,y2,n,mat,{skip=()=>false,asymmetric=false,segments=128}={}){
 const v=[],idx=[];const height=(t,h)=>h*(asymmetric?1+.22*Math.max(0,Math.sin(t)):1);
 for(let i=0;i<segments;i++){const t=i/segments*TAU,t2=(i+1)/segments*TAU;if(skip((t+t2)/2))continue;const ps=[point(t,a,b,n),point(t,a2,b2,n),point(t2,a2,b2,n),point(t2,a,b,n)],base=v.length/3;ps.forEach((p,j)=>v.push(p.x,height(j===0||j===3?(j===0?t:t2):(j===1?t:t2),j===0||j===3?y:y2),p.z));idx.push(base,base+2,base+1,base,base+3,base+2);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return mesh(parent,g,mat);
}
function curvedBeam(parent,points,r,mat){return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,r,6,false),mat);}
function pitchTexture(){const c=document.createElement('canvas');c.width=1024;c.height=672;const x=c.getContext('2d');for(let i=0;i<14;i++){x.fillStyle=i%2?'#318762':'#2a7c58';x.fillRect(i*c.width/14,0,c.width/14+1,c.height);}x.strokeStyle='#dbe9c8';x.lineWidth=3;x.strokeRect(35,32,954,608);x.beginPath();x.moveTo(512,32);x.lineTo(512,640);x.stroke();x.beginPath();x.arc(512,336,90,0,TAU);x.stroke();x.fillStyle='#dbe9c8';x.beginPath();x.arc(512,336,4,0,TAU);x.fill();for(const left of [true,false]){x.strokeRect(left?35:830,160,159,352);x.strokeRect(left?35:935,250,54,172);x.beginPath();x.arc(left?139:885,336,3.8,0,TAU);x.fill();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function signTexture(name,color){const c=document.createElement('canvas');c.width=1024;c.height=128;const x=c.getContext('2d');x.fillStyle='#15242c';x.fillRect(0,0,1024,128);x.fillStyle=color;x.font='600 52px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(name.toUpperCase().slice(0,30),512,66,950);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}

function buildStadium(s){
 const p=modelProfiles[s.id],g=new THREE.Group();g.name=s.id;const n=p.n||4,innerA=p.track?77:63,innerB=p.track?56:43,rows=p.tiers*6,rowStep=1.28,outerA=innerA+rows*rowStep+5,outerB=innerB+rows*rowStep+5,height=rows*.92+4;
 const concrete=material('#788a8f'),dark=material('#293b44'),white=material('#cbd7d8',{metalness:.3}),steel=material('#405765',{metalness:.6}),primary=material(p.colors[0]);
 mesh(g,new THREE.CylinderGeometry(149,152,3,96),material('#1c2b32'),0,-2,0);
 const base=mesh(g,new THREE.TorusGeometry(148,.35,6,128),material('#b3dc64',{emissive:'#749e32',emissiveIntensity:.35}),0,-.4,0);base.rotation.x=Math.PI/2;
 mesh(g,new THREE.CylinderGeometry(132,133,.5,96),material('#26383d'),0,-.25,0);
 for(let i=0;i<40;i++){const a=i/40*TAU,pos=point(a,139,139,2);const m=box(g,pos.x,.15,pos.z,3,.12,9,material(i%5===0?'#91ac86':'#3a5054'));m.rotation.y=-a;}
 const field=mesh(g,new THREE.PlaneGeometry(105,68),new THREE.MeshStandardMaterial({map:pitchTexture(),roughness:.95}),0,.7,0);field.rotation.x=-Math.PI/2;
 if(p.track)band(g,57,37,73,52,.35,.35,2.4,material('#36739e'));
 const skip=p.facade==='boca'?t=>Math.cos(t)>.72:()=>false;
 const seatGeometry=new THREE.BoxGeometry(1.1,.65,.85),seatMaterial=material('#ffffff',{roughness:.7});const seats=new THREE.InstancedMesh(seatGeometry,seatMaterial,rows*144);let count=0;const dummy=new THREE.Object3D();
 const floor=material('#5c7078');
 for(let row=0;row<rows;row++){
  const tierGap=Math.floor(row/6)*1.2,a=innerA+row*rowStep,b=innerB+row*rowStep,y=2.4+row*.92+tierGap;
  band(g,a,b,a+rowStep,b+rowStep,y,y+.6,n,floor,{skip,asymmetric:p.asymmetric});
  for(let i=0;i<144;i++){const t=i/144*TAU;if(skip(t))continue;const pos=point(t,a+.55,b+.55,n);pos.y=y+.6; if(p.asymmetric)pos.y*=1+.22*Math.max(0,Math.sin(t));dummy.position.copy(pos);dummy.rotation.set(0,Math.atan2(pos.x,pos.z),0);dummy.updateMatrix();seats.setMatrixAt(count,dummy.matrix);let index=0;if(['campnou','galatasaray','cruyff','monumental','maracana'].includes(s.id))index=Math.floor(i/18+Math.floor(row/6))%2;else if(s.id==='juventus')index=Math.floor(i/9)%2;else if(s.id==='dortmund')index=i<72?1:0;else if(row%6===0)index=1;seats.setColorAt(count,new THREE.Color(p.colors[index]));count++;}
 }
 seats.count=count;seats.castShadow=false;g.add(seats);
 for(const side of [-1,1]){const goal=new THREE.Group();g.add(goal);goal.position.set(side*53,1,0);const m=material('#dfe8df');beam(goal,new THREE.Vector3(0,0,-3.7),new THREE.Vector3(0,3,-3.7),.16,m);beam(goal,new THREE.Vector3(0,0,3.7),new THREE.Vector3(0,3,3.7),.16,m);beam(goal,new THREE.Vector3(0,3,-3.7),new THREE.Vector3(0,3,3.7),.16,m);const net=mesh(goal,new THREE.BoxGeometry(2.2,2.8,7.4),new THREE.MeshBasicMaterial({color:'#ecf4d4',wireframe:true,transparent:true,opacity:.26}),side*1.1,1.4,0);net.castShadow=false;}
 // The outer envelope stays low enough to reveal seating from a high viewpoint.
 const facadeHeight=p.facade==='silver'?height+6:height*.77;
 if(p.facade==='cushion'){
  const geo=new THREE.SphereGeometry(1,10,7),mat=material('#df3d42',{emissive:'#b51b27',emissiveIntensity:.3,metalness:.25});const cells=new THREE.InstancedMesh(geo,mat,80*5);let k=0;
  for(let row=0;row<5;row++)for(let i=0;i<80;i++){const t=(i+(row%2)*.5)/80*TAU,pos=point(t,outerA+3,outerB+3,n);dummy.position.set(pos.x,4.5+row*4.4,pos.z);dummy.rotation.set(0,-Math.atan2(pos.z/outerB,pos.x/outerA)+Math.PI/2,Math.PI/7*(row%2?1:-1));dummy.scale.set(4.2,2.7,1.5);dummy.updateMatrix();cells.setMatrixAt(k++,dummy.matrix);}g.add(cells);dummy.scale.set(1,1,1);
 }else if(p.facade==='silver'){
  for(let j=0;j<15;j++)band(g,outerA+2,outerB+2,outerA+2.5,outerB+2.5,j*2,j*2+1.55,n,material(j%2?'#a5b4be':'#728a9b',{metalness:.75}));
 }else{
  const mat=material(p.facade==='brick'?'#674340':p.facade==='glass'?'#3d626e':'#7c898a',{metalness:p.facade==='glass'?.55:.15,roughness:p.facade==='glass'?.25:.75});
  band(g,outerA,outerB,outerA+.7,outerB+.7,0,facadeHeight,n,mat,{skip});
  for(let i=0;i<48;i++){const t=i/48*TAU;if(skip(t))continue;const pos=point(t,outerA+1,outerB+1,n);beam(g,new THREE.Vector3(pos.x,0,pos.z),new THREE.Vector3(pos.x,facadeHeight+1,pos.z),p.facade==='ribs'?.95:.5,p.facade==='ribs'?concrete:steel);}
 }
 const roofY=height+5+(p.asymmetric?4:0),roofInnerA=innerA+8,roofInnerB=innerB+8,roofOuterA=outerA+7,roofOuterB=outerB+7;
 if(!['open','sides'].includes(p.roof)){
  const roofMat=material(p.roof==='four'?'#acbec8':'#d1d9d9',{side:THREE.DoubleSide,metalness:.38});band(g,roofInnerA,roofInnerB,roofOuterA,roofOuterB,roofY+1,roofY,n,roofMat,{skip:p.facade==='boca'?skip:()=>false,asymmetric:p.asymmetric});
  for(let i=0;i<32;i++){const t=i/32*TAU,a=point(t,roofInnerA,roofInnerB,n),b=point(t,roofOuterA,roofOuterB,n);let h=p.asymmetric?1+.22*Math.max(0,Math.sin(t)):1;a.y=(roofY+1)*h+.3;b.y=roofY*h+.3;beam(g,a,b,.25,p.roof==='steel'?material('#a83335'):steel);}
 }else if(p.roof==='sides'){
  band(g,roofInnerA,roofInnerB,roofOuterA+6,roofOuterB+6,roofY,roofY+1,n,white,{skip:t=>Math.abs(Math.cos(t))>.78});
 }else if(s.id==='campnou'){
  band(g,roofInnerA,roofInnerB,roofOuterA,roofOuterB,roofY,roofY,n,white,{skip:t=>Math.sin(t)<.5});
 }
 if(p.facade==='pylons'){
  const yellow=material('#e4c934',{emissive:'#a0790e',emissiveIntensity:.1});for(const sx of [-1,1])for(const sz of [-1,1])for(const delta of [-9,9]){const top=new THREE.Vector3(sx*(outerA+10),roofY+24,sz*(outerB-9)+delta),bottom=new THREE.Vector3(sx*(outerA-10),1,sz*(outerB-9)+delta);beam(g,bottom,top,.9,yellow);beam(g,top,new THREE.Vector3(sx*roofInnerA,roofY+2,sz*roofInnerB),.12,white);}
 }
 if(p.facade==='towers'){
  const red=material('#b34440');for(let i=0;i<11;i++){const t=i/11*TAU,pos=point(t,outerA+10,outerB+10,3.8);mesh(g,new THREE.CylinderGeometry(4.3,4.7,roofY+5,12),concrete,pos.x,(roofY+5)/2,pos.z);const points=[];for(let j=0;j<=64;j++){const a=j/64*TAU*3;points.push(new THREE.Vector3(pos.x+5*Math.cos(a),2+j/64*(roofY+3),pos.z+5*Math.sin(a)));}curvedBeam(g,points,.52,white);}
  for(const z of [-roofOuterB,-roofInnerB,roofInnerB,roofOuterB])box(g,0,roofY+7,z,roofOuterA*2+18,2.5,2.5,red);
  for(const x of [-roofOuterA,-roofInnerA,roofInnerA,roofOuterA])box(g,x,roofY+7,0,2.5,2.5,roofOuterB*2+18,red);
 }
 if(p.facade==='boca'){
  const x=outerA-8;box(g,x,25,0,12,50,outerB*1.55,material('#d3b43d'));for(let row=0;row<7;row++)box(g,x-6.4,7+row*6,0,1.2,2.8,outerB*1.52,material('#305f92'));for(let j=-5;j<=5;j++)box(g,x-7,25,j*10,1,47,.8,material('#e6d28c'));
 }
 if(p.facade==='arches'){
  for(const z of [-roofOuterB*.9,roofOuterB*.9]){const points=[];for(let i=0;i<=28;i++){const t=i/28;points.push(new THREE.Vector3(-roofOuterA+t*roofOuterA*2,roofY+2+Math.sin(t*Math.PI)*19,z));}curvedBeam(g,points,.9,material(s.id==='luz'?'#bc3f42':'#9eafb8'));}
 }
 if(p.facade==='masts'||p.facade==='juve'){
  const count=p.facade==='juve'?2:10;for(let i=0;i<count;i++){const t=i/count*TAU,pos=point(t,outerA+10,outerB+10,n);const top=new THREE.Vector3(pos.x*1.08,roofY+20,pos.z*1.08);beam(g,new THREE.Vector3(pos.x,0,pos.z),top,.65,white);const end=point(t+.15,roofInnerA,roofInnerB,n);end.y=roofY+1;beam(g,top,end,.12,white);if(p.facade==='juve')beam(g,top,new THREE.Vector3(pos.x*1.3,0,pos.z*1.3),.9,material(i?'#c74d4e':'#4da97e'));}
 }
 const sign=mesh(g,new THREE.PlaneGeometry(65,8),new THREE.MeshBasicMaterial({map:signTexture(s.clubEn.split(' ').slice(0,3).join(' '),p.colors[0]),side:THREE.DoubleSide}),0,7,outerB+2);sign.rotation.x=-.12;
 // Four entrance blocks, access plazas, and restrained floodlights anchor the diorama.
 for(const sx of [-1,1])for(const sz of [-1,1]){const pos=point(Math.atan2(sz,sx),outerA+8,outerB+8,n);box(g,pos.x,2,pos.z,8,4,8,steel);mesh(g,new THREE.BoxGeometry(5,.3,5),material('#c8e5b6',{emissive:'#b7de8e',emissiveIntensity:.35}),pos.x,4.2,pos.z);}
 return g;
}

function disposeObject(object){const geometries=new Set(),materials=new Set(),textures=new Set();object.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}

export class StadiumViewer{
 constructor(){
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#101b22');this.scene.fog=new THREE.Fog('#101b22',450,850);this.camera=new THREE.PerspectiveCamera(39,1,.5,1200);this.scene.add(new THREE.HemisphereLight('#e5f2ff','#25363a',2.1));const sun=new THREE.DirectionalLight('#fff1d7',3.3);sun.position.set(-130,240,170);this.scene.add(sun);const edge=new THREE.DirectionalLight('#92bcdc',2);edge.position.set(150,80,-140);this.scene.add(edge);const fill=new THREE.DirectionalLight('#c0db8d',.7);fill.position.set(50,50,200);this.scene.add(fill);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.dampingFactor=.075;this.controls.minDistance=125;this.controls.maxDistance=570;this.controls.minPolarAngle=.12;this.controls.maxPolarAngle=Math.PI*.48;this.controls.panSpeed=.6;this.controls.zoomSpeed=.8;this.controls.autoRotateSpeed=.32;this.controls.addEventListener('start',()=>{this.controls.autoRotate=false;this.tween=null;this.sync();});this.controls.addEventListener('change',()=>this.sync());
  this.renderer.domElement.tabIndex=0;this.renderer.domElement.setAttribute('role','img');this.renderer.domElement.setAttribute('aria-label','可交互的球场3D模型，方向键旋转，Shift加方向键平移，加减号缩放，Home重置');this.renderer.domElement.addEventListener('keydown',e=>this.onKey(e));this.renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());this.onVisibility=()=>{if(document.hidden)this.stopLoop();else if(this.host?.isConnected&&this.active)this.startLoop();};document.addEventListener('visibilitychange',this.onVisibility);
 }
 mount(host,s){this.stopLoop();this.resizeObserver?.disconnect();if(this.model){this.scene.remove(this.model);disposeObject(this.model);}this.host=host;this.stadium=s;this.active=true;host.replaceChildren(this.renderer.domElement);this.model=buildStadium(s);this.scene.add(this.model);this.camera.position.set(205,180,220);this.controls.target.set(0,13,0);this.controls.autoRotate=!matchMedia('(prefers-reduced-motion: reduce)').matches;this.controls.update();this.controls.saveState();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.fitNeeded=true;this.resize();host.dataset.ready='true';host.dataset.stadium=s.id;this.renderer.domElement.setAttribute('aria-label',s.name+'可交互3D模型，拖拽旋转，右键平移，滚轮缩放，方向键旋转，Shift加方向键平移，加减号缩放，Home重置');this.sync();this.startLoop();}
 resize(){if(!this.host)return;const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.home=new THREE.Vector3(205,180,220).multiplyScalar(Math.max(1,1.32/(w/h)));if(this.fitNeeded){this.camera.position.copy(this.home);this.controls.update();this.fitNeeded=false;}}
 sync(){if(!this.host)return;this.host.dataset.camera=[this.camera.position.x,this.camera.position.y,this.camera.position.z].map(v=>v.toFixed(2)).join(',');this.host.dataset.target=[this.controls.target.x,this.controls.target.y,this.controls.target.z].map(v=>v.toFixed(2)).join(',');this.host.dataset.distance=this.controls.getDistance().toFixed(2);const label=document.querySelector('#model-view-label');if(label)label.textContent=this.controls.autoRotate?'缓缓环绕 · 拖拽即可接管':'自由视角 · 随你探索';const spin=document.querySelector('[data-model-action="spin"]');if(spin)spin.setAttribute('aria-pressed',String(this.controls.autoRotate));}
 startLoop(){if(!this.active)return;let previous=performance.now();this.renderer.setAnimationLoop(()=>{if(!this.active)return;const now=performance.now(),dt=Math.min(.05,(now-previous)/1000);previous=now;if(this.tween){const t=Math.min(1,(now-this.tween.start)/650),k=1-(1-t)**3;this.camera.position.lerpVectors(this.tween.from,this.tween.to,k);this.controls.target.lerpVectors(this.tween.targetFrom,this.tween.targetTo,k);if(t>=1)this.tween=null;}this.controls.update(dt);this.renderer.render(this.scene,this.camera);});}
 stopLoop(){this.renderer.setAnimationLoop(null);}
 transition(position,target=new THREE.Vector3(0,13,0)){this.controls.autoRotate=false;if(matchMedia('(prefers-reduced-motion: reduce)').matches){this.camera.position.copy(position);this.controls.target.copy(target);this.controls.update();}else this.tween={from:this.camera.position.clone(),to:position,targetFrom:this.controls.target.clone(),targetTo:target,start:performance.now()};this.sync();}
 action(name){if(name==='reset')this.transition(this.home.clone());if(name==='top')this.transition(new THREE.Vector3(0,355,48));if(name==='zoom-in'||name==='zoom-out'){this.tween=null;this.controls.autoRotate=false;const offset=this.camera.position.clone().sub(this.controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*(name==='zoom-in'?.84:1.19),this.controls.minDistance,this.controls.maxDistance));this.camera.position.copy(this.controls.target).add(offset);this.controls.update();}if(name==='spin'){this.tween=null;this.controls.autoRotate=!this.controls.autoRotate;this.sync();}}
 onKey(e){if(['+','=','-','_','Home','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();this.controls.autoRotate=false;this.tween=null;if(e.key==='Home')return this.action('reset');if(['+','='].includes(e.key))return this.action('zoom-in');if(['-','_'].includes(e.key))return this.action('zoom-out');if(e.shiftKey){const forward=this.camera.getWorldDirection(new THREE.Vector3());forward.y=0;forward.normalize();const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();const delta=new THREE.Vector3();if(e.key==='ArrowRight')delta.copy(right).multiplyScalar(8);if(e.key==='ArrowLeft')delta.copy(right).multiplyScalar(-8);if(e.key==='ArrowUp')delta.copy(forward).multiplyScalar(8);if(e.key==='ArrowDown')delta.copy(forward).multiplyScalar(-8);this.camera.position.add(delta);this.controls.target.add(delta);this.controls.update();return;}const s=new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));if(e.key==='ArrowLeft')s.theta-=.1;if(e.key==='ArrowRight')s.theta+=.1;if(e.key==='ArrowUp')s.phi=Math.max(.12,s.phi-.1);if(e.key==='ArrowDown')s.phi=Math.min(Math.PI*.48,s.phi+.1);this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(s));this.controls.update();}}
 suspend(){this.active=false;this.stopLoop();this.resizeObserver?.disconnect();this.tween=null;if(this.model){this.scene.remove(this.model);disposeObject(this.model);this.model=null;}this.renderer.domElement.remove();this.host=null;}
 dispose(){this.suspend();this.controls.dispose();this.renderer.dispose();document.removeEventListener('visibilitychange',this.onVisibility);}
}
