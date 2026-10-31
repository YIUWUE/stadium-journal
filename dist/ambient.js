export {tracks} from './audio-tracks.js';

// A stadium click is the playback gesture. No video players or synthesized substitutes.
export class MatchdayAudio {
 constructor(onState,{muted=false}={}){this.onState=onState;this.muted=muted;this.token=0;this.retiring=new Set();}
 report(state,message){this.state=state;this.onState?.({state,message,muted:this.muted,track:this.track?.name});}
 mount(track){
  this.destroy();this.track=track;const token=++this.token;
  if(!track?.src){this.report('unavailable','这支主队的纯音频正在收录');return;}
  const element=document.createElement('audio');this.element=element;element.src=track.src;element.preload='auto';element.loop=true;element.volume=0;element.muted=this.muted;element.dataset.volume='0';element.dataset.stadiumAudio='true';element.setAttribute('aria-hidden','true');document.body.append(element);
  element.addEventListener('error',()=>{if(token===this.token)this.report('unavailable','主队音源暂时无法连接');});
  element.addEventListener('waiting',()=>{if(token===this.token)this.report('loading','正在连接主队声音');});
  element.addEventListener('playing',()=>{if(token!==this.token)return;this.report(this.muted?'muted':'playing',this.muted?'主队声音已静音':'主队声音 · 低音量渐入');this.fadeTo(this.muted?0:.10,3500);});
  this.report('loading','正在连接主队声音');this.play(token);
 }
 play(token=this.token){if(!this.element)return;try{const promise=this.element.play();promise?.catch(error=>{if(token!==this.token)return;this.report(error.name==='NotAllowedError'?'blocked':'unavailable',error.name==='NotAllowedError'?'浏览器限制了自动播放':'主队音源暂时无法连接');});}catch{this.report('unavailable','主队音源暂时无法连接');}}
 fadeTo(target,duration=1000){cancelAnimationFrame(this.frame);const element=this.element;if(!element)return;const start=performance.now(),from=element.volume;const step=now=>{if(element!==this.element)return;const t=Math.min(1,(now-start)/duration),k=t*t*(3-2*t);element.volume=Math.max(0,Math.min(.10,from+(target-from)*k));element.dataset.volume=element.volume.toFixed(4);if(t<1)this.frame=requestAnimationFrame(step);};this.frame=requestAnimationFrame(step);}
 toggleMute(){this.muted=!this.muted;for(const element of this.retiring)element.muted=this.muted;if(this.element){if(this.muted){this.fadeTo(0,250);this.element.muted=true;}else{this.element.volume=0;this.element.muted=false;if(this.element.paused)this.play();else this.fadeTo(.10,1700);}this.report(this.muted?'muted':this.state==='blocked'?'blocked':'playing',this.muted?'主队声音已静音':'主队声音 · 低音量渐入');}else this.report('unavailable',this.track?'这支主队的纯音频正在收录':'');return this.muted;}
 pause(){cancelAnimationFrame(this.frame);if(this.element){this.element.pause();this.element.volume=0;}}
 resume(){if(this.element)this.play();}
 destroy(){++this.token;cancelAnimationFrame(this.frame);const element=this.element;this.element=null;this.track=null;if(!element)return;this.retiring.add(element);const from=element.volume,start=performance.now();const release=()=>{element.pause();element.removeAttribute('src');element.load();element.remove();this.retiring.delete(element);};if(element.paused||element.muted||from===0){release();return;}const fade=now=>{const t=Math.min(1,(now-start)/280);element.volume=from*(1-t);if(t<1)requestAnimationFrame(fade);else release();};requestAnimationFrame(fade);}
}
