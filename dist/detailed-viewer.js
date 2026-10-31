let sdk;
function loadSDK(){return sdk??=new Promise((resolve,reject)=>{if(window.Sketchfab)return resolve(window.Sketchfab);const script=document.createElement('script');script.src='https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';script.onload=()=>resolve(window.Sketchfab);script.onerror=()=>{sdk=null;reject(new Error('Model host unavailable'));};document.head.append(script);});}

export class DetailedViewer{
 async mount(host,model,onFailure){
  this.suspend();this.host=host;this.active=true;const token=this.token=(this.token||0)+1;host.dataset.ready='loading';host.dataset.modelKind='authored';
  const frame=document.createElement('iframe');this.frame=frame;frame.title=model.name+' · '+model.author;frame.allow='fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';frame.className='authored-model';host.replaceChildren(frame);
  this.timeout=setTimeout(()=>{if(this.active&&this.token===token)onFailure();},65000);
  try{const Sketchfab=await loadSDK();if(!this.active||this.token!==token)return;const client=new Sketchfab('1.12.1',frame);client.init(model.uid,{autostart:1,preload:1,dnt:1,transparent:1,camera:matchMedia('(prefers-reduced-motion: reduce)').matches?0:1,autospin:0,success:api=>{if(!this.active||this.token!==token)return;this.api=api;api.addEventListener('viewerready',()=>{if(!this.active||this.token!==token)return;clearTimeout(this.timeout);host.dataset.ready='true';});api.start();},error:()=>{if(this.active&&this.token===token)onFailure();}});}catch{if(this.active&&this.token===token)onFailure();}
 }
 suspend(){this.active=false;this.token=(this.token||0)+1;clearTimeout(this.timeout);try{this.api?.stop();}catch{}this.api=null;this.frame?.remove();this.frame=null;this.host=null;}
}
