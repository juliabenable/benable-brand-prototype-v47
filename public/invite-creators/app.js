const api = mockApi;
const $ = id => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const first = name => name.split(' ')[0];
const STACK = 4;   // avatars shown before the "+N" bubble

// ---------- Creator card + its Not a Fit row ----------
const cardHtml = c => `
  <div class="c-main">
    <div class="c-top">
      <div class="c-who">
        <div class="c-av"><span><img src="assets/${c.avatar}.jpg" alt=""></span></div>
        <div class="c-id">
          <div class="c-line">
            <span class="c-name">${c.name}<img src="assets/card-verified-16.svg" alt="" width="16" height="16"></span>
            <span class="c-handle">${c.handle}</span>
            ${c.source === 'new' ? '<span class="c-new">New</span>' : ''}
          </div>
          <p class="c-bio">${c.bio}</p>
        </div>
      </div>
      <div class="c-social">
        <img src="assets/card-instagram-24.svg" alt="Instagram" width="24" height="24">
        <img src="assets/card-tiktok-24.svg" alt="TikTok" width="24" height="24">
      </div>
    </div>
    ${c.source === 'approved' ? `<div class="c-history"><span class="c-tag">Previously approved</span><p>${c.history}</p></div>` : ''}
    <div class="c-fit">
      <p class="c-fit-head"><img src="assets/card-sparkle-16.svg" alt="" width="16" height="16">Why they fit</p>
      <ul>${c.fits.map(f => `<li><img src="assets/card-bullet-16.svg" alt="" width="16" height="16">${f}</li>`).join('')}</ul>
    </div>
    <div class="c-stats">
      <div class="c-col c-soc">
        <p class="c-label">Social Stats</p>
        <div class="c-box">
          <div class="c-stat c-fol"><small>Followers</small><b>${c.followers}</b></div>
          <div class="c-stat c-eng">
            <small>Engagement <img src="assets/card-info-12.svg" alt="" width="12" height="12"></small>
            <b><span class="c-ig12"><img src="assets/card-instagram-12.svg" alt="" width="13" height="13"></span>${c.engagement}</b>
          </div>
        </div>
      </div>
      <div class="c-col c-aud">
        <p class="c-label">Audience</p>
        <div class="c-box">
          <div class="c-stat c-loc"><small>Location</small><b>${c.location}</b></div>
          <div class="c-stat mid c-age"><small>Age Range</small><b>${c.age}</b></div>
          <div class="c-stat mid c-gender"><small>Gender</small><b>${c.gender}</b></div>
        </div>
      </div>
    </div>
    <div class="c-recent">
      <p class="c-label">Recent content</p>
      <div class="c-thumbs">${c.content.map(img => `<span><img src="assets/${img}.jpg" alt=""></span>`).join('')}</div>
    </div>
  </div>
  <div class="c-foot">
    <button class="c-btn" data-act="notfit">Not a Fit</button>
    <button class="c-btn${c.priority ? ' prio-on' : ''}" data-act="prio" aria-pressed="${c.priority}">
      <img class="off" src="assets/prioritize-16.svg" alt="" width="16" height="16">
      <img class="on" src="assets/prioritize-16-purple.svg" alt="" width="16" height="16">
      <span class="off">Prioritize</span><span class="on">Prioritized</span>
      <span class="tip" role="tooltip">Prioritized creators get their invite first.</span>
    </button>
  </div>`;

const rowHtml = c => `
  <div class="r-who">
    <div class="r-av"><span><img src="assets/${c.avatar}.jpg" alt=""></span></div>
    <p class="r-text"><span class="r-name">${c.name}</span><span class="r-tag">Not a Fit</span><span class="r-chip">Not a Fit</span>${
      c.feedback ? '<span class="r-sent">Feedback sent</span>' : '<button class="r-why" data-act="why">Tell us why?</button>'}</p>
  </div>
  <button class="r-undo" data-act="undo">Undo</button>`;

const itemHtml = (c, i) => `<div class="nc ${c.notFit ? 'row' : 'card'}${c.source === 'approved' ? ' ap' : ''}" data-id="${c.id}" style="--i:${Math.min(i, REVEAL_CAP)}">${c.notFit ? rowHtml(c) : cardHtml(c)}</div>`;

// Swap a card and its row in place as one morph: the avatar and name are the same person in both,
// so they glide and resize from where they were to where they land (40px avatar to 28px, the name
// shrinking into the small grey one). Everything else dissolves: the old parts fade out where they
// are, the new ones fade in, while the slot eases to its new height. Undo plays it in reverse.
const SWAP_MS = 480;   // keep in step with .nc.anim in styles.css
const SWAP_EASE = 'cubic-bezier(.4, 0, .2, 1)';
const AV = '.c-av, .r-av', NAME = '.c-name, .r-name';
// The parts that only exist on one side: they dissolve in rather than move
const ADDED = '.c-main > :not(.c-top), .c-foot, .c-social, .c-bio, .c-handle, .c-new, .c-name img, .r-tag, .r-chip, .r-why, .r-sent, .r-undo';

// The name's text box (the card's name also holds the verified badge)
function textRect(el) {
  const r = document.createRange();
  r.selectNodeContents(el.firstChild || el);
  return r.getBoundingClientRect();
}

// FLIP: put `el` back where `from` was, then let it travel home. `scale` sizes it from its top-left.
function morphFrom(el, from, to, scale, extra = {}) {
  const dx = from.left - (to.left + (to.ox || 0) * scale), dy = from.top - (to.top + (to.oy || 0) * scale);
  el.style.transformOrigin = '0 0';
  el.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${scale})`, ...extra.from },
              { transform: 'none', ...extra.to }], { duration: SWAP_MS, easing: SWAP_EASE });
}

function finishSwap(el) {
  clearTimeout(el._t);
  el.querySelectorAll(':scope > .nc-old').forEach(n => n.remove());
  el.getAnimations({ subtree: true }).forEach(a => a.cancel());
  el.style.height = '';
  el.classList.remove('anim', 'morph');
}

function setItem(el, c) {
  finishSwap(el);
  const swap = () => {
    el.innerHTML = c.notFit ? rowHtml(c) : cardHtml(c);
    el.classList.toggle('row', c.notFit);
    el.classList.toggle('card', !c.notFit);
  };
  if (reduceMotion || !el.offsetParent) { swap(); keepInView(el); return; }   // hidden versions just take the new state

  // Before: where the avatar and name are now
  const from = el.offsetHeight;
  const oAv = el.querySelector(AV), oName = el.querySelector(NAME);
  const avFrom = oAv.getBoundingClientRect(), nameFrom = textRect(oName);
  const nameStyle = getComputedStyle(oName), fromSize = parseFloat(nameStyle.fontSize), fromColor = nameStyle.color;

  // The old content stays as a layer that dissolves; its avatar and name hand over to the new ones
  const old = document.createElement('div');
  old.className = 'nc-old';
  old.style.height = from + 'px';
  old.append(...el.childNodes);
  old.querySelectorAll(AV + ', ' + NAME).forEach(n => { n.style.visibility = 'hidden'; });
  swap();
  const nAv = el.querySelector(AV), nName = el.querySelector(NAME);   // the new ones, before the old layer goes back in
  el.prepend(old);

  // After: lay the new content out at its final height, then pin the slot back to where it started
  el.style.height = '';
  const to = el.offsetHeight;
  el.style.setProperty('--mid', to / 2 + 'px');   // the row content sits at its final spot while the slot shrinks
  el.classList.add('morph');
  el.style.height = from + 'px';
  keepInView(el);

  const avTo = nAv.getBoundingClientRect();
  const elTo = nName.getBoundingClientRect(), txtTo = textRect(nName);
  const toStyle = getComputedStyle(nName);
  morphFrom(nAv, avFrom, avTo, avFrom.width / avTo.width);
  morphFrom(nName, nameFrom, { left: elTo.left, top: elTo.top, ox: txtTo.left - elTo.left, oy: txtTo.top - elTo.top },
    fromSize / parseFloat(toStyle.fontSize), { from: { color: fromColor }, to: { color: toStyle.color } });

  old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
  el.querySelectorAll(ADDED).forEach(n => n.closest('.nc-old') || n.animate([{ opacity: 0 }, { opacity: 1 }],
    { duration: 260, delay: 180, easing: 'ease-out', fill: 'backwards' }));

  void el.offsetHeight;   // commit the start height before animating
  el.classList.add('anim');
  el.style.height = to + 'px';
  el._t = setTimeout(() => finishSwap(el), SWAP_MS + 80);
}

// A card collapsing from deep inside it would leave its row above the fold (or under the sticky heading):
// scroll so the row lands just below the heading, alongside the height animation
function keepInView(el) {
  const body = el.closest('.m-body');
  if (!body || !el.offsetParent) return;   // hidden version: nothing to keep in view
  const head = el.closest('.group')?.querySelector('.g-head');
  const floor = body.getBoundingClientRect().top + (head ? head.offsetHeight : 0) + 8;
  const top = el.getBoundingClientRect().top;
  if (top >= floor) return;
  const from = body.scrollTop, to = Math.max(0, from - (floor - top));
  if (reduceMotion) { body.scrollTop = to; return; }
  // Tweened by hand: a native smooth scroll gets cancelled when the content shrinks under it
  cancelAnimationFrame(body._keep);
  clearTimeout(body._keepT);
  const t0 = performance.now(), dur = SWAP_MS;   // moves with the collapse, same length and easing
  const step = now => {
    const p = Math.min(1, (now - t0) / dur), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    body.scrollTop = from + (to - from) * e;
    if (p < 1) body._keep = requestAnimationFrame(step);
  };
  body._keep = requestAnimationFrame(step);
  body._keepT = setTimeout(() => { cancelAnimationFrame(body._keep); body.scrollTop = to; }, dur + 80);   // frames can stall
}

// ---------- Opening animations ----------
const LOAD_MS = 500;      // first open: skeletons stand in this long
const REVEAL_CAP = 5;     // cards past this one share the last delay (they're below the fold anyway)
const REVEAL_MS = 1400;   // long enough for the last card's parts to settle

const b = (w, h, r = 6, extra = '') => `<b class="sk-b" style="width:${w};height:${h}px;border-radius:${r}px;${extra}"></b>`;
const skeletonHtml = approved => `
  <div class="nc card sk${approved ? ' ap' : ''}" aria-hidden="true">
    <div class="c-main">
      <div class="sk-row">
        ${b('40px', 40, 100)}
        <div class="sk-col">${b('180px', 14)}${b(approved ? '320px' : '260px', 10)}${approved ? '' : b('200px', 10)}</div>
        <div class="sk-row" style="margin-left:auto; gap:8px">${b('24px', 24, 100)}${b('24px', 24, 100)}</div>
      </div>
      ${approved ? `<div class="sk-row">${b('141px', 25, 100)}${b('300px', 10)}</div>` : ''}
      <div class="sk-col" style="gap:${approved ? 12 : 10}px">${b('90px', 12)}${b('440px', 10)}${b('410px', 10)}${b('380px', 10)}</div>
      <div class="sk-row" style="gap:${approved ? 20 : 16}px">${b('240px', 52, 12)}${b('auto', 52, 12, 'flex:1')}</div>
      <div class="sk-col" style="gap:12px">${b('90px', 12)}
        <div class="sk-row" style="gap:12px">${Array.from({ length: 7 }, () => b('auto', approved ? 108 : 86, 8, 'flex:1')).join('')}</div>
      </div>
    </div>
    <div class="c-foot"><span class="sk-row" style="gap:32px; padding-right:16px">${b('64px', 14)}${b('84px', 14)}</span></div>
  </div>`;

// Replays the staggered entrance: cards rise one after another, then each card's parts settle in order
function reveal(panel) {
  clearTimeout(panel._reveal);
  panel.classList.remove('reveal');
  void panel.offsetWidth;   // restart the animations
  panel.classList.add('reveal');
  panel._reveal = setTimeout(() => panel.classList.remove('reveal'), REVEAL_MS);
}

function openGroup(group, open) {
  const panel = group.querySelector('.g-panel');
  group.classList.toggle('open', open);
  group.querySelector('.g-bar').setAttribute('aria-expanded', open);
  clearTimeout(panel._load);
  if (!open) { panel.classList.remove('loading', 'reveal'); return; }
  if (group.dataset.loaded || reduceMotion) { group.dataset.loaded = 1; reveal(panel); return; }
  // First open: show skeletons briefly, as if the profiles were loading
  panel.classList.add('loading');
  panel._load = setTimeout(() => {
    group.dataset.loaded = 1;
    panel.classList.remove('loading');
    reveal(panel);
  }, LOAD_MS);
}

// ---------- Groups ----------
const groupHtml = g => {
  const n = g.creators.length;
  const shown = g.creators.slice(0, STACK);
  return `
  <section class="group" data-id="${g.id}">
    <div class="g-head">
      <div class="g-text">
        <p class="g-title">${g.title} <span class="dot">· </span><span class="num">${n}</span></p>
        <p class="g-sub">${g.sub}</p>
      </div>
      <button class="g-hide">${g.hide}<img src="assets/chevron-up-12.svg" alt="" width="12" height="12"></button>
    </div>
    <div class="g-box">
      <button class="g-bar" aria-expanded="false">
        <span class="g-summary">
          <span class="g-stack">
            ${shown.map(c => `<span class="g-av"><img src="assets/${c.avatar}.jpg" alt=""></span>`).join('')}
            ${n > STACK ? `<span class="g-more"><span>+${n - STACK}</span></span>` : ''}
          </span>
          <span class="g-names"><b>${first(g.creators[0].name)}, ${first(g.creators[1].name)} </b>and ${n - 2} others</span>
        </span>
        <span class="g-chev">
          <img class="down" src="assets/chevron-down-16.svg" alt="" width="16" height="16">
          <img class="up" src="assets/chevron-up-16.svg" alt="" width="16" height="16">
        </span>
      </button>
      <div class="g-panel">${[0, 1, 2].map(() => skeletonHtml(g.id === 'approved')).join('')}${g.creators.map(itemHtml).join('')}</div>
    </div>
  </section>`;
};

const MIN_APPROVED = 50;   // about half accept, so 50 approved fills the 25 spots
const renderCount = () => {
  const n = api.approvedCount();
  document.querySelectorAll('.js-approve').forEach(el => { el.textContent = n; });
  document.querySelectorAll('.m-foot').forEach(f => f.classList.toggle('warn', n < MIN_APPROVED));
};

// V1 and V2 render the same groups; each popup keeps its own open/loaded state
const groups = api.groups().map(g => ({ ...g, hide: g.id === 'approved' ? 'Hide previously approved' : 'Hide new creators' }));
document.querySelectorAll('.modal:not(.v3) .groups').forEach(el => { el.innerHTML = groups.map(groupHtml).join(''); });
document.querySelectorAll('.js-total').forEach(el => { el.textContent = groups.reduce((n, g) => n + g.creators.length, 0); });
renderCount();

document.querySelectorAll('.groups').forEach(list => list.addEventListener('click', e => {
  const toggle = e.target.closest('.g-bar, .g-hide');
  if (toggle) {
    const group = toggle.closest('.group');
    openGroup(group, !group.classList.contains('open'));
    return;
  }
  const btn = e.target.closest('[data-act]');
  const item = btn && btn.closest('.nc');
  if (!item) return;
  const id = item.dataset.id;
  const act = btn.dataset.act;
  // A creator's state is shared, so every version shows the same choice
  const copies = document.querySelectorAll(`.nc[data-id="${id}"]`);
  if (act === 'prio') {
    const on = !btn.classList.contains('prio-on');
    api.setPriority(id, on);
    copies.forEach(el => {
      const b = el.querySelector('[data-act=prio]');
      if (!b) return;
      b.classList.toggle('prio-on', on);
      b.setAttribute('aria-pressed', on);
    });
  } else if (act === 'notfit') {
    // V1 can skip the popup: the card collapses right away and "Tell us why?" asks later
    if (item.closest('.modal.v1') && notFitMode === 'inline') setNotFit(id, true);
    else openFit(id);   // ask why first (optional), then collapse
  } else if (act === 'why') {
    openFit(id, true);   // already Not a fit: the popup only collects the reason
  } else {
    setNotFit(id, false);
  }
}));

// Applies a Not a fit (or its Undo) everywhere the creator is shown
function setNotFit(id, on) {
  api.setNotFit(id, on);
  document.querySelectorAll(`.nc[data-id="${id}"]`).forEach(el => setItem(el, api.get(id)));
  renderCount();
  decks.forEach(d => d.sync());
}

// White background + stroke only once a heading is actually pinned to the top
document.querySelectorAll('.modal').forEach(modal => {
  const body = modal.querySelector('.m-body');
  if (!body) return;
  const markStuck = () => {
    const top = body.getBoundingClientRect().top;
    modal.querySelectorAll('.group').forEach(g => {
      const head = g.querySelector('.g-head');
      const stuck = g.classList.contains('open') && body.scrollTop > 0 && Math.abs(head.getBoundingClientRect().top - top) < 1;
      head.classList.toggle('stuck', stuck);
    });
  };
  body.addEventListener('scroll', markStuck, { passive: true });
  body.addEventListener('click', () => setTimeout(markStuck));
});

// ---------- V3: deck expand ----------
// Each group is a deck: the bar is the top card, the creator cards sit tucked under it and spread out on open.
// The bar's avatar pile slides out to the left as the label rolls in; each card keeps its own avatar.
const EASE = 'cubic-bezier(.32, .72, 0, 1)';
const deckHtml = g => {
  const n = g.creators.length;
  return `
  <section class="group" data-id="${g.id}">
    <div class="g-head">
      <div class="g-text">
        <p class="g-title">${g.title} <span class="dot">· </span><span class="num">${n}</span></p>
        <p class="g-sub">${g.sub}</p>
      </div>
      <button class="g-collapse" tabindex="-1">Collapse<img src="assets/chevron-up-16.svg" alt="" width="16" height="16"></button>
    </div>
    <div class="deck">
      <button class="known" aria-expanded="false">
        <span class="g-summary">
          <span class="g-stack kn-stack">
            ${g.creators.slice(0, STACK).map(c => `<span class="g-av"><img src="assets/${c.avatar}.jpg" alt=""></span>`).join('')}
            <span class="g-more"><span></span></span>
          </span>
          <span class="kn-text"><span class="l l-closed"></span><span class="l l-open"></span></span>
        </span>
        <span class="g-chev"><img src="assets/chevron-down-16.svg" alt="" width="16" height="16"></span>
      </button>
      <div class="clip"><div class="list">${g.creators.map(itemHtml).join('')}</div></div>
    </div>
  </section>`;
};

// V3 and V4 share this deck; V4 is the same thing with the stacked card edges turned off
document.querySelectorAll('.modal.v3 .groups').forEach(el => { el.innerHTML = groups.map(deckHtml).join(''); });

function makeDeck(sec, g, v3Body, stack) {
  const deck = sec.querySelector('.deck'), bar = deck.querySelector('.known');
  const clip = deck.querySelector('.clip'), list = deck.querySelector('.list');
  const head = sec.querySelector('.g-head'), collapseBtn = sec.querySelector('.g-collapse');
  const D = { open: false, busy: false };
  const items = () => [...list.children];
  // The clip's top edge sits INSET px below the bar's top: still hidden behind the bar, but it can't
  // bleed through the bar's half-pixel edge. Every measure below is from the clip's top.
  const INSET = 2;
  const barH = () => bar.offsetHeight - INSET;
  const closedH = () => barH() + (stack ? 16 : 0);   // +16 leaves room for the two peeking card edges
  // Extra clip room so card shadows (0 4px 24px) aren't sliced off; a matching negative margin keeps layout unchanged
  const SHADOW = 28;
  const clipClosed = () => closedH() + SHADOW;

  function labels() {
    const left = g.creators.filter(c => !api.get(c.id).notFit);
    const named = left.slice(0, 2).map(c => first(c.name));
    const rest = left.length - named.length;
    bar.querySelector('.l-closed').innerHTML = `<b>${named.join(', ')} </b>${rest > 0 ? `and ${rest} others` : ''}`;
    bar.querySelector('.l-open').innerHTML = `<b>Showing all ${left.length}</b> · Collapse`;
    bar.querySelector('.g-more span').textContent = '+' + Math.max(0, left.length - STACK);
    sec.querySelector('.num').textContent = left.length;
  }

  // The clip is pulled up behind the bar; the list is pushed down by the same amount plus the card gap
  function layout() {
    clip.style.marginTop = -barH() + 'px';
    clip.style.marginBottom = -SHADOW + 'px';
    list.style.paddingTop = barH() + 16 + 'px';
    list.style.paddingBottom = 12 + SHADOW + 'px';
  }

  // Closed rest pose: bottom-aligned just under the bar, the first two peeking out as stack edges.
  // Without the stack (V4) every card hides fully behind the bar.
  function pose(el, i) {
    const bottom = el.offsetTop + el.offsetHeight;
    if (!stack) return { transform: `translateY(${barH() - bottom}px) scale(.96)`, opacity: 0 };
    const edge = i === 0 ? 8 : 15, sc = i === 0 ? .965 : .93;
    return { transform: `translateY(${barH() + edge - bottom}px) scale(${sc})`, opacity: i < 2 ? 1 : 0 };
  }

  function restClosed() {
    layout();
    clip.style.height = clipClosed() + 'px';
    const all = items(), n = all.length;
    all.forEach((el, i) => {
      el.style.zIndex = n - i;
      if (i < 2) { const p = pose(el, i); el.style.transform = p.transform; el.style.opacity = p.opacity; }
      else { el.style.transform = ''; el.style.opacity = 0; }
    });
  }
  function restOpen() {
    layout();
    clip.style.height = 'auto';
    items().forEach((el, i, all) => { el.style.zIndex = all.length - i; el.style.transform = ''; el.style.opacity = ''; });
  }

  function checkBar() {
    const off = D.open && bar.getBoundingClientRect().bottom < head.getBoundingClientRect().bottom + 4;
    sec.classList.toggle('bar-off', off);
  }
  function setOpenClasses(o) {
    D.open = o;
    deck.classList.toggle('is-open', o);
    sec.classList.toggle('open', o);
    bar.setAttribute('aria-expanded', String(o));
    collapseBtn.tabIndex = o ? 0 : -1;
    checkBar();
  }
  v3Body.addEventListener('scroll', checkBar, { passive: true });

  async function open() {
    if (D.busy || D.open) return;
    D.busy = true;
    if (reduceMotion) {
      setOpenClasses(true); restOpen();
      await clip.animate([{ opacity: 0 }, { opacity: 1 }], 160).finished;
      D.busy = false; return;
    }
    const dur = 560, stag = 42;
    deck.style.setProperty('--d', dur + 'ms');
    const all = items();
    const from = all.map((el, i) => pose(el, i));
    const fullH = list.offsetHeight;
    // Only animate what can be seen; cards further down just sit in layout
    const visible = v3Body.getBoundingClientRect().bottom - clip.getBoundingClientRect().top + 40;
    const target = Math.min(fullH, Math.max(visible, clipClosed()));
    const moving = all.filter(el => el.offsetTop < target);
    all.forEach(el => { el.style.transform = ''; el.style.opacity = ''; });
    setOpenClasses(true);
    clip.style.height = target + 'px';
    const anims = [clip.animate([{ height: clipClosed() + 'px' }, { height: target + 'px' }],
      { duration: Math.min(dur + stag * (moving.length - 1), dur * 1.25), easing: EASE })];
    moving.forEach((el, i) => anims.push(el.animate([
      { transform: from[i].transform, opacity: from[i].opacity },
      { opacity: 1, offset: .3 },
      { transform: 'none', opacity: 1 }
    ], { duration: dur, delay: i * stag, easing: EASE, fill: 'backwards' })));
    await Promise.all(anims.map(a => a.finished));
    anims.forEach(a => a.cancel());
    restOpen();
    D.busy = false;
    checkBar();
  }

  async function close() {
    if (D.busy || !D.open) return;
    D.busy = true;
    if (reduceMotion) { setOpenClasses(false); restClosed(); D.busy = false; return; }
    const br0 = bar.getBoundingClientRect(), bb = v3Body.getBoundingClientRect();
    const headH = head.offsetHeight;
    const barAway = br0.top < bb.top + headH - 20 || br0.top > bb.bottom - 120;
    // V4: collapsing from deep in the list doesn't scroll back up. The cards fade out where they are,
    // the section snaps closed with its heading kept at the top, and the collapsed bar fades in.
    if (!stack && barAway) {
      await list.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-out', fill: 'forwards' }).finished;
      deck.style.setProperty('--d', '1ms');   // no bar morph while it's out of sight
      setOpenClasses(false);
      restClosed();
      list.getAnimations().forEach(a => a.cancel());
      v3Body.scrollTop += sec.getBoundingClientRect().top - v3Body.getBoundingClientRect().top;
      checkBar();
      await deck.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
        { duration: 260, easing: EASE }).finished;
      deck.style.setProperty('--d', '460ms');
      D.busy = false;
      return;
    }
    // Bring the bar back into view first, so the cards have somewhere to go
    if (barAway) {
      const top = v3Body.scrollTop + br0.top - bb.top - headH - 8;
      await new Promise(res => {
        let done = false;
        const fin = () => { if (!done) { done = true; res(); } };
        v3Body.addEventListener('scrollend', fin, { once: true });
        setTimeout(fin, 700);
        v3Body.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      });
    }
    const dur = 460, stag = 30;
    deck.style.setProperty('--d', dur + 'ms');
    const all = items();
    const cur = Math.min(list.offsetHeight, Math.max(clipClosed(), v3Body.getBoundingClientRect().bottom - clip.getBoundingClientRect().top + 40));
    const moving = all.filter(el => el.offsetTop < cur);
    const to = moving.map((el, i) => pose(el, i));
    const k = moving.length;
    clip.style.height = cur + 'px';
    setOpenClasses(false);
    const anims = [clip.animate([{ height: cur + 'px' }, { height: clipClosed() + 'px' }],
      { duration: dur + stag * Math.min(k - 1, 4), easing: EASE, fill: 'forwards' })];
    moving.forEach((el, i) => anims.push(el.animate([   // lowest card goes first
      { transform: 'none', opacity: 1 },
      { opacity: 1, offset: .75 },
      { transform: to[i].transform, opacity: to[i].opacity }
    ], { duration: dur, delay: (k - 1 - i) * stag, easing: EASE, fill: 'forwards' })));
    await Promise.all(anims.map(a => a.finished));
    anims.forEach(a => a.cancel());
    restClosed();
    D.busy = false;
  }

  bar.addEventListener('click', () => (D.open ? close() : open()));
  collapseBtn.addEventListener('click', close);

  labels();
  restClosed();
  let syncT;
  return {
    relayout() { if (!D.busy) (D.open ? restOpen() : restClosed()); },
    // A creator changed (here or in another version): refresh the labels, then re-pose once the row/card swap settles
    sync() { labels(); clearTimeout(syncT); syncT = setTimeout(() => this.relayout(), SWAP_MS + 120); },
  };
}

const decks = [];
document.querySelectorAll('.modal.v3').forEach(modal => {
  const body = modal.querySelector('.m-body');
  const stack = !modal.classList.contains('v4');
  const own = [...modal.querySelectorAll('.group')].map((sec, i) => makeDeck(sec, groups[i], body, stack));
  decks.push(...own);
  let relayoutT;
  new ResizeObserver(() => { clearTimeout(relayoutT); relayoutT = setTimeout(() => own.forEach(d => d.relayout()), 80); }).observe(body);
});
document.fonts && document.fonts.ready.then(() => decks.forEach(d => d.relayout()));

// ---------- Modal open / close (shows the selected version's popup) ----------
const overlay = $('overlay');
const modals = { v1: $('modal-v1'), v2: $('modal-v2'), v3: $('modal-v3'), v4: $('modal-v4') };
let version = 'v2';
let isOpen = true;
const setOpen = open => {
  isOpen = open;
  overlay.classList.toggle('hidden', !open);
  Object.entries(modals).forEach(([v, m]) => { m.hidden = !(open && v === version); });
  // Once invites are sent the popup stays on the success screen. It animates the first time only;
  // after that it reopens settled, and the dashboard shows the "approved" card.
  if (!open && document.querySelector('.modal.is-done')) {
    document.querySelectorAll('.modal.is-done').forEach(m => m.classList.add('done-seen'));
    $('sentBanner').hidden = false;
  }
};
document.querySelectorAll('.m-close').forEach(b => b.addEventListener('click', () => setOpen(false)));
overlay.addEventListener('click', () => setOpen(false));
$('openModal').addEventListener('click', () => setOpen(true));
document.querySelectorAll('.approve-btn').forEach(b => b.addEventListener('click', () => openSummary(b)));
// Done on the success screen closes the popup; View on the dashboard card reopens it on that screen
document.addEventListener('click', e => { if (e.target.closest('.m-done .done-btn')) setOpen(false); });
$('viewList').addEventListener('click', () => setOpen(true));
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (fitOpen()) closeFit();
  else if (summaryOpen()) closeSummary();
  else setOpen(false);
});

// ---------- Invite summary pop-up ("Ready to send N invites?") ----------
// Read-only: says who gets invited. Cancel keeps every selection.
const sum = $('sum');
const sumDlg = sum.querySelector('.sum-dlg');
let sumOpener = null;
let sumCloseT;
const summaryOpen = () => !sum.hidden;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const invites = n => plural(n, 'invite', 'invites');
const esc = t => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function summaryData() {
  const all = api.groups().flatMap(g => g.creators);
  const kept = all.filter(c => !c.notFit);
  const rest = kept.filter(c => !c.priority);
  return {
    prio: kept.filter(c => c.priority),   // prioritized and then removed counts only as Not a fit
    rest,
    nofit: all.filter(c => c.notFit),
  };
}

// "We'll invite **73 creators** to this campaign, including **16 previously approved** and **57 new**.
//  **2 prioritized creators** get the first chance to accept."
// When everyone left is in one group, name it instead: "We'll invite **56 new creators** to this campaign."
// The prioritized sentence only shows once they've prioritized someone.
function inviteLine(d) {
  const kept = [...d.prio, ...d.rest];
  const prev = kept.filter(c => c.source === 'approved').length;
  const fresh = kept.length - prev;
  const who = n => plural(n, 'creator', 'creators');
  const line = !prev || !fresh
    ? `We'll invite <b>${kept.length} ${prev ? 'previously approved' : 'new'} ${who(kept.length).replace(/^\d+ /, '')}</b> to this campaign.`
    : `We'll invite <b>${who(kept.length)}</b> to this campaign, including <b>${prev} previously approved</b> and <b>${fresh} new</b>.`;
  const p = d.prio.length;
  return p ? `${line} <b>${plural(p, 'prioritized creator', 'prioritized creators')}</b> ${p === 1 ? 'gets' : 'get'} the first chance to accept.` : line;
}

// Compact confirm (Figma 15372:8161): the sentence carries the breakdown, Send sits above Cancel
function summaryHtml(d, error) {
  const n = d.prio.length + d.rest.length;
  return `
  <div class="sum-view">
    <div class="sum-head">
      <span class="sum-icon" aria-hidden="true"><img src="assets/confirm-send-48.png" alt="" width="40" height="40"></span>
      <div class="sum-copy">
        <h2 class="sum-title" id="sumTitle">${n ? 'Good to go?' : 'Nobody to invite yet'}</h2>
        <p class="sum-sub">${n ? inviteLine(d) : 'You marked everyone as Not a fit. Go back and keep at least one creator.'}</p>
      </div>
    </div>
    ${error ? `<p class="sum-error" role="alert">${error}</p>` : ''}
    <div class="sum-foot">
      <button class="sum-send" data-sum="send"${n ? '' : ' disabled'}>${n ? `Send ${invites(n)}` : 'Send invites'}</button>
      <button class="sum-back" data-sum="back">Cancel</button>
    </div>
  </div>`;
}

function doneHtml(n) {
  return `
  <div class="sum-view">
    <div class="sum-done">
      <span class="done-check" aria-hidden="true">
        <span class="done-ring"></span>
        <svg width="64" height="64" viewBox="0 0 64 64"><circle class="done-disc" cx="32" cy="32" r="32"/><path class="done-tick" d="M21 33.5l7.5 7.5L43.5 25" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <h2 class="sum-done-title" id="sumTitle">${plural(n, 'creator', 'creators')} approved</h2>
      <p class="sum-done-body">Invites are going out now. Most creators answer within a few days, some take up to 3 business days.</p>
      <button class="done-btn" data-sum="close">Done</button>
    </div>
  </div>`;
}

// A short confetti burst from a point, in brand colors. Canvas-only, removed when the last piece settles.
function confetti(x, y) {
  if (reduceMotion) return;
  const cv = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  cv.className = 'confetti';
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  const colors = ['#7a5cfa', '#a48bff', '#c9bdfd', '#cdff5a', '#ffb547', '#ff7eb6'];
  const bits = Array.from({ length: 110 }, () => {
    const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.1;   // mostly upward, fanned out
    const v = 6 + Math.random() * 9;
    return {
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      w: 5 + Math.random() * 5, h: 8 + Math.random() * 6,
      r: Math.random() * Math.PI, vr: (Math.random() - .5) * .4,
      flip: Math.random() * Math.PI, vf: .1 + Math.random() * .2,
      c: colors[(Math.random() * colors.length) | 0], round: Math.random() < .3,
    };
  });
  const start = performance.now(), LIFE = 2200;
  setTimeout(() => cv.remove(), LIFE + 400);   // safety net if frames are paused (background tab)
  (function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - LIFE * .6) / (LIFE * .4));   // fade out over the last 40%
    bits.forEach(b => {
      b.vx *= .985; b.vy = b.vy * .985 + .32;   // air drag + gravity
      b.x += b.vx; b.y += b.vy; b.r += b.vr; b.flip += b.vf;
      ctx.save();
      ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.scale(1, Math.cos(b.flip));   // tumble
      ctx.fillStyle = b.c;
      if (b.round) { ctx.beginPath(); ctx.arc(0, 0, b.w / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    });
    if (t < LIFE) requestAnimationFrame(frame); else cv.remove();
  })(start);
}

function focusPrimary() {
  const el = sumDlg.querySelector('.done-btn, .sum-send:not(:disabled)') || sumDlg.querySelector('.sum-back');
  if (el) el.focus({ preventScroll: true });
}

function openSummary(opener) {
  clearTimeout(sumCloseT);
  sumOpener = opener;
  sumDlg.innerHTML = summaryHtml(summaryData());
  sum.hidden = false;
  void sum.offsetWidth;   // start from the hidden pose so the enter transition runs
  sum.classList.add('in');
  focusPrimary();
}

function closeSummary() {
  if (!summaryOpen()) return;
  sum.classList.remove('in');
  clearTimeout(sumCloseT);
  sumCloseT = setTimeout(() => { sum.hidden = true; sumDlg.innerHTML = ''; }, 260);
  if (sumOpener && !sumOpener.disabled) sumOpener.focus();
}


async function sendInvites(btn) {
  const d = summaryData();
  const ids = [...d.prio, ...d.rest].map(c => c.id);   // invite order: prioritized first
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    await api.sendInvites(ids);
  } catch {
    // Keep the summary on screen, with a clear error above the footer
    sumDlg.innerHTML = summaryHtml(d, "We couldn't send the invites. Check your connection and try again.");
    focusPrimary();
    return;
  }
  document.querySelectorAll('.approve-btn').forEach(b => {
    b.disabled = true;
    b.innerHTML = `<span>${invites(ids.length)} sent</span>`;
  });
  // The summary closes and the big popup itself turns into the success screen
  closeSummary();
  setTimeout(() => showSuccess(ids.length), 180);
}

// Success screen inside the Invite Creators popup: the list and footer fade out, the check/confetti/text rise in
function showSuccess(n) {
  // Every version turns into the success screen, so switching versions doesn't bring the list back
  Object.values(modals).forEach(modal => {
    let done = modal.querySelector('.m-done');
    if (!done) { done = document.createElement('div'); done.className = 'm-done'; modal.appendChild(done); }
    done.innerHTML = doneHtml(n);
    modal.classList.add('is-done');
    modal.classList.toggle('done-seen', modal !== modals[version]);   // only the one on screen animates
  });
  const done = modals[version].querySelector('.m-done');
  done.querySelector('.done-btn').focus({ preventScroll: true });
  $('sentCount').textContent = plural(n, 'creator', 'creators');
  // Burst from the check as the disc lands
  setTimeout(() => {
    const r = done.querySelector('.done-check').getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height / 2);
  }, 380);
}

sum.addEventListener('click', e => {
  if (e.target === sum) return closeSummary();   // backdrop = Go back
  const act = e.target.closest('[data-sum]')?.dataset.sum;
  if (act === 'back' || act === 'close') closeSummary();
  else if (act === 'send') sendInvites(e.target.closest('[data-sum]'));
});
// Keep Tab inside the dialog: it only moves between its buttons
sum.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const btns = [...sumDlg.querySelectorAll('button:not(:disabled)')];
  if (!btns.length) return;
  const i = btns.indexOf(document.activeElement);
  e.preventDefault();
  btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus();
});

// ---------- Not a fit feedback modal (Figma 15343:68271) ----------
// Not a fit asks why first; the reason is optional and the creator is marked Not a fit however the popup closes.
const fit = $('fit');
const fitDlg = fit.querySelector('.fit-dlg');
const fitInput = $('fitWhy');
const fitSend = fitDlg.querySelector('[data-fit=send]');
let fitId = null, fitCloseT, fitReasonOnly = false;
const fitOpen = () => !fit.hidden;

// reasonOnly: opened from "Tell us why?" on a row that's already Not a fit (V1 inline)
function openFit(id, reasonOnly = false) {
  const c = api.get(id);
  fitId = id;
  fitReasonOnly = reasonOnly;
  fitDlg.querySelector('.fit-av img').src = `assets/${c.avatar}.jpg`;
  fitDlg.querySelector('.fit-name').textContent = c.name;
  fitDlg.querySelector('.fit-handle').textContent = c.handle;
  fitInput.value = '';
  fitSend.disabled = true;
  clearTimeout(fitCloseT);
  fit.hidden = false;
  void fit.offsetWidth;   // start from the hidden pose so the enter transition runs
  fit.classList.add('in');
  fitInput.focus();
}

// Every way out (Send, Cancel, ✕, Esc, backdrop) marks the creator Not a fit; Send also keeps the reason.
// Undo on the collapsed row is the way back.
function closeFit(sent) {
  if (!fitOpen()) return;
  const id = fitId;
  fit.classList.remove('in');
  clearTimeout(fitCloseT);
  fitCloseT = setTimeout(() => { fit.hidden = true; }, 260);
  if (sent) api.notFitFeedback(id, fitInput.value.trim());
  if (!fitReasonOnly) setTimeout(() => setNotFit(id, true), 260);   // collapse the card once the popup is gone
  else if (sent) document.querySelectorAll(`.nc.row[data-id="${id}"] .r-why`)
    .forEach(b => { b.outerHTML = '<span class="r-sent">Feedback sent</span>'; });
}

fitInput.addEventListener('input', () => { fitSend.disabled = !fitInput.value.trim(); });
fit.addEventListener('click', e => {
  if (e.target === fit) return closeFit();   // backdrop = Cancel
  const act = e.target.closest('[data-fit]')?.dataset.fit;
  if (act === 'cancel') closeFit();
  else if (act === 'send' && !fitSend.disabled) closeFit(true);
});
// Keep Tab inside the dialog
fit.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const els = [...fitDlg.querySelectorAll('button:not(:disabled), textarea')];
  const i = els.indexOf(document.activeElement);
  e.preventDefault();
  els[(i + (e.shiftKey ? -1 : 1) + els.length) % els.length].focus();
});

// ---------- V1 option: how Not a fit behaves (Popup asks why first, Inline collapses right away) ----------
let notFitMode = 'popup';
try { notFitMode = localStorage.getItem('v1-notfit') || 'popup'; } catch {}
function setNotFitMode(m) {
  notFitMode = m;
  try { localStorage.setItem('v1-notfit', m); } catch {}
  $('modal-v1').classList.toggle('fit-inline', m === 'inline');
  const sub = document.querySelector('.ver-sub');
  sub.dataset.on = m;
  sub.querySelectorAll('.ver-sub-opt').forEach(b => b.setAttribute('aria-checked', b.dataset.mode === m));
}
document.querySelectorAll('.ver-sub-opt').forEach(b => b.addEventListener('click', () => setNotFitMode(b.dataset.mode)));
setNotFitMode(notFitMode);

// ---------- Prototype version switch (V1 / V2 / V3), remembered per browser ----------
try { version = localStorage.getItem('invite-version') || 'v2'; } catch {}
const hashVersion = location.hash.match(/v[1234]/);   // #v1 … #v4 pick a version
if (hashVersion) version = hashVersion[0];
function setVersion(v) {
  version = v;
  try { localStorage.setItem('invite-version', v); } catch {}
  document.querySelector('.ver').dataset.on = v;
  document.querySelector('.ver-sub').classList.toggle('show', v === 'v1');   // the Not a fit option only applies to V1
  document.querySelectorAll('.ver-opt').forEach(b => b.setAttribute('aria-checked', b.dataset.ver === v));
  setOpen(isOpen);
}
document.querySelectorAll('.ver-opt').forEach(b => b.addEventListener('click', () => setVersion(b.dataset.ver)));
setVersion(version);
if (location.hash) history.replaceState(null, '', location.pathname + location.search);
