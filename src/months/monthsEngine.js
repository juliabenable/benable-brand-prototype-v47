/* Directions A + C, "same screens, new clock" + "the pace line", as a vanilla
   render engine mounted inside the /nf production chrome (pages/NfMonths.jsx).
   Ported from selling-months-study/proto-ac.html. The overview reuses
   production's own campaign-card / opportunity / overview classes (with their
   svelte hashes) so the cards ARE production's; the tracker reuses the
   workflow-header / phase-pill / dashboard-tab classes from the launch screen.

   Three "today" snapshots (DAYS). Nothing is locked: every future month can be
   queued as early as the brand likes (Rule 4, Julia Sep 8). "Plan November" /
   "Start planning" hand off to the REAL captured wizard (/nf/step1) via onPlan;
   the wizard copy is patched in months mode inside NewFlow.jsx. */

export const DAYS = [
  ['day0', 'Sep 8 · signed today'],
  ['ontrack', 'Oct 5 · on track'],
  ['behind', 'Oct 12 · running behind'],
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthAfter = (name, k = 1) => MONTHS[(MONTHS.indexOf(name) + k + 12) % 12];
const opensOn = (name) => `${monthAfter(name, -1).slice(0, 3)} 1`;
const firstBy = (name) => `${name.slice(0, 3)} 12`;
const allBy = (name) => `${name.slice(0, 3)} 26`;
export const cutoffFor = (name) => `${monthAfter(name, -1).slice(0, 3)} 19`;
export const paceFor = (name) => ({ first_by: firstBy(name), all_by: allBy(name), opens: opensOn(name) });

const CREATORS = [
  ['Maya Ruiz', '@maya.routine'], ['Jordan Kim', '@jordan.skin'], ['Priya Shah', '@priya.glow'], ['Elena Voss', '@elenav.daily'],
  ['Tasha Moore', '@tashamoore'], ['Noor Ali', '@noor.routine'], ['Camille Dubois', '@camille.d'], ['Ines Lopez', '@ines.lo'],
  ['Sofia Bell', '@sofiabell.skin'], ['Harper Wu', '@harperwu'],
];
const creator = (i, stage, when, late) => ({ name: CREATORS[i][0], handle: CREATORS[i][1], stage, when, late: !!late });

const RUN_BASE = {
  id: 88, title: 'Fall Campaign', content_month: 'October', launched_at: 'Sep 10', promised: 10,
  stages: [
    { k: 'Launched', d: 'Sep 10', s: 'done' }, { k: 'Matched', d: 'Sep 11', s: 'done' }, { k: 'Approved', d: 'Sep 15', s: 'done' },
    { k: 'Invited', d: 'Sep 16', s: 'done' }, { k: 'Shipped', d: 'Sep 22 to 24', s: 'done' }, { k: 'Filming', d: 'from delivery', s: 'now' }, { k: 'Live', d: 'by Nov 5', s: '' },
  ],
};

const DB = {
  day0: {
    today: 'Sep 8',
    runs: [],
    opportunities: [
      { content_month: 'October', state: 'available', plan_by: 'Sep 12', cutoff: 'Sep 19',
        copy: 'Launch your brief by <b>Sep 12</b> to keep October on track. First posts land about six weeks after launch; the industry takes ten.', cta: 'Start planning' },
      { content_month: 'November', state: 'queue', copy: 'Everything you set up for October is reused.' },
    ],
  },
  ontrack: {
    today: 'Oct 5',
    runs: [Object.assign({}, RUN_BASE, {
      status: 'In production', tone: 'active', live: 2, first_post_at: 'Oct 2', first_post_by: 'Oct 22', all_live_by: 'Nov 5', behind_days: 0,
      creators: [
        creator(0, 'Content published', 'Oct 2'), creator(1, 'Content published', 'Oct 4'), creator(2, 'Draft approved', 'posts by Oct 9'),
        creator(3, 'Order delivered', 'posts by Oct 14'), creator(4, 'Order delivered', 'posts by Oct 14'), creator(5, 'Order delivered', 'posts by Oct 15'),
        creator(6, 'Order delivered', 'posts by Oct 16'), creator(7, 'Order delivered', 'posts by Oct 16'), creator(8, 'Order shipped', 'arrives Oct 7'), creator(9, 'Order shipped', 'arrives Oct 7'),
      ],
    })],
    opportunities: [
      { content_month: 'November', state: 'available', plan_by: 'Oct 7', cutoff: 'Oct 19',
        copy: 'Launch by <b>Oct 7</b> and it lands in November. October\'s brief and products are saved, so this takes a few minutes.', cta: 'Plan November' },
      { content_month: 'December', state: 'queue', copy: 'Holiday content? Queue it now and we match two weeks early.' },
    ],
  },
  behind: {
    today: 'Oct 12',
    runs: [Object.assign({}, RUN_BASE, {
      status: 'Running 4 days behind', tone: 'warn', live: 3, first_post_at: 'Oct 2', first_post_by: 'Oct 22', all_live_by: 'Nov 9', behind_days: 4,
      why: 'Two orders left the warehouse on Oct 3, four days after the others. Katie has asked both creators to post within a week of delivery.', ask: 'Nothing needed from you.',
      stages: [
        { k: 'Launched', d: 'Sep 10', s: 'done' }, { k: 'Matched', d: 'Sep 11', s: 'done' }, { k: 'Approved', d: 'Sep 15', s: 'done' },
        { k: 'Invited', d: 'Sep 16', s: 'done' }, { k: 'Shipped', d: '2 late, Oct 3', s: 'late' }, { k: 'Filming', d: '7 of 10', s: 'now' }, { k: 'Live', d: 'by Nov 9', s: '' },
      ],
      creators: [
        creator(0, 'Content published', 'Oct 2'), creator(1, 'Content published', 'Oct 4'), creator(2, 'Content published', 'Oct 9'),
        creator(3, 'Draft approved', 'posts by Oct 14'), creator(4, 'Order delivered', 'posts by Oct 14'), creator(5, 'Order delivered', 'posts by Oct 15'),
        creator(6, 'Order delivered', 'posts by Oct 16'), creator(7, 'Order delivered', 'posts by Oct 16'), creator(8, 'Order delivered', 'shipped Oct 3 · posts by Oct 24', true), creator(9, 'Order delivered', 'shipped Oct 3 · posts by Oct 24', true),
      ],
    })],
    opportunities: [
      { content_month: 'November', state: 'at_risk', plan_by: 'Oct 7', over_days: 5, cutoff: 'Oct 19',
        copy: 'Launch this week and it still lands in November. After <b>Oct 19</b> it becomes December content.', cta: 'Plan November' },
      { content_month: 'December', state: 'queue', copy: 'Holiday content? Queue it now and we match two weeks early.' },
    ],
  },
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const initials = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const ARROW = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M5 10h10M11 5l5 5-5 5"/></svg>';
const BACK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M10 3L5 8l5 5"/></svg>';
const GRADIENT = 'https://benable.com/_app/immutable/assets/campaign-window-gradient.DdmQlVVC.webp';

export function createMonths(root, opts = {}) {
  let stateKey = 'ontrack';
  let screen = 'overview';
  let queuing = null;
  let more = false;
  let toastT;
  const S = () => DB[stateKey];
  const Q = () => (S().queued = S().queued || {});
  const curMonth = () => (S().runs[0] ? S().runs[0].content_month : 'October');
  try { const s = localStorage.getItem('acState'); if (s && DB[s]) stateKey = s; } catch { /* fresh */ }

  /* ---------- overview pieces (production classes) ---------- */
  function runCard(r) {
    const pct = Math.round((r.live / r.promised) * 100);
    const warn = r.behind_days > 0;
    const pace = r.first_post_at
      ? (warn ? `First post landed <b>${r.first_post_at}</b> · all ${r.promised} now by <b>${r.all_live_by}</b>` : `First post landed <b>${r.first_post_at}</b> · on pace for all ${r.promised} by <b>${r.all_live_by}</b>`)
      : `On pace for first post by <b>${r.first_post_by}</b> · all ${r.promised} by <b>${r.all_live_by}</b>`;
    return `
    <a class="campaign-card svelte-1fvpax8" href="#" data-open="${r.id}" aria-label="Open ${esc(r.content_month)} content, ${esc(r.title)}">
      <div class="campaign-card__heading svelte-1fvpax8">
        <span class="campaign-card__date svelte-1fvpax8"><strong class="svelte-1fvpax8">${esc(r.content_month)} content</strong> · launched ${r.launched_at}</span>
        <h2 class="svelte-1fvpax8">${esc(r.title)}</h2>
      </div>
      <p class="campaign-card__subtitle svelte-1fvpax8 nfm-status ${warn ? 'warn' : (r.live >= r.promised ? 'ok' : '')}">${esc(r.status)}</p>
      <div class="nfm-bottom">
        <div class="campaign-card__progress-copy svelte-1fvpax8"><strong class="svelte-1fvpax8">${r.live}</strong> <span class="svelte-1fvpax8">of ${r.promised} live</span></div>
        <div class="nfm-pace ${warn ? 'warn' : ''}">${pace}</div>
        <div class="campaign-card__progress svelte-1fvpax8" role="progressbar" aria-valuemin="0" aria-valuemax="${r.promised}" aria-valuenow="${r.live}"><span style="width: ${pct}%" class="svelte-1fvpax8"></span></div>
      </div>
      <span class="campaign-card__open svelte-1fvpax8" aria-hidden="true">${ARROW}</span>
    </a>`;
  }

  function queueTile(month, copy, compact) {
    const q = Q()[month];
    const cur = curMonth();
    const p = paceFor(month);
    if (queuing === month) {
      return `
      <article class="opportunity opportunity--action svelte-75h9ek nfm-queue ${compact ? 'nfm-compact' : ''}">
        <div class="opportunity__action-copy svelte-75h9ek">
          <div class="opportunity__title-row svelte-75h9ek"><h2 class="svelte-75h9ek">${esc(month)} content</h2><span class="nfm-badge open">Launches ${p.opens} by itself</span></div>
          <div class="nfm-queue-form">
            <div class="nfm-chips"><button type="button" class="nfm-chip on" data-chip="same">Same brief as ${esc(cur)}</button><button type="button" class="nfm-chip" data-chip="pick">Change products</button></div>
            <textarea class="nfm-note" rows="2" placeholder="Anything different for ${esc(month)}? A holiday angle, a launch, a date to hit. Leave it empty and ${esc(month)} runs like ${esc(cur)}."></textarea>
            <div class="nfm-actions"><button type="button" class="nfm-btn" data-save-queue="${esc(month)}">Queue ${esc(month)}</button><button type="button" class="nfm-txt" data-cancel-queue>Cancel</button></div>
          </div>
        </div>
      </article>`;
    }
    if (q) {
      return `
      <article class="opportunity opportunity--action svelte-75h9ek nfm-queued ${compact ? 'nfm-compact' : ''}">
        <div class="opportunity__action-copy svelte-75h9ek">
          <div class="opportunity__title-row svelte-75h9ek"><h2 class="svelte-75h9ek">${esc(month)} content</h2><span class="nfm-badge ok">Queued</span></div>
          <p class="svelte-75h9ek">Launches <b>${p.opens}</b> by itself · first post by <b>${p.first_by}</b> · all 10 by <b>${p.all_by}</b>.<span class="nfm-qnote">${q.note ? esc(q.note) : `Same brief as ${esc(cur)}.`}</span></p>
        </div>
        <button type="button" class="opportunity__action svelte-75h9ek nfm-ghost" data-queue="${esc(month)}">Edit</button>
      </article>`;
    }
    return `
    <article class="opportunity opportunity--action svelte-75h9ek nfm-queue ${compact ? 'nfm-compact' : ''}">
      <div class="opportunity__action-copy svelte-75h9ek">
        <div class="opportunity__title-row svelte-75h9ek"><h2 class="svelte-75h9ek">${esc(month)} content</h2><span class="nfm-badge open">Matching starts ${p.opens}</span></div>
        <p class="svelte-75h9ek">${copy ? copy + ' ' : ''}<b>Queue the brief now</b> and it launches ${p.opens} by itself. Edit it any time before then.</p>
      </div>
      <button type="button" class="opportunity__action svelte-75h9ek" data-queue="${esc(month)}">Queue ${esc(month)}</button>
    </article>`;
  }

  function oppCard(o) {
    if (o.state === 'queue') return queueTile(o.content_month, o.copy, false);
    const badge = o.state === 'at_risk'
      ? `<span class="nfm-badge warn">At risk · ${o.over_days} days past ${o.plan_by}</span>`
      : `<span class="nfm-badge open">Launch by ${o.plan_by}</span>`;
    return `
    <article class="opportunity opportunity--action svelte-75h9ek">
      <span class="opportunity__visuals svelte-75h9ek" aria-hidden="true"><img class="opportunity__action-gradient svelte-75h9ek" src="${GRADIENT}" alt=""> <span class="opportunity__action-overlay svelte-75h9ek"></span></span>
      <div class="opportunity__action-copy svelte-75h9ek">
        <div class="opportunity__title-row svelte-75h9ek"><h2 class="svelte-75h9ek">${esc(o.content_month)} content</h2>${badge}</div>
        <p class="svelte-75h9ek">${o.copy}</p>
      </div>
      <button type="button" class="opportunity__action svelte-75h9ek" data-plan="${esc(o.content_month)}">${esc(o.cta)}</button>
    </article>`;
  }

  function moreTiles() {
    const last = S().opportunities[S().opportunities.length - 1].content_month;
    const names = [1, 2, 3].map((k) => monthAfter(last, k));
    if (!more) return `<div class="nfm-more-toggle"><button type="button" class="nfm-txt accent" data-more="1">Plan further ahead · ${names.join(', ')}</button></div>`;
    return `<div class="nfm-more">${names.map((name) => queueTile(name, '', true)).join('')}</div><div class="nfm-more-toggle"><button type="button" class="nfm-txt accent" data-more="0">Show fewer months</button></div>`;
  }

  function renderOverview() {
    const s = S();
    const runs = s.runs.map(runCard).join('');
    const opps = s.opportunities.map(oppCard).join('');
    const plan = s.runs.length
      ? `Today is <b>${s.today}</b> · ${s.runs[0].live} of ${s.runs[0].promised} live for ${s.runs[0].content_month}`
      : `Today is <b>${s.today}</b> · your first content month is <b>October</b>`;
    return `
    <div class="campaign-overview svelte-9w8so5 nfm-overview">
      <header class="overview-header svelte-9w8so5"><div><h1 class="svelte-9w8so5">Your content</h1> <p class="svelte-9w8so5">One run a month. Each month shows what is promised, what is live, and the next date that needs you.</p></div></header>
      <div class="overview-controls svelte-9w8so5">
        <div class="overview-tabs svelte-9w8so5" role="tablist" aria-label="Content overview"><button type="button" role="tab" class="svelte-9w8so5 active">Active</button> <button type="button" role="tab" class="svelte-9w8so5" data-inert="Delivered months land here with the full report and every post">Delivered</button></div>
        <div class="nfm-plan-line">${plan}</div>
      </div>
      <section class="overview-stack svelte-9w8so5">
        <section class="campaign-group svelte-9w8so5"><div class="campaign-group__reveal svelte-9w8so5"><div class="campaign-group__cards svelte-9w8so5">${runs}${opps}</div></div></section>
        ${moreTiles()}
      </section>
    </div>`;
  }

  /* ---------- tracker (production workflow header + the pace card) ---------- */
  function renderTracker() {
    const r = S().runs[0];
    if (!r) return renderOverview();
    const warn = r.behind_days > 0;
    const steps = r.stages.map((s) => `<div class="nfm-step ${s.s}"><b>${esc(s.k)}</b><span>${esc(s.d)}</span></div>`).join('');
    const rows = r.creators.map((c) => {
      const done = c.stage === 'Content published';
      const now = c.stage === 'Draft approved' || c.stage === 'Order delivered';
      return `<tr>
        <td><div class="nfm-who"><span class="nfm-av">${initials(c.name)}</span><div><b>${esc(c.name)}</b><br><span>${esc(c.handle)}</span></div></div></td>
        <td><span class="nfm-st ${c.late ? 'late' : done ? 'done' : now ? 'now' : ''}">${esc(c.stage)}</span></td>
        <td class="r"><span class="nfm-when ${c.late ? 'warn' : ''}">${esc(c.when)}</span></td>
      </tr>`;
    }).join('');
    const why = warn
      ? `<div class="nfm-why"><span class="nfm-av k">K</span><div><b>Why:</b> ${esc(r.why)} <b>${esc(r.ask)}</b></div></div>`
      : `<div class="nfm-why"><span class="nfm-av k">K</span><div><b>Katie:</b> ${r.promised - r.live} creators are filming. Two orders arrive ${r.creators[8].when.replace('arrives ', '')}; both usually post within a week of delivery. <b>Nothing needed from you.</b></div></div>`;
    return `
    <section class="workflow-page nfm-track">
      <div class="workspace-grid">
        <main class="main-column">
          <header class="workflow-header">
            <a class="workflow-header-backlink" href="#" data-back><span class="icon" aria-hidden="true">${BACK}</span> <span>Campaigns</span></a>
            <div class="workflow-header-row">
              <div class="workflow-header-main">
                <span class="campaign-card__date svelte-1fvpax8 nfm-monthpill"><strong class="svelte-1fvpax8">${esc(r.content_month)} content</strong></span>
                <h1>${esc(r.title)}</h1>
                <span class="phase-pill ${warn ? 'phase-pill--recruiting' : 'phase-pill--active'}"><span class="phase-pill-dot" aria-hidden="true"></span> <span>${esc(r.status)}</span></span>
              </div>
              <div class="header-right"><button type="button" class="workflow-header-edit-btn" data-inert="Edit campaign is unchanged; it opens the brief">Edit Campaign</button></div>
            </div>
          </header>
          <div>
            <section class="workflow-stage-shell">
              <section class="stage-primary-surface">
                <div class="workflow-dashboard-controls"><nav class="workflow-dashboard-tabs" aria-label="Campaign dashboard tabs"><button type="button" class="workflow-dashboard-tab active">Dashboard</button> <button type="button" class="workflow-dashboard-tab" data-inert="Content lands here once creators submit and Benable approves it">Content</button></nav></div>
                <section class="nfm-pace-card ${warn ? 'warn' : ''}" aria-label="Pace">
                  <div class="nfm-pace-top">
                    <div class="nfm-stat"><div class="k">First post</div><div class="v ok">Landed ${r.first_post_at}</div><div class="s">Promised by <b>${r.first_post_by}</b></div></div>
                    <div class="nfm-stat"><div class="k">All ${r.promised} live</div><div class="v ${warn ? 'warn' : ''}">${warn ? 'Now by ' + r.all_live_by : 'On pace for ' + r.all_live_by}</div><div class="s"><b>${r.live} of ${r.promised}</b> live today${warn ? ` · running <b>${r.behind_days} days</b> behind` : ''}</div></div>
                  </div>
                  <div class="nfm-steps">${steps}</div>
                  ${why}
                </section>
                <section class="nfm-panel" aria-label="Creators">
                  <h3>Creators</h3>
                  <p class="sub">${r.promised} promised for ${r.content_month} · ${r.live} published · ${r.promised - r.live} in progress</p>
                  <div class="nfm-tbl-wrap"><table class="nfm-tbl"><thead><tr><th>Creator</th><th>Stage</th><th class="r">Next</th></tr></thead><tbody>${rows}</tbody></table></div>
                </section>
              </section>
            </section>
          </div>
        </main>
      </div>
    </section>`;
  }

  function render() {
    root.innerHTML = (screen === 'track' ? renderTracker() : renderOverview()) + '<div class="nfm-toast" data-toast role="status"></div>';
    if (opts.onRender) opts.onRender(stateKey, screen);
  }
  function toast(msg) {
    const t = root.querySelector('[data-toast]'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  const onClick = (e) => {
    const t = e.target;
    const open = t.closest('[data-open]');
    if (open) { e.preventDefault(); opts.onOpen && opts.onOpen(); return; }
    if (t.closest('[data-back]')) { e.preventDefault(); opts.onBack && opts.onBack(); return; }
    const plan = t.closest('[data-plan]');
    if (plan) { opts.onPlan && opts.onPlan(plan.dataset.plan); return; }
    const q = t.closest('[data-queue]');
    if (q) { queuing = q.dataset.queue; render(); const ta = root.querySelector('.nfm-note'); if (ta) { const prev = Q()[queuing]; if (prev) ta.value = prev.note || ''; ta.focus(); } return; }
    const chip = t.closest('[data-chip]');
    if (chip) { if (chip.dataset.chip === 'pick') toast('Changing products is the existing wizard step. The queued month keeps your current products.'); return; }
    const sq = t.closest('[data-save-queue]');
    if (sq) { const month = sq.dataset.saveQueue; const note = (root.querySelector('.nfm-note') || {}).value || ''; Q()[month] = { note: note.trim() }; queuing = null; render(); toast(`${month} is queued. It launches ${opensOn(month)} by itself with your ${curMonth()} brief; first post by ${firstBy(month)}.`); return; }
    if (t.closest('[data-cancel-queue]')) { queuing = null; render(); return; }
    const mo = t.closest('[data-more]');
    if (mo) { more = mo.dataset.more === '1'; render(); return; }
    const inert = t.closest('[data-inert]');
    if (inert) { e.preventDefault(); toast(inert.dataset.inert); }
  };
  root.addEventListener('click', onClick);
  render();

  return {
    setDay(key) { if (DB[key] && key !== stateKey) { stateKey = key; queuing = null; more = false; try { localStorage.setItem('acState', key); } catch { /* ok */ } if (!DB[key].runs.length) screen = 'overview'; render(); } },
    setScreen(next) { const want = next === 'track' && S().runs.length ? 'track' : 'overview'; if (want !== screen) { screen = want; render(); } return screen; },
    day: () => stateKey,
    nextMonth: () => (S().opportunities.find((o) => o.state !== 'queue') || S().opportunities[0]).content_month,
    toast,
    destroy() { root.removeEventListener('click', onClick); root.innerHTML = ''; },
  };
}
