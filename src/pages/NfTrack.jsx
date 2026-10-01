import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CampaignDetailPage from './CampaignDetailPage.jsx';
import { NF_SHELL, NF_STATES } from '../data/newFlowHtml.js';
import { forks } from '../components/pulse/forks.js';
import { getPulseScene } from '../components/pulse/CampaignPulse.jsx';
import { crewFor } from '../components/pulse/pulseData.js';

/* production's tracker frames (Aug 20, campaigns 88/89): the Content tab's
   empty state (capture 52) and the locked Campaign details modal (53) */
const pickHtml = (key, part, sel) => {
  const t = document.createElement('div');
  t.innerHTML = NF_STATES[key]?.[part] || '';
  return t.querySelector(sel)?.outerHTML || '';
};
const PROD_CONTENT_EMPTY = pickHtml('52-prod-tracker-88-content', 'main', '.campaign-dashboard-placeholder-state');
const PROD_DETAILS_MODAL = NF_STATES['53-prod-campaign-details']?.modal || '';

/* Content shows posts only once something is live (crew stage 5 = published) */
const contentLive = () => {
  const sc = getPulseScene();
  if (!sc) return false;
  return sc.day === 30 || crewFor(sc.day, sc.mode).some((c) => c.stage >= 5);
};

/*
 * /nf/track — the v45 tracker (Campaign Pulse: Amine rail + creators table +
 * review shell + wrap-up), hosted under the NEW-chrome sidebar. The tracker
 * content is the OLD-chrome captured page + pulse overlays, so it must live
 * OUTSIDE the .nf scope (class names like .workflow-header/.workspace-grid
 * exist in BOTH CSS worlds); the layout is a plain grid: .nf-scoped sidebar
 * cell on the left, unscoped old-chrome document on the right.
 */
export default function NfTrack() {
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const [details, setDetails] = useState(false);

  const overviewRoute = () => (forks.get('type') === 'local' ? '/nf/gc-overview' : '/nf/overview');

  // Sidebar (new chrome) clicks
  const onSideClick = (e) => {
    const el = e.target.closest('a, button');
    if (!el) return;
    e.preventDefault();
    const txt = el.textContent.trim();
    const aria = (el.getAttribute('aria-label') || '').toLowerCase();
    if (txt === 'Campaigns' || aria.includes('home')) navigate(overviewRoute());
    else if (txt === 'Settings') navigate('/nf/settings');
  };

  // The tracker's own back-link points at the old-chrome campaigns list —
  // intercept in the CAPTURE phase (before CampaignDetailPage's handler).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const h = (e) => {
      const back = e.target.closest('.workflow-header-backlink, .flow-backlink, .workflow-back-link');
      if (back) {
        e.preventDefault();
        e.stopPropagation();
        navigate(overviewRoute());
        return;
      }
      // "Campaign Details" opens production's locked details modal (capture 53)
      if (e.target.closest('.workflow-header-edit-btn')) {
        e.preventDefault();
        e.stopPropagation();
        setDetails(true);
      }
    };
    el.addEventListener('click', h, true);
    return () => el.removeEventListener('click', h, true);
  }, [navigate]);

  // Patch the tracker's captured campaign title to the card the user opened
  // (the demo data underneath stays the Pikora scenario either way).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let title = '';
    try { title = sessionStorage.getItem('nfTrackTitle') || ''; } catch { /* ok */ }
    const apply = () => {
      const h1 = el.querySelector('.workflow-header-main h1');
      if (title && h1 && h1.textContent !== title) h1.textContent = title;
      // production labels the header button "Campaign Details" (the old chrome said "Campaign Brief")
      const lbl = el.querySelector('.workflow-header-edit-btn span');
      if (lbl && lbl.textContent !== 'Campaign Details') lbl.textContent = 'Campaign Details';
      // Content tab before anything is live = production's empty state, not the old post grid
      const panel = el.querySelector('.content-dashboard-panel');
      if (panel && !panel.dataset.nfEmpty && !contentLive() && PROD_CONTENT_EMPTY) {
        panel.dataset.nfEmpty = '1';
        panel.innerHTML = PROD_CONTENT_EMPTY;
      }
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    if (!details) return;
    const onKey = (e) => { if (e.key === 'Escape') setDetails(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [details]);
  // the details modal carries production's demo brief — title it after the campaign on screen
  const modalRef = useRef(null);
  useEffect(() => {
    if (!details) return;
    const t = wrapRef.current?.querySelector('.workflow-header-main h1')?.textContent;
    const h = [...(modalRef.current?.querySelectorAll('.text-widget') || [])].find((n) => n.textContent.trim() === 'Fall Campaign');
    if (t && h) h.textContent = t;
  }, [details]);
  const onModalClick = (e) => {
    if (e.target.closest('.brand-portal-modal__backdrop, .setup-config-modal-close')) setDetails(false);
  };

  // Sidebar active state: Campaigns
  const sideRef = useRef(null);
  useEffect(() => {
    const aside = sideRef.current?.querySelector('aside');
    if (!aside) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = NF_SHELL.sidebar;
    ['campaigns', 'settings'].forEach((seg) => {
      const src = tmp.querySelector(`a[href$="/${seg}"]`);
      const dst = aside.querySelector(`a[href$="/${seg}"]`);
      if (src && dst) dst.className = src.className;
    });
  }, []);

  return (
    <div className="nf-track">
      {/* the sidebar needs the captured page's wrapper chain — the CSS
          custom properties (--accent, --text-muted) and Inter live on
          .brand-dashboard.svelte-187rxgr */}
      <div className="nf nf--embed nf-track__side" ref={sideRef} onClick={onSideClick}>
        <div className="brand-dashboard svelte-187rxgr" style={{ height: '100%' }}>
          <div
            className="dashboard-body svelte-187rxgr"
            style={{ display: 'block' }}
            dangerouslySetInnerHTML={{ __html: NF_SHELL.sidebar }}
          />
        </div>
      </div>
      <div className="nf-track__main brand-dashboard" ref={wrapRef}>
        <CampaignDetailPage />
      </div>
      {details && (
        <div className="nf nf-track__modal" ref={modalRef} onClick={onModalClick} dangerouslySetInnerHTML={{ __html: PROD_DETAILS_MODAL }} />
      )}
    </div>
  );
}
