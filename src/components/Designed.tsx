'use client';

/* Interactive pieces from the "Cool Paper Glass" design. Copy comes from content.json and the resume. */
import { useEffect, useRef, useState } from 'react';
import { useMotion } from './client';

/* ---------- 60-second version: Top five selector ---------- */

export type TopItem = { title: string; stat: string; prefix?: string; statLabel: string; text: string };

export function TopFive({ items }: { items: TopItem[] }) {
  const [sel, setSel] = useState(0);
  const cur = items[sel];
  return (
    <div className="top5x">
      <ol className="glass top5x__list">
        {items.map((it, i) => (
          <li key={it.title}>
            <button type="button" aria-pressed={i === sel} onClick={() => setSel(i)} className={`top5x__row ${i === sel ? 'is-on' : ''}`}>
              <span className="top5x__n">{i + 1}</span>
              <span className="top5x__t">{it.title}</span>
              <span className="top5x__s">{it.prefix ? `${it.prefix} ` : ''}{it.stat}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="glass top5x__card" aria-live="polite">
        <span className="glow glow--accent" aria-hidden="true" style={{ right: -80, top: -100, width: 320, height: 320 }} />
        <span className="kick">0{sel + 1} / 05 · TOP FIVE</span>
        <div className="top5x__big">
          <span className="top5x__stat">
            {cur.prefix && <span className="pre">{cur.prefix}</span>}
            {cur.stat}
          </span>
          <span className="top5x__label">{cur.statLabel}</span>
        </div>
        <p className="top5x__text">{cur.text}</p>
        <div className="top5x__nav">
          <button type="button" className="glass round" aria-label="Previous" onClick={() => setSel((sel + items.length - 1) % items.length)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button type="button" className="glass round" aria-label="Next" onClick={() => setSel((sel + 1) % items.length)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Stack tabs ---------- */

export function StackTabs({ groups }: { groups: { label: string; items: string[] }[] }) {
  const [tab, setTab] = useState(0);
  return (
    <div className="glass panel">
      <div className="panel__head">
        <h3 className="caps">Stack</h3>
        <div className="seg seg--flat" role="group" aria-label="Stack area">
          {groups.map((g, i) => (
            <button key={g.label} type="button" aria-pressed={i === tab} className={i === tab ? 'is-on' : ''} onClick={() => setTab(i)}>
              {g.label}
            </button>
          ))}
        </div>
      </div>
      <div className="tags">
        {groups[tab].items.map((x) => <span key={x} className="tag">{x}</span>)}
      </div>
    </div>
  );
}

/** Scroll progress (0..1) of an element through the viewport, or null when motion is off. */
function useScrollProgress(ref: React.RefObject<HTMLElement | null>) {
  const { on } = useMotion();
  const [p, setP] = useState<number | null>(null);
  useEffect(() => {
    if (!on) return setP(null);
    let raf = 0;
    const tick = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const v = (window.innerHeight * 0.8 - r.top) / (r.height + window.innerHeight * 0.3);
      setP(Math.min(1, Math.max(0, v)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [on, ref]);
  return p;
}

/* ---------- Release regression: before / after bar (scroll drives it until you pick) ---------- */

export function ReleaseBar() {
  const ref = useRef<HTMLDivElement>(null);
  const p = useScrollProgress(ref);
  const [picked, setPicked] = useState<'before' | 'after' | null>(null);
  const rel = picked ?? (p === null || p > 0.45 ? 'after' : 'before');
  const after = rel === 'after';
  return (
    <div ref={ref} className="relbar">
      <div className="relbar__top">
        <div className="seg" role="group" aria-label="Regression cycle">
          {(['before', 'after'] as const).map((k) => (
            <button key={k} type="button" aria-pressed={rel === k} className={rel === k ? `is-on is-${k}` : ''} onClick={() => setPicked(k)}>
              {k === 'before' ? 'Before' : 'After'}
            </button>
          ))}
        </div>
        <span className="relbar__cap">{after ? '8 to 10 hours' : 'about a week'}</span>
      </div>
      <div className={`relbar__track ${after ? 'is-after' : 'is-before'}`}>
        <div className="relbar__fill" />
        <div className="relbar__days">
          {Array.from({ length: 7 }, (_, i) => <span key={i}><span className="relbar__d">Day&nbsp;</span>{i + 1}</span>)}
        </div>
      </div>
      <div className="relbar__foot">
        <div className="tags tags--sm">
          {['TestRail cases', 'Claude Code', 'Playwright', 'Scoped by blast radius'].map((x) => <span key={x} className="tag">{x}</span>)}
        </div>
        <span className="fine">Illustrative scale.</span>
      </div>
    </div>
  );
}

/* ---------- MCP: try a request (scroll walks Read, Update, Delete until you pick) ---------- */

const REQ = [
  { label: 'Read', q: "What's on my list this week?", lane: 0, result: 'Routed to a read tool. The answer comes back to the chat.' },
  { label: 'Update', q: 'Mark that item as done', lane: 1, result: 'Routed to a safe write tool.' },
  { label: 'Delete', q: 'Delete that item', lane: 2, result: 'Blocked. Deletes happen in the app, never through an LLM.' },
];
const LANES = [
  { kick: 'TOOL', name: 'read', sub: 'safe' },
  { kick: 'TOOL', name: 'write', sub: 'safe' },
  { kick: 'FENCED', name: 'delete', sub: 'in the app only' },
];

export function McpDemo({ caption }: { caption: string }) {
  const ref = useRef<HTMLElement>(null);
  const p = useScrollProgress(ref);
  const [picked, setPicked] = useState<number | null>(null);
  const m = picked ?? (p === null ? 2 : Math.min(2, Math.floor(p * 3.2)));
  const cur = REQ[m];
  return (
    <figure ref={ref} className="glass mcpx">
      <span className="glow glow--accent" aria-hidden="true" style={{ right: -90, top: -90, width: 300, height: 300 }} />
      <div className="mcpx__head">
        <span className="kick kick--mute">TRY A REQUEST</span>
        <div className="seg" role="group" aria-label="Sample request">
          {REQ.map((r, i) => (
            <button key={r.label} type="button" aria-pressed={i === m} className={i === m ? `is-on ${i === 2 ? 'is-danger' : ''}` : ''} onClick={() => setPicked(i)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mcpx__flow">
        <div className="mcpx__q">
          <span className="kick kick--mute">QUESTION</span>
          <span>“{cur.q}”</span>
        </div>
        <i className="mcpx__wire" aria-hidden="true" />
        <div className="mcpx__cls">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" /><path d="m15 9 6-6" /></svg>
          classifier
        </div>
        <i className="mcpx__wire" aria-hidden="true" />
        <div className="mcpx__lanes">
          {LANES.map((l, i) => {
            const hit = i === cur.lane;
            const fence = i === 2;
            return (
              <div key={l.name} className={`lane ${hit ? 'is-hit' : ''} ${fence ? 'is-fence' : ''}`}>
                <span className="lane__k">{l.kick}</span>
                <span className="lane__n">{l.name}</span>
                <span className="lane__s">{hit && fence ? 'blocked' : l.sub}</span>
              </div>
            );
          })}
        </div>
        <div className={`mcpx__res ${m === 2 ? 'is-danger' : ''}`} aria-live="polite">
          <span className="dot" />
          {cur.result}
        </div>
      </div>
      <figcaption className="fine">{caption}</figcaption>
    </figure>
  );
}

/* ---------- Platform / Leadership tabs ---------- */

export function PlatformTabs({ platform, leadership }: { platform: { title: string; text: string }[]; leadership: { title: string; text: string }[] }) {
  const [pl, setPl] = useState(0);
  const items = pl ? leadership : platform;
  return (
    <div className="glass panel panel--lg" data-commit>
      <div className="panel__head">
        <div className="seg seg--lg" role="group" aria-label="Platform or leadership">
          {['Platform', 'Leadership'].map((label, i) => (
            <button key={label} type="button" aria-pressed={pl === i} className={pl === i ? 'is-on is-ink' : ''} onClick={() => setPl(i)}>
              {label}
            </button>
          ))}
        </div>
        <span className="mono-sm">{items.length} {pl ? 'leadership' : 'platform'} notes</span>
      </div>
      <ul className="notes">
        {items.map((it, i) => (
          <li key={it.title} className="note">
            <span className="note__h"><span className="kick">0{i + 1}</span><b>{it.title}</b></span>
            <span>{it.text}</span>
          </li>
        ))}
      </ul>
      {/* the hidden tab stays in the DOM for search, screen readers and print */}
      <ul className="sr-only">
        {(pl ? platform : leadership).map((it) => <li key={it.title}>{it.title}: {it.text}</li>)}
      </ul>
    </div>
  );
}
