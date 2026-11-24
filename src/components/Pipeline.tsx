'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import { section, t } from '@/lib/content';
import { useMotion } from './client';
import { Accent } from './Accent';
import { LoopScene } from './LoopScenes';

/*
 * The Pipeline: the defect loop as a live run you scroll through.
 *
 * Wide screens with motion on: the scene pins for six screens of scroll. A git-style rail on top
 * fills stage by stage (verify and regression fork into parallel branches), and the console below
 * plays the active stage's scene, scrubbed by the scroll position, so it runs backwards on the way up.
 * Narrow screens: the stages stack as cards and each scene plays as its card crosses the viewport.
 * Reduced motion or no JS: the stacked cards, each showing its finished frame.
 */

type Stage = { id: string; label: string; text: string; aside?: { label: string; text: string } };

/* Rail geometry (viewBox 1000 x 122). Verify and regression share a column on two branches. */
const Y = 56;
const NODES: Array<[number, number]> = [[70, Y], [270, Y], [500, 28], [500, 84], [730, Y], [930, Y]];
// Each path fills as stage k hands off: k = the stage whose end draws it.
const PATHS: Array<{ k: number; d: string; gate: [number, number] }> = [
  { k: 0, d: `M70 ${Y}H270`, gate: [170, Y] },
  { k: 1, d: `M270 ${Y}C370 ${Y} 390 28 500 28`, gate: [381, 42] },
  { k: 1, d: `M270 ${Y}C370 ${Y} 390 84 500 84`, gate: [381, 70] },
  { k: 3, d: `M500 28C610 28 630 ${Y} 730 ${Y}`, gate: [619, 42] },
  { k: 3, d: `M500 84C610 84 630 ${Y} 730 ${Y}`, gate: [619, 70] },
  { k: 4, d: `M730 ${Y}H930`, gate: [830, Y] },
];

function Rail({ stages, stage }: { stages: Stage[]; stage: number }) {
  return (
    <svg className="lrail" viewBox="0 0 1000 122" aria-hidden="true">
      {PATHS.map((p, i) => <path key={`b${i}`} className="lrail__base" d={p.d} />)}
      {PATHS.map((p, i) => <path key={`f${i}`} className="lrail__fill" d={p.d} pathLength={1} style={{ '--k': p.k } as CSSProperties} />)}
      {PATHS.map((p, i) => (
        <rect key={`g${i}`} className={`lrail__gate${stage > p.k ? ' is-open' : ''}`} x={p.gate[0] - 5} y={p.gate[1] - 5} width="10" height="10" rx="2" transform={`rotate(45 ${p.gate[0]} ${p.gate[1]})`} />
      ))}
      {NODES.map(([x, y], i) => {
        // Regression runs alongside verify, so it is already running while verify is the active stage.
        const cls = i < stage ? ' is-done' : i === stage ? ' is-active' : i === 3 && stage === 2 ? ' is-par' : '';
        return (
          <g key={i} className={`lrail__n${cls}`}>
            <circle className="lrail__halo" cx={x} cy={y} r="17" />
            <circle className="lrail__dot" cx={x} cy={y} r="11" />
            <text className="lrail__num" x={x} y={y + 4} textAnchor="middle">{i + 1}</text>
            <text className="lrail__label" x={x} y={i === 2 ? y - 18 : y + 30} textAnchor="middle">{stages[i].label}</text>
          </g>
        );
      })}
    </svg>
  );
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function Pipeline() {
  const s = section('pipeline');
  const stages = s.stages as Stage[];
  const n = stages.length;
  const { on } = useMotion();
  const [stage, setStage] = useState(n - 1);
  const [pinned, setPinned] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const scenes = () => [...el.querySelectorAll<HTMLElement>('.lstage__scene')];
    const finish = () => {
      scenes().forEach((sc) => sc.style.removeProperty('--t'));
      railRef.current?.style.removeProperty('--p6');
    };
    if (!on) {
      setPinned(false);
      setStage(n - 1);
      finish();
      return;
    }

    const wide = window.matchMedia('(min-width: 961px) and (min-height: 620px)');
    let cleanup = () => {};
    let cancelled = false;

    const pin = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      // Commit the pinned layout before ScrollTrigger measures it, or the pin starts at the wrong place.
      flushSync(() => {
        setPinned(true);
        setStage(0);
      });
      const list = scenes();
      const paint = (progress: number) => {
        const f = Math.min(n - 0.001, progress * n);
        const i = Math.floor(f);
        // The scene plays over the first 80% of its stage, then holds while the rail hands off.
        const local = clamp01((f - i) / 0.8);
        list.forEach((sc, j) => sc.style.setProperty('--t', j < i ? '1' : j === i ? local.toFixed(4) : '0'));
        railRef.current?.style.setProperty('--p6', f.toFixed(4));
        if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
        setStage(i);
      };
      paint(0);
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: () => `+=${window.innerHeight * n}`,
        pin: true,
        scrub: true,
        onUpdate: (self) => paint(self.progress),
      });
      cleanup = () => {
        st.kill(true);
        finish();
      };
    };

    const flow = () => {
      setPinned(false);
      setStage(n - 1);
      const list = scenes();
      let raf = 0;
      const paint = () => {
        raf = 0;
        const vh = window.innerHeight;
        // Each scene starts once a third of it is on screen and finishes as it nears the middle.
        list.forEach((sc) => {
          const r = sc.getBoundingClientRect();
          sc.style.setProperty('--t', clamp01((vh * 0.92 - (r.top + r.height * 0.33)) / (vh * 0.42)).toFixed(4));
        });
      };
      const onScroll = () => {
        if (!raf) raf = requestAnimationFrame(paint);
      };
      paint();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        finish();
      };
    };

    const start = () => {
      cleanup();
      cleanup = () => {};
      if (wide.matches) void pin();
      else flow();
    };
    start();
    wide.addEventListener('change', start);
    return () => {
      cancelled = true;
      wide.removeEventListener('change', start);
      cleanup();
    };
  }, [on, n]);

  return (
    <section id="pipeline" className="sec sec--dark pipeline" aria-labelledby="pipeline-title" data-ticket-away data-ticket="PR opened" data-ticket-kind="pr">
      <span className="route-anchor" data-route="gutter" data-route-at="top" />
      <div className="wrap pipeline__intro">
        <span className="glass badge"><span className="badge__dot" aria-hidden="true" />{t(s.badge)}</span>
        <h2 id="pipeline-title" className="display">{t(s.title)}</h2>
        <p className="lede"><Accent item={s.intro} /></p>
      </div>

      <div ref={rootRef} className={`lp ${pinned ? 'lp--pinned' : 'lp--flow'}`}>
        <div className="lp__inner wrap">
          <div ref={railRef} className="glass lp__rail">
            <Rail stages={stages} stage={stage} />
          </div>
          <ol className="lp__stages">
            {stages.map((st, i) => (
              <li key={st.id} className={`lstage${i === stage ? ' is-active' : ''}${i < stage ? ' is-done' : ''}`} aria-hidden={pinned && i !== stage ? true : undefined}>
                <div className="lstage__copy">
                  <p className="lstage__n"><b>{String(i + 1).padStart(2, '0')}</b> / {String(n).padStart(2, '0')}</p>
                  <h3 className="lstage__h">{t(st.label)}</h3>
                  <p className="lstage__p">{t(st.text)}</p>
                  {st.aside && (
                    <p className="lstage__aside">
                      <b>{t(st.aside.label)}.</b> {t(st.aside.text)}
                    </p>
                  )}
                </div>
                <div className="lstage__scene" aria-hidden="true">
                  <LoopScene i={i} L={s.scenes} />
                </div>
              </li>
            ))}
          </ol>
          <div className="lp__foot">
            <p className="label">{t(s.visualLabel)}</p>
            <span className="lp__bar" aria-hidden="true"><span ref={barRef} /></span>
          </div>
        </div>
      </div>

      <span className="route-anchor route-anchor--end" data-route="gutter" data-route-at="bottom" />
    </section>
  );
}
