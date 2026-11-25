'use client';

import { useEffect, useRef } from 'react';
import { useMotion } from './motion';

/*
 * A HEAD dot that rides a git graph as the page scrolls, for the resume and the portfolio.
 * Same idea as the home page journeys: HEAD is held at a fixed line of the viewport and the graph
 * above it is drawn, the graph below it is not. Everything is a pure function of the scroll
 * position, with no timers, so scrolling back up rewinds it exactly and a jump lands in the right state.
 */

const HOLD = 0.45;

/**
 * The viewport y that HEAD is held at. Near the end of the page there is not enough scroll left for
 * the bottom of a graph to reach 45%, so the line slides down toward the bottom over the last half screen.
 */
export function holdLine() {
  const vh = window.innerHeight;
  const left = document.documentElement.scrollHeight - vh - window.scrollY;
  const end = Math.min(1, Math.max(0, 1 - left / (vh * 0.5)));
  return vh * (HOLD + (0.92 - HOLD) * end);
}

/** Run `paint` now and on every scroll or resize, at most once per frame. */
export function onScrollFrame(paint: () => void) {
  let raf = 0;
  const frame = () => {
    raf = 0;
    paint();
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };
  paint();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  // Images and fonts loading change the layout without a scroll or resize event.
  const ro = new ResizeObserver(schedule);
  ro.observe(document.body);
  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
  };
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The resume's career line. Rendered as the last <li> of .rlog__list: HEAD rides the line, the
 * gradient fill follows it (--p), and each entry's commit dot lights once HEAD has reached it.
 */
export function CareerHead() {
  const { on } = useMotion();
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const head = ref.current;
    const list = head?.parentElement;
    if (!head || !list || !on) return;
    const entries = Array.from(list.querySelectorAll<HTMLElement>('.rentry'));
    list.classList.add('is-live');
    const stop = onScrollFrame(() => {
      // The line runs from 28px below the list's top to 40px above its bottom (see .rlog__list::before).
      const top = 28;
      const bottom = list.offsetHeight - 40;
      const y = clamp(holdLine() - list.getBoundingClientRect().top, top, bottom);
      list.style.setProperty('--p', ((y - top) / (bottom - top)).toFixed(4));
      head.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      // An entry's dot is centred 34px below its top.
      entries.forEach((e) => e.classList.toggle('is-on', e.offsetTop + 26 <= y));
    });
    return () => {
      stop();
      list.classList.remove('is-live');
      list.style.removeProperty('--p');
      entries.forEach((e) => e.classList.remove('is-on'));
    };
  }, [on]);
  return (
    <li ref={ref} className="ghead" aria-hidden="true">
      <span className="head__dot" />
    </li>
  );
}
