import { t } from '@/lib/content';
import { SiteHeader, nodeKey, trail, type Where } from '@/components/SiteChrome';
import type { Commit } from '@/lib/logs';

/*
 * Page light, dock and footer shared by every page, plus the build log's header and footer.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

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

/** The build log uses the site header, with HEAD on the build log node. */
export function LogsHeader({ post = false }: { post?: boolean }) {
  return <SiteHeader where={post ? 'post' : 'logs'} />;
}

/**
 * Phones and small tablets: a fixed frosted dock with the header's four page nodes. HEAD sits on the
 * page you're on.
 */
export function SiteDock({ where }: { where: Where }) {
  const here = where === 'post' ? 'logs' : where;
  return (
    <nav className="ldock" aria-label="Pages">
      <span className="ldock__rail" aria-hidden="true" />
      {trail().map((n: Any) => {
        const key = nodeKey(n);
        const on = key === here;
        return (
          <a
            key={n.id}
            href={on && where === 'home' ? '#top' : n.href}
            className={`ldock__node${on ? ' is-on' : ''}`}
            aria-current={on ? (where === 'post' ? 'true' : 'page') : undefined}
          >
            <span className="ldock__hd" aria-hidden="true">HEAD</span>
            <span className="ldock__d" aria-hidden="true" />
            {n.short ?? t(n)}
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
            <a href="/portfolio">Portfolio</a>
            <a href="/resume">Resume</a>
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
