'use client';

import { createContext, useContext, useEffect, useState } from 'react';

/*
 * Motion: the provider and smooth scroll. Kept apart from client.tsx,
 * which imports content.json, so pages that only need motion (the build log) don't ship the copy.
 * client.tsx re-exports these, so the home page uses the same context.
 */

/* ---------- Motion: on, unless the OS asks for reduced motion ---------- */

type MotionState = { on: boolean };
const MotionCtx = createContext<MotionState>({ on: true });
export const useMotion = () => useContext(MotionCtx);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [on, setOn] = useState(true);

  useEffect(() => {
    // The OS reduced-motion setting always wins (DECISIONS Q9). The old Pause motion switch saved
    // its choice under tt-motion; drop it so nobody stays paused with no switch to undo it.
    try {
      localStorage.removeItem('tt-motion');
    } catch {
      /* storage blocked */
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setOn(!mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = on ? 'on' : 'off';
  }, [on]);

  return <MotionCtx.Provider value={{ on }}>{children}</MotionCtx.Provider>;
}

/* ---------- Smooth scroll (off with reduced motion) ---------- */

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
