'use client';

import { useEffect, useState } from 'react';
import { useMotion } from './motion';
import { Clone } from './Buttons';
import { EMAIL_DOMAIN, EMAIL_USER, section, t } from '@/lib/content';

/* ---------- Motion (provider and smooth scroll live in ./motion) ---------- */

export { MotionProvider, SmoothScroll, useMotion } from './motion';

/* ---------- Nav scroll spy: the lens follows the section in view ---------- */

export function ScrollSpy() {
  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-spy]'));
    const targets = links.map((l) => document.getElementById(l.dataset.spy!)).filter(Boolean) as HTMLElement[];
    let raf = 0;
    const tick = () => {
      raf = 0;
      const y = window.innerHeight * 0.35;
      let cur: string | null = null;
      for (const el of targets) if (el.getBoundingClientRect().top <= y) cur = el.id;
      links.forEach((l) => l.classList.toggle('is-on', l.dataset.spy === (cur ?? 'top')));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
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

/* ---------- Footer: copy the curl command ---------- */

export function CopyCommand({ command }: { command: string }) {
  return (
    <div className="term-line">
      <code>
        <span className="term-line__ps" aria-hidden="true">$ </span>
        {command}
      </code>
      <Clone text={command} />
    </div>
  );
}
