'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/*
 * The button sheet (v2 design): every button is a git command.
 *   Push      primary action     a dark pill in a slow colour ring; hover runs the loop dots and rolls
 *                                the label into its command; click confirms in green
 *   Checkout  secondary action   marching dashed outline; hover floods it with the branch colour
 *   Fetch     link out           no pill: an underline rail whose dot rides to the end and turns HEAD
 *   Cmd       command link       a tiny terminal with a blinking cursor that retypes on hover
 *   Branch    filters and tags   a coloured dot that pings on hover and floods the chip when on
 *   Switch    tabs and toggles   one dark thumb with a HEAD tag that springs between options
 *   Clone     copy               snaps green with a check and a ring burst, reads "cloned"
 *   RemoteOrb icon actions       the arrow shoots out, a fresh one flies in, an orbit ring draws
 * Motion stops with the OS reduced-motion setting (the global data-motion='off' rule).
 */

const ext = (href: string) => (/^https?:/.test(href) ? { target: '_blank', rel: 'noopener' } : {});

/* ---------- Push ---------- */

/** The inside of a Push button, for wrappers that render their own element (EmailLink, submit buttons). */
export function PushInner({ label, cmd, done }: { label: string; cmd: string; done: string }) {
  return (
    <>
      <span className="bpush__dots" aria-hidden="true"><i /><b /><i /><b /><i /><b /><i /></span>
      <span className="bpush__roll">
        <span className="bpush__t0">{label}</span>
        <span className="bpush__t1" aria-hidden="true">{cmd}</span>
        <span className="bpush__t2" aria-hidden="true">{done}</span>
      </span>
    </>
  );
}

function useOk(ms = 2200): [boolean, () => void] {
  const [ok, setOk] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return [
    ok,
    () => {
      setOk(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setOk(false), ms);
    },
  ];
}

type PushProps = { label: string; cmd: string; done: string; size?: 'md' | 'sm'; className?: string };

export function Push({ href, download, ...p }: PushProps & { href: string; download?: boolean }) {
  const [ok, fire] = useOk();
  return (
    <a
      className={`bpush${p.size === 'sm' ? ' bpush--sm' : ''}${ok ? ' is-ok' : ''}${p.className ? ` ${p.className}` : ''}`}
      href={href}
      onClick={fire}
      {...(download ? { download: '' } : ext(href))}
    >
      <PushInner label={p.label} cmd={p.cmd} done={p.done} />
    </a>
  );
}

export function PushButton({ type = 'button', onClick, ...p }: PushProps & { type?: 'button' | 'submit'; onClick?: () => void }) {
  const [ok, fire] = useOk();
  return (
    <button
      type={type}
      className={`bpush${p.size === 'sm' ? ' bpush--sm' : ''}${ok ? ' is-ok' : ''}${p.className ? ` ${p.className}` : ''}`}
      onClick={() => {
        fire();
        onClick?.();
      }}
    >
      <PushInner label={p.label} cmd={p.cmd} done={p.done} />
    </button>
  );
}

/* ---------- Checkout ---------- */

const BranchIcon = () => (
  <svg className="bco__ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="6" cy="5" r="2.5" />
    <circle cx="6" cy="19" r="2.5" />
    <circle cx="18" cy="8" r="2.5" />
    <path d="M6 7.5v9M18 10.5c0 4-6 3-12 6" />
  </svg>
);

export function Checkout({ href, children, color = '#7c5cff' }: { href: string; children: React.ReactNode; color?: string }) {
  return (
    <a className="bco" href={href} style={{ '--c': color } as React.CSSProperties} {...ext(href)}>
      <svg className="bco__ants" aria-hidden="true"><rect rx="26" ry="26" /></svg>
      <BranchIcon />
      {children}
    </a>
  );
}

/* ---------- Fetch ---------- */

export function Fetch({ href, children, ink = false }: { href: string; children: React.ReactNode; ink?: boolean }) {
  return (
    <a className={`bfetch${ink ? ' bfetch--ink' : ''}`} href={href} {...ext(href)}>
      {children} <span className="bfetch__ar" aria-hidden="true">↗</span>
    </a>
  );
}

/* ---------- Cmd ---------- */

export function Cmd({ href, cmd, label, size = 'md', className }: { href: string; cmd: string; label?: string; size?: 'md' | 'sm'; className?: string }) {
  return (
    <a
      className={`bcmd${size === 'sm' ? ' bcmd--sm' : ''}${className ? ` ${className}` : ''}`}
      href={href}
      style={{ '--n': `${cmd.length}ch`, '--s': cmd.length } as React.CSSProperties}
      {...(label ? { 'aria-label': label } : {})}
      {...ext(href)}
    >
      <span className="bcmd__ps" aria-hidden="true">$</span>
      {/* The box keeps the full command's width while the text retypes inside it; if the button
          shrank on hover it would slip out from under the pointer and flicker in and out of hover. */}
      <span className="bcmd__box">
        <span className="bcmd__ty">{cmd}</span>
        <span className="bcmd__ct" aria-hidden="true" />
      </span>
    </a>
  );
}

/* ---------- Branch ---------- */

export function Branch({
  on,
  color = 'var(--accent-fill)',
  ink = '#fff',
  count,
  onClick,
  children,
  className,
}: {
  on?: boolean;
  color?: string;
  ink?: string;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`bbr${on ? ' is-on' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--c': color, '--t': ink } as React.CSSProperties}
      {...(on !== undefined ? { 'aria-pressed': on } : {})}
      onClick={onClick}
    >
      <i aria-hidden="true" />
      <span className="bbr__l">{children}</span>
      {count !== undefined && <span className="bbr__n">{count}</span>}
    </button>
  );
}

/* ---------- Switch ---------- */

export function Switch<T extends string>({
  items,
  value,
  onChange,
  label,
  tabs = false,
  className,
}: {
  items: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  tabs?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);
  const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;
  useIso(() => {
    const measure = () => {
      const sc = ref.current;
      const el = sc?.querySelector<HTMLButtonElement>('button.is-on');
      if (el) setThumb({ x: el.offsetLeft, w: el.offsetWidth });
      edges();
    };
    // Which ends have more options hidden past them (drives the edge fade)
    const edges = () => {
      const sc = ref.current;
      if (!sc) return;
      sc.classList.toggle('is-l', sc.scrollLeft > 1);
      sc.classList.toggle('is-r', sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 1);
    };
    measure();
    window.addEventListener('resize', measure);
    ref.current?.addEventListener('scroll', edges, { passive: true });
    const sc = ref.current;
    return () => {
      window.removeEventListener('resize', measure);
      sc?.removeEventListener('scroll', edges);
    };
  }, [value]);
  // Keep the chosen option in view when the row scrolls (phones). Scrolls the row only, never the page.
  useEffect(() => {
    const sc = ref.current;
    const el = sc?.querySelector<HTMLButtonElement>('button.is-on');
    if (!sc || !el) return;
    const pad = 24;
    if (el.offsetLeft - pad < sc.scrollLeft) sc.scrollTo({ left: el.offsetLeft - pad, behavior: 'smooth' });
    else if (el.offsetLeft + el.offsetWidth + pad > sc.scrollLeft + sc.clientWidth)
      sc.scrollTo({ left: el.offsetLeft + el.offsetWidth + pad - sc.clientWidth, behavior: 'smooth' });
  }, [value]);
  // The track stays put while the options scroll inside it, so the outer box draws the track
  // and the inner box scrolls (with the thumb inside, so the thumb moves with its option).
  return (
    <div className={`bsw${className ? ` ${className}` : ''}`}>
      <div ref={ref} className="bsw__sc" role={tabs ? 'tablist' : 'group'} aria-label={label}>
        <span
          className="bsw__thumb"
          aria-hidden="true"
          style={thumb ? { transform: `translateX(${thumb.x}px)`, width: thumb.w } : { opacity: 0 }}
        />
        {items.map((it) => {
          const on = it.value === value;
          return (
            <button
              key={it.value}
              type="button"
              className={on ? 'is-on' : undefined}
              {...(tabs ? { role: 'tab', 'aria-selected': on } : { 'aria-pressed': on })}
              onClick={() => onChange(it.value)}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Clone ---------- */

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" />
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false; // clipboard blocked: the text is still selectable
  }
}

/** Copies `text` (or this page's URL when text is null). `light` is for use on light backgrounds. */
export function Clone({ text, label = 'clone', light = false, className }: { text: string | null; label?: string; light?: boolean; className?: string }) {
  const [ok, fire] = useOk(2000);
  return (
    <button
      type="button"
      className={`bclone${light ? ' bclone--light' : ''}${ok ? ' is-ok' : ''}${className ? ` ${className}` : ''}`}
      onClick={async () => {
        if (await copyText(text ?? window.location.href.split('#')[0])) fire();
      }}
    >
      {ok ? <CheckIcon /> : <CopyIcon />}
      {ok ? 'cloned' : label}
      <span className="sr-only" aria-live="polite">{ok ? ' to the clipboard' : ''}</span>
    </button>
  );
}

/** Code cards from logs-core render a plain Copy button; this gives it the Clone look and behaviour. */
export const CLONE_ICON_HTML =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg>';
export const CHECK_ICON_HTML =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/* ---------- Remote ---------- */

/** The round icon action. Inside a row link it is decoration; the row's hover drives it. */
export function RemoteOrb({ arrow, bg, fg, ring }: { arrow: string; bg: string; fg: string; ring: string }) {
  return (
    <span className="rorb" style={{ '--c': bg, '--t': fg, '--rc': ring } as React.CSSProperties} aria-hidden="true">
      <span className="rorb__b">
        <span className="rorb__a rorb__a1">{arrow}</span>
        <span className="rorb__a rorb__a2">{arrow}</span>
      </span>
      <svg className="rorb__ring" viewBox="0 0 70 70"><circle cx="35" cy="35" r="32" /></svg>
    </span>
  );
}
