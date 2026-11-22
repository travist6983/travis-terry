import { section, t } from '@/lib/content';
import { KillSwitch } from '@/components/client';

/*
 * Header, page light and footer for the build log pages. Same classes as the home page chrome;
 * the home page's in-page anchors point back to the home page from here.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const SHOW = ['sixty', 'pipeline', 'career', 'contact', 'logs'];

export function Paper() {
  return (
    <div className="paper" aria-hidden="true">
      <span className="blob blob--a" />
      <span className="blob blob--b" />
      <span className="blob blob--c" />
      <span className="blob blob--d" />
    </div>
  );
}

export function LogsHeader() {
  const h = section('header');
  return (
    <header className="nav">
      <a className="skip" href="#main">{t(h.skipLink)}</a>
      <div className="nav__inner">
        <a className="glass pillx nav__mark" href="/">{t(h.wordmark)}</a>
        <nav aria-label="Sections" className="glass nav__group">
          {h.nav
            .filter((n: Any) => SHOW.includes(n.href.replace(/^[#/]/, '')))
            .map((n: Any) => {
              const here = n.href === '/logs';
              return (
                <a key={n.href} href={n.href.startsWith('#') ? `/${n.href}` : n.href} className={here ? 'is-on' : undefined} aria-current={here ? 'page' : undefined}>
                  {t(n)}
                </a>
              );
            })}
        </nav>
        <div className="nav__end">
          <KillSwitch />
          <a className="btn btn--accent btn--pill" href={h.resumePdf.href}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Resume
          </a>
        </div>
      </div>
    </header>
  );
}

export function LogsFooter() {
  return (
    <footer className="foot">
      <div className="wrap foot__grid">
        <div className="glass foot__bar">
          <span className="foot__who"><b>Travis Terry</b> <span>Build log</span></span>
          <nav className="foot__nav" aria-label="Footer">
            <a href="/">Home</a>
            <a href="/logs">All posts</a>
            <a href="/logs/feed.xml">RSS feed</a>
            <a href="#top" className="foot__top">Back to top</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
