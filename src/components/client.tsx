'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { EMAIL_DOMAIN, EMAIL_USER, section, t } from '@/lib/content';

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

export function KillSwitch({ variant = 'nav' }: { variant?: 'nav' | 'panel' }) {
  const { on, toggle } = useMotion();
  const mc = section('header').motionControl;
  return (
    <button
      type="button"
      className={`kill kill--${variant}`}
      aria-pressed={!on}
      aria-label={t(mc.ariaLabel)}
      onClick={toggle}
    >
      <span className="kill__track" aria-hidden="true">
        <span className="kill__thumb" />
      </span>
      <span className="kill__label">{on ? t(mc.pauseLabel) : t(mc.statusPaused)}</span>
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

/* ---------- Email (assembled at runtime so scrapers never see it in HTML) ---------- */

function refTag(): string | null {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref');
    return ref ? ref.replace(/[^\w-]/g, '').slice(0, 40) : null;
  } catch {
    return null;
  }
}

export function EmailLink({ className, children }: { className?: string; children: React.ReactNode }) {
  const [href, setHref] = useState('#contact');
  useEffect(() => {
    const mail = section('contact').mailto;
    const ref = refTag();
    const subject = ref ? t(mail.subjectWithRef).replace('{ref}', ref) : t(mail.subject);
    setHref(`mailto:${EMAIL_USER}@${EMAIL_DOMAIN}?subject=${encodeURIComponent(subject)}`);
  }, []);
  return (
    <a className={className} href={href}>
      {children}
    </a>
  );
}

export function EmailAddress() {
  const [addr, setAddr] = useState<string | null>(null);
  useEffect(() => setAddr(`${EMAIL_USER}@${EMAIL_DOMAIN}`), []);
  return <span>{addr ?? 'Email me'}</span>;
}

/* ---------- Availability date (DECISIONS Q49) ---------- */

export function AvailableToday() {
  const [d, setD] = useState<string | null>(null);
  useEffect(() => {
    setD(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
  }, []);
  return d ? <span className="avail-date"> (as of {d})</span> : null;
}

/* ---------- Count-up number (final value is in the HTML; motion only animates toward it) ---------- */

export function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const { on } = useMotion();
  const fmt = (n: number) => n.toLocaleString('en-US') + suffix;
  const [shown, setShown] = useState(fmt(to));
  useEffect(() => {
    if (!on) {
      setShown(fmt(to));
      return;
    }
    const el = document.querySelector(`[data-count="${to}"]`);
    if (!el) return;
    let raf = 0;
    setShown(fmt(0));
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1600;
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 4);
          setShown(fmt(Math.round(to * eased)));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, to]);
  return (
    <span data-count={to} aria-hidden="true">
      {shown}
    </span>
  );
}
