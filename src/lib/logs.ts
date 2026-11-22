import path from 'node:path';
import { historyState, publishCommit, published, render, type RawPost } from './logs-core.mjs';

/* Build log posts for the Next pages. Server-only: runs at build time, ships no client JS. */

export const LOGS_DIR = path.join(process.cwd(), 'logs');

// Drafts show up only under `next dev`. `next build` always runs with NODE_ENV=production.
const includeDrafts = process.env.NODE_ENV === 'development';

/** Placeholder route for an empty log (see app/logs/[slug]/page.tsx). Not a valid post filename slug. */
export const EMPTY_SLUG = '_empty';

export const REPO = 'https://github.com/travist6983/travis-terry';

/** The commit that published a post: full SHA, 7-character id, and its GitHub URL. Null until it's committed. */
export type Commit = { sha: string; id: string; url: string } | null;
export type Post = Omit<RawPost, 'body'> & { commit: Commit };

// A shallow clone would pin every post to the same cut-off commit, so show no ids rather than wrong ones.
// (CI fails earlier, in scripts/build-logs.mjs.)
const canTrace = historyState(process.cwd()) === 'full';

function commitOf(p: { file: string }): Commit {
  const sha = canTrace ? publishCommit(process.cwd(), p.file) : null;
  return sha ? { sha, id: sha.slice(0, 7), url: `${REPO}/commit/${sha}` } : null;
}

export function posts(): Post[] {
  return published(LOGS_DIR, { includeDrafts }).map(({ body: _body, ...p }) => ({ ...p, commit: commitOf(p) }));
}

export function post(slug: string) {
  const all = published(LOGS_DIR, { includeDrafts });
  const i = all.findIndex((p) => p.slug === slug);
  if (i < 0) return null;
  const { body: _body, ...rest } = all[i];
  const meta = { ...rest, commit: commitOf(all[i]) };
  // Newest first: the next (newer) post sits before this one, the previous (older) after it.
  const strip = (p?: RawPost) => (p ? { slug: p.slug, title: p.title } : null);
  return { ...meta, html: render(all[i], LOGS_DIR).html, newer: strip(all[i - 1]), older: strip(all[i + 1]) };
}

export const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
