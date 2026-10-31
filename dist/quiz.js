const questions=[
 {title:'哪一种画面，会让你停下来？',description:'跟着第一眼的直觉选。',options:[['atmosphere','万人一起唱歌','热烈、共鸣、起鸡皮疙瘩'],['architecture','一座不可思议的建筑','线条、结构、未来感'],['history','一个有故事的老地方','岁月、传奇、留下的痕迹'],['city','一座想亲自去的城市','街区、旅行、当地生活']]},
 {title:'下一次出发，你更向往哪里？',description:'选一个此刻最想走近的目的地。',options:[['england','英伦看台','街区里的球场，传统的比赛日'],['europe','欧洲大陆','从城市地标到充满想象力的新主场'],['south','南美现场','色彩、烟火气与热烈的看台'],['anywhere','哪里都好','把未知留给旅程']]},
 {title:'一场比赛之外，你会先做什么？',description:'这是一次偏好推荐，没有标准答案。',options:[['atmosphere','加入人群，听一首歌','感受每个人一起呼吸的瞬间'],['architecture','绕球场走一圈','从不同角度看清它的轮廓'],['history','去博物馆看一段往事','找到那个让故事开始的瞬间'],['city','走进附近的街道','看看球场怎样长在一座城里']]},
];
export function setupQuiz({stadiums,dialog,onOpen,closeDialog}){
 const content=document.querySelector('#quiz-content');let step=0,answers=[];
 function render(){
  const q=questions[step];content.innerHTML=`<p class="quiz-step">FIND YOUR MATCH / 0${step+1} OF 03</p><div class="quiz-progress"><i style="width:${(step+1)/3*100}%"></i></div><h2 class="quiz-heading" id="quiz-title">${q.title}</h2><p class="quiz-description">${q.description}</p><div class="quiz-options">${q.options.map((option,i)=>`<button class="quiz-option" data-answer="${option[0]}" style="animation-delay:${i*40}ms"><span>0${i+1}</span><div><strong>${option[1]}</strong><small>${option[2]}</small></div></button>`).join('')}</div>${step?'<button class="quiz-back" data-quiz-back>← 上一题</button>':''}`;dialog.scrollTop=0;
 }
 function result(){
  const scored=stadiums.map((s,i)=>{let score=0;if(s.moods.includes(answers[0]))score+=5;if(s.moods.includes(answers[2]))score+=3;const south=['阿根廷','巴西'].includes(s.country);if(answers[1]==='england'&&['英格兰','苏格兰'].includes(s.country))score+=10;if(answers[1]==='south'&&south)score+=10;if(answers[1]==='europe'&&!south&&!['英格兰','苏格兰'].includes(s.country))score+=10;return{s,score,tie:(i*7+answers.join('').length)%23};}).sort((a,b)=>b.score-a.score||b.tie-a.tie);
  const s=scored[0].s;content.innerHTML=`<p class="eyebrow accent">YOUR NEXT HOME / 你的偏好推荐</p><h2 class="quiz-heading" id="quiz-title">你的下一站，<br>${s.name}。</h2><div class="quiz-result-image"><img src="assets/${s.id}.jpg" alt="${s.name}历史实景"></div><p class="quiz-result-reason">你偏爱${questions[0].options.find(o=>o[0]===answers[0])[1]}，也想${questions[2].options.find(o=>o[0]===answers[2])[1]}。${s.description}<br>这是一座值得你先走近的主场。</p><div class="quiz-result-actions"><button class="button lime" data-quiz-open="${s.id}">走进这座球场 <span>↗</span></button><button class="text-link" data-quiz-restart>再测一次 ↻</button></div>`;dialog.scrollTop=0;
 }
 content.addEventListener('click',e=>{const option=e.target.closest('[data-answer]');if(option){answers[step]=option.dataset.answer;if(step<2){step++;render();}else result();}if(e.target.closest('[data-quiz-back]')){step--;render();}if(e.target.closest('[data-quiz-restart]')){step=0;answers=[];render();}const go=e.target.closest('[data-quiz-open]');if(go){closeDialog(dialog,true);onOpen(go.dataset.quizOpen);}});
 return()=>{step=0;answers=[];render();dialog.showModal();document.querySelector('#close-quiz').focus({preventScroll:true});};
}
