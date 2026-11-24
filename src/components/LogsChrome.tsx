import { section, t } from '@/lib/content';
import { MotionToggle } from '@/components/motion';
import type { Commit } from '@/lib/logs';

/*
 * Header, page light and footer for the build log pages. Same classes as the home page chrome;
 * the home page's in-page anchors point back to the home page from here.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const SHOW = ['journey', 'kit', 'portfolio', 'logs'];

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
            <MotionToggle pauseLabel={t(h.motionControl.pauseLabel)} pausedLabel={t(h.motionControl.statusPaused)} />
            <a className="btn btn--accent btn--pill" href={h.resumePage.href}>{t(h.resumePage)}</a>
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

// Dock order, short labels and targets. In-page targets get the home page's scroll spy.
const DOCK: { key: string; label: string; href: string }[] = [
  { key: 'top', label: 'home', href: '#top' },
  { key: 'kit', label: 'kit', href: '#kit' },
  { key: 'work', label: 'work', href: '#work' },
  { key: 'logs', label: 'log', href: '/logs' },
  { key: 'resume', label: 'resume', href: '/resume' },
];

/**
 * Phones and small tablets (<= 900px, where the header's section links are hidden): a fixed frosted
 * dock of commit-dot links. HEAD sits on the page you're on; on the home page the in-page links
 * carry data-spy, so the home page's ScrollSpy moves HEAD as you scroll.
 */
export function SiteDock({ where }: { where: 'home' | 'logs' | 'post' | 'resume' | 'portfolio' }) {
  const home = where === 'home';
  const here = (key: string) =>
    (key === 'logs' && (where === 'logs' || where === 'post')) || (key === 'resume' && where === 'resume') || (key === 'work' && where === 'portfolio');
  return (
    <nav className="ldock" aria-label="Sections">
      <span className="ldock__rail" aria-hidden="true" />
      {DOCK.map(({ key, label, href }) => {
        const inPage = href.startsWith('#');
        const on = here(key);
        return (
          <a
            key={key}
            href={inPage && !home ? (key === 'top' ? '/' : key === 'work' ? '/portfolio' : `/${href}`) : href}
            className={`ldock__node${on ? ' is-on' : ''}`}
            aria-current={on ? (where === 'post' ? 'true' : 'page') : undefined}
            {...(home && inPage ? { 'data-spy': key } : {})}
          >
            <span className="ldock__hd" aria-hidden="true">HEAD</span>
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
