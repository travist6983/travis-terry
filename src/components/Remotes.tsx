import { content, section, t } from '@/lib/content';
import { EmailLink } from '@/components/client';
import { RemoteOrb } from '@/components/Buttons';

/*
 * Contact and social links as `git remote -v` rows: a brand tile, the name, what it's for, and a
 * round orb whose arrow flies out on hover. The home contact card uses the dark rows; the resume
 * sidebar uses `light`, a compact version for a pale card.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

type Style = { bg: string; fg: string; cbg: string; cfg: string; ring: string; glyph: React.ReactNode };

const MAIL = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
const CODE = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>;
const BRANCH = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="5" r="2.5" /><circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="8" r="2.5" /><path d="M6 7.5v9M18 10.5c0 4-6 3-12 6" /></svg>;

const DARK: Record<string, Style> = {
  'contact.remote.email': { bg: '#ff8a5c', fg: '#0c1220', cbg: '#ff8a5c', cfg: '#0c1220', ring: '#ff8a5c', glyph: MAIL },
  'contact.remote.x': { bg: '#000', fg: '#fff', cbg: '#fff', cfg: '#000', ring: '#ffffff', glyph: 'X' },
  'contact.remote.linkedin': { bg: '#0a66c2', fg: '#fff', cbg: '#0a66c2', cfg: '#fff', ring: '#4b9be8', glyph: 'in' },
  'contact.remote.github': { bg: '#f0f6fc', fg: '#24292f', cbg: '#f0f6fc', cfg: '#24292f', ring: '#f0f6fc', glyph: CODE },
};

// On a pale card the white tiles and orbs would vanish, so those flip to dark.
const LIGHT: Record<string, Style> = {
  ...DARK,
  'contact.remote.x': { ...DARK['contact.remote.x'], cbg: '#000', cfg: '#fff', ring: '#000' },
  'contact.remote.github': { ...DARK['contact.remote.github'], bg: '#24292f', fg: '#fff', cbg: '#24292f', cfg: '#fff', ring: '#24292f' },
  portfolio: { bg: '#7c5cff', fg: '#fff', cbg: '#7c5cff', cfg: '#fff', ring: '#7c5cff', glyph: BRANCH },
};

const ext = { target: '_blank', rel: 'noopener' } as const;

function Row({ id, name, sub, cta, href, email, light }: { id: string; name: string; sub: string; cta?: string; href?: string; email?: boolean; light?: boolean }) {
  const st = (light ? LIGHT : DARK)[id];
  const cls = `remote${light ? ' remote--light' : ''}`;
  const inner = (
    <>
      <span className="remote__i" aria-hidden="true" style={{ background: st.bg, color: st.fg }}>{st.glyph}</span>
      <span className="remote__b">
        <span className="remote__n">{name}</span>
        <span className="remote__u">{sub}</span>
      </span>
      {cta && <span className="sr-only">{cta}</span>}
      <RemoteOrb arrow={email || (href && !/^https?:/.test(href)) ? '→' : '↗'} bg={st.cbg} fg={st.cfg} ring={st.ring} />
    </>
  );
  if (email) return <EmailLink className={cls}>{inner}</EmailLink>;
  return <a className={cls} href={href} {...(href && /^https?:/.test(href) ? ext : {})}>{inner}</a>;
}

/** One contact remote from content.json (contact.remotes). */
export function Remote({ r, light = false }: { r: Any; light?: boolean }) {
  const email = r.hrefFrom === 'person.email';
  const href = email ? undefined : content.person[r.hrefFrom.split('.')[1]]?.href;
  return <Row id={r.id} name={t(r)} sub={`${r.verb} · ${r.detail}`} cta={r.cta} href={href} email={email} light={light} />;
}

/** The resume sidebar's list: the contact remotes plus the portfolio, on a pale card. */
export function RemotesLight({ extra }: { extra?: { name: string; sub: string; href: string } }) {
  const remotes = section('contact').remotes;
  return (
    <ul className="rremotes">
      {remotes.map((r: Any) => <li key={r.id}><Remote r={r} light /></li>)}
      {extra && <li><Row id="portfolio" name={extra.name} sub={extra.sub} href={extra.href} light /></li>}
    </ul>
  );
}
