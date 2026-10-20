const api = mockApi;
const $ = id => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE_OUT = 'cubic-bezier(.22, 1, .36, 1)';    // settles softly
const EASE_IN_OUT = 'cubic-bezier(.65, 0, .35, 1)';
const THROW = 'cubic-bezier(.25, .2, .7, .55)';     // moves on the first frame, then accelerates away

const TAGS = {
  fav:    { label: 'Favorite',         icon: 'tag-favorite.svg' },
  again:  { label: 'Would work again', icon: 'tag-work-again.svg' },
  missed: { label: 'Missed last time', icon: 'tag-missed.svg' },
};

// ---------- Shared bits ----------
const avatar = (img, border2 = false, size = '') => `
  <div class="avatar ${size}"><div class="avatar-in${border2 ? ' b2' : ''}">
    <img src="assets/${img}.jpg" alt="">
  </div></div>`;

const person = c => `
  <div class="person">
    ${avatar(c.avatar, false, 'sm')}
    <div class="p-info">
      <div class="p-name"><b>${c.name}</b><img src="assets/verified.svg" alt=""></div>
      <p class="p-sub">${c.handle}</p>
    </div>
  </div>`;

const emo = text => text.replace(/(\p{Extended_Pictographic})/gu, '<i class="emo">$1</i>');

// Creator card body. Suggestions get the "New" pill; creators you know get their "For you" tag.
const profileHTML = c => `
  <div class="cc-head">
    <div class="cc-who">
      ${avatar(c.avatar, true, 'md')}
      <div class="cc-info">
        <div class="cc-name">
          <span class="cc-n"><b>${c.name}</b><img src="assets/verified-16.svg" alt="" width="16" height="16"></span>
          <span class="cc-handle">@${c.handle}</span>
          ${c.source === 'known'
            ? `<span class="cc-tag ${c.tag}"><img src="assets/${TAGS[c.tag].icon}" alt="">${TAGS[c.tag].label}</span>`
            : '<span class="cc-new">New</span>'}
        </div>
        <p class="cc-bio">${emo(c.bio)}</p>
      </div>
    </div>
    <div class="cc-social">
      <a><img src="assets/instagram-24.svg" alt="Instagram" width="24" height="24"></a>
      <a><img src="assets/tiktok-24.svg" alt="TikTok" width="24" height="24"></a>
    </div>
  </div>

  <div class="cc-fit">
    <div class="cc-fit-title"><img src="assets/sparkle-fit.svg" alt="" width="16" height="16">Why they fit</div>
    <div class="cc-fit-list">
      ${c.fit.map(f => `<p><img src="assets/bullet-check.svg" alt="" width="16" height="16">${f}</p>`).join('')}
    </div>
  </div>

  <div class="cc-stats">
    <div class="cc-col grow">
      <p class="cc-label">Social Stats</p>
      <div class="cc-box">
        <div class="stat" style="left:15.5px"><span>Followers</span><b>${c.followers}</b></div>
        <div class="stat" style="left:105px">
          <span class="stat-row">Engagement<img src="assets/info-12.svg" alt="" width="12" height="12"></span>
          <b class="stat-row"><span class="ig12"><img src="assets/instagram-12.svg" alt=""></span>${c.engagement}</b>
        </div>
      </div>
    </div>
    <div class="cc-col" style="width:343px">
      <p class="cc-label">Audience</p>
      <div class="cc-box">
        <div class="stat" style="left:19.5px"><span>Location</span><b>${c.location}</b></div>
        <div class="stat cx" style="left:calc(50% - 7.5px)"><span>Age Range</span><b>${c.age}</b></div>
        <div class="stat cx" style="left:calc(50% + 105.5px); top:calc(50% - 0.5px)"><span>Gender</span><b>${c.gender}</b></div>
      </div>
    </div>
  </div>

  <div class="cc-content">
    <p class="cc-label">Recent content</p>
    <div class="tiles">${c.content.map(img => `<div class="tile"><img src="assets/${img}.jpg" alt=""></div>`).join('')}</div>
  </div>`;

// ---------- Card decks ----------
// One engine drives both decks: the suggestions, and the "creators you know" deck that
// opens from the collapsed bar. Each deck owns a card element, a list and a position.
//  'next' : the top card is thrown off to the left (accelerating, arcing from a low pivot)
//           while the next card dissolves up in its place.
//  'prev' : the current card dissolves back while the previous one glides back in on top.
// Moving copies live in the card's own container, so they disappear at its edge.
// Clicks mid-swipe fast-forward the swipe; rapid clicks queue.
const DECK = 'translateY(6px) scale(.96)';   // a card waiting just behind the top one
const OFFSCREEN = 'translate(-1000px, 80px) rotate(-18deg)';
// Where an added card flies to: from its own centre to the upper middle of the shortlist list
function intoPanel(el) {
  const r = el.getBoundingClientRect(), t = document.querySelector('.lists').getBoundingClientRect();
  return { dx: t.left + t.width / 2 - (r.left + r.width / 2), dy: t.top + 120 - (r.top + r.height / 2) };
}

// Cards use the 16px plus (Figma 15204 / 15212); Added shows the 12px check
function setAddIcon(split, added) {
  split.querySelector('.i-add').classList.toggle('is-check', added);   // [PRIORITY-MORPH] masked icon, takes the text colour
}

const modalEl = document.getElementById('modal');

function makeDeck({ card, body, list, pager }) {
  const deck = { card, body, list, pager, index: 0, running: null, queue: Promise.resolve(), pending: null };

  deck.current = () => deck.list()[deck.index];

  // Re-render after a data change, staying on the same creator if they're still in the deck
  // (e.g. someone removed from the shortlist returns to the deck without moving you)
  deck.refresh = () => {
    const i = deck.list().findIndex(x => x.id === deck.curId);
    if (i >= 0) deck.index = i;
    deck.render();
  };

  deck.render = () => {
    const l = deck.list();
    deck.index = Math.max(0, Math.min(deck.index, l.length - 1));
    const c = l[deck.index];
    deck.curId = c?.id;
    if (!c) { body.innerHTML = '<p class="sg-done">You’ve gone through every creator.</p>'; return; }
    body.innerHTML = profileHTML(c);
    const split = card.querySelector('.split');
    split.classList.toggle('added', c.shortlisted);
    split.classList.toggle('prio', c.priority);
    setAddIcon(split, c.shortlisted);
    split.querySelector('.l-add').textContent = c.shortlisted ? 'Added' : 'Shortlist';
    // Tooltips say what a click will do
    split.querySelector('.split-add').dataset.tip = c.shortlisted ? 'Remove from your shortlist' : 'Add creator to your shortlist';
    // ⚡ has no tooltip: hovering it already previews "⚡ Priority" [PRIORITY-MORPH]
    renderPager(deck);
  };

  // escape: the copy goes straight into the modal (not the card's own container), so a card
  // inside the expanded edit block can still fly out of it into the shortlist panel
  const flyingCopy = (escape = false) => {
    const el = card.cloneNode(true);
    el.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    el.removeAttribute('id');
    el.classList.add('ghost');
    el.style.zIndex = 2;
    if (escape && card.parentElement !== modalEl) {
      const r = card.getBoundingClientRect(), m = modalEl.getBoundingClientRect();
      Object.assign(el.style, {
        left: r.left - m.left - modalEl.clientLeft + 'px', top: r.top - m.top - modalEl.clientTop + 'px',
        width: r.width + 'px', height: r.height + 'px', right: 'auto', bottom: 'auto',
      });
      modalEl.appendChild(el);
    } else card.after(el);
    return el;
  };

  const finishRunning = () => {
    if (!deck.running) return;
    deck.running.anims.forEach(a => a.finish());
    deck.running.cleanup();
  };

  // onCopy(copy): optional, runs on the moving copy right after it's made (e.g. to animate its button)
  deck.swap = (direction, change, onCopy, opts = {}) => {
    finishRunning();
    card.classList.add('no-tx');
    const old = flyingCopy(direction === 'add');
    onCopy?.(old);
    change();
    let anims, incoming;
    if (reduceMotion) {
      anims = [
        old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }),
        card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 }),
      ];
    } else if (direction === 'add') {
      // [PRIORITY-MORPH] "Lift, then throw": the card lifts in place while its button changes
      // (readable at full size), then slides toward the shortlist panel still near full size and
      // only shrinks + fades as it reaches the list. ⚡ gets a longer lift than Add.
      const { dx, dy } = intoPanel(old);
      const total = opts.prio ? 800 : 700, lift = (opts.prio ? 200 : 160) / total;   // ⚡ was previewed on hover, so a shorter lift
      old.style.transformOrigin = '50% 50%';
      anims = [
        old.animate([
          { offset: 0, transform: 'none', easing: EASE_OUT },
          // the slide speeds up into the joint and the final leg leaves at that speed, so no hitch
          { offset: lift, transform: 'translateY(-4px) scale(1.02)', easing: 'cubic-bezier(.5, 0, .8, .6)' },
          { offset: lift + (1 - lift) * .4, transform: `translate(${dx * .4}px, ${dy * .4 - 4}px) scale(.9)`, easing: 'cubic-bezier(.2, .55, .3, 1)' },
          { offset: 1, transform: `translate(${dx}px, ${dy}px) scale(.22)` },
        ], { duration: total, fill: 'forwards' }),
        old.animate([
          { offset: 0, boxShadow: '0 4px 24px rgba(0,0,0,.04)' },
          { offset: lift, boxShadow: '0 18px 40px rgba(0,0,0,.14)' },
          { offset: 1, boxShadow: '0 4px 12px rgba(0,0,0,0)' },
        ], { duration: total, easing: 'linear', fill: 'forwards' }),
        old.animate([{ opacity: 1 }, { opacity: 1, offset: .72 }, { opacity: 0 }], { duration: total, easing: 'linear', fill: 'forwards' }),
        card.animate([{ transform: DECK, opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 440, delay: total * .55, easing: EASE_OUT, fill: 'backwards' }),
      ];
    } else if (direction === 'next') {
      old.style.transformOrigin = '50% 140%';
      anims = [
        old.animate([{ transform: 'none' }, { transform: OFFSCREEN }], { duration: 420, easing: THROW, fill: 'forwards' }),
        card.animate([{ transform: DECK, opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 420, delay: 60, easing: EASE_OUT, fill: 'backwards' }),
      ];
    } else {
      incoming = flyingCopy();          // sits right after the card, above `old`
      old.style.zIndex = 1;
      card.style.opacity = 0;
      incoming.style.transformOrigin = '50% 140%';
      anims = [
        old.animate([{ transform: 'none' }, { transform: DECK }], { duration: 320, easing: EASE_OUT, fill: 'forwards' }),
        old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'linear', fill: 'forwards' }),
        incoming.animate([{ transform: OFFSCREEN }, { transform: 'none' }], { duration: 540, easing: EASE_OUT, fill: 'forwards' }),
      ];
      anims[2].finished.then(() => { card.style.opacity = ''; incoming.remove(); }, () => {});
    }
    const me = {
      anims,
      cleanup() {
        if (deck.running !== me) return;
        deck.running = null;
        card.style.opacity = '';
        incoming?.remove();
        old.remove();
        card.classList.remove('no-tx');
      },
    };
    deck.running = me;
    Promise.all(anims.map(a => a.finished)).then(me.cleanup, me.cleanup);
  };

  deck.go = delta => {
    const target = (deck.pending ?? deck.index) + delta;
    if (target < 0 || target > deck.list().length - 1) return deck.queue;
    deck.pending = target;
    deck.queue = deck.queue.then(async () => {
      await Promise.race([warm(deck.list()[target]), new Promise(r => setTimeout(r, 120))]);
      deck.swap(delta > 0 ? 'next' : 'prev', () => { deck.index = target; deck.render(); });
      if (deck.pending === target) deck.pending = null;
      warmAround(deck);
    });
    return deck.queue;
  };

  // Add / priority advance to the next card after a beat, so the new state is seen first
  const advanceSoon = () => { if (deck.index < deck.list().length - 1) setTimeout(() => deck.go(1), 350); };

  // A click hides the tooltip until the pointer leaves the button
  card.querySelectorAll('.split button').forEach(b => {
    b.addEventListener('pointerdown', () => b.classList.add('tip-off'));
    b.addEventListener('pointerleave', () => b.classList.remove('tip-off'));
  });

  card.querySelector('.dc-foot').addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    const c = deck.current();
    if (!btn || !c) return;
    const act = btn.dataset.act;
    // Add / ⚡ (turning on) sends the card into the shortlist panel. Suggestions then leave
    // the deck; creators you know stay in it and the deck moves on to the next one.
    const turningOn = act === 'add' ? !c.shortlisted : act === 'prio' && !c.priority;
    if (turningOn) {
      // The card leaves straight away; its button switches to Added / Priority on the way into
      // the panel, so the state change and the flight play as one motion
      deck.swap('add', () => {
        act === 'prio' ? api.setPriority(c.id, true) : api.setShortlisted(c.id, true);
        if (c.source === 'known' && deck.index < deck.list().length - 1) { deck.index++; deck.render(); }
      }, copy => {
        copy.classList.remove('no-tx');   // the copy inherits the card's no-transition flag; let its button animate
        const split = copy.querySelector('.split'), orig = card.querySelector('.split');
        // [PRIORITY-MORPH] the copy isn't under the pointer, so carry over the hover look it had
        if (orig.matches(':has(.split-star:hover)')) split.classList.add('peek');
        if (orig.matches(':has(.split-add:hover)')) split.classList.add('hov-add');
        void split.offsetWidth;           // commit the starting look before switching state
        split.classList.add('added');
        if (act === 'prio') split.classList.add('prio');   // [PRIORITY-MORPH] morphs into "⚡ Priority" mid-flight
        setAddIcon(split, true);
        split.querySelector('.l-add').textContent = 'Added';
      }, { prio: act === 'prio' });
      return;
    }
    if (act === 'add') api.setShortlisted(c.id, false);   // turning off: stays on this card
    else if (act === 'prio') api.setPriority(c.id, false);
    else if (act === 'skip') {
      // Suggestions: "Not a Fit" drops them from the deck. Creators you know: it takes them
      // off the list but keeps their card, so they can be added back.
      if (c.source === 'suggested') deck.swap('next', () => api.dismiss(c.id));
      else { api.setShortlisted(c.id, false); advanceSoon(); }
    }
  });

  pager.querySelector('.pg-prev').addEventListener('click', () => deck.go(-1));
  pager.querySelector('.pg-next').addEventListener('click', () => deck.go(1));
  return deck;
}

// Decode a creator's photos before their card is dealt, so tiles never pop in mid-dissolve
const warmed = new Set();
function warm(c) {
  if (!c || warmed.has(c.id)) return Promise.resolve();
  warmed.add(c.id);
  const srcs = [c.avatar, ...c.content].map(n => `assets/${n}.jpg`);
  return Promise.all(srcs.map(src => { const i = new Image(); i.src = src; return i.decode().catch(() => {}); }));
}
const warmAround = d => { const l = d.list(); warm(l[d.index - 1]); warm(l[d.index + 1]); };

const suggestDeck = makeDeck({
  card: $('suggestCard'), body: $('suggestBody'),
  list: () => api.suggestions().filter(c => !c.dismissed && !c.shortlisted),   // added creators leave the deck
  pager: $('suggestPager'),
});
const knownDeck = makeDeck({
  card: $('knownCard'), body: $('knownBody'),
  list: () => api.known(),
  pager: $('knownPager'),
});

// ---------- Pagers: each deck has its own, which moves with it ----------
function renderPager(deck) {
  const l = deck.list(), p = deck.pager;
  p.querySelector('.pg-num').textContent = l.length ? deck.index + 1 : 0;
  p.querySelector('.pg-total').textContent = l.length;
  p.querySelector('.pg-prev').disabled = deck.index <= 0;
  p.querySelector('.pg-next').disabled = deck.index >= l.length - 1;
}

// ---------- Creators you know: collapsed bar ⇄ expanded deck ----------
const known = $('known');
const COLLAPSED = 65, EXPANDED_DECK = 635;   // bar → bar + card + pager (bottom lines up with the shortlist panel); V3's table block is 578
let knownAnims = [];

function stackHTML(people, max, cls) {
  const shown = people.slice(0, max);
  const more = people.length - shown.length;
  return shown.map(c => `<span class="${cls}-av"><img src="assets/${c.avatar}.jpg" alt=""></span>`).join('')
    + (more > 0 ? `<span class="${cls}-more">+${more}</span>` : '');
}

function renderKnownBar() {
  const on = api.known().filter(c => c.shortlisted);
  $('knCount').textContent = on.length;
  $('knStack').innerHTML = stackHTML(on, 4, 'kn');
  $('knSub').textContent = on.length
    ? 'Creators you loved working with are already on your list'
    : 'Add creators you’ve worked with before';
}

function setKnownOpen(open) {
  if (known.classList.contains('open') === open) return;
  knownAnims.forEach(a => a.cancel());   // cancel (not finish) so no held fade lingers into the next toggle
  known.classList.toggle('open', open);
  $('modal').classList.toggle('editing', open);
  $('knEdit').setAttribute('aria-expanded', open);
  $('knEditLabel').textContent = open ? 'Save' : 'Edit';
  setAddedOpen(open);
  const table = version === 'v3';
  const EXPANDED = table ? 578 : EXPANDED_DECK;
  known.classList.toggle('as-table', table);
  if (open) table ? renderKnTable() : knownDeck.render();

  // The suggestion card and its pager travel together; so do the known card and its pager
  const sugg = [suggestDeck.card, suggestDeck.pager];
  const kn = table ? [$('knTable')] : [knownDeck.card, knownDeck.pager];
  const all = (els, frames, opts) => els.map(el => el.animate(frames, opts));
  const h = (a, b) => [{ height: a + 'px' }, { height: b + 'px' }];
  known.style.height = (open ? EXPANDED : COLLAPSED) + 'px';
  if (reduceMotion) { sugg.forEach(el => el.style.visibility = open ? 'hidden' : ''); return; }

  if (open) {
    sugg.forEach(el => el.style.pointerEvents = 'none');
    const out = all(sugg, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(48px) scale(.97)' }],
      { duration: 280, easing: EASE_IN_OUT, fill: 'forwards' });
    if (table) $('ktRows').querySelectorAll('.pop-row').forEach((r, i) => r.animate(
      [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }],
      { duration: 320, delay: 140 + i * 30, easing: EASE_OUT, fill: 'backwards' }));
    knownAnims = [
      known.animate(h(COLLAPSED, EXPANDED), { duration: 480, easing: EASE_OUT }),
      ...all(kn, [{ opacity: 0, transform: 'translateY(-14px)' }, { opacity: 1, transform: 'none' }],
        { duration: 380, delay: 110, easing: EASE_OUT, fill: 'backwards' }),
      ...out,
    ];
    out[0].finished.then(() => { if (known.classList.contains('open')) sugg.forEach(el => el.style.visibility = 'hidden'); }, () => {});
  } else {
    sugg.forEach(el => el.style.visibility = '');
    // Save: the block rolls up into the bar (fast start, soft landing) and the suggestion
    // card slides back up into place beneath it, pager and all
    const roll = known.animate(h(EXPANDED, COLLAPSED), { duration: 420, easing: EASE_OUT });
    const fade = all(kn, [{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' });   // stays hidden while the block shrinks
    const back = all(sugg, [{ opacity: 0, transform: 'translateY(140px)' }, { opacity: 1, transform: 'none' }],
      { duration: 560, delay: 60, easing: EASE_OUT, fill: 'backwards' });
    knownAnims = [roll, ...fade, ...back];
    back[0].finished.then(() => sugg.forEach(el => el.style.pointerEvents = ''), () => {});
    roll.finished.then(() => fade.forEach(a => a.cancel()), () => {});   // drop the held fade once collapsed
  }
}

// V1 / V3 expand the block in place (deck / table); V2 opens the editor popup instead
const editKnown = () => version === 'v2' ? openPop() : setKnownOpen(!known.classList.contains('open'));
$('knEdit').addEventListener('click', editKnown);
$('weAdded').addEventListener('click', () => version === 'v2' ? openPop() : setKnownOpen(true));

// ---------- Right panel: the shortlist ----------
// ⚡ shows on everyone invited first; tapping it moves them down to a normal invite.
// [PRIORITY-MORPH] priority ⚡ is green, matching the card's Priority pill (was bolt-20-panel.svg, purple)
// Normal invites get a grey ⚡ on hover that makes them a priority invite.
const BOLT = c => c.priority
  ? `<button class="item-star" title="Remove from first priority" aria-label="Remove ${c.name} from first priority"><img src="assets/bolt-20-green.svg" alt=""></button>`
  : `<button class="item-bolt" title="Priority invite" aria-label="Make ${c.name} a priority invite"><img class="b-off" src="assets/bolt-20-grey.svg" alt=""><img class="b-on" src="assets/bolt-20-green.svg" alt=""></button>`;

function renderList(el, list) {
  el.innerHTML = list.map(c => `
    <div class="item" data-id="${c.id}">
      ${person(c)}
      <div class="item-actions">
        ${BOLT(c)}
        <button class="item-x" aria-label="Remove ${c.name}"><img src="assets/close-12.svg" alt=""></button>
      </div>
    </div>`).join('');
}

// "We added for you": a summary card normally, the full list while editing. The group
// eases to its new height and the rows drop in one after another.
let addedAnim = null;
function setAddedOpen(open) {
  const g = $('addedGroup');
  addedAnim?.cancel();
  const from = g.offsetHeight;
  g.classList.toggle('open', open);
  if (reduceMotion || g.hidden) return;
  const to = g.offsetHeight;
  g.style.overflowY = 'clip';   // clip vertically only: the open box hangs 12px past the column on each side
  addedAnim = g.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 460, easing: EASE_OUT });
  addedAnim.finished.then(() => { g.style.overflowY = ''; }, () => {});
  const show = open ? g.querySelector('.wa-box') : $('weAdded');
  show.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'linear' });
  if (open) g.querySelectorAll('#addedList .item').forEach((el, i) => el.animate(
    [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }],
    { duration: 340, delay: 60 + i * 35, easing: EASE_OUT, fill: 'backwards' }));
}

// Find who just arrived (added, or moved between groups) and show them: after the
// current burst of changes settles, scroll the first arrival into view and slide + tint it.
let placed = null;
let addedBefore = null;
const arrivals = new Set();
let arrivalsQueued = false;

function noteArrivals(groups) {
  const now = new Map();
  Object.entries(groups).forEach(([g, list]) => list.forEach(c => now.set(c.id, g)));
  if (placed) now.forEach((g, id) => { if (placed.get(id) !== g) arrivals.add(id); });   // hidden rows are skipped later
  placed = now;
  const addedCount = groups.added.length;
  if (addedBefore !== null && addedCount > addedBefore) arrivals.add('__added');
  addedBefore = addedCount;
  if (arrivals.size && !arrivalsQueued) { arrivalsQueued = true; queueMicrotask(showArrivals); }
}

function showArrivals() {
  arrivalsQueued = false;
  const lists = document.querySelector('.lists');
  const items = [...arrivals]
    .map(id => id === '__added' ? $('weAdded') : lists.querySelector(`.item[data-id="${id}"]`))
    .filter(el => el && el.offsetParent);
  arrivals.clear();
  if (!items.length) return;
  const topIn = el => el.getBoundingClientRect().top - lists.getBoundingClientRect().top + lists.scrollTop;
  items.sort((a, b) => topIn(a) - topIn(b));

  // Bring the first arrival into view (only if it's out of sight): jump, then glide the content (FLIP)
  const first = items[0], pad = 40, top = topIn(first), bottom = top + first.offsetHeight;
  if (top < lists.scrollTop + pad || bottom > lists.scrollTop + lists.clientHeight - pad) {
    const max = lists.scrollHeight - lists.clientHeight;
    const target = Math.min(max, Math.max(0, top - lists.clientHeight / 2 + first.offsetHeight / 2));
    const delta = target - lists.scrollTop;
    lists.scrollTop = target;
    if (!reduceMotion && delta) [...lists.children].forEach(g => g.animate(
      [{ transform: `translateY(${delta}px)` }, { transform: 'none' }], { duration: 420, easing: EASE_OUT }));
  }

  items.forEach((el, i) => {
    if (!reduceMotion && el.classList.contains('item')) el.animate(
      [{ opacity: 0, transform: 'translateX(14px)' }, { opacity: 1, transform: 'none' }],
      { duration: 320, delay: i * 40, easing: EASE_OUT, fill: 'backwards' });
    el.classList.remove('arrived'); void el.offsetWidth; el.classList.add('arrived');
  });
}

function renderShortlist() {
  const list = api.shortlist();
  const groups = {
    added: list.filter(c => c.source === 'known' && c.priority),       // creators you know, invited first by default
    prio: list.filter(c => c.source === 'suggested' && c.priority),
    rest: list.filter(c => !c.priority),                                // normal invites, from either source
  };
  $('waCount').textContent = groups.added.length;
  $('waStack').innerHTML = stackHTML(groups.added, 4, 'wa');
  renderList($('addedList'), groups.added);
  renderList($('priorityList'), groups.prio);
  renderList($('everyoneList'), groups.rest);
  $('addedGroup').hidden = !groups.added.length;
  $('priorityList').closest('.group').hidden = !groups.prio.length;
  $('everyoneList').closest('.group').hidden = !groups.rest.length;
  $('invitesEmpty').hidden = groups.prio.length + groups.rest.length > 0;   // initial state: only "We added for you"
  $('slEmpty').hidden = list.length > 0;
  document.querySelector('.lists').hidden = list.length === 0;
  noteArrivals(groups);

  const n = list.length;
  $('slCount').textContent = n;
  $('inviteCount').textContent = n;
  $('target').textContent = api.TARGET;
  $('barFill').style.width = Math.min(100, n / api.TARGET * 100) + '%';
  $('allCount').textContent = api.known().length + api.suggestions().filter(c => !c.dismissed).length;
}

// A row folds away first, then the change lands (and the creator reappears where they now belong)
function leave(el) {
  if (el.dataset.leaving) return null;
  el.dataset.leaving = 1;
  el.style.overflow = 'hidden';
  if (reduceMotion) return Promise.resolve();
  const anim = el.animate([
    { opacity: 1, height: el.offsetHeight + 'px', transform: 'none' },
    { opacity: 0, height: '0px', transform: 'translateX(16px)' },
  ], { duration: 240, easing: EASE_IN_OUT, fill: 'forwards' });
  // the change must land even if the tab is in the background and animations are paused
  return Promise.race([anim.finished, new Promise(r => setTimeout(r, 260))]);
}

document.querySelector('.right').addEventListener('click', e => {
  const item = e.target.closest('.item');
  if (!item) return;
  const id = item.dataset.id;
  const act = e.target.closest('.item-x') ? () => api.setShortlisted(id, false)
    : e.target.closest('.item-star') ? () => api.setPriority(id, false)
    : e.target.closest('.item-bolt') ? () => api.setPriority(id, true)
    : null;
  if (act) leave(item)?.then(act);
});

// ---------- Re-render whenever the "backend" changes ----------
function renderAll() {
  renderKnownBar();
  renderShortlist();
  suggestDeck.refresh();
  if (known.classList.contains('open')) known.classList.contains('as-table') ? renderKnTable() : knownDeck.render();
}
api.onChange(renderAll);
renderAll();
warmAround(suggestDeck);
warm(api.known()[0]);

// ---------- Modal open / close ----------
const modal = $('modal');
const overlay = $('overlay');
const setOpen = open => { modal.classList.toggle('hidden', !open); overlay.classList.toggle('hidden', !open); };
$('closeModal').addEventListener('click', () => setOpen(false));
overlay.addEventListener('click', () => setOpen(false));
$('openModal').addEventListener('click', () => setOpen(true));
// Esc steps back one level: the popup, then the expanded deck, then the modal
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('pop').hidden) closePop();
  else if (known.classList.contains('open')) setKnownOpen(false);
  else setOpen(false);
});

// ---------- V2: "Start with creators you know" popup ----------
// Edits go into a draft; Save sends them to the backend, Cancel / × / Esc drop them.
let draft = null;
let sortDesc = false;
const TAG_ORDER = ['fav', 'again', 'missed'];

// One table row for a creator you know: shared by the V2 popup and the V3 inline table
const knownRowHTML = c => `
    <div class="pop-row" data-id="${c.id}">
      <div class="pr-who">
        ${avatar(c.avatar, false)}
        <div class="pr-info">
          <div class="pr-name"><b>${c.name}</b><img src="assets/verified.svg" alt=""></div>
          <p class="pr-sub">${c.sub}</p>
        </div>
      </div>
      <span class="cc-tag ${c.tag}"><img src="assets/${TAGS[c.tag].icon}" alt="">${TAGS[c.tag].label}</span>
      <div class="mini${c.shortlisted ? ' added' : ''}${c.priority ? ' prio' : ''}">
        <button class="mini-add" data-act="add" aria-label="${c.shortlisted ? 'Remove' : 'Add'} ${c.name}">
          <img src="assets/${c.shortlisted ? 'check-12' : 'plus-12'}.svg" alt="" width="12" height="12">${c.shortlisted ? 'Added' : 'Add'}
        </button>
        <button class="mini-star" data-act="prio" aria-label="Priority invite for ${c.name}">
          <img src="assets/bolt-16${c.priority ? '-white' : ''}.svg" alt="" width="16" height="16">
        </button>
      </div>
    </div>`;
const byTag = rows => rows.sort((a, b) => (TAG_ORDER.indexOf(a.tag) - TAG_ORDER.indexOf(b.tag)) * (sortDesc ? -1 : 1));

function renderPop() {
  const rows = byTag(api.known().map(c => ({ ...c, ...draft[c.id] })));
  $('popCount').textContent = `(${rows.filter(c => c.shortlisted).length})`;
  $('popRows').innerHTML = rows.map(knownRowHTML).join('');
}

$('popRows').addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const d = draft[btn.closest('.pop-row').dataset.id];
  if (btn.dataset.act === 'add') { d.shortlisted = !d.shortlisted; if (!d.shortlisted) d.priority = false; }
  else { d.priority = !d.priority; if (d.priority) d.shortlisted = true; }   // same rules as the backend
  renderPop();
});
$('popSort').addEventListener('click', () => { sortDesc = !sortDesc; renderPop(); });

// ---------- V3: the expanded block is a table; changes apply straight away, like V1 ----------
function renderKnTable() { $('ktRows').innerHTML = byTag(api.known()).map(knownRowHTML).join(''); }
$('ktRows').addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const c = api.get(btn.closest('.pop-row').dataset.id);
  if (btn.dataset.act === 'add') api.setShortlisted(c.id, !c.shortlisted);
  else api.setPriority(c.id, !c.priority);
});
$('ktSort').addEventListener('click', () => { sortDesc = !sortDesc; renderKnTable(); });

function openPop() {
  draft = Object.fromEntries(api.known().map(c => [c.id, { shortlisted: c.shortlisted, priority: c.priority }]));
  renderPop();
  $('popOverlay').hidden = $('pop').hidden = false;
  if (reduceMotion) return;
  $('popOverlay').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'linear' });
  $('pop').animate([{ opacity: 0, transform: 'translateY(12px) scale(.97)' }, { opacity: 1, transform: 'none' }],
    { duration: 320, easing: EASE_OUT });
}

function closePop(save = false) {
  if (save) api.known().forEach(c => {
    const d = draft[c.id];
    if (d.shortlisted !== c.shortlisted) api.setShortlisted(c.id, d.shortlisted);
    if (d.priority !== api.get(c.id).priority) api.setPriority(c.id, d.priority);
  });
  const hide = () => { $('popOverlay').hidden = $('pop').hidden = true; };
  if (reduceMotion) return hide();
  $('popOverlay').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'linear', fill: 'forwards' });
  const a = $('pop').animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px) scale(.98)' }],
    { duration: 200, easing: EASE_IN_OUT, fill: 'forwards' });
  Promise.race([a.finished, new Promise(r => setTimeout(r, 220))]).then(() => {
    hide(); $('pop').getAnimations().forEach(x => x.cancel()); $('popOverlay').getAnimations().forEach(x => x.cancel());
  });
}
$('popSave').addEventListener('click', () => closePop(true));
$('popCancel').addEventListener('click', () => closePop());
$('popClose').addEventListener('click', () => closePop());
$('popOverlay').addEventListener('click', () => closePop());

// ---------- Prototype version switch (V1 / V2), remembered per browser ----------
let version = 'v1';
try { version = localStorage.getItem('invite-version') || 'v1'; } catch {}
const hashVersion = location.hash.match(/v[123]/);   // #v1 / #v2 / #v3 pick a version
if (hashVersion) version = hashVersion[0];
function setVersion(v) {
  if (known.classList.contains('open')) setKnownOpen(false);   // close the current version's editor first
  if (!$('pop').hidden) closePop();
  version = v;
  try { localStorage.setItem('invite-version', v); } catch {}
  document.querySelector('.ver').dataset.on = v;
  document.querySelectorAll('.ver-opt').forEach(b => b.setAttribute('aria-checked', b.dataset.ver === v));
}
document.querySelectorAll('.ver-opt').forEach(b => b.addEventListener('click', () => setVersion(b.dataset.ver)));
setVersion(version);
// Always start with the editor closed, whatever is in the URL
if (location.hash) history.replaceState(null, '', location.pathname + location.search);
