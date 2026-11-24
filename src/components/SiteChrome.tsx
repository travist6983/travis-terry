import { person, section, t } from '@/lib/content';
import { EmailLink } from '@/components/client';

/*
 * Header, footer and the home page's section rail. Every page (home, portfolio, resume, build log)
 * uses the same header; LogsChrome holds the shared dock.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

/** Which page you're on. The build log index and its posts both sit on the build log node. */
export type Where = 'home' | 'portfolio' | 'logs' | 'post' | 'resume';

const NODE: Record<Where, string> = { home: 'home', portfolio: 'portfolio', logs: 'logs', post: 'logs', resume: 'resume' };
const PATH: Record<Where, string> = { home: '~', portfolio: '~/work', logs: '~/logs', post: '~/logs', resume: '~/resume' };

/** The four pages, as commit nodes on one line, in the header (and the phone dock). */
export const trail = (): Any[] => section('header').trail;
export const nodeKey = (n: Any) => n.id.replace('header.trail.', '');

/**
 * The header on every page (v3 design): one centred glass bar with the name over a terminal prompt
 * (`~/resume git:(main)`), then the pages as commit nodes on a line. HEAD sits on the page you're on.
 * Phones (<= 760px) get a slim bar with the name and prompt; the dock carries the same four nodes.
 */
export function SiteHeader({ where, path }: { where: Where; path?: string }) {
  const h = section('header');
  const here = NODE[where];
  const prompt = path ?? PATH[where];
  const root = where === 'home' ? '#top' : '/';
  return (
    <>
      <header className="nav">
        <a className="skip" href="#main">{t(h.skipLink)}</a>
        <div className="glass topbar">
          <a className="topbar__who" href={root}>
            {t(h.wordmark)}
            <small aria-hidden="true">{prompt} git:(<b>main</b>)</small>
          </a>
          <nav className="trail" aria-label="Pages">
            <span className="trail__line" aria-hidden="true" />
            {trail().map((n: Any) => {
              const on = nodeKey(n) === here;
              return (
                <a key={n.id} className={`trail__n${on ? ' is-on' : ''}`} href={on && where === 'home' ? '#top' : n.href} {...(on ? { 'aria-current': 'page' as const } : {})}>
                  {on && <span className="trail__hd" aria-hidden="true">HEAD</span>}
                  <span className="trail__d" aria-hidden="true" />
                  {t(n)}
                </a>
              );
            })}
          </nav>
        </div>
      </header>
      <header className="lbar">
        <div className="lbar__inner">
          <a className="lbar__who" href={root}>{t(h.wordmark)}</a>
          <span className="lbar__prompt" aria-hidden="true">
            <span className="lbar__ar">&gt;</span>
            <span>{prompt}</span>
            <span className="lbar__git">git:(<span className="lbar__ref">main</span>)</span>
          </span>
        </div>
      </header>
    </>
  );
}

export function SiteFooter({ where }: { where: 'home' | 'portfolio' | 'resume' }) {
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
