'use client';

import { useEffect, useRef, useState } from 'react';
import { section, t } from '@/lib/content';
import { useMotion } from './client';
import { BELT_END, Factory, STATION_X, beltOffset, ticketOrigin } from './Factory';

const STOPS = [...STATION_X, BELT_END];
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** Belt x for scroll progress: the ticket dwells at each station, then rolls to the next. */
function beltX(progress: number) {
  const f = Math.min(5.999, progress * 6);
  const i = Math.floor(f);
  return STOPS[i] + (STOPS[i + 1] - STOPS[i]) * smooth(0.6, 1, f - i);
}

const STATUS = ['Reproduced', 'Fixed', 'Verified', 'Regression passing', 'Reviewed', 'PR opened'];

export function Pipeline() {
  const s = section('pipeline');
  const stages = s.stages as Array<{ label: string; text: string; badge?: string; aside?: { label: string; text: string } }>;
  const { on } = useMotion();
  const [stage, setStage] = useState(stages.length - 1);
  const [pinned, setPinned] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const visRef = useRef<HTMLDivElement>(null);
  const placeTicket = (progress: number) => {
    const g = visRef.current?.querySelector<SVGGElement>('.belt-ticket');
    if (!g) return;
    const [ox, oy] = ticketOrigin();
    const [dx, dy] = beltOffset(beltX(progress) - 0.45);
    g.setAttribute('transform', `translate(${(ox + dx).toFixed(1)} ${(oy + dy).toFixed(1)})`);
  };

  useEffect(() => {
    const el = sceneRef.current;
    if (!on || !el || window.matchMedia('(max-width: 760px)').matches) {
      setPinned(false);
      setStage(stages.length - 1);
      placeTicket(0.99);
      return;
    }
    let kill = () => {};
    let cancelled = false;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      setPinned(true);
      setStage(0);
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: () => `+=${window.innerHeight * stages.length * 0.9}`,
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          const i = Math.min(stages.length - 1, Math.floor(self.progress * stages.length));
          setStage(i);
          if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
          placeTicket(self.progress);
          if (countRef.current) countRef.current.textContent = self.progress > 0.97 ? '100+' : String(Math.round(self.progress * 100));
        },
      });
      kill = () => st.kill(true);
    })();
    return () => {
      cancelled = true;
      kill();
    };
  }, [on, stages.length]);

  return (
    <section id="pipeline" className="sec sec--dark pipeline" aria-labelledby="pipeline-title" data-ticket-away data-ticket="PR opened" data-ticket-kind="pr">
      <span className="route-anchor" data-route="gutter" data-route-at="top" />
      <div className="wrap pipeline__intro">
        <p className="eyebrow">{t(s.kicker)}</p>
        <h2 id="pipeline-title" className="display">{t(s.title)}</h2>
        <p className="lede">{t(s.intro)}</p>
      </div>

      <div ref={sceneRef} className={`scene ${pinned ? 'scene--pinned' : 'scene--static'}`}>
        <div className="scene__inner wrap">
          <ol className="stages">
            {stages.map((st, i) => (
              <li key={st.label} className={`stages__item ${i === stage ? 'is-active' : ''} ${i < stage ? 'is-done' : ''}`}>
                <span className="stages__num">{i + 1}</span>
                <div className="stages__copy">
                  <h3 className="stages__label">{t(st.label)}</h3>
                  <p className="stages__text">{t(st.text)}</p>
                  {st.badge && <span className="badge">{t(st.badge)}</span>}
                  {st.aside && (
                    <p className="stages__aside">
                      <b>{t(st.aside.label)}.</b> {t(st.aside.text)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <div className="scene__visual" ref={visRef}>
            <div className="hud" aria-hidden="true">
              <span className="hud__k">bugs cleared</span>
              <span ref={countRef} className="hud__v">100+</span>
              <span className="hud__k">in about six weeks</span>
            </div>
            <Factory stage={stage} />
            <p className="factory__status"><span className={`dot ${stage >= 5 ? 'dot--green' : 'dot--red'}`} aria-hidden="true" />Ticket 0001 · {STATUS[stage]}</p>
            <p className="label">{t(s.visualLabel)}</p>
            <span className="scene__bar" aria-hidden="true"><span ref={barRef} /></span>
          </div>
        </div>
      </div>

      <div className="wrap">
        <p className="pipeline__result">{t(s.result)}</p>
        <p className="fine">{t(s.visualNote)}</p>
      </div>
      <span className="route-anchor route-anchor--end" data-route="gutter" data-route-at="bottom" />
    </section>
  );
}
