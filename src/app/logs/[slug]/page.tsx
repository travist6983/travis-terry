import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MotionProvider } from '@/components/client';
import { CommitId, LogsFooter, LogsHeader, Paper } from '@/components/LogsChrome';
import { EMPTY_SLUG, fmtDate, post, posts } from '@/lib/logs';

type Props = { params: Promise<{ slug: string }> };

// Only published posts get a page. Drafts are filtered out in src/lib/logs-core.mjs.
// output: 'export' fails the build on an empty list, so with no posts yet we emit one placeholder
// that renders the 404; scripts/check-logs.mjs deletes it from dist/ after the build.
export const dynamicParams = false;
export function generateStaticParams() {
  const list = posts().map((p) => ({ slug: p.slug }));
  return list.length ? list : [{ slug: EMPTY_SLUG }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = post((await params).slug);
  if (!p) return {};
  const title = `${p.title} | Build log | Travis Terry`;
  return {
    title,
    description: p.summary,
    alternates: { canonical: `/logs/${p.slug}`, types: { 'application/rss+xml': [{ url: '/logs/feed.xml', title: 'Build log | Travis Terry' }] } },
    openGraph: { type: 'article', url: `/logs/${p.slug}`, title, description: p.summary, publishedTime: p.date, tags: p.tags },
  };
}

export default async function LogPost({ params }: Props) {
  const p = post((await params).slug);
  if (!p) notFound();
  return (
    <MotionProvider>
      <Paper />
      <LogsHeader />
      <main id="main">
        <article id="top" className="sec post" aria-labelledby="post-title">
          <div className="wrap wrap--narrow">
            <a className="mono-link" href="/logs">← Build log</a>
            <header className="post__head">
              <span className="kick logpost__meta"><CommitId commit={p.commit} /> · <time dateTime={p.date}>{fmtDate(p.date)}</time>{p.draft ? ' · DRAFT (dev only)' : ''}</span>
              <h1 id="post-title" className="h2">{p.title}</h1>
              <p className="lede">{p.summary}</p>
              {p.tags.length > 0 && (
                <ul className="tags tags--sm" aria-label="Tags">
                  {p.tags.map((tag) => <li key={tag} className="tag tag--mono">{tag}</li>)}
                </ul>
              )}
            </header>
            <div className="glass panel panel--lg prose" dangerouslySetInnerHTML={{ __html: p.html }} />
            <nav className="post__pager" aria-label="More posts">
              {p.older ? <a className="glass post__pg" href={`/logs/${p.older.slug}`}><span className="kick">← PREVIOUS</span>{p.older.title}</a> : <span />}
              {p.newer ? <a className="glass post__pg post__pg--next" href={`/logs/${p.newer.slug}`}><span className="kick">NEXT →</span>{p.newer.title}</a> : <span />}
            </nav>
          </div>
        </article>
      </main>
      <LogsFooter />
    </MotionProvider>
  );
}
