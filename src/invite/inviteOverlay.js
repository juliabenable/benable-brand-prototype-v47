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
 * button version) and the copy changes Julia asked for (fixCopy below).
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

/* Copy: every product string comes from Amine's build as synced, EXCEPT the
   changes Julia asks for, which all live here (and go to Amine as a list).
   Oct 20, Julia: the "creators you know" list also holds creators the brand
   picked in a past campaign who never got their turn (tag "Missed last time"),
   so it can't say only "loved working with". Lines from the copywriter, PROPOSED. */
const KN_SUB_HIS = 'Creators you loved working with are already on your list';
const KN_SUB_OURS = 'Creators you loved working with or picked last time';
function fixCopy(doc, win) {
  // top bar subtitle: his renderKnownBar rewrites it on every change
  const sub = doc.getElementById('knSub');
  const swapSub = () => { if (sub.textContent === KN_SUB_HIS) sub.textContent = KN_SUB_OURS; };
  swapSub();
  new MutationObserver(swapSub).observe(sub, { childList: true, characterData: true, subtree: true });

  // "We added for you" row: "8 creators: 5 you loved working with, 3 you picked last time"
  // (a zero part is dropped; "creator" for one). His code keeps updating #waCount.
  const b = doc.getElementById('waCount')?.parentElement;
  const tail = b?.nextSibling;
  let api = null;
  try { api = win.eval('mockApi'); } catch { /* his data layer moved: leave his line */ }
  if (!b || !tail || !api) return;
  const noun = [...b.childNodes].find((n) => n.nodeType === 3);
  const rest = doc.createElement('span');
  tail.replaceWith(rest);
  const render = () => {
    const added = api.shortlist().filter((c) => c.source === 'known' && c.priority);
    const loved = added.filter((c) => c.tag !== 'missed').length;
    const picked = added.length - loved;
    if (noun) noun.textContent = added.length === 1 ? ' creator' : ' creators';
    rest.textContent = loved && picked
      ? `: ${loved} you loved working with, ${picked} you picked last time`
      : picked ? ' you picked last time' : ' you loved working with';
  };
  render();
  api.onChange(render);
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
    fixCopy(doc, frame.contentWindow);
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
