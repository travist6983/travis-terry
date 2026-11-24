import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MotionProvider } from '@/components/motion';
import { LogsFooter, LogsHeader, Paper, SiteDock } from '@/components/LogsChrome';
import { CodeCopy, CopyButton, FilesChanged, FilesChangedPhone, ReadPercent } from '@/components/LogsClient';
import { AUTHOR, EMPTY_SLUG, gitDate, post, posts } from '@/lib/logs';

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
  const file = p.file.replace(/^logs\//, '');
  const sections = p.headings.length;
  return (
    <MotionProvider>
      <Paper />
      <CodeCopy />
      <div className="logs-page">
        <LogsHeader />
        <main id="main" className="wrap lpage">
          <nav className="pcrumb" aria-label="Breadcrumb">
            <a href="/logs" className="pcrumb__back">← git log</a>
            <span className="pcrumb__trail" aria-hidden="true">/</span>
            <span className="pcrumb__trail">logs</span>
            <span className="pcrumb__trail" aria-hidden="true">/</span>
            <span className="pcrumb__trail pcrumb__here" aria-current="page">{p.slug}</span>
            <ReadPercent />
          </nav>

          <article id="top" className="post" aria-labelledby="post-title">
            <header className="post__head">
              <div className="glass pcommit">
                <div className="pcommit__lines">
                  <div className="pcommit__row">
                    <span className="pcommit__kw">commit</span>
                    {p.commit ? (
                      <a href={p.commit.url} className="pcommit__sha" target="_blank" rel="noopener">
                        <span className="pcommit__full">{p.commit.sha}</span>
                        <span className="pcommit__short">{p.commit.id}</span>
                      </a>
                    ) : (
                      <span className="pcommit__sha pcommit__sha--local">uncommitted</span>
                    )}
                    {p.newest && <span className="lref lref--head">HEAD → main</span>}
                    {p.draft && <span className="lref lref--init">DRAFT · dev only</span>}
                  </div>
                  <div><span className="pcommit__k">Author</span>{AUTHOR}</div>
                  <div><span className="pcommit__k">Date</span><time dateTime={p.date}>{gitDate(p.date)}</time></div>
                  <div className="pcommit__parent">
                    <span className="pcommit__k">Parent</span>
                    {p.older ? (
                      <>
                        {p.older.commit ? <a href={`/logs/${p.older.slug}`}>{p.older.commit.id}</a> : <a href={`/logs/${p.older.slug}`}>uncommitted</a>}{' '}
                        <span className="pcommit__ptitle">{p.older.title}</span>
                      </>
                    ) : (
                      <span className="pcommit__ptitle">none, the first post</span>
                    )}
                  </div>
                </div>
                {p.commit && (
                  <div className="pcommit__btns">
                    <CopyButton text={p.commit.sha} label="Copy SHA" className="pbtn" />
                    <a href={p.commit.url} className="pbtn pbtn--link" target="_blank" rel="noopener">View on GitHub ↗</a>
                  </div>
                )}
              </div>
              <h1 id="post-title" className="post__title">{p.title}</h1>
              <p className="lede post__lede">{p.summary}</p>
              <div className="post__tagrow">
                {p.tags.length > 0 && (
                  <ul className="ltags" aria-label="Tags">
                    {p.tags.map((tag) => <li key={tag} className="ltag ltag--lg">{tag}</li>)}
                  </ul>
                )}
                <span className="post__stats">{p.mins} min read · {sections} {sections === 1 ? 'section' : 'sections'}</span>
              </div>
            </header>

            <FilesChangedPhone headings={p.headings} />

            <div className="pcols">
              <FilesChanged file={file} headings={p.headings} />
              <div className="glass prose pprose">
                <div dangerouslySetInnerHTML={{ __html: p.html }} />
                <div className="psign">
                  <span>Signed-off-by: {AUTHOR}</span>
                  <span className="psign__links">
                    <a href={p.editUrl} target="_blank" rel="noopener">Edit on GitHub</a>
                    <CopyButton text={null} label="Copy link" className="psign__copy" />
                    <a href="/logs/feed.xml">RSS</a>
                  </span>
                </div>
              </div>
            </div>

            <nav className="ppager" aria-label="More posts">
              {p.older ? (
                <a className="glass ppg" href={`/logs/${p.older.slug}`}>
                  <span className="kick">← PREVIOUS{p.older.commit ? ` · ${p.older.commit.id}` : ''}</span>
                  <span className="ppg__t">{p.older.title}</span>
                </a>
              ) : (
                <div className="glass ppg">
                  <span className="kick ppg__init">INITIAL COMMIT</span>
                  <span className="ppg__t ppg__t--mute">This is the first post.</span>
                </div>
              )}
              {p.newer ? (
                <a className="glass ppg ppg--next" href={`/logs/${p.newer.slug}`}>
                  <span className="kick">NEXT{p.newer.commit ? ` · ${p.newer.commit.id}` : ''} →</span>
                  <span className="ppg__t">{p.newer.title}</span>
                </a>
              ) : (
                <div className="glass ppg ppg--next">
                  <span className="kick ppg__head">HEAD · LATEST</span>
                  <span className="ppg__t ppg__t--mute">You’re at the newest commit.</span>
                  <a className="ppg__rss" href="/logs/feed.xml">git pull: subscribe via RSS</a>
                </div>
              )}
            </nav>
          </article>
        </main>
        <LogsFooter />
      </div>
      <SiteDock where="post" />
    </MotionProvider>
  );
}
