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

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Reading time in minutes: words ÷ 230, rounded, at least 1. Image and link targets don't count as words. */
export function readingTime(body) {
  const words = String(body)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\]\([^)]*\)/g, ']')
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return Math.max(1, Math.round(words / 230));
}

// Inline Markdown for fixes rows and the closing quote: bold, links and code work; raw HTML is shown as text.
const inlineMd = new Marked({ gfm: true });
inlineMd.use({ renderer: { html: ({ text }) => esc(text) } });

/**
 * The ```fixes block: a failure/fix diff. One row per line:
 *   @@ label @@ optional inline Markdown (a link)   → purple hunk row
 *   - inline Markdown                              → removed (the failure)
 *   + inline Markdown                              → added (the fix)
 * Blank lines are skipped; anything else throws.
 */
export function renderFixes(src) {
  let removed = 0;
  let added = 0;
  const rows = [];
  String(src)
    .split('\n')
    .forEach((line, i) => {
      if (!line.trim()) return;
      const hunk = /^@@\s*(.*?)\s*@@\s*(.*)$/.exec(line);
      const row = /^([-+])\s+(.+)$/.exec(line);
      if (hunk) {
        rows.push(`<div class="diff__hunk">@@ ${esc(hunk[1])} @@${hunk[2] ? ` ${inlineMd.parseInline(hunk[2])}` : ''}</div>`);
      } else if (row) {
        const minus = row[1] === '-';
        if (minus) removed++;
        else added++;
        const cls = minus ? 'diff--minus' : 'diff--plus';
        rows.push(
          `<div class="diff__g ${cls}" aria-hidden="true">${minus ? '−' : '+'}</div>` +
            `<div class="diff__t ${cls}"><span class="sr-only">${minus ? 'Failure: ' : 'Fix: '}</span>${inlineMd.parseInline(row[2])}</div>`,
        );
      } else {
        throw new Error(`fixes block line ${i + 1} must start with "@@ label @@", "- " or "+ ": ${line}`);
      }
    });
  if (!removed && !added) throw new Error('fixes block has no - or + rows');
  return (
    `<figure class="diff"><figcaption class="diff__head"><span><b>git diff</b> failures..fixes</span>` +
    `<span><span class="diff__rm">${removed} removed</span> · <span class="diff__add">${added} added</span></span></figcaption>` +
    `<div class="diff__rows">${rows.join('')}</div></figure>`
  );
}

/** Pixel size of a PNG, WebP, JPEG or SVG from its header, so figures reserve their space (no layout shift). */
export function imageSize(file) {
  const b = fs.readFileSync(file);
  if (b.length > 24 && b.toString('latin1', 1, 4) === 'PNG') return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b.length > 30 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
    const kind = b.toString('latin1', 12, 16);
    if (kind === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (kind === 'VP8L') {
      const v = b.readUInt32LE(21);
      return { width: 1 + (v & 0x3fff), height: 1 + ((v >> 14) & 0x3fff) };
    }
    if (kind === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i + 9 < b.length; ) {
      if (b[i] !== 0xff) break;
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  const svg = b.toString('utf8', 0, Math.min(b.length, 2000));
  const vb = /viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(svg);
  if (vb) return { width: Math.round(+vb[1]), height: Math.round(+vb[2]) };
  return null;
}

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[`*_~[\]()]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'section';

/**
 * Render a post body to HTML and check its structure and images.
 * Returns the HTML, the image paths it uses, and its H2s ({ id, text, fixes }) for the sections list.
 */
export function render(post, dir) {
  const images = [];
  const h2s = [];
  const headings = [];
  const ids = new Map();
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
    renderer: {
      // ## headings get an id and a "##" anchor link
      heading(tok) {
        if (tok.depth !== 2) return false;
        const text = tok.text.replace(/[*_`]/g, '').trim();
        let id = slugify(text);
        const n = ids.get(id) ?? 0;
        ids.set(id, n + 1);
        if (n) id = `${id}-${n + 1}`;
        headings.push({ id, text, fixes: false });
        return `<h2 id="${id}"><a class="hash" href="#${id}" aria-label="Link to ${esc(text)}">##</a>${this.parser.parseInline(tok.tokens)}</h2>\n`;
      },
      // ```fixes is the failure/fix diff; other fences become a dark card with a file bar and Copy.
      // The info string is "lang filename", e.g. ```text defect-loop.recipe
      code(tok) {
        const [lang = '', file = ''] = (tok.lang ?? '').trim().split(/\s+/);
        if (lang === 'fixes') {
          if (headings.length) headings[headings.length - 1].fixes = true;
          try {
            return renderFixes(tok.text);
          } catch (e) {
            problems.push(e.message);
            return '';
          }
        }
        const label = file || lang || 'code';
        return (
          `<figure class="codecard"><div class="codecard__bar"><span>${esc(label)}</span>` +
          `<button type="button" class="codecard__copy" data-copy-code hidden>Copy</button></div>` +
          `<pre><code${lang ? ` class="language-${esc(lang)}"` : ''}>${esc(tok.text)}</code></pre></figure>\n`
        );
      },
      // An image on its own line becomes a figure with a monospace caption: the title if given, else the alt text
      paragraph(tok) {
        if (tok.tokens.length !== 1 || tok.tokens[0].type !== 'image') return false;
        const img = tok.tokens[0];
        const caption = img.title || img.text;
        let size = null;
        try {
          size = imageSize(path.join(dir, path.posix.normalize(img.href)));
        } catch {
          /* a missing image is already a reported problem */
        }
        const dims = size ? ` width="${size.width}" height="${size.height}"` : '';
        return (
          `<figure class="figure"><img src="${esc(img.href)}" alt="${esc(img.text)}"${dims} loading="lazy" decoding="async">` +
          `<figcaption${img.title ? '' : ' aria-hidden="true"'}>${esc(caption)}</figcaption></figure>\n`
        );
      },
      // A blockquote whose first line is "$ git commit -m" is the dark closing quote card
      blockquote(tok) {
        const m = /^\s*\$ git commit -m[ \t]*\n([\s\S]*)$/.exec(tok.text);
        if (!m) return false;
        const paras = m[1].split(/\n\s*\n/).map((p) => `<p>${inlineMd.parseInline(p.trim())}</p>`).join('');
        return `<blockquote class="commitq"><span class="commitq__cmd" aria-hidden="true">$ git commit -m</span>${paras}</blockquote>\n`;
      },
    },
  });
  const html = md.parse(post.body);
  if (!post.draft && h2s.slice(0, SECTIONS.length).join('|') !== SECTIONS.join('|')) {
    problems.push(`the body's first ## headings must be, in order: ${SECTIONS.join(' / ')} (found: ${h2s.join(' / ') || 'none'})`);
  }
  if (problems.length) throw new Error(`${post.file}:\n  - ${problems.join('\n  - ')}`);
  return { html, images, headings };
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
