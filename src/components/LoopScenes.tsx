import type { CSSProperties, ReactNode } from 'react';

/*
 * The six illustrative scenes of the defect loop, one per stage. Each is plain HTML and CSS driven by
 * a single custom property, --t (0 to 1), set on the scene's root by Pipeline as the reader scrolls:
 * an element with class "at" and --a fades in once --t passes --a, and motion (the cursor, the bars,
 * the blast radius) is calc()'d from --t in globals.css. Nothing here keeps state, so the run plays
 * backwards when you scroll up, and --t: 1 (the default) is the finished frame.
 *
 * Original drawings with synthetic labels: no real tickets, code, tool names or data.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const at = (a: number, extra: Record<string, number | string> = {}) => ({ '--a': a, ...extra }) as CSSProperties;

function Chrome({ title, status, tone, children }: { title: string; status: string; tone: string; children: ReactNode }) {
  return (
    <div className="lcon">
      <div className="lcon__bar">
        <i /><i /><i />
        <span className="lcon__title">{title}</span>
        <span className={`lcon__status lcon__status--${tone} at`} style={at(0.82)}><b />{status}</span>
      </div>
      <div className="lcon__body">{children}</div>
    </div>
  );
}

function Reproduce({ L }: { L: Any }) {
  return (
    <div className="sc sc-repro">
      <div className="mb">
        <div className="mb__bar">
          <i /><i /><i />
          <span className="mb__url">{L.url}</span>
          <span className="mb__rec"><b />{L.rec}</span>
        </div>
        <div className="mb__page">
          <span className="sk sk--h" />
          <span className="sk" style={{ width: '72%' }} />
          <span className="sk" style={{ width: '54%' }} />
          <div className="mb__form">
            <span className="sk sk--in" />
            <span className="sk sk--in" />
            <span className="mb__btn"><span className="mb__ripple" /></span>
          </div>
          <div className="mb__toast at" style={at(0.56)}><b>✕</b>{L.toast}</div>
          <svg className="mb__cur" width="18" height="22" viewBox="0 0 18 22" aria-hidden="true"><path d="M2 2v15.5l4.2-3.7 2.9 6.2 2.6-1.2-2.9-6.1H15z" fill="#0c1220" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        </div>
        <div className="mb__film">
          {Array.from({ length: 9 }, (_, i) => <span key={i} className={i > 5 ? 'is-bad' : ''} style={at(0.06 + i * 0.085, { '--k': 14 })} />)}
        </div>
      </div>
      <p className="sc__res sc__res--red at" style={at(0.8)}><b />{L.result}</p>
    </div>
  );
}

function Fix({ L }: { L: Any }) {
  return (
    <div className="sc sc-fix">
      <div className="tr">
        <p className="sc__cap">{L.trace}</p>
        <ol className="tr__list">
          <li className="tr__f tr__f--origin"><span className="sk" style={{ width: '62%' }} /><em className="tr__tag tr__tag--origin at" style={at(0.36)}>{L.origin}</em></li>
          <li className="tr__f"><span className="sk" style={{ width: '48%' }} /></li>
          <li className="tr__f"><span className="sk" style={{ width: '70%' }} /></li>
          <li className="tr__f tr__f--crash"><span className="sk" style={{ width: '40%' }} /><em className="tr__tag tr__tag--crash">{L.crash}</em></li>
          <li className="tr__pulse" aria-hidden="true" />
        </ol>
      </div>
      <div className="df">
        <p className="df__tab"><b />{L.file}</p>
        <ol className="df__lines">
          <li><span className="sk" style={{ width: '58%' }} /></li>
          <li><span className="sk" style={{ width: '74%' }} /></li>
          <li className="df__del"><span className="sk" style={{ width: '66%' }} /></li>
          <li className="df__add df__add--1"><span className="sk" style={{ width: '78%' }} /></li>
          <li className="df__add df__add--2"><span className="sk" style={{ width: '52%' }} /></li>
          <li><span className="sk" style={{ width: '44%' }} /></li>
          <li><span className="sk" style={{ width: '30%' }} /></li>
        </ol>
        <p className="sc__res sc__res--green at" style={at(0.86)}><b />{L.patch}</p>
      </div>
    </div>
  );
}

function Verify({ L }: { L: Any }) {
  return (
    <div className="sc sc-verify">
      <div className="ag">
        <div className="ag__c ag__c--1"><span className="ag__av">1</span>{L.a1}</div>
        <div className="ag__wall"><span>{L.wall}</span></div>
        <div className="ag__c ag__c--2"><span className="ag__av">2</span>{L.a2}</div>
      </div>
      <div className="rp">
        <div className="rp__row">
          <span className="rp__play" aria-hidden="true" />
          <span className="rp__l">{L.replay}</span>
        </div>
        <div className="rp__bar"><span /></div>
        <div className="rp__flip">
          <span className="rp__face rp__face--red"><b>✕</b>{L.red}</span>
          <span className="rp__face rp__face--green"><b>✓</b>{L.green}</span>
        </div>
      </div>
    </div>
  );
}

/* Regression: a grid of tests. The change sits at one cell; tests within reach are in scope. */
const COLS = 14;
const ROWS = 6;
const CX = 4;
const CY = 2;
const R = 2.7;
const CELLS = Array.from({ length: COLS * ROWS }, (_, n) => {
  const x = n % COLS;
  const y = Math.floor(n / COLS);
  const d = Math.hypot(x - CX, y - CY);
  return { x, y, d, hit: d <= R, self: d === 0 };
});
const HITS = CELLS.filter((c) => c.hit && !c.self).length;

function Regression({ L }: { L: Any }) {
  let order = 0;
  return (
    <div className="sc sc-reg">
      <div className="par">
        <span className="par__l">{L.verify}</span><span className="par__b par__b--v"><span /></span>
        <span className="par__l">{L.regression}</span><span className="par__b par__b--r"><span /></span>
        <em className="par__tag">{L.parallel}</em>
      </div>
      <div className="tg">
        <span className="tg__ring" style={{ left: `${((CX + 0.5) / COLS) * 100}%`, top: `${((CY + 0.5) / ROWS) * 100}%`, width: `${((2 * R + 0.9) / COLS) * 100}%` }} />
        {CELLS.map((c, n) => {
          if (c.self) return <span key={n} className="tg__d tg__d--self" />;
          if (!c.hit) return <span key={n} className="tg__d" />;
          const i = order++;
          return (
            <span key={n} className="tg__d tg__d--in" style={at(0.06 + (c.d / R) * 0.26, { '--g': (0.44 + (i / HITS) * 0.42).toFixed(3) })}><i /></span>
          );
        })}
      </div>
      <div className="lg">
        <span><i className="lg__k lg__k--self" />{L.changed}</span>
        <span><i className="lg__k lg__k--in" />{L.in}</span>
        <span><i className="lg__k" />{L.out}</span>
        <span className="sc__res sc__res--green at" style={at(0.9)}><b />{L.done}</span>
      </div>
    </div>
  );
}

function Review({ L }: { L: Any }) {
  const rows = [
    { label: L.check, w: '46%' },
    { label: L.check, w: '62%' },
    { label: L.check, w: '38%' },
    { label: L.review, w: '54%', tag: L.reviewTag },
  ];
  return (
    <div className="sc sc-chk">
      <ul className="ck">
        {rows.map((r, i) => (
          <li key={i} className={`ck__r${r.tag ? ' ck__r--review' : ''}`} style={at(0.12 + i * 0.18, { '--k': 10 })}>
            <span className="ck__box"><i /><b>✓</b></span>
            <span className="ck__l">{r.label}</span>
            <span className="sk" style={{ width: r.w }} />
            {r.tag && <em className="ck__tag">{r.tag}</em>}
          </li>
        ))}
      </ul>
      <div className="gt">
        <span className="gt__post" /><span className="gt__arm" /><span className="gt__post" />
        <p className="sc__res sc__res--green at" style={at(0.9)}><b />{L.ready}</p>
      </div>
    </div>
  );
}

const SPARKS = Array.from({ length: 12 }, (_, i) => {
  const ang = (i / 12) * Math.PI * 2 + 0.3;
  const r = 70 + (i % 3) * 26;
  return { dx: Math.round(Math.cos(ang) * r), dy: Math.round(Math.sin(ang) * r * 0.7), c: ['#30d158', '#0a84ff', '#ffb020', '#7c5cff'][i % 4] };
});

function Pr({ L }: { L: Any }) {
  return (
    <div className="sc sc-pr">
      <div className="prc">
        <div className="prc__h">
          <span className="prc__open at" style={at(0.08)}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="4" cy="3.5" r="1.8" /><circle cx="4" cy="12.5" r="1.8" /><circle cx="12" cy="12.5" r="1.8" /><path d="M4 5.3v5.4M12 10.7V7.5c0-1.7-1.3-3-3-3H7.5M9 2.5l-2 2 2 2" /></svg>
            {L.open}
          </span>
          <span className="sk" style={{ width: '46%' }} />
        </div>
        <div className="prc__v">
          {(['before', 'after'] as const).map((k, i) => (
            <figure key={k} className={`vid vid--${k} at`} style={at(0.2 + i * 0.16)}>
              <span className="vid__play" aria-hidden="true" />
              <span className="vid__mark" aria-hidden="true">{k === 'before' ? '✕' : '✓'}</span>
              <span className="vid__bar"><span /></span>
              <figcaption>{L[k]}</figcaption>
            </figure>
          ))}
        </div>
        <p className="prc__p at" style={at(0.74)}><b>✓</b>{L.prod}</p>
        <div className="prc__sparks" aria-hidden="true">
          {SPARKS.map((s, i) => <span key={i} style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, background: s.c } as CSSProperties} />)}
        </div>
      </div>
    </div>
  );
}

const TONE = ['red', 'blue', 'violet', 'green', 'green', 'green'];

/** The console for stage i: window chrome plus that stage's scene. */
export function LoopScene({ i, L }: { i: number; L: Any }) {
  const scene = [
    <Reproduce key="r" L={L.reproduce} />,
    <Fix key="f" L={L.fix} />,
    <Verify key="v" L={L.verify} />,
    <Regression key="g" L={L.regression} />,
    <Review key="c" L={L.review} />,
    <Pr key="p" L={L.pr} />,
  ][i];
  return <Chrome title={L.console} status={L.status[i]} tone={TONE[i]}>{scene}</Chrome>;
}
