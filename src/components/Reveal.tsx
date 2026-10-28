'use client';

import { useEffect } from 'react';
import { useMotion } from './client';

/**
 * Scroll-scrubbed scenes outside the pipeline:
 * - [data-reveal]: fades and lifts in once.
 * - .release: "about a week" strikes through as "8 to 10 hours" arrives.
 * - .contact: the PR merges and its status light turns green.
 * - page tone shifts from warm (backlog) to cool (shipped) via --tone on <html>.
 */
export function Reveal() {
  const { on } = useMotion();
  useEffect(() => {
    const root = document.documentElement;
    if (!on) {
      root.style.removeProperty('--tone');
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
      document.querySelectorAll('.release, .contact, .mcp__fig').forEach((el) => el.classList.add('is-done'));
      return;
    }
    let cleanup = () => {};
    let cancelled = false;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
          el.classList.remove('is-in');
          ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => el.classList.add('is-in') });
        });
        document.querySelectorAll<HTMLElement>('.release, .mcp__fig').forEach((el) => {
          el.classList.remove('is-done');
          ScrollTrigger.create({
            trigger: el,
            start: 'top 70%',
            end: 'center 45%',
            scrub: true,
            onUpdate: (s) => el.style.setProperty('--p', s.progress.toFixed(3)),
          });
        });
        document.querySelectorAll<HTMLElement>('.contact').forEach((el) => {
          el.classList.remove('is-done');
          ScrollTrigger.create({ trigger: el, start: 'top 60%', onEnter: () => el.classList.add('is-done') });
        });
        ScrollTrigger.create({
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (s) => root.style.setProperty('--tone', s.progress.toFixed(3)),
        });
      });
      ScrollTrigger.refresh();
      cleanup = () => ctx.revert();
    })();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [on]);
  return null;
}
