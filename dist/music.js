export const tracks = {
 bernabeu:{id:'Yc-7IQqcqeM',name:'Hala Madrid… y nada más',credit:'Real Madrid · 官方频道'},
 campnou:{id:'9JdugskAcS0',name:'Cant del Barça',credit:'FC Barcelona · 官方队歌'},
 anfield:{id:'C1QYrVjDPnA',name:"You’ll Never Walk Alone",credit:'Liverpool FC · 安菲尔德现场'},
 allianz:{id:'o5XqRGQ8vng',name:'Stern des Südens',credit:'拜仁主场歌曲 · 原站公开视频'},
 sansiro:{id:'vVaPCFg3Vvw',name:'#Rossoneri',credit:'Emis Killa & Saturnino · 官方艺人频道（AC 米兰）'},
 dortmund:{id:'apzC24Iis2Q',name:'看台归来 · 球迷现场助威',credit:'Borussia Dortmund · 官方频道'},
 paris:{id:'oViapnBhzMQ',name:'Ô Ville Lumière',credit:'Paris Saint-Germain · 官方频道'},
 emirates:{id:'5gU277dBf8I',name:'The Angel (North London Forever)',credit:'Louis Dunford · 官方艺人现场版'},
 stamfordbridge:{id:'V02OibHkdCE',name:'Blue Is the Colour',credit:'切尔西代表歌曲 · 原站音乐录音'},
 oldtrafford:{id:'-BssUhMwQe0',name:'Glory Glory Man United',credit:'Manchester United Football Team · 球队歌曲'},
 juventus:{id:'w740ojhxOw0',name:'Juve (Storia di un Grande Amore)',credit:'HiveSoundz · 艺人演绎版本'},
 etihad:{id:'EZNZVVbsdBU',name:'Blue Moon',credit:'Man City · Jason Manford 现场演唱'},
 tottenham:{id:'LSgxYDJF14g',name:'Glory Glory Tottenham Hotspur',credit:'热刺代表歌曲 · 原站公开视频'},
 metropolitano:{id:'bwSlybhtw9U',name:'Himno Oficial del Atlético de Madrid',credit:'Mas Temas Hoy · 艺人录音版本'},
 dragao:{id:'k9G7RcnQASA',name:'Hino do FC Porto',credit:'Alberto Indio · 官方艺人频道'},
 luz:{id:'BIN2cZ5P-MU',name:'Ser Benfiquista',credit:'BenficaChannel · 球迷发布版本'},
 galatasaray:{id:'w-ah3lyBEh4',name:'Galatasaray Marşı',credit:'Galatasaray · 官方频道'},
 cruyff:{id:'TjJbjun42JI',name:'De Ajax Marsch',credit:'Release – Topic · 原站歌曲录音'},
 feyenoord:{id:'qqzOi4RhFwg',name:'Hand in Hand, Kameraden',credit:'Ad Murck · 原站公开视频'},
 celtic:{id:'DfUXuWQnh9s',name:'You’ll Never Walk Alone',credit:'Celtic Thunder · 艺人演唱版本，非俱乐部现场'},
 bombonera:{id:'NAC6Wg-gPXs',name:'糖果盒的看台助威',credit:'博卡青年球迷现场 · 原站公开视频'},
 monumental:{id:'MdBW_WKoiaw',name:'Himno Oficial Club Atlético River Plate',credit:'Club Atlético River Plate – Topic · RCA Victor'},
 maracana:{id:'F78cefmHAFI',name:'Hino do Flamengo',credit:'Orquestra e Coro Cid · 弗拉门戈歌曲录音'},
 napoli:{id:'eQATT_i2dk0',name:'’O surdato ’nnammurato',credit:'Sal Da Vinci · 官方艺人频道'},
};

let apiPromise;
function youtubeAPI(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(apiPromise)return apiPromise;
 apiPromise=new Promise((resolve,reject)=>{
  let timer=setTimeout(()=>{apiPromise=null;reject(new Error('network'));},8000);
  window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);resolve(window.YT);};
  const old=document.querySelector('script[data-youtube-api]');old?.remove();
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.dataset.youtubeApi='true';
  script.onerror=()=>{clearTimeout(timer);apiPromise=null;reject(new Error('network'));};document.head.append(script);
 });
 return apiPromise;
}

// Each player belongs to one open detail view. A token invalidates delayed callbacks.
export class MatchdayAudio {
 constructor(update){this.update=update;this.player=null;this.token=0;this.volume=12;this.muted=false;this.state='idle';this.active=false;this.timer=null;this.fade=null;this.frame=null;}
 setState(state,message){this.state=state;this.update({state,message,volume:this.volume,muted:this.muted});}
 async mount(track,{autoplay=true}={}){
  this.destroy();const token=this.token;this.track=track;this.active=true;
  if(!track){this.setState('unavailable','这座球场的球队音乐尚待收录。你仍可探索球场故事。');return;}
  this.setState('loading',autoplay?'正在连接主场声音，默认音量 12%。':'音乐已准备，点击播放开启。');
  if(!autoplay){this.setState('idle','点击播放，听见这座主场。');return;}
  this.create(track,token,true);
 }
 async create(track,token,autoplay){
  try{
   const YT=await youtubeAPI();if(token!==this.token||!this.active)return;
   this.setState('loading','正在准备播放器…');
   const target=document.querySelector('#music-player');if(!target)return;
   target.innerHTML='<div id="youtube-player"></div>';
   this.player=new YT.Player('youtube-player',{width:'100%',height:'210',host:'https://www.youtube-nocookie.com',videoId:track.id,playerVars:{playsinline:1,rel:0,controls:1,origin:location.origin,autoplay:0},events:{
    onReady:event=>{if(token!==this.token)return;event.target.setVolume(0);if(this.muted)event.target.mute();if(autoplay){event.target.playVideo();this.watchPlayback(token);}else this.setState('paused','点击播放，听见这座主场。');},
    onStateChange:event=>{if(token!==this.token)return;if(event.data===1){clearTimeout(this.timer);this.rampVolume();this.setState('playing',this.muted?'正在播放 · 已静音':'正在播放 · 轻声感受这座主场');}else if(event.data===2){this.setState('paused','已暂停，随时继续。');}else if(event.data===0){this.setState('ended','本曲已结束，可以再次播放。');}},
    onAutoplayBlocked:()=>{if(token===this.token)this.setState('blocked','浏览器需要再点一次。点击播放即可开启音乐。');},
    onError:()=>{if(token===this.token){clearTimeout(this.timer);this.setState('error','当前视频无法在这里播放，可前往原站收听。');}}
   }});
   this.timer=setTimeout(()=>{if(token===this.token&&this.state==='loading')this.setState('error','播放器连接较慢，可重试或前往原站收听。');},9000);
  }catch{if(token===this.token)this.setState('error','暂时无法连接音乐源。请重试，或前往原站收听。');}
 }
 watchPlayback(token){clearTimeout(this.timer);this.timer=setTimeout(()=>{if(token===this.token&&!['playing','error','paused'].includes(this.state))this.setState('blocked','自动播放未成功，点击播放再试一次。');},5000);}
 rampVolume(){clearInterval(this.fade);let value=0;try{value=this.player?.getVolume?.()||0;}catch{}this.fade=setInterval(()=>{if(!this.player){clearInterval(this.fade);return;}value=Math.min(this.volume,value+2);this.player.setVolume(value);if(value>=this.volume)clearInterval(this.fade);},70);}
 play(){if(!this.track)return;if(this.state==='playing'){this.player?.pauseVideo?.();return;}if(this.player&&this.state!=='error'){this.player.setVolume(this.volume);if(this.muted)this.player.mute();this.player.playVideo();this.watchPlayback(this.token);}else{this.player?.destroy?.();this.player=null;this.setState('loading','正在重新连接主场声音…');this.create(this.track,this.token,true);}}
 setVolume(value){this.volume=Math.max(0,Math.min(30,Number(value)||0));clearInterval(this.fade);this.player?.setVolume?.(this.volume);if(this.volume>0&&this.muted){this.muted=false;this.player?.unMute?.();}this.update({state:this.state,volume:this.volume,muted:this.muted});}
 toggleMute(){this.muted=!this.muted;if(this.player){this.muted?this.player.mute():this.player.unMute();}this.update({state:this.state,volume:this.volume,muted:this.muted,message:this.muted?'音乐已静音':this.state==='playing'?'正在播放 · 轻声感受这座主场':undefined});}
 pause(){if(this.state==='playing')this.player?.pauseVideo?.();}
 destroy(){this.token++;this.active=false;clearTimeout(this.timer);clearInterval(this.fade);try{this.player?.destroy?.();}catch{}this.player=null;this.state='idle';}
}
