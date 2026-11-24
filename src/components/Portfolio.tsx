'use client';

import { useEffect, useRef, useState } from 'react';

/*
 * The portfolio as `git log --graph --all`: every project forks off main into its lane (clients, apps,
 * open source), ships, and merges back. The open branch keeps a dashed lane and the glowing HEAD dot.
 * The branch buttons filter the log. Rows draw in as they scroll into view; with motion off (the kill
 * switch or reduced motion) everything is drawn from the start.
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

const ext = (href: string) => (/^https?:/.test(href) ? { target: '_blank', rel: 'noopener' } : {});

export function PortfolioLog({ rows, labels }: { rows: Row[]; labels: Record<Lane, string> }) {
  const [f, setF] = useState<'all' | Lane>('all');
  const list = rows.filter((r) => f === 'all' || r.lane === f);
  const ref = useRef<HTMLOListElement>(null);

  // Draw each row once it scrolls into view (re-run when the filter swaps rows in)
  useEffect(() => {
    const els = Array.from(ref.current?.querySelectorAll<HTMLElement>('.pf-row:not(.is-in)') ?? []);
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }),
      { rootMargin: '0px 0px -12% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [f]);

  const keys: ('all' | Lane)[] = ['all', 'clients', 'apps', 'oss'];
  const merged = list.filter((r) => r.state !== 'open').length;

  return (
    <>
      <div className="pf-bar">
        <div className="pf-legend" role="group" aria-label="Filter by branch">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              className={`pf-br${f === k ? ' is-on' : ''}`}
              aria-pressed={f === k}
              onClick={() => setF(k)}
            >
              <i aria-hidden="true" style={{ background: k === 'all' ? 'var(--green)' : LANES[k].c }} />
              {k === 'all' ? '--all' : labels[k]}{' '}
              <span className="pf-br__n">{rows.filter((r) => k === 'all' || r.lane === k).length}</span>
            </button>
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
            >
              <div className="pf-graph" aria-hidden="true">
                <span className="pf-main" />
                <svg className="pf-svg pf-svg--fork" width="200" height="64" viewBox="0 0 200 64">
                  <path d={`M21 0 C21 40, ${x} 24, ${x} 64`} />
                </svg>
                <span className="pf-lane" />
                {r.state !== 'open' && (
                  <svg className="pf-svg pf-svg--merge" width="200" height="64" viewBox="0 0 200 64">
                    <path d={`M${x} 0 C${x} 40, 21 24, 21 64`} />
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
                    {r.links.map((l) => (
                      <a key={l.href} className={`pf-lk${l.alt ? ' pf-lk--alt' : ''}`} href={l.href} {...ext(l.href)}>{l.label}</a>
                    ))}
                  </p>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </>
  );
}
