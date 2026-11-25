'use client';

import { useEffect, useRef, useState } from 'react';
import { Branch, Checkout, Fetch } from './Buttons';
import { useMotion } from './motion';
import { clamp, holdLine, onScrollFrame } from './GraphHead';

/*
 * The portfolio as `git log --graph --all`: every project forks off main into its lane (clients, apps,
 * open source), ships, and merges back. The open branch keeps a dashed lane. The branch buttons filter the log.
 *
 * With motion on, HEAD rides the graph as you scroll: down main, out along each fork, down the lane and
 * back through the merge. The graph is coloured as far as HEAD has travelled and grey beyond it. All of
 * it is computed from the scroll position (no timers), so scrolling up rewinds it exactly.
 * With motion off (the kill switch or reduced motion) the whole graph is drawn and the open row holds HEAD.
 * Each branch path uses pathLength=1 so the dash always covers the whole curve, however far its lane.
 */

export type Lane = 'clients' | 'apps' | 'oss';

export type Row = {
  slug: string;
  lane: Lane;
  branch: string;
  date: string;
  status: string;
  state: 'open' | 'merged' | 'retired';
  head: boolean;
  type: string;
  msg: string;
  title: string;
  text: string;
  diff: string;
  tags: string[];
  img: { src: string; alt: string; width: number; height: number; phone: boolean };
  frame: string;
  links: { label: string; href: string; alt?: boolean }[];
};

const LANES: Record<Lane, { x: number; c: string }> = {
  clients: { x: 72, c: '#ff6a14' },
  apps: { x: 122, c: '#7c5cff' },
  oss: { x: 172, c: '#0a84ff' },
};


/* Graph geometry, in px from the left of the graph column. A fork or merge curve is TURN px tall. */
const MAIN_X = 21;
const PHONE_X = 10;
const TURN = 64;

/**
 * The fork curve M21,0 C21,40 x,24 x,64 as a lookup by y: the x at that height, and f, the fraction
 * of the curve's length drawn by then (for the dash). y(t) is monotonic, so the lookup is exact.
 */
const curves = new Map<number, { at: (y: number) => { x: number; f: number } }>();
function curve(x: number) {
  let c = curves.get(x);
  if (c) return c;
  const N = 64;
  const xs: number[] = [];
  const ys: number[] = [];
  const ls: number[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const u = 1 - t;
    xs.push(MAIN_X * (u * u * u + 3 * u * u * t) + x * (3 * u * t * t + t * t * t));
    ys.push(3 * u * u * t * 40 + 3 * u * t * t * 24 + t * t * t * TURN);
    ls.push(i ? ls[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]) : 0);
  }
  c = {
    at(y: number) {
      if (y <= 0) return { x: MAIN_X, f: 0 };
      if (y >= TURN) return { x, f: 1 };
      let i = 1;
      while (ys[i] < y) i++;
      const k = (y - ys[i - 1]) / (ys[i] - ys[i - 1] || 1);
      return { x: xs[i - 1] + (xs[i] - xs[i - 1]) * k, f: (ls[i - 1] + (ls[i] - ls[i - 1]) * k) / ls[N] };
    },
  };
  curves.set(x, c);
  return c;
}

export function PortfolioLog({ rows, labels }: { rows: Row[]; labels: Record<Lane, string> }) {
  const [f, setF] = useState<'all' | Lane>('all');
  const list = rows.filter((r) => f === 'all' || r.lane === f);
  const ref = useRef<HTMLOListElement>(null);
  const headRef = useRef<HTMLLIElement>(null);
  const { on } = useMotion();

  // HEAD and the coloured graph follow the scroll position. Cards fade in once, the first time
  // their row comes on screen, and stay: only the graph rewinds.
  useEffect(() => {
    const ol = ref.current;
    const head = headRef.current;
    if (!ol || !head) return;
    const els = Array.from(ol.querySelectorAll<HTMLElement>('.pf-row'));
    if (!on) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const phone = window.matchMedia('(max-width: 760px)');
    ol.classList.add('is-live');
    const stop = onScrollFrame(() => {
      const vh = window.innerHeight;
      const box = ol.getBoundingClientRect();
      const hy = clamp(holdLine() - box.top, 0, box.height);
      const thin = phone.matches;
      let hx = thin ? PHONE_X : MAIN_X;
      for (const el of els) {
        const top = el.offsetTop;
        const h = el.offsetHeight;
        const y = clamp(hy - top, 0, h);
        const inside = hy >= top && hy < top + h;
        const open = el.classList.contains('pf-row--open');
        if (top + box.top < vh * 0.9) el.classList.add('is-in');
        if (thin) {
          // Phones: one straight lane per row, no curves.
          el.style.setProperty('--ln', (y / h).toFixed(4));
          el.classList.toggle('is-on', y >= 53);
        } else {
          const x = Number(el.dataset.x);
          const cv = curve(x);
          const tail = open ? 0 : TURN;
          el.style.setProperty('--fk', cv.at(Math.min(y, TURN)).f.toFixed(4));
          el.style.setProperty('--ln', clamp((y - TURN) / (h - TURN - tail), 0, 1).toFixed(4));
          el.style.setProperty('--mg', open ? '0' : cv.at(clamp(y - (h - TURN), 0, TURN)).f.toFixed(4));
          el.classList.toggle('is-on', y >= 105);
          if (inside) {
            // Fork out, ride the lane, then come back to main along the mirror of the fork.
            // An open branch has no merge drawn, but HEAD still returns to main for the next row.
            if (y < TURN) hx = cv.at(y).x;
            else if (y < h - TURN) hx = x;
            else hx = x + MAIN_X - cv.at(y - (h - TURN)).x;
          }
        }
        el.classList.toggle('is-cur', inside);
      }
      head.style.transform = `translate3d(${hx.toFixed(1)}px, ${hy.toFixed(1)}px, 0)`;
    });
    return () => {
      stop();
      ol.classList.remove('is-live');
      els.forEach((el) => {
        el.classList.remove('is-on', 'is-cur');
        ['--fk', '--ln', '--mg'].forEach((k) => el.style.removeProperty(k));
      });
    };
  }, [f, on]);

  const keys: ('all' | Lane)[] = ['all', 'clients', 'apps', 'oss'];
  const merged = list.filter((r) => r.state !== 'open').length;

  return (
    <>
      <div className="pf-bar">
        <div className="pf-legend" role="group" aria-label="Filter by branch">
          {keys.map((k) => (
            <Branch
              key={k}
              on={f === k}
              color={k === 'all' ? '#0c1220' : LANES[k].c}
              ink={k === 'clients' ? '#0c1220' : '#fff'}
              count={rows.filter((r) => k === 'all' || r.lane === k).length}
              onClick={() => setF(k)}
            >
              {k === 'all' ? '--all' : labels[k]}
            </Branch>
          ))}
        </div>
        <p className="pf-sum mono-sm" aria-live="polite">
          {list.length} branches · {merged} merged · {list.length - merged} open
        </p>
      </div>

      <ol className="pf-log" ref={ref}>
        {list.map((r) => {
          const { x, c } = LANES[r.lane];
          return (
            <li
              key={r.slug}
              className={`pf-row${r.state === 'open' ? ' pf-row--open' : ''}${r.head ? ' pf-row--head' : ''}`}
              style={{ '--c': c, '--x': `${x}px` } as React.CSSProperties}
              data-x={x}
            >
              <div className="pf-graph" aria-hidden="true">
                <span className="pf-main" />
                <svg className="pf-svg pf-svg--fork" width="200" height="64" viewBox="0 0 200 64">
                  <path className="pf-track" d={`M21 0 C21 40, ${x} 24, ${x} 64`} />
                  <path d={`M21 0 C21 40, ${x} 24, ${x} 64`} pathLength={1} />
                </svg>
                <span className="pf-lane"><i /></span>
                {r.state !== 'open' && (
                  <svg className="pf-svg pf-svg--merge" width="200" height="64" viewBox="0 0 200 64">
                    <path className="pf-track" d={`M${x} 0 C${x} 40, 21 24, 21 64`} />
                    <path d={`M${x} 0 C${x} 40, 21 24, 21 64`} pathLength={1} />
                  </svg>
                )}
                <span className="pf-dot" />
              </div>
              <article className="glass pf-card">
                <div className="pf-thumb">
                  {r.img.phone ? (
                    <div className="pf-phone">
                      <img src={r.img.src} alt={r.img.alt} width={r.img.width} height={r.img.height} loading="lazy" />
                    </div>
                  ) : (
                    <div className="pf-win">
                      <div className="pf-win__bar" aria-hidden="true"><i /><i /><i /><span>{r.frame}</span></div>
                      <img src={r.img.src} alt={r.img.alt} width={r.img.width} height={r.img.height} loading="lazy" />
                    </div>
                  )}
                </div>
                <div className="pf-body">
                  <p className="pf-meta">
                    <span className="pf-bpill"><i aria-hidden="true" />{r.branch}</span>
                    <span>{r.date}</span>
                    <span className={`pf-st pf-st--${r.state}`}>{r.status}</span>
                  </p>
                  <p className="pf-msg"><b>{r.type}:</b> {r.msg}</p>
                  <h2 className="pf-title">{r.title}</h2>
                  <p className="pf-text">{r.text}</p>
                  <p className="pf-diff">{r.diff}</p>
                  <ul className="pf-tags">{r.tags.map((tg) => <li key={tg}>{tg}</li>)}</ul>
                  <p className="pf-links">
                    {r.links.map((l) =>
                      l.alt ? (
                        <Checkout key={l.href} href={l.href} color={c}>{l.label}</Checkout>
                      ) : (
                        <Fetch key={l.href} href={l.href}>{l.label.replace(/\s*↗$/, '')}</Fetch>
                      ),
                    )}
                  </p>
                </div>
              </article>
            </li>
          );
        })}
        <li ref={headRef} className="ghead" aria-hidden="true"><span className="head__dot" /></li>
      </ol>
    </>
  );
}
