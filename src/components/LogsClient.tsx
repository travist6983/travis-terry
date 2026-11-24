'use client';

import { useEffect, useMemo, useState } from 'react';
import { CommitJourney } from './Journeys';
import { Branch, CHECK_ICON_HTML, CLONE_ICON_HTML, Clone, Cmd, Switch } from './Buttons';
import { SmoothScroll } from './motion';
import type { Commit, Heading, Post } from '@/lib/logs';

/*
 * Build log client islands. Each renders its full content on the server too (static export),
 * so with JavaScript off the list is complete and only the filters and copy buttons are inert.
 */

/* ---------- Copy ---------- */

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false; // clipboard blocked: the text is still on the page to select
  }
}

/** A Copy button that only appears once JavaScript can make it work. `text` null copies the page URL. */
export function CopyButton({ text, label, light = true }: { text: string | null; label: string; light?: boolean }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  return <Clone text={text} label={label} light={light} />;
}

/** Wires the Copy buttons that logs-core renders into code cards (they ship hidden). */
export function CodeCopy() {
  useEffect(() => {
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-copy-code]'));
    const handlers = buttons.map((b) => {
      b.hidden = false;
      b.classList.add('bclone', 'bclone--code');
      const rest = () => {
        b.classList.remove('is-ok');
        b.innerHTML = `${CLONE_ICON_HTML}clone`;
      };
      rest();
      const onClick = async () => {
        const code = b.closest('figure')?.querySelector('pre')?.textContent ?? '';
        if (await copy(code)) {
          b.classList.add('is-ok');
          b.innerHTML = `${CHECK_ICON_HTML}cloned`;
          setTimeout(rest, 2000);
        }
      };
      b.addEventListener('click', onClick);
      return () => b.removeEventListener('click', onClick);
    });
    return () => handlers.forEach((off) => off());
  }, []);
  return null;
}

/* ---------- List page ---------- */

/**
 * The home page's smooth scroll, for mouse and trackpad only. Lenis leaves touch scrolling native,
 * so on phones its code would download for nothing.
 */
export function PointerSmoothScroll() {
  const [fine, setFine] = useState(false);
  useEffect(() => setFine(window.matchMedia('(pointer: fine)').matches), []);
  return fine ? <SmoothScroll /> : null;
}

function Sha({ commit }: { commit: Commit }) {
  if (!commit) return <span className="lsha lsha--local">uncommitted</span>;
  return (
    <a className="lsha" href={commit.url} title={`Commit ${commit.sha} on GitHub`} target="_blank" rel="noopener">
      <span className="sr-only">Commit </span>
      {commit.id}
    </a>
  );
}

function Refs({ p }: { p: Post }) {
  return (
    <>
      {p.newest && <span className="lref lref--head">HEAD → main</span>}
      {p.oldest && <span className="lref lref--init">INITIAL COMMIT</span>}
    </>
  );
}

/** 5-block reading bar: one block per 3 minutes, 1 to 5. */
const blocks = (mins: number) => Math.min(5, Math.max(1, Math.round(mins / 3)));

export function LogList({ posts }: { posts: Post[] }) {
  const [q, setQ] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [view, setView] = useState<'graph' | 'oneline'>('graph');

  const chips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of posts) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [posts]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts.filter(
      (p) =>
        (!tag || p.tags.includes(tag)) &&
        (!needle || p.title.toLowerCase().includes(needle) || p.summary.toLowerCase().includes(needle) || p.tags.some((t) => t.toLowerCase().includes(needle))),
    );
  }, [posts, q, tag]);

  // The graph measures on resize; filtering can keep the same height, so ask it to measure again.
  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [shown, view]);

  return (
    <>
      <div className="glass lsearch">
        <label htmlFor="grep" className="lsearch__label">
          <span className="lsearch__ps" aria-hidden="true">$</span>
          <span className="lsearch__cmd">git log --grep=</span>
          <input id="grep" className="lsearch__q" type="search" aria-label="Search posts" placeholder="search posts" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Switch
          className="bsw--sm"
          label="View"
          value={view}
          onChange={setView}
          items={[{ value: 'graph', label: '--graph' }, { value: 'oneline', label: '--oneline' }]}
        />
      </div>

      {chips.length > 0 && (
        <div className="lchips" role="group" aria-label="Filter by tag">
          <Branch on={tag === null} color="#0c1220" count={posts.length} onClick={() => setTag(null)}>all</Branch>
          {chips.map(([t, n]) => (
            <Branch key={t} on={tag === t} count={n} onClick={() => setTag(tag === t ? null : t)}>{t}</Branch>
          ))}
        </div>
      )}

      <div className="lcols">
        <div className="lmain">
          {shown.length === 0 && (
            <p className="glass lempty" role="status">
              <span className="kick lempty__k">0 COMMITS</span>
              {posts.length ? 'Nothing matches that search. Try another word or clear the tag.' : 'No posts yet. The first one is on its way.'}
            </p>
          )}

          {shown.length > 0 && view === 'graph' && (
            // One post = one commit on the home page's git graph (CommitJourney, src/components/Journeys.tsx)
            <div id="logs-act" className="act logs-act">
              <CommitJourney actId="logs-act" />
              <section className="graph-col logs-graph" aria-label="Posts, newest first">
                <ol className="lposts">
                  {shown.map((p) => (
                    <li key={p.slug} className="glass lpost" data-commit>
                      <div className="lpost__meta">
                        <Sha commit={p.commit} />
                        <span className="kick kick--mute">· <time dateTime={p.date}>{p.date}</time></span>
                        <Refs p={p} />
                      </div>
                      <h2 className="lpost__title"><a href={`/logs/${p.slug}`}>{p.title}</a></h2>
                      <p className="lpost__sum">{p.summary}</p>
                      <div className="lpost__foot">
                        <ul className="ltags" aria-label="Tags">
                          {p.tags.map((t) => <li key={t} className="ltag">{t}</li>)}
                        </ul>
                        <div className="lpost__read">
                          <span className="lpost__mins">
                            {p.mins} min read
                            <span className="lbar5" aria-hidden="true">
                              {Array.from({ length: 5 }, (_, i) => <i key={i} className={i < blocks(p.mins) ? 'on' : undefined} />)}
                            </span>
                          </span>
                          <Cmd href={`/logs/${p.slug}`} cmd="git show" size="sm" className="lpost__show" label={`git show: read ${p.title}`} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          )}

          {shown.length > 0 && view === 'oneline' && (
            <ol className="glass lone" aria-label="Posts, one line each">
              {shown.map((p) => (
                <li key={p.slug} className="lone__row">
                  <span className="lone__g" aria-hidden="true">*</span>
                  <Sha commit={p.commit} />
                  <Refs p={p} />
                  <a className="lone__t" href={`/logs/${p.slug}`}>{p.title}</a>
                  <span className="lone__d"><time dateTime={p.date}>{p.date}</time></span>
                </li>
              ))}
            </ol>
          )}

          <p className="lend">(END) · showing {shown.length} of {posts.length} {posts.length === 1 ? 'commit' : 'commits'}</p>
        </div>

        <aside className="lside" aria-label="Refs and subscribe">
          <section className="glass lcard">
            <h2 className="kick lcard__h">BRANCHES</h2>
            <ul className="lcard__list">
              <li><span className="lref lref--head">main</span><span className="lcard__n">{posts.length} {posts.length === 1 ? 'commit' : 'commits'}</span></li>
            </ul>
          </section>
          <section className="glass lcard">
            <h2 className="kick lcard__h">GIT PULL</h2>
            <p className="lcard__p">New posts land in the feed the day they merge.</p>
            <div className="lterm">
              <code><span className="lterm__ps" aria-hidden="true">$ </span>curl -sL travisjterry.dev/logs/feed.xml</code>
              <CopyButton text="curl -sL https://travisjterry.dev/logs/feed.xml" label="clone" light={false} />
            </div>
            <a className="mono-link lcard__rss" href="/logs/feed.xml">RSS: /logs/feed.xml</a>
          </section>
        </aside>
      </div>
    </>
  );
}

/* ---------- Post page ---------- */

/** Percent of the article read, from the scroll position against the prose card. */
function useReadPercent(): number | null {
  const [pct, setPct] = useState<number | null>(null); // null until measured, so no-JS readers never see "0%"
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const el = document.querySelector('.post .prose');
      if (!el) return;
      const r = el.getBoundingClientRect();
      const seen = window.innerHeight - r.top;
      setPct(Math.round(Math.min(1, Math.max(0, seen / r.height)) * 100));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      cancelAnimationFrame(raf);
    };
  }, []);
  return pct;
}

/**
 * The section in view: the last ## heading above 30% of the viewport (the first one before that).
 * IntersectionObserver catches headings crossing that line; a jump that skips past a heading
 * fires no intersection, so a rAF-throttled scroll check covers that case.
 */
function useActiveSection(headings: Heading[]) {
  const [active, setActive] = useState(headings[0]?.id ?? '');
  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const pick = () => {
      // At the very bottom, the last sections can't reach the line: the last one in view wins
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        const seen = els.filter((el) => { const t = el.getBoundingClientRect().top; return t >= 0 && t < window.innerHeight; });
        const hash = decodeURIComponent(window.location.hash.slice(1));
        setActive(seen.some((el) => el.id === hash) ? hash : (seen[seen.length - 1] ?? els[els.length - 1]).id);
        return;
      }
      const line = window.innerHeight * 0.3;
      const above = els.filter((el) => el.getBoundingClientRect().top <= line);
      setActive((above[above.length - 1] ?? els[0]).id);
    };
    let raf = 0;
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => ((raf = 0), pick()));
    };
    const io = new IntersectionObserver(pick, { rootMargin: '0px 0px -70% 0px' });
    els.forEach((el) => io.observe(el));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', onScroll);
    pick();
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('hashchange', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [headings]);
  return active;
}

function SectionLinks({ headings, active }: { headings: Heading[]; active: string }) {
  return (
    <nav className="ptoc" aria-label="Sections">
      {headings.map((h) => (
        <a key={h.id} href={`#${h.id}`} className={h.id === active ? 'is-on' : undefined} aria-current={h.id === active ? 'location' : undefined}>
          <span className={`ptoc__st${h.fixes ? ' ptoc__st--fix' : ''}`} aria-hidden="true">{h.fixes ? '±' : '§'}</span>
          {h.text}
        </a>
      ))}
    </nav>
  );
}

/** Desktop: the "Files changed" card with the active section and a read bar. */
export function FilesChanged({ file, headings }: { file: string; headings: Heading[] }) {
  const active = useActiveSection(headings);
  const pct = useReadPercent();
  return (
    <aside className="pside" aria-label="On this page">
      <div className="glass pside__card">
        <p className="kick pside__k">FILES CHANGED</p>
        <p className="pside__file">{file}</p>
        <SectionLinks headings={headings} active={active} />
        {pct !== null && (
          <div className="pside__read">
            <div className="pside__readrow"><span>read</span><span>{pct}%</span></div>
            <div className="pside__bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
          </div>
        )}
      </div>
    </aside>
  );
}

/** Phones: the same sections in a <details> above the article. */
export function FilesChangedPhone({ headings }: { headings: Heading[] }) {
  const active = useActiveSection(headings);
  return (
    <details className="glass pdetails">
      <summary>
        Files changed · {headings.length} {headings.length === 1 ? 'section' : 'sections'} <span aria-hidden="true">▾</span>
      </summary>
      <SectionLinks headings={headings} active={active} />
    </details>
  );
}

/** Phones: "42% read" next to the back link. */
export function ReadPercent() {
  const pct = useReadPercent();
  return pct === null ? null : <span className="pcrumb__pct">{pct}% read</span>;
}
