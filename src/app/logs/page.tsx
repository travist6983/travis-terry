import type { Metadata } from 'next';
import { MotionProvider, SmoothScroll } from '@/components/client';
import { CommitJourney } from '@/components/Journeys';
import { CommitId, LogsFooter, LogsHeader, Paper } from '@/components/LogsChrome';
import { fmtDate, posts } from '@/lib/logs';

const DESCRIPTION = 'Notes from building with an agent kit: the problem, what the kit did, what broke, and what I changed.';

export const metadata: Metadata = {
  title: 'Build log | Travis Terry',
  description: DESCRIPTION,
  alternates: { canonical: '/logs', types: { 'application/rss+xml': [{ url: '/logs/feed.xml', title: 'Build log | Travis Terry' }] } },
  openGraph: { type: 'website', url: '/logs', title: 'Build log | Travis Terry', description: DESCRIPTION },
};

/*
 * One post = one commit on the home page's git graph (CommitJourney, src/components/Journeys.tsx).
 * Each <li data-commit> becomes a dot on the main line; HEAD rides it as you scroll, newest first.
 */
export default function LogsPage() {
  const list = posts();
  return (
    <MotionProvider>
      <Paper />
      <SmoothScroll />
      <LogsHeader />
      <main id="main">
        <div id="logs-act" className="act">
          <CommitJourney actId="logs-act" />
          <section id="top" className="sec logs" aria-labelledby="logs-title">
            <div className="wrap graph-col">
              <div className="sec__head">
                <span className="glass badge"><span className="badge__dot" aria-hidden="true" />git log · {list.length} {list.length === 1 ? 'commit' : 'commits'}</span>
                <h1 id="logs-title" className="h2">Build log</h1>
                <p className="lede">{DESCRIPTION}</p>
                <a className="mono-link" href="/logs/feed.xml">RSS: /logs/feed.xml</a>
              </div>
              {list.length ? (
                <ol className="log log--posts">
                  {list.map((p) => (
                    <li key={p.slug} className="glass log__item logpost" data-commit>
                      <span className="kick logpost__meta"><CommitId commit={p.commit} /> · <time dateTime={p.date}>{fmtDate(p.date)}</time></span>
                      <h2 className="logpost__title"><a href={`/logs/${p.slug}`}>{p.title}</a></h2>
                      <p className="logpost__sum">{p.summary}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="glass log__edu" data-commit><span className="kick">NO COMMITS YET</span> The first post is on its way.</p>
              )}
            </div>
          </section>
        </div>
      </main>
      <LogsFooter />
    </MotionProvider>
  );
}
