import type { Metadata } from 'next';
import { MotionProvider, SmoothScroll } from '@/components/client';
import { LogsDock, LogsFooter, LogsHeader, Paper } from '@/components/LogsChrome';
import { LogList } from '@/components/LogsClient';
import { posts } from '@/lib/logs';

const DESCRIPTION = 'Notes from building with an agent kit: the problem, what the kit did, what broke, and what I changed.';

export const metadata: Metadata = {
  title: 'Build log | Travis Terry',
  description: DESCRIPTION,
  alternates: { canonical: '/logs', types: { 'application/rss+xml': [{ url: '/logs/feed.xml', title: 'Build log | Travis Terry' }] } },
  openGraph: { type: 'website', url: '/logs', title: 'Build log | Travis Terry', description: DESCRIPTION },
};

/*
 * The list renders on the server in full (newest first); LogList adds search, tag chips and the
 * --graph / --oneline toggle on top. In graph view each post is one commit on the home page's git
 * graph (CommitJourney, src/components/Journeys.tsx), with HEAD riding it as you scroll.
 */
export default function LogsPage() {
  const list = posts();
  return (
    <MotionProvider>
      <Paper />
      <SmoothScroll />
      <div className="logs-page">
        <LogsHeader />
        <main id="main" className="wrap lpage">
          <section id="top" className="lhead" aria-labelledby="logs-title">
            <span className="glass badge"><span className="badge__dot" aria-hidden="true" />git log · {list.length} {list.length === 1 ? 'commit' : 'commits'} · 1 branch</span>
            <h1 id="logs-title" className="h2">Build log</h1>
            <p className="lede">{DESCRIPTION}</p>
          </section>
          <LogList posts={list} />
        </main>
        <LogsFooter />
      </div>
      <LogsDock page />
    </MotionProvider>
  );
}
