import { person, section, t } from '@/lib/content';
import { EmailLink, KillSwitch } from '@/components/client';

/*
 * Header and footer for the home page and the resume page (v2 design). The build log keeps its own
 * header (LogsChrome); all three share the dock.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const navItem = (key: string) => section('header').nav.find((n: Any) => n.id === `header.nav.${key}`);

/** Home: in-page section links with the scroll-spy lens. Resume: the same sections, linked back to the home page. */
type Where = 'home' | 'resume' | 'portfolio';

const NAV: Record<Where, string[]> = {
  home: ['kit', 'pipeline', 'safety', 'journey', 'work', 'log'],
  resume: ['journey', 'kit', 'portfolio', 'logs'],
  portfolio: ['kit', 'journey', 'portfolio', 'logs'],
};

const PROMPT: Record<Where, { path: string; label: string }> = {
  home: { path: '~', label: 'You are on the home page' },
  resume: { path: '~/resume', label: 'You are on the resume page' },
  portfolio: { path: '~/work', label: 'You are on the portfolio page' },
};

export function SiteHeader({ where }: { where: Where }) {
  const h = section('header');
  const home = where === 'home';
  const root = home ? '#top' : '/';
  return (
    <>
      <header className="nav">
        <a className="skip" href="#main">{t(h.skipLink)}</a>
        <div className="nav__inner">
          <a className="glass pillx nav__mark" href={root}>{t(h.wordmark)}</a>
          <nav aria-label="Sections" className="glass nav__group">
            {NAV[where].map((key) => {
              const n = navItem(key);
              const href: string = n.href.startsWith('#') && !home ? `/${n.href}` : n.href;
              const here = where === 'portfolio' && key === 'portfolio';
              return (
                <a
                  key={key}
                  href={href}
                  className={here ? 'is-on' : undefined}
                  aria-current={here ? 'page' : undefined}
                  {...(home ? { 'data-spy': n.href.slice(1) } : {})}
                >
                  {t(n)}
                </a>
              );
            })}
          </nav>
          <div className="nav__end">
            <KillSwitch />
            {where === 'resume' ? (
              <a className="btn btn--ink btn--pill" href={h.resumePage.href} aria-current="page">{t(h.resumePage)}</a>
            ) : (
              <a className="btn btn--accent btn--pill" href={h.resumePage.href}>{t(h.resumePage)}</a>
            )}
          </div>
        </div>
      </header>
      {/* Phones (<= 760px): the sticky bar with a terminal-prompt pill, same as the build log */}
      <header className="lbar">
        <div className="lbar__inner">
          <a className="lbar__who" href={root}>{t(h.wordmark)}</a>
          <span className="lbar__prompt" aria-label={PROMPT[where].label}>
            <span className="lbar__ar" aria-hidden="true">&gt;</span>
            <span aria-hidden="true">{PROMPT[where].path}</span>
            <span className="lbar__git" aria-hidden="true">git:(<span className="lbar__ref">main</span>)</span>
          </span>
        </div>
      </header>
    </>
  );
}

export function SiteFooter({ where }: { where: Where }) {
  const f = section('footer');
  const h = section('header');
  const body = (x: Any) => t(x).replace(/^(Privacy|Accessibility):\s*(.)/, (_m: string, _h: string, c: string) => c.toUpperCase());
  // Until the Cloudflare Web Analytics token is set, drop the sentence that says visits are counted.
  const privacy = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN ? body(f.privacy) : body(f.privacy).replace(/\s*Visits are counted[^.]*\./, '');
  const access = body(f.accessibility).replace(/email me\.?$/i, '');
  return (
    <footer className="foot">
      <div className="wrap foot__grid">
        <div className="glass foot__bar">
          <span className="foot__who">
            <b>{t(person.name)}</b> <span>{where === 'home' ? t(f.tagline) : where === 'resume' ? 'Resume' : 'Portfolio'}</span>
          </span>
          <nav className="foot__nav" aria-label="Footer">
            {where !== 'home' && <a href="/">Home</a>}
            {where !== 'portfolio' && <a href="/portfolio">Portfolio</a>}
            {where !== 'resume' && <a href={h.resumePage.href}>Resume</a>}
            <a href={h.resumePdf.href}>Resume (PDF)</a>
            <a href="/logs">Build log</a>
            <a href="/logs/feed.xml">RSS</a>
            <a href="#top" className="foot__top">Back to top</a>
          </nav>
        </div>
        <p className="foot__fine">
          <b>Privacy.</b> {privacy} <b>Accessibility.</b> {access}
          <EmailLink className="foot__mail">email me</EmailLink>.
        </p>
      </div>
    </footer>
  );
}
