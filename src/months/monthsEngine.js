/* The Months version, V1 as Tony and Julia settled it on the Sep 8 call
   ("Selling Months not Campaigns, first pass"): keep the existing blocks, change
   the syntax. Mounted inside the /nf production chrome (pages/NfMonths.jsx).

   Decided on the call (Tony, Sep 8):
   - Campaigns are named by their content month ("November content"); the first
     campaign's month is where its first content lands. 8-week baseline.
   - One date, not two: "First content expected, week of {date}". No "all by"
     (the long tail stretches). No live pace, no "running behind", no reds.
   - A "Campaign timeline" box on the campaign page: "Currently week X of 8",
     the first-content date, and an (i) that explains the 8-week benchmark.
     Top-right column, above "While you were away".
   - Monthly unlocks stay exactly as they are (30 days from payment).
   - The wizard's intro screen goes: the overview tile says "Start my campaign"
     and opens setup directly, already named for the month.
   Kept out on purpose: lateness / at-risk states, queueing months ahead,
   fast mode (rush fee + auto-approve, Tony's idea for later). */

export const DAYS = [
  ['signed', 'Sep 8 · signed today'],
  ['week4', 'Oct 5 · week 4 of 8'],
  ['landed', 'Nov 10 · first content in'],
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthAfter = (name, k = 1) => MONTHS[(MONTHS.indexOf(name) + k + 12) % 12];

/* The timeline rule, written once so engineering and the prototype agree:
   first_content_expected = launch + 56 days, shown as "week of {Monday}";
   content_month = the month that date falls in; week_of_8 = floor(days/7) + 1. */
const DAY = 86400000;
const fmt = (d) => `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${d.getDate()}`;
const mondayOf = (d) => { const m = new Date(d); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return m; };
export function timeline(launchISO, todayISO) {
  const launch = new Date(launchISO + 'T12:00:00');
  const today = new Date(todayISO + 'T12:00:00');
  const first = new Date(launch.getTime() + 56 * DAY);
  const days = Math.max(0, Math.round((today - launch) / DAY));
  const week = Math.floor(days / 7) + 1;
  return {
    launch: fmt(launch),
    first_content: fmt(mondayOf(first)),
    content_month: MONTHS[first.getMonth()],
    week,
    weekLabel: week <= 8 ? `Week ${week} of 8` : `Week ${week} · long tail`,
    pct: Math.min(100, Math.round((Math.min(week, 8) / 8) * 100)),
  };
}
export const contentMonthFor = (launchISO) => timeline(launchISO, launchISO).content_month;
export const firstContentFor = (launchISO) => timeline(launchISO, launchISO).first_content;

const CREATORS = [
  ['Maya Ruiz', '@maya.routine'], ['Jordan Kim', '@jordan.skin'], ['Priya Shah', '@priya.glow'], ['Elena Voss', '@elenav.daily'],
  ['Tasha Moore', '@tashamoore'], ['Noor Ali', '@noor.routine'], ['Camille Dubois', '@camille.d'], ['Ines Lopez', '@ines.lo'],
  ['Sofia Bell', '@sofiabell.skin'], ['Harper Wu', '@harperwu'],
];
const creator = (i, stage, when) => ({ name: CREATORS[i][0], handle: CREATORS[i][1], stage, when });

const RUN = { id: 88, title: 'Fall Campaign', launchISO: '2026-09-10', promised: 10 };

const DB = {
  signed: {
    todayISO: '2026-09-08', today: 'Sep 8',
    runs: [],
    opportunities: [
      { content_month: 'November', state: 'available', cta: 'Start my campaign',
        copy: 'Your first campaign is <b>November content</b>: first content is expected about eight weeks after you launch, and the campaign runs on from there.' },
      { content_month: 'December', state: 'locked', unlocks: 'Oct 8', in_days: 30 },
    ],
  },
  week4: {
    todayISO: '2026-10-05', today: 'Oct 5',
    runs: [Object.assign({}, RUN, {
      status: 'Active', live: 0,
      now: '10 creators have product and are filming',
      creators: [
        creator(0, 'Order delivered', 'filming'), creator(1, 'Order delivered', 'filming'), creator(2, 'Order delivered', 'filming'),
        creator(3, 'Order delivered', 'filming'), creator(4, 'Order delivered', 'filming'), creator(5, 'Order delivered', 'filming'),
        creator(6, 'Order delivered', 'filming'), creator(7, 'Order delivered', 'filming'), creator(8, 'Order shipped', 'arrives Oct 7'), creator(9, 'Order shipped', 'arrives Oct 7'),
      ],
      upNext: 'Drafts start arriving around week 5. We review each one for quality before it goes live.',
    })],
    opportunities: [
      { content_month: 'December', state: 'locked', unlocks: 'Oct 8', in_days: 3 },
    ],
  },
  landed: {
    todayISO: '2026-11-10', today: 'Nov 10',
    runs: [Object.assign({}, RUN, {
      status: 'Active', live: 3, first_landed: 'Nov 4',
      now: '3 posts live, 7 creators finishing',
      creators: [
        creator(0, 'Content published', 'Nov 4'), creator(1, 'Content published', 'Nov 6'), creator(2, 'Content published', 'Nov 9'),
        creator(3, 'Draft approved', 'posts this week'), creator(4, 'Draft approved', 'posts this week'), creator(5, 'Order delivered', 'filming'),
        creator(6, 'Order delivered', 'filming'), creator(7, 'Order delivered', 'filming'), creator(8, 'Order delivered', 'filming'), creator(9, 'Order delivered', 'filming'),
      ],
      upNext: 'The rest of the posts land over the next few weeks. We keep chasing so you do not have to.',
    })],
    opportunities: [
      { content_month: 'December', state: 'available', cta: 'Launch now',
        copy: 'Your next campaign is ready. Everything from November is saved, so it takes a few minutes to review and go live.' },
      { content_month: 'January', state: 'locked', unlocks: 'Dec 8', in_days: 28 },
    ],
  },
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const initials = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const ARROW = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M5 10h10M11 5l5 5-5 5"/></svg>';
const BACK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M10 3L5 8l5 5"/></svg>';
const INFO = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><path d="M8 7v4.5M8 4.8v.4" stroke-linecap="round"/></svg>';
const GRADIENT = 'https://benable.com/_app/immutable/assets/campaign-window-gradient.DdmQlVVC.webp';

/* the (i) explainer, Tony's words as the frame */
const TIMELINE_ROWS = [
  ['Week 1', 'We match your creators; you approve them'],
  ['Week 2', 'Invites out, creators accept within 48 hours'],
  ['Weeks 2 to 3', 'Product ships and arrives'],
  ['Weeks 3 to 5', 'Creators film with your product'],
  ['Weeks 5 to 7', 'Drafts come in; we review each one'],
  ['Weeks 7 to 8', 'First posts go live'],
  ['After week 8', 'The rest land over the following weeks'],
];
export const TIMELINE_INFO = {
  title: 'How a campaign runs',
  lead: 'A classic campaign takes about eight weeks. The industry benchmark is eight to ten, and we aim to be a bit faster. Every step can run a little faster or slower, and the last posts can trail on; this is what we manage towards.',
  rows: TIMELINE_ROWS,
};

export function createMonths(root, opts = {}) {
  let stateKey = 'week4';
  let screen = 'overview';
  let infoOpen = false;
  let toastT;
  const S = () => DB[stateKey];
  try { const s = localStorage.getItem('acState'); if (s && DB[s]) stateKey = s; } catch { /* fresh */ }

  const tl = (r) => timeline(r.launchISO, S().todayISO);

  /* ---------- overview (production classes, new syntax) ---------- */
  function runCard(r) {
    const t = tl(r);
    const landed = r.live > 0;
    const progress = landed
      ? `<div class="campaign-card__progress-copy svelte-1fvpax8"><strong class="svelte-1fvpax8">${r.live}</strong> <span class="svelte-1fvpax8">of ${r.promised} live</span></div>`
      : `<div class="campaign-card__progress-copy svelte-1fvpax8"><strong class="svelte-1fvpax8">Week ${Math.min(t.week, 8)}</strong> <span class="svelte-1fvpax8">of 8</span></div>`;
    const line = landed
      ? `First content landed <b>${r.first_landed}</b>, expected the week of ${t.first_content}`
      : `First content expected the week of <b>${t.first_content}</b>`;
    const pct = landed ? Math.round((r.live / r.promised) * 100) : t.pct;
    return `
    <a class="campaign-card svelte-1fvpax8" href="#" data-open="${r.id}" aria-label="Open ${esc(t.content_month)} content, ${esc(r.title)}">
      <div class="campaign-card__heading svelte-1fvpax8">
        <span class="campaign-card__date svelte-1fvpax8"><strong class="svelte-1fvpax8">${esc(t.content_month)} content</strong> · launched ${t.launch}</span>
        <h2 class="svelte-1fvpax8">${esc(r.title)}</h2>
      </div>
      <p class="campaign-card__subtitle svelte-1fvpax8">${esc(r.now)}</p>
      <div class="nfm-bottom">
        ${progress}
        <div class="nfm-pace">${line}</div>
        <div class="campaign-card__progress svelte-1fvpax8 ${landed ? '' : 'nfm-weeks'}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width: ${pct}%" class="svelte-1fvpax8"></span></div>
      </div>
      <span class="campaign-card__open svelte-1fvpax8" aria-hidden="true">${ARROW}</span>
    </a>`;
  }

  function oppCard(o) {
    if (o.state === 'locked') {
      return `
      <article class="opportunity opportunity--locked svelte-75h9ek">
        <div class="opportunity__locked-copy svelte-75h9ek"><h2 class="svelte-75h9ek">${esc(o.content_month)} content</h2><p class="svelte-75h9ek">Your next campaign unlocks ${esc(o.unlocks)}.</p></div>
        <span class="opportunity__countdown svelte-75h9ek">in <strong class="svelte-75h9ek">${o.in_days} days</strong></span>
      </article>`;
    }
    return `
    <article class="opportunity opportunity--action svelte-75h9ek">
      <span class="opportunity__visuals svelte-75h9ek" aria-hidden="true"><img class="opportunity__action-gradient svelte-75h9ek" src="${GRADIENT}" alt=""> <span class="opportunity__action-overlay svelte-75h9ek"></span></span>
      <div class="opportunity__action-copy svelte-75h9ek">
        <div class="opportunity__title-row svelte-75h9ek"><h2 class="svelte-75h9ek">${esc(o.content_month)} content</h2></div>
        <p class="svelte-75h9ek">${o.copy}</p>
      </div>
      <button type="button" class="opportunity__action svelte-75h9ek" data-plan="${esc(o.content_month)}">${esc(o.cta)}</button>
    </article>`;
  }

  function renderOverview() {
    const s = S();
    const runs = s.runs.map(runCard).join('');
    const opps = s.opportunities.map(oppCard).join('');
    return `
    <div class="campaign-overview svelte-9w8so5 nfm-overview">
      <header class="overview-header svelte-9w8so5"><div><h1 class="svelte-9w8so5">Campaigns Overview</h1> <p class="svelte-9w8so5">Each campaign is a month of content. Manage your active campaigns and creator relationships.</p></div></header>
      <div class="overview-controls svelte-9w8so5">
        <div class="overview-tabs svelte-9w8so5" role="tablist" aria-label="Campaign overview"><button type="button" role="tab" class="svelte-9w8so5 active">Active</button> <button type="button" role="tab" class="svelte-9w8so5" data-inert="Completed campaigns land here with the full report and every post">Completed</button></div>
        <div class="nfm-plan-line">Today is <b>${s.today}</b></div>
      </div>
      <section class="overview-stack svelte-9w8so5">
        <section class="campaign-group svelte-9w8so5"><div class="campaign-group__reveal svelte-9w8so5"><div class="campaign-group__cards svelte-9w8so5">${runs}${opps}</div></div></section>
      </section>
    </div>`;
  }

  /* ---------- campaign page: production header, timeline box top right ---------- */
  function timelineBox(r) {
    const t = tl(r);
    const landed = r.live > 0;
    return `
    <section class="nfm-timeline" aria-label="Campaign timeline">
      <div class="nfm-timeline__head"><h3>Campaign timeline</h3><button type="button" class="nfm-info" data-info aria-label="How a campaign runs">${INFO}<span>More info</span></button></div>
      <div class="nfm-timeline__week">Currently <b>${t.weekLabel.toLowerCase()}</b></div>
      <div class="nfm-timeline__bar" aria-hidden="true"><span style="width:${t.pct}%"></span></div>
      <div class="nfm-timeline__first">${landed ? `First content landed <b>${r.first_landed}</b>` : `First content expected <b>week of ${t.first_content}</b>`}</div>
      ${landed ? `<div class="nfm-timeline__sub">Expected the week of ${t.first_content}. The rest lands over the following weeks.</div>` : `<div class="nfm-timeline__sub">Launched ${t.launch}. Most campaigns take about eight weeks; the last posts can trail on.</div>`}
    </section>`;
  }

  function infoPopup() {
    const rows = TIMELINE_INFO.rows.map(([w, what]) => `<tr><th scope="row">${esc(w)}</th><td>${esc(what)}</td></tr>`).join('');
    return `
    <div class="nfm-scrim" data-close-info>
      <div class="nfm-pop" role="dialog" aria-modal="true" aria-label="${esc(TIMELINE_INFO.title)}">
        <div class="nfm-pop__head"><h3>${esc(TIMELINE_INFO.title)}</h3><button type="button" class="nfm-pop__close" data-close-info aria-label="Close">&#x2715;</button></div>
        <p>${esc(TIMELINE_INFO.lead)}</p>
        <table class="nfm-pop__tbl"><tbody>${rows}</tbody></table>
      </div>
    </div>`;
  }

  function renderTracker() {
    const r = S().runs[0];
    if (!r) return renderOverview();
    const t = tl(r);
    const rows = r.creators.map((c) => {
      const done = c.stage === 'Content published';
      const now = c.stage === 'Draft approved' || c.stage === 'Order delivered';
      return `<tr>
        <td><div class="nfm-who"><span class="nfm-av">${initials(c.name)}</span><div><b>${esc(c.name)}</b><br><span>${esc(c.handle)}</span></div></div></td>
        <td><span class="nfm-st ${done ? 'done' : now ? 'now' : ''}">${esc(c.stage)}</span></td>
        <td class="r"><span class="nfm-when">${esc(c.when)}</span></td>
      </tr>`;
    }).join('');
    return `
    <section class="workflow-page nfm-track">
      <div class="workspace-grid">
        <main class="main-column">
          <header class="workflow-header">
            <a class="workflow-header-backlink" href="#" data-back><span class="icon" aria-hidden="true">${BACK}</span> <span>Campaigns</span></a>
            <div class="workflow-header-row">
              <div class="workflow-header-main">
                <span class="campaign-card__date svelte-1fvpax8 nfm-monthpill"><strong class="svelte-1fvpax8">${esc(t.content_month)} content</strong></span>
                <h1>${esc(r.title)}</h1>
                <span class="phase-pill phase-pill--active"><span class="phase-pill-dot" aria-hidden="true"></span> <span>${esc(r.status)}</span></span>
              </div>
              <div class="header-right"><button type="button" class="workflow-header-edit-btn" data-inert="Edit campaign is unchanged; it opens the brief">Edit Campaign</button></div>
            </div>
          </header>
          <div>
            <section class="workflow-stage-shell">
              <section class="stage-primary-surface">
                <div class="workflow-dashboard-controls"><nav class="workflow-dashboard-tabs" aria-label="Campaign dashboard tabs"><button type="button" class="workflow-dashboard-tab active">Dashboard</button> <button type="button" class="workflow-dashboard-tab" data-inert="Content lands here once creators submit and Benable approves it">Content</button></nav></div>
                <div class="nfm-grid">
                  <section class="nfm-panel" aria-label="Creators">
                    <h3>Creators</h3>
                    <p class="sub">${r.promised} on this campaign · ${esc(r.now)}</p>
                    <div class="nfm-tbl-wrap"><table class="nfm-tbl"><thead><tr><th>Creator</th><th>Stage</th><th class="r">Next</th></tr></thead><tbody>${rows}</tbody></table></div>
                  </section>
                  <aside class="nfm-rail">
                    ${timelineBox(r)}
                    <section class="nfm-railcard" aria-label="Up next"><h3>Up next</h3><p>${esc(r.upNext)}</p></section>
                  </aside>
                </div>
              </section>
            </section>
          </div>
        </main>
      </div>
      ${infoOpen ? infoPopup() : ''}
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
    if (t.closest('[data-open]')) { e.preventDefault(); opts.onOpen && opts.onOpen(); return; }
    if (t.closest('[data-back]')) { e.preventDefault(); opts.onBack && opts.onBack(); return; }
    const plan = t.closest('[data-plan]');
    if (plan) { opts.onPlan && opts.onPlan(plan.dataset.plan); return; }
    if (t.closest('[data-info]')) { infoOpen = true; render(); return; }
    if (t.closest('.nfm-pop') && !t.closest('[data-close-info]')) return;
    if (t.closest('[data-close-info]')) { infoOpen = false; render(); return; }
    const inert = t.closest('[data-inert]');
    if (inert) { e.preventDefault(); toast(inert.dataset.inert); }
  };
  const onKey = (e) => { if (e.key === 'Escape' && infoOpen) { infoOpen = false; render(); } };
  root.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  render();

  return {
    setDay(key) { if (DB[key] && key !== stateKey) { stateKey = key; infoOpen = false; try { localStorage.setItem('acState', key); } catch { /* ok */ } if (!DB[key].runs.length) screen = 'overview'; render(); } },
    setScreen(next) { const want = next === 'track' && S().runs.length ? 'track' : 'overview'; if (want !== screen) { screen = want; infoOpen = false; render(); } return screen; },
    day: () => stateKey,
    toast,
    destroy() { root.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); root.innerHTML = ''; },
  };
}
