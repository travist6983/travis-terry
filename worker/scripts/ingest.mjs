// Build the knowledge base: site copy (already sourced and corrected), drafted Ask answers,
// and approved interview chunks. Embeds with Workers AI and upserts into Vectorize.
// Run: node scripts/ingest.mjs   (reads ../.env.local; never prints keys)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env.local'), 'utf8').split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
const ACCT = env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = env.CLOUDFLARE_API_TOKEN;
const INDEX = 'travis-resume';
const api = (p, init) => fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCT}${p}`, { ...init, headers: { authorization: `Bearer ${TOKEN}`, ...(init?.headers ?? {}) } });

const content = JSON.parse(fs.readFileSync(path.join(root, 'content/content.json'), 'utf8'));
const ask = JSON.parse(fs.readFileSync(path.join(root, 'content/ask-my-resume.json'), 'utf8'));
const chunks = [];
const add = (id, title, section, lines) => {
  const text = lines.filter(Boolean).join('\n').trim();
  if (text.length > 40) chunks.push({ id, title, section, text });
};
// Factual copy only: skip ui labels and anything still waiting on Travis.
const facts = (o) => {
  const out = [];
  (function w(x) {
    if (Array.isArray(x)) return x.forEach(w);
    if (x && typeof x === 'object') {
      if (typeof x.text === 'string' && !x.confirm && Array.isArray(x.src) && !x.src.every((s) => s === 'ui')) out.push(x.text);
      for (const k in x) if (k !== 'src') w(x[k]);
    }
  })(o);
  return [...new Set(out)];
};

for (const s of content.sections) {
  const title = s.title?.text ?? s.id;
  if (s.id === 'career') {
    for (const e of s.entries) add(`career-${e.slug}`, `Career: ${e.company.text}`, 'career', [`${e.company.text} (${e.location.text})`, ...e.roles.map((r) => r.text), ...facts([e.context, e.progression, e.highlights])]);
    add('career-education', 'Education', 'career', facts(s.education));
  } else if (s.id === 'independent') {
    for (const c of s.cards) add(`project-${c.slug}`, `Project: ${c.name.text}`, 'independent', facts(c));
  } else if (['header', 'footer', 'ask', 'recommendations'].includes(s.id)) {
    continue;
  } else {
    const f = facts(s);
    for (let i = 0; i < f.length; i += 6) add(`${s.id}-${i / 6 + 1}`, title, s.id, f.slice(i, i + 6));
  }
}
for (const e of ask.entries) if (!e.fallbackOnly) add(`qa-${e.id}`, `Q&A: ${e.question}`, e.sourceSection ?? 'ask', [`Q: ${e.question}`, `A: ${e.answer}`]);

// Interview chunks: private/interview/transcript-*.md, "## Chunk" blocks without a review flag.
const idir = path.join(root, 'private/interview');
for (const f of fs.existsSync(idir) ? fs.readdirSync(idir).filter((n) => n.startsWith('transcript-')) : []) {
  for (const block of fs.readFileSync(path.join(idir, f), 'utf8').split(/\n## Chunk /).slice(1)) {
    const field = (k) => (block.match(new RegExp(`- ${k}: (.*)`)) ?? [])[1]?.trim();
    if (field('review') && field('review') !== 'none') continue;
    const id = field('id');
    if (id) add(`iv-${id}`, `Interview: ${block.split('\n')[0].replace(/^\d+:\s*/, '')}`, field('topic') ?? 'interview', [`Q: ${field('question')}`, `A: ${field('answer')}`]);
  }
}
console.log(`chunks: ${chunks.length}`);

// Embed in batches of 50, then upsert as NDJSON.
const vectors = [];
for (let i = 0; i < chunks.length; i += 50) {
  const batch = chunks.slice(i, i + 50);
  const r = await api('/ai/run/@cf/baai/bge-base-en-v1.5', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: batch.map((c) => `${c.title}\n${c.text}`) }) });
  const d = await r.json();
  if (!d.success) throw new Error(`embed failed: ${JSON.stringify(d.errors)}`);
  batch.forEach((c, j) => vectors.push({ id: c.id, values: d.result.data[j], metadata: { title: c.title, section: c.section, text: c.text } }));
}
const r = await api(`/vectorize/v2/indexes/${INDEX}/upsert`, { method: 'POST', headers: { 'content-type': 'application/x-ndjson' }, body: vectors.map((v) => JSON.stringify(v)).join('\n') });
const d = await r.json();
console.log(d.success ? `upserted ${vectors.length} vectors (mutation ${d.result?.mutationId})` : `upsert failed: ${JSON.stringify(d.errors)}`);
