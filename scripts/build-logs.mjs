// Build log assets. Runs before `next dev` (with --drafts) and before `next build` (without).
// Copies only the images that published posts use from logs/img/ into public/logs/img/,
// so an image that only a draft uses never reaches the built site. public/logs/ is generated
// (gitignored) and wiped on every run, so a dev run's draft images can't leak into a build.
// It also renders every published post once, so a bad post fails here with a clear message.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { historyState, publishCommit, published, render } from '../src/lib/logs-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'logs');
const out = path.join(root, 'public/logs');
const includeDrafts = process.argv.includes('--drafts');

fs.rmSync(out, { recursive: true, force: true });
const posts = published(dir, { includeDrafts });

// Commit ids come from git history. In CI a shallow clone would give every post the same wrong id,
// and a published post that isn't committed has no id at all: both fail the deploy build.
if (process.env.CI && posts.length) {
  const state = historyState(root);
  if (state !== 'full') throw new Error(`build log: git history is ${state}; commit ids need a full clone (actions/checkout with fetch-depth: 0)`);
  for (const p of posts) if (!publishCommit(root, p.file)) throw new Error(`${p.file}: no commit sets draft: false yet, so it has no commit id`);
}
const images = new Set();
for (const p of posts) for (const img of render(p, dir).images) images.add(img);
for (const rel of images) {
  fs.mkdirSync(path.dirname(path.join(out, rel)), { recursive: true });
  fs.copyFileSync(path.join(dir, rel), path.join(out, rel));
}
console.log(`build log: ${posts.length} post(s)${includeDrafts ? ' incl. drafts (dev)' : ''}, ${images.size} image(s)`);
