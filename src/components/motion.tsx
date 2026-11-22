'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

/*
 * Motion: the provider, the Pause motion switch and smooth scroll. Kept apart from client.tsx,
 * which imports content.json, so pages that only need motion (the build log) don't ship the copy.
 * client.tsx re-exports these, so the home page uses the same context.
 */

/* ---------- Motion kill switch ---------- */

type MotionState = { on: boolean; toggle: () => void };
const MotionCtx = createContext<MotionState>({ on: true, toggle: () => {} });
export const useMotion = () => useContext(MotionCtx);

const KEY = 'tt-motion';

function readSaved(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [on, setOn] = useState(true);

  useEffect(() => {
    // The OS reduced-motion setting always wins (DECISIONS Q9).
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setOn(!reduced && readSaved() !== 'off');
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = on ? 'on' : 'off';
  }, [on]);

  const toggle = useCallback(() => {
    setOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(KEY, next ? 'on' : 'off');
      } catch {
        /* storage blocked: the choice lasts for this visit only */
      }
      return next;
    });
  }, []);

  return <MotionCtx.Provider value={{ on, toggle }}>{children}</MotionCtx.Provider>;
}

/** The Pause motion switch. Labels come in as props so this module never imports content.json. */
export function MotionToggle({ variant = 'nav', pauseLabel, pausedLabel }: { variant?: 'nav' | 'panel'; pauseLabel: string; pausedLabel: string }) {
  const { on, toggle } = useMotion();
  return (
    <button
      type="button"
      className={`kill kill--${variant} ${variant === 'nav' ? 'glass' : ''}`}
      aria-pressed={!on}
      onClick={toggle}
    >
      <span className="kill__track" aria-hidden="true">
        <span className="kill__thumb" />
      </span>
      <span className="kill__label">{on ? pauseLabel : pausedLabel}</span>
    </button>
  );
}

/* ---------- Smooth scroll (off with the kill switch) ---------- */

export function SmoothScroll() {
  const { on } = useMotion();
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    let destroyed = false;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (destroyed) return;
      gsap.registerPlugin(ScrollTrigger);
      const l = new Lenis({ lerp: 0.12, anchors: true });
      l.on('scroll', ScrollTrigger.update);
      lenis = l;
      const loop = (time: number) => {
        l.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    })();
    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, [on]);
  return null;
}
