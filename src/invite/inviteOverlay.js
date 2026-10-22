/*
 * Invite Creators: Amine's v2 popup, V1 layout only, cleaned for engineering
 * (public/invite-creators/, see its README.md for what changed from his build).
 *
 * Two doors on the tracker open it in a full-screen iframe over the page:
 *   - "Review Creators" on Day 3 (CreatorsFound in amine.jsx): the first round,
 *     with the campaign's spots (SPOTS).
 *   - "Review matches" on Day 11 (the rematch row in either table): a rematch
 *     for the open spots (the found rows that day).
 * His background page (sidebar + campaign header) is hidden so our tracker
 * shows through his dim. The page and this file talk with postMessage:
 * invite:closed { sent } when it closes, invite:open to reopen it. Once
 * invites are sent, closing it moves the tracker on to the table (Day 3 to
 * Day 4, Day 11 to Day 13): after Send the dashboard is the creators table.
 * Each round keeps its iframe, so choices survive a close and reopen; the page
 * also saves them as the brand goes (sessionStorage).
 */
import { SPOTS, crewFor } from '../components/pulse/pulseData.js';
import { forks } from '../components/pulse/forks.js';

const SRC = `${import.meta.env.BASE_URL}invite-creators/index.html`;

const EMBED_CSS = `
  html { overscroll-behavior: none; }
  html, body { background: transparent !important; }
  .sidebar, .page-head { display: none !important; }
`;

const collab = () => (forks.get('type') === 'local' ? 'local' : 'product');
const openSpots = (day) => crewFor(day, collab()).filter((c) => c.mystery && c.found).length || 1;

const ROUNDS = {
  first: { next: 4, query: () => `?spots=${SPOTS}` },
  rematch: { next: 13, query: () => `?mode=rematch&spots=${openSpots(11)}` },
};
const frames = {};

const show = (frame, on) => {
  frame.style.visibility = on ? 'visible' : 'hidden';
  frame.style.pointerEvents = on ? 'auto' : 'none';
  if (on) frame.focus();
};

// The tracker's own day scrubber moves the demo (its day state lives inside CampaignPulse)
function goToDay(day) {
  const btn = [...document.querySelectorAll('.cp-scrubber .cp-scrub-day')]
    .find((b) => b.textContent.trim() === `D${day}` || b.textContent.trim().startsWith(`Day ${day} ·`));
  btn?.click();
}

function open(round) {
  const known = frames[round];
  if (known) {
    if (!known.ready) return;
    known.el.contentWindow.postMessage({ type: 'invite:open' }, location.origin);
    show(known.el, true);
    return;
  }
  const el = document.createElement('iframe');
  el.src = SRC + ROUNDS[round].query();
  el.title = 'Invite Creators';
  el.className = 'ic-embed';
  Object.assign(el.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    border: '0', background: 'transparent', zIndex: '2147483000',
  });
  const f = { el, ready: false };
  frames[round] = f;
  show(el, false); // until the embed CSS is in, so his background page never flashes
  el.addEventListener('load', () => {
    const st = el.contentDocument.createElement('style');
    st.textContent = EMBED_CSS;
    el.contentDocument.head.appendChild(st);
    f.ready = true;
    show(el, true);
  });
  document.body.appendChild(el);
}

window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || e.data?.type !== 'invite:closed') return;
  const round = Object.keys(frames).find((k) => frames[k].el.contentWindow === e.source);
  if (!round) return;
  show(frames[round].el, false);
  if (e.data.sent) goToDay(ROUNDS[round].next);
});

const ROUND_FOR = (el) => {
  if (el.closest('.am-found-btn')) return 'first';
  const btn = el.closest('button, .am-row-cta');
  return btn && btn.textContent.trim().endsWith('Review matches') ? 'rematch' : null;
};

document.addEventListener('click', (e) => {
  const round = e.target instanceof Element && ROUND_FOR(e.target);
  if (!round) return;
  e.preventDefault();
  e.stopPropagation();
  open(round);
}, true);
