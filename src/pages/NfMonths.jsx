import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NF_SHELL } from '../data/newFlowHtml.js';
import { forks } from '../components/pulse/forks.js';
import NfForkBar from './NfForkBar.jsx';
import { createMonths, DAYS } from '../months/monthsEngine.js';
import '../styles/pulse.css';
import '../styles/months.css';

/*
 * /nf/months and /nf/months/track — directions A + C from the Sep 8 study
 * "October, On Track": the campaigns overview relabeled by content month with a
 * count of promised and a pace line, and the tracker with the pace line as its
 * hero. Same captured chrome as the rest of /nf (NF_SHELL header + sidebar,
 * content inside production's .workspace-content-shell). Fully wired:
 * "Start my campaign" / "Launch now" hand off to the REAL wizard at setup
 * (/nf/step2, the intro screen is skipped per Tony), whose copy NewFlow patches
 * in months mode; the wizard's back links and the launch screen's "Campaigns"
 * return here. V1 as settled on the Sep 8 Tony call: same blocks, new syntax,
 * one date (first content expected), a Campaign timeline box, no lateness states.
 */
export default function NfMonths({ screen = 'overview' }) {
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const engineRef = useRef(null);
  const [day, setDayState] = useState('week4');

  const go = (next) => navigate('/nf/' + next);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return undefined;
    const engine = createMonths(el, {
      onRender: (k) => setDayState(k),
      onOpen: () => navigate('/nf/months/track'),
      onBack: () => navigate('/nf/months'),
      onPlan: (month, todayISO) => {
        // the real captured wizard, intro screen skipped (Tony, Sep 8): straight to setup,
        // already named for the month (NewFlow.jsx patches the copy); the prototype's
        // "today" rides along so the launch screen dates from it, not the real clock
        if (typeof window !== 'undefined' && window.__nfLive) Object.assign(window.__nfLive, { monthsTarget: month, monthsToday: todayISO });
        navigate('/nf/step2');
      },
    });
    engineRef.current = engine;
    engine.setScreen(screen);
    return () => { engine.destroy(); engineRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    const got = e.setScreen(screen);
    if (got !== screen && screen === 'track') navigate('/nf/months', { replace: true });
  }, [screen, navigate]);

  const onShellClick = (e) => {
    if (mountRef.current && mountRef.current.contains(e.target)) return;
    const el = e.target.closest('a, button');
    if (!el) return;
    e.preventDefault();
    const txt = el.textContent.trim();
    const toast = engineRef.current?.toast;
    if (txt === 'Campaigns' || (el.getAttribute('aria-label') || '').toLowerCase().includes('home')) { navigate('/nf/months'); return; }
    if (txt === 'Settings') { navigate('/nf/settings'); return; }
    if (/UGC Studio|Push Alerts|Brand Intelligence/.test(txt)) { toast && toast('Coming soon in production too.'); }
  };

  useEffect(() => forks.sub((s) => {
    if (s.model === 'campaigns') navigate(forks.get('type') === 'local' ? '/nf/gc-overview' : '/nf/overview');
    if (s.model === 'roster') navigate('/nf/roster');
  }), [navigate]);
  useEffect(() => { if (forks.get('model') !== 'months') forks.set('model', 'months'); }, []);

  return (
    <>
      <div className="nf" onClick={onShellClick}>
        <div className="brand-dashboard svelte-187rxgr">
          <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: NF_SHELL.header }} />
          <div className="dashboard-body svelte-187rxgr">
            <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: NF_SHELL.sidebar }} />
            <main className="workspace-content svelte-187rxgr" aria-busy="false">
              <div className="workspace-content-shell svelte-187rxgr">
                <div className="nf-months" ref={mountRef} />
              </div>
            </main>
          </div>
          <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: NF_SHELL.backdrop }} />
        </div>
      </div>
      <NfForkBar go={go} />
      <div className="cp-mode cp-mode--opts nf-forkbar nf-roster-days" role="group" aria-label="Months day">
        <span className="cp-scrub-tag">TODAY IS</span>
        {DAYS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={day === key ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'}
            onClick={() => { engineRef.current?.setDay(key); if (key === 'signed' && screen === 'track') navigate('/nf/months'); }}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
