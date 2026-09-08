import { useEffect, useState } from 'react';
import { forks, FORK_DEFS } from '../components/pulse/forks.js';

/*
 * The fork switchboard for /nf pages — the same black cp-mode bar the
 * tracker wears, mirrored across the creation flow so every fork can be
 * flipped anywhere and holds everywhere (shared forks store).
 * The ⚙ opens the admin drawer: one row per fork in FORK_DEFS — the
 * extensible home for every configuration as Julia specs them.
 */
export default function NfForkBar({ go }) {
  const [, tickState] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => forks.sub(() => tickState((t) => t + 1)), []);

  const setFork = (key, v) => {
    if (forks.get(key) === v) return;
    forks.set(key, v);
    // collab type re-roots the demo into that flow's overview
    if (key === 'type') go(v === 'local' ? 'gc-overview' : 'overview');
  };

  const seg = (def) => def.options.map(([val, label]) => (
    <button
      key={String(val)}
      type="button"
      className={forks.get(def.key) === val ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'}
      onClick={() => setFork(def.key, val)}
    >
      {label}
    </button>
  ));

  const bar = FORK_DEFS.filter((d) => d.key !== 'rui'); // review UI lives in the drawer only

  return (
    <>
      <div className="cp-mode nf-forkbar" role="group" aria-label="Demo config">
        {bar.map((def, i) => (
          <span key={def.key} className="nf-forkbar__group">
            {i > 0 && <span className="cp-mode-sep" aria-hidden />}
            <span className="cp-scrub-tag">{def.label.toUpperCase()}</span>
            {seg(def)}
          </span>
        ))}
        <span className="cp-mode-sep" aria-hidden />
        <button type="button" className={open ? 'cp-scrub-day cp-scrub-day--active' : 'cp-scrub-day'} onClick={() => setOpen((o) => !o)}>
          ⚙ All forks
        </button>
      </div>

      {open && (
        <div className="nf-forkdrawer" role="dialog" aria-label="Campaign forks">
          <div className="nf-forkdrawer__head">
            <strong>Campaign forks</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close forks panel">✕</button>
          </div>
          <p className="nf-forkdrawer__sub">
            Every configuration the prototype can play. Flip a fork here and the whole
            flow — wizard, brief, tracker — follows. More forks land as the logic firms up.
          </p>
          {FORK_DEFS.map((def) => (
            <div key={def.key} className="nf-forkdrawer__row">
              <div className="nf-forkdrawer__label">
                {def.label}
                <span>{def.hint}</span>
              </div>
              <div className="nf-forkdrawer__seg">{seg(def)}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
