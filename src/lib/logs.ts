import path from 'node:path';
import { historyState, publishCommit, published, readingTime, render, type Heading, type RawPost } from './logs-core.mjs';

/* Build log posts for the Next pages. Server-only: runs at build time, ships no client JS. */

export const LOGS_DIR = path.join(process.cwd(), 'logs');
export const REPO = 'https://github.com/travist6983/travis-terry';
export const AUTHOR = 'Travis Terry';

/** Placeholder route for an empty log (see app/logs/[slug]/page.tsx). Not a valid post filename slug. */
export const EMPTY_SLUG = '_empty';

// Drafts show up only under `next dev`. `next build` always runs with NODE_ENV=production.
const includeDrafts = process.env.NODE_ENV === 'development';

/** The commit that published a post: full SHA, 7-character id, and its GitHub URL. Null until it's committed. */
export type Commit = { sha: string; id: string; url: string } | null;
export type Post = Omit<RawPost, 'body'> & { commit: Commit; mins: number; newest: boolean; oldest: boolean };
export type { Heading };

// A shallow clone would pin every post to the same cut-off commit, so show no ids rather than wrong ones.
// (CI fails earlier, in scripts/build-logs.mjs.)
const canTrace = historyState(process.cwd()) === 'full';

function commitOf(p: { file: string }): Commit {
  const sha = canTrace ? publishCommit(process.cwd(), p.file) : null;
  return sha ? { sha, id: sha.slice(0, 7), url: `${REPO}/commit/${sha}` } : null;
}

function load() {
  const raw = published(LOGS_DIR, { includeDrafts });
  return raw.map(({ body, ...p }, i): Post & { body: string } => ({
    ...p,
    body,
    commit: commitOf(p),
    mins: readingTime(body),
    newest: i === 0,
    oldest: i === raw.length - 1,
  }));
}

/** Published posts, newest first. */
export function posts(): Post[] {
  return load().map(({ body: _body, ...p }) => p);
}

export function post(slug: string) {
  const all = load();
  const i = all.findIndex((p) => p.slug === slug);
  if (i < 0) return null;
  const { body, ...meta } = all[i];
  const { html, headings } = render({ ...meta, body }, LOGS_DIR);
  // Newest first: the next (newer) post sits before this one, the previous (older) after it.
  const link = (p?: Post) => (p ? { slug: p.slug, title: p.title, commit: p.commit } : null);
  return { ...meta, html, headings, newer: link(all[i - 1]), older: link(all[i + 1]), editUrl: `${REPO}/blob/main/${meta.file}` };
}

export const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** git's date style: "Sat Nov 21 2026" */
export const gitDate = (d: string) => {
  const s = new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return s.replace(/,/g, '');
};

/** First two words of a slug, for the phone prompt: the-loop-around-it → the-loop */
export const shortSlug = (slug: string) => slug.split('-').slice(0, 2).join('-');
