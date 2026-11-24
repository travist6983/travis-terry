'use client';

import { useEffect, useRef, useState } from 'react';
import { useMotion } from './motion';

/*
 * The hero's defect loop: one ticket steps through the stages. At each stop the line fills to the
 * stage, its dot turns green, and the ticket's status changes; at ship it becomes a PR, holds, then
 * the run fades and starts over. Reduced motion (or no JS) shows the finished run.
 */

const STEP = 1700; // ms per stage
const HOLD = 3200; // ms parked at ship
const FADE = 450; // ms for the ticket to fade out before the next run

type Props = {
  stages: string[];
  status: string[];
  from: { flag: string };
  to: { flag: string; text: string };
};

export function LoopBar({ stages, status, from, to }: Props) {
  const n = stages.length - 1;
  const { on } = useMotion();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'run' | 'out' | 'snap'>('run');
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!on) {
      setI(n);
      setPhase('run');
      return;
    }
    let timer = 0;
    let visible = true;
    let cur = 0;
    const tick = () => {
      if (!visible) {
        timer = window.setTimeout(tick, 400);
        return;
      }
      if (cur < n) {
        cur += 1;
        setI(cur);
        timer = window.setTimeout(tick, cur === n ? HOLD : STEP);
        return;
      }
      // Fade the finished ticket, snap back to intake with transitions off, then fade in.
      setPhase('out');
      timer = window.setTimeout(() => {
        cur = 0;
        setPhase('snap');
        setI(0);
        timer = window.setTimeout(() => {
          setPhase('run');
          timer = window.setTimeout(tick, STEP);
        }, 60);
      }, FADE);
    };
    cur = 0;
    setPhase('snap');
    setI(0);
    timer = window.setTimeout(() => {
      setPhase('run');
      timer = window.setTimeout(tick, STEP);
    }, 60);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    if (ref.current) io.observe(ref.current);
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [on, n]);

  const shipped = i === n;
  const label = status[i] ?? '';
  return (
    <ol ref={ref} className={`loopbar__track is-${phase}${shipped ? ' is-shipped at-end' : ''}${i === 0 ? ' at-0' : ''}`} aria-label="Defect loop stages">
      <li className="loopbar__line" aria-hidden="true" />
      <li className="loopbar__fill" aria-hidden="true" style={{ width: `${(i / n) * 100}%` }} />
      {stages.map((st, k) => (
        <li
          key={st}
          className={`loopbar__n${k < i || shipped ? ' is-done' : ''}${k === i && !shipped ? ' is-cur' : ''}`}
          style={{ left: `${(k / n) * 100}%` }}
          aria-current={k === i ? 'step' : undefined}
        >
          <span className="loopbar__d" aria-hidden="true" />
          {st}
        </li>
      ))}
      <li className="loopbar__tkt" aria-hidden="true" style={{ left: `${(i / n) * 100}%` }}>
        <span className="loopbar__tl" key={i}>
          <b>{shipped ? to.flag : from.flag}</b>
          {shipped ? to.text : label}
        </span>
        <i /><i />
      </li>
    </ol>
  );
}
