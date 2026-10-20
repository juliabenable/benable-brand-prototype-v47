/*
 * Amine's Invite Creators modal (repo AmineBenjil/invite-creators-prototype),
 * copied untouched into public/invite-creators/ by scripts/sync-invite.sh.
 *
 * "Review Creators" on the Day 3 tracker state (CreatorsFound in amine.jsx)
 * opens it in a full-screen iframe over the page. His background page
 * (sidebar + campaign header) is hidden so our tracker shows through his dim.
 * Closing his modal (×, overlay click, Esc) hides the iframe; it stays alive,
 * so the shortlist survives a close and reopen until the page reloads.
 *
 * Our changes ride on top, never inside his files, so a re-sync is one command:
 * public/invite-fixes/fixes.css (Figma border/shadow fixes + the black/green
 * button version) and the label fixes below.
 */
const BASE = import.meta.env.BASE_URL;
const SRC = `${BASE}invite-creators/index.html`;
const FIXES = `${BASE}invite-fixes/fixes.css`;

const EMBED_CSS = `
  html { overscroll-behavior: none; }
  html, body { background: transparent !important; }
  body { min-width: 0 !important; min-height: 0 !important; }
  .sidebar, .page-head { display: none !important; }
  .overlay, .modal { position: fixed !important; }
  /* his page is 982 tall; on shorter screens keep the modal (821) clear of his V1/V2/V3 pill */
  .modal { top: max(50%, 470px) !important; }
`;

/* Labels: the right panel's normal-invite group is "Invites" in Amine's design
   (Figma 15204:68686, 15213:112007), not "Also on your list". */
function fixLabels(doc) {
  const title = doc.getElementById('everyoneList')?.closest('.group')?.querySelector('.group-title');
  if (title) title.textContent = 'Invites';
  // creator sub-lines in the V2 popup / V3 table come from his mock data
  const SUBS = [[/^1 campaigns$/, '1 campaign'], [/before her turn/, 'before their turn']];
  const fixSubs = () => doc.querySelectorAll('.pr-sub').forEach((p) => {
    SUBS.forEach(([re, to]) => { if (re.test(p.textContent)) p.textContent = p.textContent.replace(re, to); });
  });
  fixSubs();
  new MutationObserver(fixSubs).observe(doc.body, { childList: true, subtree: true });
}

/* Button version switch: black Shortlist + soft green Priority (default) | Amine's original */
const BTN_KEY = 'ic-buttons';
function buttonSwitch(doc) {
  let mode = 'black';
  try { mode = localStorage.getItem(BTN_KEY) || mode; } catch { /* ok */ }
  const q = new URLSearchParams(location.search).get('buttons');
  if (q === 'black' || q === 'original') mode = q;
  const bar = doc.createElement('div');
  bar.className = 'ic-switch';
  bar.setAttribute('role', 'radiogroup');
  bar.setAttribute('aria-label', 'Button style');
  bar.innerHTML = '<span class="ic-switch-label">Buttons</span>'
    + '<button type="button" role="radio" data-mode="black">Black + green</button>'
    + '<button type="button" role="radio" data-mode="original">Original</button>';
  const set = (m) => {
    mode = m;
    doc.documentElement.classList.toggle('ic-btn-black', m === 'black');
    bar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === m)));
    try { localStorage.setItem(BTN_KEY, m); } catch { /* ok */ }
  };
  bar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) set(b.dataset.mode); });
  doc.body.appendChild(bar);
  set(mode);
}

let frame = null;
let ready = false;

const show = (on) => {
  if (!frame) return;
  frame.style.visibility = on ? 'visible' : 'hidden';
  frame.style.pointerEvents = on ? 'auto' : 'none';
  if (on) frame.focus();
};

function open() {
  if (frame) {
    if (!ready) return;
    const doc = frame.contentDocument;
    doc.getElementById('modal')?.classList.remove('hidden');
    doc.getElementById('overlay')?.classList.remove('hidden');
    show(true);
    return;
  }
  frame = document.createElement('iframe');
  frame.src = SRC;
  frame.title = 'Invite Creators';
  frame.className = 'ic-embed';
  Object.assign(frame.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    border: '0', background: 'transparent', zIndex: '2147483000',
  });
  show(false); // until our CSS is in, so his background page never flashes
  frame.addEventListener('load', () => {
    const doc = frame.contentDocument;
    const st = doc.createElement('style');
    st.textContent = EMBED_CSS;
    doc.head.appendChild(st);
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = FIXES;
    const reveal = () => { ready = true; show(true); };
    link.onload = reveal;
    link.onerror = reveal;
    doc.head.appendChild(link);
    fixLabels(doc);
    buttonSwitch(doc);
    const modal = doc.getElementById('modal');
    new MutationObserver(() => {
      if (modal.classList.contains('hidden')) show(false);
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  });
  document.body.appendChild(frame);
}

document.addEventListener('click', (e) => {
  if (!e.target.closest?.('.am-found-btn')) return;
  e.preventDefault();
  e.stopPropagation();
  open();
}, true);
