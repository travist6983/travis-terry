'use client';

import { useEffect, useRef } from 'react';
import { useMotion } from './client';

/*
 * Two scroll journeys, both "held object" scenes: the object stays at HOLD of the viewport
 * while the page scrolls under it, and its x comes from the route at that y.
 *  Act 1, One Ticket: a bug ticket rides a drawn route through the agentic-work sections.
 *  Act 2, One Commit: the merged PR becomes HEAD and rides a git graph through the career.
 * Everything is a pure function of scroll position, so scrolling back rewinds it.
 */

const HOLD = 0.45;
type Pt = { x: number; y: number };

/** Cubic segments with vertical tangents: always monotonic in y, so y -> x lookup is exact. */
function routeD(pts: Pt[]) {
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const m = (b.y - a.y) / 2;
    d += ` C${a.x},${a.y + m} ${b.x},${b.y - m} ${b.x},${b.y}`;
  }
  return d;
}

/** Sample a path into a y-sorted lookup table: y -> { x, length }. */
function sampler(path: SVGPathElement) {
  const total = path.getTotalLength();
  const n = Math.max(200, Math.ceil(total / 6));
  const ys = new Float32Array(n + 1);
  const xs = new Float32Array(n + 1);
  const ls = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const l = (total * i) / n;
    const p = path.getPointAtLength(l);
    ys[i] = i ? Math.max(p.y, ys[i - 1]) : p.y;
    xs[i] = p.x;
    ls[i] = l;
  }
  return {
    total,
    top: ys[0],
    bottom: ys[n],
    at(y: number) {
      if (y <= ys[0]) return { x: xs[0], l: 0, y: ys[0] };
      if (y >= ys[n]) return { x: xs[n], l: total, y: ys[n] };
      let lo = 0;
      let hi = n;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (ys[mid] < y) lo = mid;
        else hi = mid;
      }
      const t = (y - ys[lo]) / (ys[hi] - ys[lo] || 1);
      return { x: xs[lo] + (xs[hi] - xs[lo]) * t, l: ls[lo] + (ls[hi] - ls[lo]) * t, y };
    },
  };
}

const rel = (el: Element, act: Element) => {
  const r = el.getBoundingClientRect();
  const a = act.getBoundingClientRect();
  return { top: r.top - a.top, bottom: r.bottom - a.top, left: r.left - a.left, right: r.right - a.left, cx: r.left - a.left + r.width / 2, cy: r.top - a.top + r.height / 2 };
};

const narrow = () => window.matchMedia('(max-width: 760px)').matches;

/** Shared engine: measure on resize, update on scroll, all imperative so React never re-renders per frame. */
function useJourney(actId: string, on: boolean, build: (act: HTMLElement) => ((headY: number) => void) | null) {
  useEffect(() => {
    const act = document.getElementById(actId);
    if (!act) return;
    let update: ((headY: number) => void) | null = null;
    let raf = 0;
    const frame = () => {
      raf = 0;
      if (!update) return;
      const top = act.getBoundingClientRect().top;
      update(on ? window.innerHeight * HOLD - top : Number.POSITIVE_INFINITY);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    let measuring = 0;
    const measure = () => {
      cancelAnimationFrame(measuring);
      measuring = requestAnimationFrame(() => {
        update = build(act);
        schedule();
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(act);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(measuring);
    };
  }, [actId, on, build]);
}

/* ======================= Act 1: One Ticket ======================= */

function buildTicket(svg: SVGSVGElement, track: SVGPathElement, line: SVGPathElement, rider: HTMLDivElement) {
  return (act: HTMLElement) => {
    const W = act.clientWidth;
    const H = act.scrollHeight;
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(H));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const thin = narrow();
    const wrapBox = rel(act.querySelector('.wrap')!, act);
    const gutter = thin ? 14 : wrapBox.left + 6;
    const margin = (wrapBox.right - 12 + W) / 2;

    const pts: Pt[] = [];
    // Phones hide the backlog, so the route starts at the hero copy instead of the bug card
    const heroCopy = thin ? act.querySelector('.hero__copy') : null;
    if (heroCopy) pts.push({ x: 14, y: rel(heroCopy, act).top });
    act.querySelectorAll<HTMLElement>('[data-route]').forEach((el) => {
      // A hidden anchor (the backlog card on phones) has no box; its rect would track the scroll position
      if (!el.getClientRects().length) return;
      const r = rel(el, act);
      const spec = el.dataset.route!;
      const at = el.dataset.routeAt ?? 'center';
      const y = at === 'top' ? r.top : at === 'bottom' ? r.bottom : r.cy;
      let x = spec === 'el' ? r.cx : spec === 'gutter' ? gutter : spec === 'margin' ? margin : Number(spec) * W;
      if (thin) x = 14;
      if (!pts.length || y > pts[pts.length - 1].y + 1) pts.push({ x, y });
    });
    if (pts.length < 2) return null;
    const d = routeD(pts);
    track.setAttribute('d', d);
    line.setAttribute('d', d);
    const s = sampler(line);
    line.style.strokeDasharray = `${s.total}`;

    const states = Array.from(act.querySelectorAll<HTMLElement>('[data-ticket]')).map((el) => ({ y: rel(el, act).top, label: el.dataset.ticket!, kind: el.dataset.ticketKind ?? '' }));
    const stations = Array.from(act.querySelectorAll<HTMLElement>('[data-station]')).map((el) => ({ el, y: rel(el, act).cy }));
    const away = Array.from(act.querySelectorAll<HTMLElement>('[data-ticket-away]')).map((el) => rel(el, act));
    const start = act.querySelector<HTMLElement>('[data-ticket-start]');
    const chip = rider.querySelector('.rider__chip')!;
    const flag = rider.querySelector('.rider__flag')!;
    let last = '';

    return (headY: number) => {
      const done = headY === Number.POSITIVE_INFINITY;
      const p = s.at(done ? s.bottom : headY);
      line.style.strokeDashoffset = `${s.total - p.l}`;
      rider.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      start?.classList.toggle('is-lifted', !done);
      const hidden = done || away.some((r) => p.y > r.top + 40 && p.y < r.bottom - 40);
      rider.classList.toggle('is-away', hidden);
      rider.classList.toggle('is-commit', !done && p.y > s.bottom - 140);
      let cur = states[0];
      for (const st of states) if (st.y <= p.y) cur = st;
      if (cur && cur.label !== last) {
        last = cur.label;
        chip.textContent = cur.label;
        rider.dataset.kind = cur.kind;
        flag.textContent = cur.kind === 'pr' ? 'PR' : 'bug';
      }
      for (const st of stations) st.el.classList.toggle('is-passed', done || st.y <= p.y);
    };
  };
}

export function TicketJourney() {
  const { on } = useMotion();
  const svg = useRef<SVGSVGElement>(null);
  const track = useRef<SVGPathElement>(null);
  const line = useRef<SVGPathElement>(null);
  const rider = useRef<HTMLDivElement>(null);
  const build = useRef<((act: HTMLElement) => ((y: number) => void) | null) | null>(null);
  if (!build.current) {
    build.current = (act) =>
      svg.current && track.current && line.current && rider.current ? buildTicket(svg.current, track.current, line.current, rider.current)(act) : null;
  }
  useJourney('act1', on, build.current);
  return (
    <div className="journey" aria-hidden="true">
      <svg ref={svg} className="journey__svg">
        <path ref={track} className="route__track" />
        <path ref={line} className="route__line" />
      </svg>
      <div ref={rider} className="rider" data-kind="bug">
        <div className="rider__card">
          <span className="rider__flag">bug</span>
          <span className="rider__chip">New</span>
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}

/* ======================= Act 2: One Commit ======================= */

function buildGraph(svg: SVGSVGElement, head: HTMLDivElement) {
  return (act: HTMLElement) => {
    const W = act.clientWidth;
    const H = act.scrollHeight;
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(H));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const thin = narrow();
    const col = act.querySelector('.graph-col');
    if (!col) return null;
    const mainX = thin ? 14 : rel(col, act).left + 6;
    const lane = thin ? 30 : 30;
    const tagEl = act.querySelector('[data-tag]');
    const tag = tagEl ? rel(tagEl, act) : { cx: mainX, cy: H - 40 };
    const startY = 8;

    const mainPts: Pt[] = [{ x: mainX, y: startY }, { x: mainX, y: tag.cy - 220 }, { x: tag.cx, y: tag.cy }];
    const NS = 'http://www.w3.org/2000/svg';
    svg.replaceChildren();
    const mk = (tagName: string, attrs: Record<string, string>) => {
      const el = document.createElementNS(NS, tagName);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      svg.appendChild(el);
      return el;
    };
    mk('path', { d: routeD(mainPts), class: 'graph__track' });
    const main = mk('path', { d: routeD(mainPts), class: 'graph__main' }) as SVGPathElement;
    const s = sampler(main);
    main.style.strokeDasharray = `${s.total}`;

    type Seg = { path: SVGPathElement; top: number; bottom: number; len: number };
    const segs: Seg[] = [];
    act.querySelectorAll<HTMLElement>('[data-branch]').forEach((el, i) => {
      const r = rel(el, act);
      const x = mainX + lane;
      const a = r.top - 6;
      const end = el.dataset.branch;
      const b = end === 'merge' ? r.bottom + 18 : r.bottom - 8;
      let d = `M${mainX},${a} C${mainX},${a + 22} ${x},${a + 8} ${x},${a + 34} L${x},${end === 'merge' ? b - 34 : b}`;
      if (end === 'merge') d += ` C${x},${b - 8} ${mainX},${b - 22} ${mainX},${b}`;
      const path = mk('path', { d, class: `graph__branch graph__branch--${i % 4}` }) as SVGPathElement;
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
      if (end === 'open') mk('path', { d: `M${x - 5},${b - 6} L${x},${b + 2} L${x + 5},${b - 6}`, class: `graph__open graph__branch--${i % 4}` });
      if (end === 'retired') mk('path', { d: `M${x - 6},${b - 6} L${x + 6},${b + 6} M${x + 6},${b - 6} L${x - 6},${b + 6}`, class: 'graph__retired' });
      segs.push({ path, top: a, bottom: b, len });
    });

    type Dot = { el: SVGElement; y: number };
    const dots: Dot[] = [];
    act.querySelectorAll<HTMLElement>('[data-commit]').forEach((el) => {
      const r = rel(el, act);
      const inBranch = !!el.closest('[data-branch]');
      const y = r.top + (thin ? 10 : 13);
      const x = inBranch ? mainX + lane : s.at(y).x;
      dots.push({ el: mk('circle', { cx: String(x), cy: String(y), r: inBranch ? '4.5' : '6', class: `graph__dot ${inBranch ? '' : 'graph__dot--main'}` }), y });
    });

    return (headY: number) => {
      const done = headY === Number.POSITIVE_INFINITY;
      const p = s.at(done ? s.bottom : Math.max(headY, s.top));
      main.style.strokeDashoffset = `${s.total - p.l}`;
      head.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      head.classList.toggle('is-away', done || headY < s.top - 40);
      head.classList.toggle('is-home', !done && p.y >= s.bottom - 2);
      for (const g of segs) {
        const f = done ? 1 : Math.min(1, Math.max(0, (p.y - g.top) / (g.bottom - g.top)));
        g.path.style.strokeDashoffset = `${g.len * (1 - f)}`;
      }
      for (const dt of dots) dt.el.classList.toggle('is-on', done || dt.y <= p.y);
    };
  };
}

export function CommitJourney() {
  const { on } = useMotion();
  const svg = useRef<SVGSVGElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const build = useRef<((act: HTMLElement) => ((y: number) => void) | null) | null>(null);
  if (!build.current) {
    build.current = (act) => (svg.current && head.current ? buildGraph(svg.current, head.current)(act) : null);
  }
  useJourney('act2', on, build.current);
  return (
    <div className="journey" aria-hidden="true">
      <svg ref={svg} className="journey__svg" />
      <div ref={head} className="head">
        <span className="head__dot" />
        <span className="head__label">HEAD</span>
      </div>
    </div>
  );
}
