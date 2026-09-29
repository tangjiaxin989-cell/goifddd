'use strict';

const items = {
  fist: '徒手',
  knife: '匕首',
  revolver: '左轮',
  sniper: '大狙',
  leather: '皮甲',
  vest: '防弹衣',
  heavy: '六级套',
  intel: '单人情报',
  equipment: '道具情报'
};

const people = [
  { id: 'doubao', name: '豆包', x: 670, y: 127, gear: { heavy: 2, vest: 2, leather: 1, knife: 1 } },
  { id: 'claude', name: 'Claude', x: 326, y: 206, gear: { intel: 4, equipment: 1, knife: 3, vest: 1 } },
  { id: 'kimi', name: 'Kimi', x: 135, y: 382, gear: { intel: 1, equipment: 1, sniper: 2, heavy: 1 } },
  { id: 'gpt', name: 'GPT', x: 326, y: 565, gear: { intel: 1, sniper: 1, revolver: 1, knife: 1, vest: 1, heavy: 1 } },
  { id: 'grok', name: 'Grok', x: 1014, y: 206, gear: { intel: 1, sniper: 2, revolver: 2, knife: 1 } },
  { id: 'qwen', name: '千问', x: 1205, y: 382, gear: { intel: 1, revolver: 3, knife: 2, vest: 1, leather: 1 } },
  { id: 'deepseek', name: 'DeepSeek', x: 1014, y: 565, gear: { equipment: 1, sniper: 1, revolver: 2, knife: 2, leather: 1 } },
  { id: 'gemini', name: 'Gemini', x: 670, y: 610, gear: { equipment: 1, leather: 1, vest: 1, sniper: 1, revolver: 1, knife: 2 } }
];

// Paths stop at card boundaries. Separate curves distinguish Grok's two actions.
const actions = [
  { from: 'claude', to: 'gpt', item: 'intel', kind: 'intel', path: 'M456 330 L456 550', bx: 456, by: 462, result: 'Claude 查看 GPT 单人情报' },
  { from: 'deepseek', to: 'gpt', item: 'sniper', kind: 'attack', path: 'M1014 591 Q800 488 586 591', bx: 744, by: 542, damage: { target: 'gpt', item: 'heavy' }, result: 'GPT 六级套被打掉 / 生命未减少' },
  { from: 'grok', to: 'gemini', item: 'intel', kind: 'intel', path: 'M1085 330 Q1020 458 821 598', bx: 972, by: 468, result: 'Grok 查看 Gemini 单人情报' },
  { from: 'grok', to: 'gemini', item: 'knife', kind: 'attack', path: 'M1160 330 Q1145 546 922 641', bx: 1059, by: 558, damage: { target: 'gemini', item: 'leather' }, result: 'Gemini 皮甲被打掉 / 生命未减少' }
];

const chatMessages = [
  { at: 1, name: '匿名01', text: '先查一眼，GPT有货。' },
  { at: 2, name: '匿名02', text: '架住了，给他一发大的。' },
  { at: 3, name: '匿名03', text: '知道他有甲？照查不误。' },
  { at: 4, name: '匿名04', text: '谁在我脸上？' }
];

let shown = 0;
let focus = -1;
let settlement = false;
const missing = new Set();
const portraitStorageKey = 'hunting-arena-custom-portraits-v1';
let customPortraits = {};
try {
  customPortraits = JSON.parse(localStorage.getItem(portraitStorageKey) || '{}') || {};
} catch {
  customPortraits = {};
}
const $ = id => document.getElementById(id);

function person(id) {
  return people.find(p => p.id === id);
}

function name(id) {
  return person(id).name;
}

function center(id) {
  const p = person(id);
  return { x: p.x + 130, y: p.y + 62 };
}

function asset(path, alt, cls) {
  const wrap = document.createElement('span');
  wrap.className = 'sprite ' + (cls === 'missing-portrait' ? 'portrait-sprite' : 'item-sprite');
  const im = document.createElement('img');
  im.src = path;
  im.alt = alt;
  const key = path.split('/').pop().split('.')[0];
  const b = assetBounds[key];
  if (b) {
    const box = cls === 'missing-portrait' ? [76, 88] : [44, 30];
    const scale = Math.min(box[0] / b[4], box[1] / b[5]);
    wrap.style.width = b[4] * scale + 'px';
    wrap.style.height = b[5] * scale + 'px';
    im.style.cssText = `position:absolute;width:${b[0] * scale}px;height:${b[1] * scale}px;max-width:none;left:${-b[2] * scale}px;top:${-b[3] * scale}px;object-fit:fill`;
  }
  im.addEventListener('error', () => {
    missing.add(path);
    const t = document.createElement('span');
    t.className = cls;
    t.textContent = cls === 'missing-portrait' ? '头像待接入' : alt;
    wrap.replaceWith(t);
    updateWarning();
  });
  wrap.append(im);
  return wrap;
}

function updateWarning() {
  $('asset-warning').textContent = missing.size ? '素材未齐：当前以文字标明缺失图片，不是最终视觉版本。请按 README 中的名称接入原始素材。' : '';
}

function usedBy(p, key) {
  return actions.slice(0, shown).filter(a => a.from === p.id && a.item === key).length;
}

function brokenOn(p, key) {
  return actions.slice(0, shown).filter(a => a.damage && a.damage.target === p.id && a.damage.item === key).length;
}

function isJustChanged(p, key) {
  if (focus < 0) return false;
  const a = actions[focus];
  return a.from === p.id && a.item === key || a.damage && a.damage.target === p.id && a.damage.item === key;
}

function renderCards() {
  $('cards').replaceChildren();
  people.forEach((p, i) => {
    const active = focus >= 0 && !settlement && (actions[focus].from === p.id || actions[focus].to === p.id);
    const card = document.createElement('article');
    card.className = 'card' + (focus >= 0 ? active ? ' active' : ' dim' : '');
    if (!settlement && focus >= 0 && actions[focus].to === p.id) {
      card.classList.add(actions[focus].kind === 'intel' ? 'scan' : 'hit');
    }
    card.style.left = p.x + 'px';
    card.style.top = p.y + 'px';
    card.setAttribute('aria-label', p.name + '，2 点生命');

    const portrait = document.createElement('div');
    portrait.className = 'portrait portrait-uploadable';
    if (customPortraits[p.id]) {
      const uploaded = document.createElement('img');
      uploaded.src = customPortraits[p.id];
      uploaded.alt = p.name;
      uploaded.className = 'uploaded-portrait';
      portrait.append(uploaded);
    } else {
      portrait.append(asset('assets/portraits/' + p.id + '.png', p.name, 'missing-portrait'));
    }
    portrait.title = '点击更换 ' + p.name + ' 头像';
    portrait.addEventListener('click', () => {
      $('portrait-upload').dataset.target = p.id;
      $('portrait-upload').value = '';
      $('portrait-upload').click();
    });

    const info = document.createElement('div');
    info.innerHTML = `<div class="name-row"><span class="name">${p.name}</span><span class="number">0${i + 1}</span></div><div class="hearts" aria-label="2 点生命"><i class="heart"></i><i class="heart"></i></div>`;

    const inv = document.createElement('div');
    inv.className = 'inventory';
    Object.entries(p.gear).forEach(([key, count]) => {
      const left = count - usedBy(p, key) - brokenOn(p, key);
      const el = document.createElement('span');
      el.className = 'item' + (left === 0 ? ' used' : '') + (isJustChanged(p, key) ? ' changed' : '');
      el.title = items[key] + '，剩余 ' + left;
      el.append(asset('assets/items/' + key + '.png', items[key], 'missing-item'), document.createTextNode('×' + left));
      inv.append(el);
    });
    info.append(inv);
    card.append(portrait, info);
    $('cards').append(card);
  });
}

function renderLines() {
  $('lines').replaceChildren();
  $('badges').replaceChildren();
  actions.forEach((a, i) => {
    if (i >= shown) return;
    const opacity = focus < 0 || focus === i ? 1 : .10;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', a.path);
    path.setAttribute('pathLength', '100');
    path.setAttribute('class', 'action-line' + (a.kind === 'intel' ? ' intel' : ''));
    if (!settlement && focus === i) path.classList.add('play');
    path.style.opacity = opacity;
    $('lines').append(path);

    const c = center(a.from);
    const badge = document.createElement('div');
    badge.className = 'badge' + (!settlement && focus === i ? ' play' : '');
    badge.style.cssText = `left:${a.bx}px;top:${a.by}px;opacity:${opacity};--from-x:${c.x - a.bx}px;--from-y:${c.y - a.by}px`;
    badge.append(asset('assets/items/' + a.item + '.png', items[a.item], 'missing-item'));
    const seq = document.createElement('span');
    seq.textContent = '0' + (i + 1);
    badge.append(seq);
    $('badges').append(badge);
  });
}

function renderSettlement() {
  $('settlement').replaceChildren();
  // CS 式右上事件流展示所有行动：情报调查和武器袭击都不能省略。
  const entries = actions.filter((a, i) => i < shown);
  $('settlement').className = entries.length ? 'settlement-panel show' : 'settlement-panel';

  entries.forEach((row, index) => {
    const line = document.createElement('div');
    line.className = 'settlement-row';
    line.dataset.item = row.item;
    line.dataset.kind = row.kind;
    line.style.setProperty('--row-index', index);
    const attacker = document.createElement('span');
    attacker.className = 'settlement-attacker';
    attacker.textContent = name(row.from);
    const target = document.createElement('strong');
    target.textContent = name(row.to);
    line.append(attacker, asset('assets/items/' + row.item + '.png', items[row.item], 'missing-item'), target);
    $('settlement').append(line);
  });
}

function renderChat() {
  const feed = $('chat-feed');
  feed.replaceChildren();
  const visible = chatMessages.filter(m => settlement || m.at <= shown);
  visible.forEach(message => {
    const line = document.createElement('div');
    line.className = 'chat-line';
    line.innerHTML = `<b>${message.name}</b><span>：${message.text}</span>`;
    feed.append(line);
  });
}

function render() {
  renderCards();
  renderLines();
  renderSettlement();
  renderChat();
  document.querySelectorAll('[data-action]').forEach((b, i) => b.setAttribute('aria-pressed', String(focus === i)));
  $('previous').disabled = shown === 0;
  $('next').disabled = settlement;
  $('settle').setAttribute('aria-pressed', String(settlement));
  $('mode-label').textContent = settlement ? '结算画面' : shown === 0 ? '等待行动' : '行动 0' + (focus + 1);
  $('step-caption').textContent = settlement ? '/ 结算画面' : shown === 0 ? '/ 等待行动' : '/ ' + name(actions[focus].from) + ' → ' + name(actions[focus].to);
  $('progress').textContent = (settlement ? 5 : shown) + ' / 5';
  $('result-banner').textContent = '';
  $('result-banner').classList.add('hide');
  $('stage').classList.toggle('settlement-mode', settlement);
}

function select(i) {
  shown = i + 1;
  focus = i;
  settlement = false;
  render();
}

function showSettlement() {
  shown = 4;
  focus = -1;
  settlement = true;
  render();
}

function next() {
  if (settlement) return;
  if (shown === 4) {
    showSettlement();
    return;
  }
  select(shown);
}

function previous() {
  if (settlement) {
    settlement = false;
    shown = 4;
    focus = 3;
  } else {
    shown = Math.max(0, shown - 1);
    focus = shown - 1;
  }
  render();
}

function reset() {
  shown = 0;
  focus = -1;
  settlement = false;
  render();
}

function recording() {
  document.body.classList.toggle('recording');
  resize();
}

function resize() {
  const box = document.querySelector('.viewport');
  $('stage').style.transform = 'scale(' + box.clientWidth / 1600 + ')';
}

actions.forEach((a, i) => {
  const b = document.createElement('button');
  b.dataset.action = i;
  b.setAttribute('aria-pressed', 'false');
  b.innerHTML = `<strong>0${i + 1} &nbsp; ${name(a.from)} → ${name(a.to)}</strong><small>${items[a.item]} · ${a.kind === 'intel' ? '情报调查' : '武器袭击'}</small>`;
  b.onclick = () => select(i);
  $('actions').append(b);
});

$('reset').onclick = reset;
$('next').onclick = next;
$('previous').onclick = previous;
$('settle').onclick = showSettlement;
$('record').onclick = recording;
$('fullscreen').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    $('asset-warning').textContent = '此浏览器不支持网页全屏，请使用浏览器的全屏功能。';
  }
};

$('portrait-upload').addEventListener('change', e => {
  const file = e.target.files && e.target.files[0];
  const target = e.target.dataset.target;
  if (!file || !target || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    customPortraits[target] = reader.result;
    try {
      localStorage.setItem(portraitStorageKey, JSON.stringify(customPortraits));
    } catch {
      $('asset-warning').textContent = '头像已更换，但浏览器无法保存本地头像。';
    }
    renderCards();
  };
  reader.readAsDataURL(file);
});

window.addEventListener('keydown', e => {
  if (e.altKey || e.ctrlKey || e.metaKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (['ArrowRight', 'ArrowLeft', ' ', '0', '1', '2', '3', '4', '5', 'h', 'H', 'f', 'F', 'Escape'].includes(e.key)) {
    if (e.key === ' ' && e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    if (e.key === '0') reset();
    else if (/^[1-4]$/.test(e.key)) select(Number(e.key) - 1);
    else if (e.key === '5') showSettlement();
    else if (e.key === 'ArrowRight' || e.key === ' ') next();
    else if (e.key === 'ArrowLeft') previous();
    else if (e.key.toLowerCase() === 'h') recording();
    else if (e.key.toLowerCase() === 'f') $('fullscreen').click();
    else if (e.key === 'Escape') {
      document.body.classList.remove('recording');
      resize();
    }
  }
});

new ResizeObserver(resize).observe(document.querySelector('.viewport'));
render();
resize();
