// Runs after `next build`. Two jobs:
// 1. Guardrail: fail the build if anything from a draft: true post is in dist/ (its page, its
//    slug or title in the list or feed, or an image only drafts use).
// 2. GitHub Pages: with trailingSlash: false the list page is dist/logs.html next to a dist/logs/
//    folder. Copy it to dist/logs/index.html so both /logs and /logs/ serve it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAll, render } from '../src/lib/logs-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'logs');
const dist = path.join(root, 'dist');
const all = readAll(dir);
const drafts = all.filter((p) => p.draft);
const live = all.filter((p) => !p.draft);

const list = path.join(dist, 'logs.html');
if (!fs.existsSync(list)) throw new Error('check-logs: dist/logs.html is missing; did next build run?');
fs.copyFileSync(list, path.join(dist, 'logs/index.html'));
// The placeholder page Next needs when there are no posts yet (see src/app/logs/[slug]/page.tsx)
for (const ext of ['html', 'txt']) fs.rmSync(path.join(dist, `logs/_empty.${ext}`), { force: true });

const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
const scan = [list, path.join(dist, 'logs.txt'), path.join(dist, 'logs/feed.xml'), ...live.flatMap((p) => ['html', 'txt'].map((ext) => path.join(dist, `logs/${p.slug}.${ext}`)))];
const liveImages = new Set(live.flatMap((p) => render(p, dir).images));
const leaks = [];
for (const d of drafts) {
  for (const ext of ['html', 'txt']) {
    if (fs.existsSync(path.join(dist, `logs/${d.slug}.${ext}`))) leaks.push(`${d.file}: dist/logs/${d.slug}.${ext} was built`);
  }
  for (const f of scan) {
    const html = read(f);
    if (html.includes(`/logs/${d.slug}"`) || html.includes(`/logs/${d.slug}<`) || html.includes(d.title)) leaks.push(`${d.file}: appears in ${path.relative(root, f)}`);
  }
  let draftImages = [];
  try {
    draftImages = render(d, dir).images;
  } catch {
    /* a half-written draft may not render yet; its page and listing checks above still apply */
  }
  for (const img of draftImages) {
    if (!liveImages.has(img) && fs.existsSync(path.join(dist, 'logs', img))) leaks.push(`${d.file}: draft-only image ${img} was copied`);
  }
}
if (leaks.length) {
  console.error(`check-logs: draft content reached dist/:\n  - ${leaks.join('\n  - ')}`);
  process.exit(1);
}
console.log(`check-logs: ${live.length} published, ${drafts.length} draft(s) kept out of dist/`);
