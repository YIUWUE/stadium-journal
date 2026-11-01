import {clubStories} from './story-data.js';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=value=>String(value).padStart(2,'0');

export function storyInvitation(id){return `<button class="exhibit-story-teaser" data-story-target="story-start">${escape(clubStories[id].title)} <span>读故事 ↓</span></button>`;}

export function renderClubStory(stadium,archive){
 const story=clubStories[stadium.id];
 const chars=[story.intro,...story.chapters.flatMap(c=>c.paragraphs)].join('').length;
 const minutes=Math.max(2,Math.ceil(chars/280));
 return `<section class="club-storybook" id="story-start" style="--story-colour:${stadium.color}" aria-labelledby="story-title">
  <header class="story-opening">
   <div class="story-opening-copy"><p class="story-kicker">BEYOND THE SCORE / ${escape(story.eyebrow)}</p><p class="story-club-name">${escape(stadium.club)}</p><h3 id="story-title" tabindex="-1">${escape(story.title)}</h3><p class="story-intro">${escape(story.intro)}</p><span class="story-reading-time">${number(story.chapters.length)} 个章节 <i>·</i> 约 ${minutes} 分钟 <i>·</i> 向下读，认识这份热爱</span></div>
   <figure class="story-opening-image"><img src="assets/${stadium.id}.jpg" alt="${escape(stadium.name)}的历史影像" loading="lazy"><figcaption>${escape(stadium.en)}<span>主场影像 · 历史视角</span></figcaption></figure>
  </header>
  <nav class="story-chapter-nav" aria-label="球队与主场故事章节"><span class="story-nav-label">这份热爱，从这里读起</span><div>${story.chapters.map((chapter,i)=>`<button data-story-target="story-chapter-${i}"${i===0?' aria-current="location"':''}><span>${number(i+1)}</span>${escape(chapter.label)}</button>`).join('')}</div><span class="story-nav-position" aria-hidden="true"><b>01</b> / ${number(story.chapters.length)}</span><span class="story-reading-line" aria-hidden="true"></span></nav>
  <div class="story-reading-layout">
   <article class="story-article" aria-label="${escape(stadium.club)}与${escape(stadium.name)}的故事">${story.chapters.map((chapter,i)=>`<section class="story-chapter" id="story-chapter-${i}" data-story-chapter="${i}" aria-labelledby="story-heading-${i}"><div class="story-chapter-label"><span>${number(i+1)}</span><p>${escape(chapter.label)}</p></div><h4 id="story-heading-${i}" tabindex="-1">${escape(chapter.title)}</h4>${chapter.paragraphs.map(p=>`<p>${escape(p)}</p>`).join('')}<div class="story-chapter-citations">故事出处 ${chapter.sources.map(index=>`<a href="${escape(story.sources[index].url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(story.sources[index].label)}，在新标签页查看">[${index+1}] ${escape(story.sources[index].label.split(' · ')[0])} ↗</a>`).join('')}</div></section>`).join('')}<p class="story-endnote"><i></i> 还有很多故事，等你从这里开始。</p><button class="story-back-model" data-story-target="detail-title">回到球场展台 ↑</button></article>
   <aside class="story-sidebar"><section class="story-timeline" aria-labelledby="story-timeline-title"><p class="story-kicker">FOUR MOMENTS</p><h4 id="story-timeline-title">把时间留在这里。</h4><ol>${story.timeline.map(item=>`<li><span>${escape(item.year)}</span><p>${escape(item.event)}</p></li>`).join('')}</ol></section>${archive}</aside>
  </div>
  <details class="story-source-list"><summary>这篇故事的资料来源 <span>${number(story.sources.length)} 份一手资料 <b>＋</b></span></summary><p>依据俱乐部、球场与赛事机构的历史资料整理，以中文重新叙述。模型与照片所呈现的时期，请参见主场档案。</p><ol>${story.sources.map(source=>`<li><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.label)} <span>↗</span></a></li>`).join('')}</ol></details>
 </section>`;
}

export class StoryReader{
 constructor(dialog){this.dialog=dialog;this.onScroll=()=>{if(!this.frame)this.frame=requestAnimationFrame(()=>{this.frame=0;this.update();});};}
 mount(){this.destroy();this.book=this.dialog.querySelector('.club-storybook');this.nav=this.book.querySelector('.story-chapter-nav');this.chapters=[...this.book.querySelectorAll('[data-story-chapter]')];this.buttons=[...this.nav.querySelectorAll('[data-story-target]')];this.dialog.addEventListener('scroll',this.onScroll,{passive:true});this.update();}
 update(){if(!this.book?.isConnected||!this.dialog.open)return;const dialogBox=this.dialog.getBoundingClientRect(),line=Math.max(dialogBox.top+this.nav.offsetHeight+32,this.nav.getBoundingClientRect().bottom+32);let active=0;for(let i=0;i<this.chapters.length;i++){if(this.chapters[i].getBoundingClientRect().top<=line)active=i;}for(let i=0;i<this.buttons.length;i++){if(i===active)this.buttons[i].setAttribute('aria-current','location');else this.buttons[i].removeAttribute('aria-current');}this.nav.querySelector('.story-nav-position b').textContent=number(active+1);const first=this.chapters[0].getBoundingClientRect().top,last=this.chapters.at(-1).getBoundingClientRect().bottom,progress=Math.max(0,Math.min(1,(line-first)/Math.max(1,last-first)));this.nav.style.setProperty('--story-progress',progress);}
 jump(id){const target=this.dialog.querySelector('#'+id);if(!target)return;const heading=target.matches('h2,h3,h4')?target:target.querySelector('h3,h4');const isChapter=target.hasAttribute('data-story-chapter');const top=target.getBoundingClientRect().top-this.dialog.getBoundingClientRect().top+this.dialog.scrollTop-(isChapter?this.nav.offsetHeight+22:18);heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});this.dialog.scrollTo({top:Math.max(0,top),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 destroy(){this.dialog.removeEventListener('scroll',this.onScroll);cancelAnimationFrame(this.frame);this.frame=0;this.book=null;}
}
