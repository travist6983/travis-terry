// Build log: read, validate and render the Markdown posts in /logs.
// Plain ESM so the Next pages (src/lib/logs.ts) and the build scripts (scripts/build-logs.mjs)
// share one parser and one draft rule. Types: logs-core.d.mts.
//
// Rules (they fail the build, not the reader):
// - Files are /logs/YYYY-MM-DD-slug.md. Any other .md except README.md is an error.
// - Frontmatter has exactly: title, date, summary, tags, draft. date must match the filename.
// - draft: true posts are dropped before anything is rendered, listed, fed or copied.
// - A published post's first four H2s are, in order: The problem, What the kit did, What broke,
//   What I changed. More H2s may follow them (e.g. a closing "Try it").
// - Every image needs alt text and a relative path into img/ that exists.
// - A post's commit id is the real git commit that published it: the oldest commit that added a
//   `draft: false` line to the file (following renames). It needs full history, not a shallow clone.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Marked } from 'marked';

export const SECTIONS = ['The problem', 'What the kit did', 'What broke', 'What I changed'];
const FIELDS = ['title', 'date', 'summary', 'tags', 'draft'];
const FILE_RE = /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

/** Small, strict frontmatter reader: `key: value`, quoted or bare strings, true/false, and [a, b] or `- a` lists. */
function parseFrontmatter(src, file) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(src);
  if (!m) throw new Error(`${file}: missing frontmatter (--- ... ---) at the top of the file`);
  const data = {};
  let listKey = null;
  for (const raw of m[1].split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && listKey) {
      data[listKey].push(scalar(item[1]));
      continue;
    }
    const kv = /^([a-z]+):\s*(.*)$/.exec(line);
    if (!kv) throw new Error(`${file}: can't read frontmatter line "${raw}"`);
    const [, key, value] = kv;
    if (!FIELDS.includes(key)) throw new Error(`${file}: unknown frontmatter field "${key}" (allowed: ${FIELDS.join(', ')})`);
    if (key in data) throw new Error(`${file}: "${key}" is set twice`);
    listKey = null;
    if (value === '') {
      data[key] = [];
      listKey = key;
    } else if (/^\[.*\]$/.test(value)) {
      data[key] = value.slice(1, -1).split(',').map((s) => scalar(s.trim())).filter((s) => s !== '');
    } else {
      data[key] = scalar(value);
    }
  }
  return { data, body: m[2] };
}

function scalar(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  const q = /^"(.*)"$/.exec(v) ?? /^'(.*)'$/.exec(v);
  return q ? q[1].replace(/\\"/g, '"') : v;
}

function validDate(s) {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Every post file, drafts included, with validated frontmatter. Bodies are not rendered here. */
export function readAll(dir) {
  if (!fs.existsSync(dir)) return [];
  const posts = [];
  for (const name of fs.readdirSync(dir).sort()) {
    if (!name.endsWith('.md') || name === 'README.md') continue;
    const file = `logs/${name}`;
    const fm = FILE_RE.exec(name);
    if (!fm) throw new Error(`${file}: post files are named YYYY-MM-DD-slug.md (lowercase slug, hyphens only)`);
    const { data, body } = parseFrontmatter(fs.readFileSync(path.join(dir, name), 'utf8'), file);
    for (const k of FIELDS) if (!(k in data)) throw new Error(`${file}: frontmatter is missing "${k}"`);
    if (typeof data.draft !== 'boolean') throw new Error(`${file}: draft must be true or false`);
    for (const k of ['title', 'summary', 'date']) {
      if (typeof data[k] !== 'string' || !data[k].trim()) throw new Error(`${file}: "${k}" must be a non-empty string`);
    }
    if (!Array.isArray(data.tags) || data.tags.some((t) => typeof t !== 'string')) throw new Error(`${file}: tags must be a list, e.g. [agents, ci]`);
    if (!validDate(data.date)) throw new Error(`${file}: date "${data.date}" is not a real YYYY-MM-DD date`);
    if (data.date !== fm[1]) throw new Error(`${file}: frontmatter date ${data.date} doesn't match the filename date ${fm[1]}`);
    posts.push({ file, slug: fm[2], title: data.title, date: data.date, summary: data.summary, tags: data.tags, draft: data.draft, body });
  }
  const seen = new Map();
  for (const p of posts) {
    if (seen.has(p.slug)) throw new Error(`${p.file}: slug "${p.slug}" is already used by ${seen.get(p.slug)}`);
    seen.set(p.slug, p.file);
  }
  return posts;
}

/** Published posts only, newest first. `includeDrafts` is for `next dev` only; production builds never pass it. */
export function published(dir, { includeDrafts = false } = {}) {
  return readAll(dir)
    .filter((p) => includeDrafts || p.draft === false)
    .sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : a.date < b.date ? 1 : -1));
}

/** Render a post body to HTML and check its structure and images. Returns the HTML and the image paths it uses. */
export function render(post, dir) {
  const images = [];
  const h2s = [];
  const problems = [];
  const md = new Marked({ gfm: true });
  md.use({
    walkTokens(tok) {
      if (tok.type === 'heading' && tok.depth === 1) problems.push('use ## and ### in the body; the title comes from frontmatter');
      if (tok.type === 'heading' && tok.depth === 2) h2s.push(tok.text.trim());
      if (tok.type === 'image') {
        const src = tok.href;
        if (!tok.text?.trim()) problems.push(`image ${src} has no alt text`);
        if (/^([a-z]+:|\/)/i.test(src)) {
          problems.push(`image ${src} must be a relative path into img/, e.g. img/name.png`);
          return;
        }
        const rel = path.posix.normalize(src);
        if (!rel.startsWith('img/')) problems.push(`image ${src} must live in logs/img/`);
        else if (!fs.existsSync(path.join(dir, rel))) problems.push(`image ${src} is not in logs/img/`);
        else images.push(rel);
      }
    },
  });
  const html = md.parse(post.body);
  if (!post.draft && h2s.slice(0, SECTIONS.length).join('|') !== SECTIONS.join('|')) {
    problems.push(`the body's first ## headings must be, in order: ${SECTIONS.join(' / ')} (found: ${h2s.join(' / ') || 'none'})`);
  }
  if (problems.length) throw new Error(`${post.file}:\n  - ${problems.join('\n  - ')}`);
  return { html, images };
}

const git = (root, args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

/** 'full', 'shallow' (history is cut off, so commit ids would be wrong), or 'none' (not a git checkout). */
export function historyState(root) {
  try {
    return git(root, ['rev-parse', '--is-shallow-repository']) === 'true' ? 'shallow' : 'full';
  } catch {
    return 'none';
  }
}

/** Full SHA of the commit that published `file` (relative to root), or null if that isn't committed yet. */
export function publishCommit(root, file) {
  try {
    const shas = git(root, ['log', '--follow', '-G', '^draft:[[:space:]]*false', '--format=%H', '--', file]).split('\n').filter(Boolean);
    return shas.at(-1) ?? null;
  } catch {
    return null;
  }
}
