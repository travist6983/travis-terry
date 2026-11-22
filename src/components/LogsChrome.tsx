import { section, t } from '@/lib/content';
import { KillSwitch } from '@/components/client';
import type { Commit } from '@/lib/logs';

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

/** The prompt in the phone top bar: `> ~/logs git:(main)`, or a post's short slug and commit id. */
export type Prompt = { path: string; ref: string };

export function LogsHeader({ prompt = { path: '~/logs', ref: 'main' } }: { prompt?: Prompt }) {
  const h = section('header');
  return (
    <>
      <header className="nav nav--logs">
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
      {/* Phones (<= 760px): a sticky bar with a terminal-prompt pill instead of the header */}
      <header className="lbar">
        <a className="skip" href="#main">{t(h.skipLink)}</a>
        <div className="lbar__inner">
          <a className="lbar__who" href="/">{t(h.wordmark)}</a>
          <span className="lbar__prompt" aria-label={`You are in ${prompt.path}, ${prompt.ref}`}>
            <span className="lbar__ar" aria-hidden="true">&gt;</span>
            <span aria-hidden="true">{prompt.path}</span>
            <span className="lbar__git" aria-hidden="true">git:(<span className="lbar__ref">{prompt.ref}</span>)</span>
          </span>
        </div>
      </header>
    </>
  );
}

// Dock order and short labels; the targets come from the header's nav items in content.json.
const DOCK: [string, string][] = [['sixty', '60s'], ['pipeline', 'pipeline'], ['career', 'career'], ['contact', 'contact'], ['logs', 'log']];

/** Phones only: a fixed frosted dock of commit-dot links. The build log is HEAD. */
export function LogsDock({ page }: { page: boolean }) {
  const h = section('header');
  const href = (key: string) => {
    const n = h.nav.find((x: Any) => x.href.replace(/^[#/]/, '') === key);
    const raw: string = n?.href ?? `#${key}`;
    return raw.startsWith('#') ? `/${raw}` : raw;
  };
  return (
    <nav className="ldock" aria-label="Sections">
      <span className="ldock__rail" aria-hidden="true" />
      {DOCK.map(([key, label]) => {
        const here = key === 'logs';
        return (
          <a key={key} href={href(key)} className={`ldock__node${here ? ' is-on' : ''}`} aria-current={here ? (page ? 'page' : 'true') : undefined}>
            {here && <span className="ldock__hd" aria-hidden="true">HEAD</span>}
            <span className="ldock__d" aria-hidden="true" />
            {label}
          </a>
        );
      })}
    </nav>
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

/** A post's real commit id, linked to the commit on GitHub. Before the post is committed (dev only) it says so. */
export function CommitId({ commit }: { commit: Commit }) {
  if (!commit) return <span className="logpost__sha logpost__sha--local">uncommitted</span>;
  return (
    <a className="logpost__sha" href={commit.url} title={`Commit ${commit.sha} on GitHub`} target="_blank" rel="noopener">
      <span className="sr-only">Commit </span>{commit.id}
    </a>
  );
}
