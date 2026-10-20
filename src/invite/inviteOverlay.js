/*
 * Amine's Invite Creators modal (repo AmineBenjil/invite-creators-prototype),
 * copied untouched into public/invite-creators/ by scripts/sync-invite.sh.
 *
 * "Review Creators" on the Day 3 tracker state (CreatorsFound in amine.jsx)
 * opens it in a full-screen iframe over the page. His background page
 * (sidebar + campaign header) is hidden so our tracker shows through his dim.
 * Closing his modal (×, overlay click, Esc) hides the iframe; it stays alive,
 * so the shortlist survives a close and reopen until the page reloads.
 * Nothing here edits his files, so a re-sync is one command.
 */
const SRC = `${import.meta.env.BASE_URL}invite-creators/index.html`;

const EMBED_CSS = `
  html { overscroll-behavior: none; }
  html, body { background: transparent !important; }
  body { min-width: 0 !important; min-height: 0 !important; }
  .sidebar, .page-head { display: none !important; }
  .overlay, .modal { position: fixed !important; }
  /* his page is 982 tall; on shorter screens keep the modal (821) clear of his V1/V2/V3 pill */
  .modal { top: max(50%, 470px) !important; }
`;

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
  show(false); // until the embed CSS is in, so his background page never flashes
  frame.addEventListener('load', () => {
    const doc = frame.contentDocument;
    const st = doc.createElement('style');
    st.textContent = EMBED_CSS;
    doc.head.appendChild(st);
    const modal = doc.getElementById('modal');
    new MutationObserver(() => {
      if (modal.classList.contains('hidden')) show(false);
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    ready = true;
    show(true);
  });
  document.body.appendChild(frame);
}

document.addEventListener('click', (e) => {
  if (!e.target.closest?.('.am-found-btn')) return;
  e.preventDefault();
  e.stopPropagation();
  open();
}, true);
