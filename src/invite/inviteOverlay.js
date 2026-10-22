/*
 * Amine's Invite Creators popup, v2 (repo AmineBenjil/invite-creators-prototype-v2),
 * V1 layout only, copied untouched into public/invite-creators/ by scripts/sync-invite.sh.
 *
 * "Review Creators" on the Day 3 tracker state (CreatorsFound in amine.jsx)
 * opens it in a full-screen iframe over the page. His background page
 * (sidebar, campaign header, "approved" dashboard card) and his V1 to V4
 * switch are hidden, so our tracker shows through his dim. V1's own
 * "Not a fit: Popup | Inline" option stays (still an open choice).
 * Closing his popup (×, backdrop, Esc, Done) hides the iframe; it stays alive,
 * so choices and the sent state survive a close and reopen until reload.
 *
 * Copy: every string is his, verbatim. Nothing here edits his files, so a
 * re-sync is one command.
 */
const SRC = `${import.meta.env.BASE_URL}invite-creators/index.html#v1`;

const EMBED_CSS = `
  html { overscroll-behavior: none; }
  html, body { background: transparent !important; }
  body { min-width: 0 !important; min-height: 0 !important; }
  .sidebar, .page-head, .sent-banner, .ver { display: none !important; }
  .overlay, .modal { position: fixed !important; }
  .ver-sub { left: 16px !important; top: 14px !important; }
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
    try {
      frame.contentWindow.eval('setOpen')(true);   // his own open, so his state stays in step
    } catch {
      const doc = frame.contentDocument;
      doc.getElementById('overlay')?.classList.remove('hidden');
      const m = doc.getElementById('modal-v1');
      if (m) m.hidden = false;
    }
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
    const overlay = doc.getElementById('overlay');
    new MutationObserver(() => {
      if (overlay.classList.contains('hidden')) show(false);
    }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
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
