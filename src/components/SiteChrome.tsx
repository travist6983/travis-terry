import { person, section, t } from '@/lib/content';
import { EmailLink } from '@/components/client';

/*
 * Header and footer for the home page and the resume page (v2 design). The build log keeps its own
 * header (LogsChrome); all three share the dock.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const navItem = (key: string) => section('header').nav.find((n: Any) => n.id === `header.nav.${key}`);

type Where = 'home' | 'resume' | 'portfolio';

/** The same three links on every page; on the home page the in-page ones carry the scroll-spy lens. */
const NAV = ['kit', 'journey', 'logs'];

/**
 * Portfolio and Resume: the two pages every header links to at every width (the section links hide
 * below 900px). The page you're on gets the ink style and aria-current.
 */
export function PageLinks({ here, size = 'nav' }: { here?: 'portfolio' | 'resume'; size?: 'nav' | 'bar' }) {
  const h = section('header');
  const pf = h.nav.find((n: Any) => n.id === 'header.nav.portfolio');
  const cls = size === 'bar' ? 'lbar__btn' : 'btn btn--pill';
  return (
    <>
      <a className={`${cls} ${here === 'portfolio' ? 'btn--ink' : 'btn--glass'}`} href={pf.href} {...(here === 'portfolio' ? { 'aria-current': 'page' as const } : {})}>
        {t(pf)}
      </a>
      <a className={`${cls} ${here === 'resume' ? 'btn--ink' : 'btn--accent'}`} href={h.resumePage.href} {...(here === 'resume' ? { 'aria-current': 'page' as const } : {})}>
        {t(h.resumePage)}
      </a>
    </>
  );
}

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
            {NAV.map((key) => {
              const n = navItem(key);
              const href: string = n.href.startsWith('#') && !home ? `/${n.href}` : n.href;
              return (
                <a key={key} href={href} {...(home && n.href.startsWith('#') ? { 'data-spy': n.href.slice(1) } : {})}>
                  {t(n)}
                </a>
              );
            })}
          </nav>
          <div className="nav__end">
            <PageLinks here={home ? undefined : where} />
          </div>
        </div>
      </header>
      {/* Phones (<= 760px): a sticky bar with the wordmark and the two page links */}
      <header className="lbar">
        <div className="lbar__inner">
          <a className="lbar__who" href={root}>{t(h.wordmark)}</a>
          <nav className="lbar__links" aria-label="Pages"><PageLinks here={home ? undefined : where} size="bar" /></nav>
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

/**
 * Home only, wide screens: a quiet rail of commit dots on the left edge, one per section, with the
 * one in view lit (ScrollSpy moves it via data-spy). Hover or keyboard focus opens it into a labelled
 * list for jumping between sections.
 */
export function SectionRail() {
  const items = section('header').rail;
  return (
    <nav className="srail" aria-label="Jump to section">
      <ol className="srail__list">
        {items.map((n: Any) => (
          <li key={n.id}>
            <a className="srail__a" href={n.href} data-spy={n.href.slice(1)}>
              <span className="srail__d" aria-hidden="true" />
              <span className="srail__t">{t(n)}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
