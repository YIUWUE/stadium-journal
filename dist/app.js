import { stadiums, stories } from './data.js';

const $ = selector => document.querySelector(selector);
const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.7 4.8a5.6 5.6 0 0 0-7.9 0l-.8.8-.8-.8a5.6 5.6 0 0 0-7.9 7.9L12 21l8.7-8.3a5.6 5.6 0 0 0 0-7.9Z"/></svg>';
const pin = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 6c0 4-5 8-5 8S3 10 3 6a5 5 0 0 1 10 0Z"/><circle cx="8" cy="6" r="1.6"/></svg>';
const key = 'beyond-the-stands:favorites:v1';
let saved = new Set();
try { const value = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(value)) saved = new Set(value.filter(id => stadiums.some(s => s.id === id))); } catch { /* Storage can be disabled by the browser. */ }
let league = 'all', query = '', onlySaved = false, limit = 6, currentId = null, toastTimer;
let credits = {};

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2400);
}

function toggleSaved(id) {
  const wasSaved = saved.has(id);
  wasSaved ? saved.delete(id) : saved.add(id);
  try { localStorage.setItem(key, JSON.stringify([...saved])); } catch { toast('已更新本次收藏；浏览器暂不支持保存到本机。'); render(); syncDetailSave(); return; }
  toast(wasSaved ? '已从收藏中移除' : '已加入收藏，下次再来仍能找到');
  render();
  syncDetailSave();
}

function syncDetailSave() {
  const button = $('#detail-save');
  if (!button || !currentId) return;
  button.classList.toggle('saved', saved.has(currentId));
  button.setAttribute('aria-pressed', String(saved.has(currentId)));
  button.textContent = saved.has(currentId) ? '♥ 已收藏' : '♡ 收藏球场';
}

function card(s, index) {
  return `<article class="stadium-card" style="--club-color:${s.color}">
    <div class="card-picture"><button class="card-open" data-open="${s.id}" aria-label="探索${s.name}"><img src="assets/${s.id}.jpg" alt="${s.name}实景历史影像" width="720" height="474" loading="lazy"></button><span class="league-tag">${s.league} · ${s.tag}</span><button class="save-button ${saved.has(s.id) ? 'saved' : ''}" data-save="${s.id}" aria-label="${saved.has(s.id) ? '取消收藏' : '收藏'}${s.name}" aria-pressed="${saved.has(s.id)}">${heart}</button><span class="photo-index">${String(index + 1).padStart(2,'0')} / ${String(stadiums.length).padStart(2,'0')}</span></div>
    <div class="card-info"><p class="card-location">${pin}${s.country} · ${s.city}</p><div class="card-title-row"><h3><button class="card-title" data-open="${s.id}">${s.name}</button></h3><button class="card-arrow" data-open="${s.id}" aria-label="阅读${s.name}详情">↗</button></div><p class="card-en">${s.en}</p><p class="card-description">${s.description}</p><div class="card-footer"><span><i class="club-dot"></i>${s.club}</span><span class="card-year">EST. ${s.year}</span></div></div></article>`;
}

function render() {
  const q = query.trim().toLocaleLowerCase();
  const filtered = stadiums.filter(s => (league === 'all' || s.league === league) && (!onlySaved || saved.has(s.id)) && (!q || [s.name,s.en,s.club,s.clubEn,s.city,s.country,s.league].join(' ').toLocaleLowerCase().includes(q)));
  $('#stadium-grid').innerHTML = filtered.slice(0,limit).map(s => card(s, stadiums.indexOf(s))).join('');
  $('#results-count').textContent = onlySaved ? `你的收藏 · ${filtered.length} 座球场` : `共 ${filtered.length} 座球场，等待你的到访`;
  $('#saved-count').textContent = saved.size;
  $('#empty-state').hidden = filtered.length !== 0;
  $('#empty-state h3').textContent = onlySaved && !saved.size ? '把喜欢的主场，留在这里' : '暂时没有找到这座主场';
  $('#empty-state p').textContent = onlySaved && !saved.size ? '点击球场图片右上角的爱心，建立你的主场清单。' : '换个关键词，或去其他联赛看看。';
  $('#load-more-wrap').hidden = filtered.length <= limit;
  $('#load-more-wrap>span').textContent = `还有 ${Math.max(0,filtered.length-limit)} 座主场，等你发现`;
  $('#saved-toggle').setAttribute('aria-pressed', String(onlySaved));
  $('#saved-toggle .heart-icon').textContent = onlySaved ? '♥' : '♡';
  document.querySelectorAll('[data-league]').forEach(button => {
    const active = button.dataset.league === league;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function resetFilters() {
  league = 'all'; query = ''; onlySaved = false; limit = 6;
  $('#search').value = '';
  render();
}

function openStadium(id) {
  const s = stadiums.find(item => item.id === id);
  if (!s) return;
  currentId = id;
  $('#dialog-content').innerHTML = `<div class="detail-hero"><img src="assets/${s.id}.jpg" alt="${s.name}历史实景" width="1440" height="700"></div><div class="detail-body"><p class="eyebrow red">${s.league} / ${s.highlight}</p><div class="detail-heading"><div><h2 id="detail-title">${s.name}</h2><p class="detail-en">${s.en}</p></div><button class="detail-save" id="detail-save" data-save="${s.id}"></button></div><dl class="detail-facts"><div><dt>所在城市</dt><dd>${s.country} · ${s.city}</dd></div><div><dt>代表俱乐部</dt><dd>${s.club}</dd></div><div><dt>${s.id==='paris' ? '现有场馆启用' : '球场启用'}</dt><dd>${s.year} 年</dd></div></dl><div class="detail-story">${s.story.map(p=>`<p>${p}</p>`).join('')}</div><blockquote class="detail-quote">${s.quote}</blockquote><div class="detail-note">影像与资料说明：${s.note}</div><div class="detail-links"><a href="${s.source}" target="_blank" rel="noopener noreferrer">${s.sourceLabel} ↗</a>${credits[id] ? `<a href="${credits[id].source}" target="_blank" rel="noopener noreferrer">图片来源与许可 ↗</a>` : ''}</div></div>`;
  syncDetailSave();
  const dialog = $('#stadium-dialog');
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  $('#close-dialog').focus({preventScroll:true});
}

document.addEventListener('click', event => {
  const open = event.target.closest('[data-open]');
  if (open) openStadium(open.dataset.open);
  const save = event.target.closest('[data-save]');
  if (save) toggleSaved(save.dataset.save);
  const filter = event.target.closest('[data-league]');
  if (filter) { league = filter.dataset.league; limit = 6; render(); }
});
$('#search').addEventListener('input', event => { query = event.target.value; limit = 6; render(); });
$('#load-more').addEventListener('click', () => { limit = stadiums.length; render(); });
$('#reset-filters').addEventListener('click', resetFilters);
$('#saved-toggle').addEventListener('click', () => { onlySaved = !onlySaved; limit = stadiums.length; render(); });
$('#nav-saved').addEventListener('click', () => { league = 'all'; query = ''; $('#search').value = ''; onlySaved = true; limit = stadiums.length; render(); $('#explore').scrollIntoView(); });
$('.nav-explore').addEventListener('click', () => { if (onlySaved) resetFilters(); });
$('#random-stadium').addEventListener('click', () => openStadium(stadiums[Math.floor(Math.random() * stadiums.length)].id));
$('#close-dialog').addEventListener('click', () => $('#stadium-dialog').close());
$('#close-credits').addEventListener('click', () => $('#credits-dialog').close());
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
}));

document.querySelectorAll('[data-story]').forEach(button => button.addEventListener('click', () => {
  const story = stories[Number(button.dataset.story)];
  $('#story-img').src = `assets/${story.id}.jpg`;
  $('#story-img').alt = stadiums.find(s=>s.id===story.id).name + '历史实景';
  $('#story-image-label').textContent = story.location;
  $('#story-kicker').textContent = story.kicker;
  $('#story-title').innerHTML = story.title;
  $('#story-description').textContent = story.description;
  $('#story-read').innerHTML = `${story.link} <span>↗</span>`;
  $('#story-read').dataset.open = story.id;
  document.querySelectorAll('[data-story]').forEach(tab => { tab.classList.toggle('active', tab === button); tab.setAttribute('aria-pressed', String(tab === button)); });
}));

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function renderCredits() {
  $('#credits-list').innerHTML = stadiums.map(s => {
    const c = credits[s.id];
    if (!c) return `<article class="credit-item"><h3>${s.name}</h3><p>图片致谢暂时无法加载，请稍后重试。</p><a href="${s.source}" target="_blank" rel="noopener noreferrer">官方资料 ↗</a></article>`;
    return `<article class="credit-item"><h3>${s.name}</h3><p>摄影：${escapeHtml(c.author)} · ${escapeHtml(c.license)}</p><p>${escapeHtml(c.title)}</p><div class="credit-links"><a href="${escapeHtml(c.source)}" target="_blank" rel="noopener noreferrer">原始图片 ↗</a>${c.licenseUrl ? `<a href="${escapeHtml(c.licenseUrl)}" target="_blank" rel="noopener noreferrer">许可条款 ↗</a>`:''}<a href="${s.source}" target="_blank" rel="noopener noreferrer">官方资料 ↗</a></div></article>`;
  }).join('');
}
$('#credits-button').addEventListener('click', () => { renderCredits(); $('#credits-dialog').showModal(); });
fetch('./assets/credits.json').then(response => { if (!response.ok) throw new Error('Credits unavailable'); return response.json(); }).then(data => { credits = data; if ($('#credits-dialog').open) renderCredits(); }).catch(() => {});
window.addEventListener('storage', event => { if (event.key !== key) return; try { const value = JSON.parse(event.newValue || '[]'); if (Array.isArray(value)) { saved = new Set(value.filter(id => stadiums.some(s => s.id === id))); render(); syncDetailSave(); } } catch {} });
render();
