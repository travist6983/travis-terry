// Build the machine-readable resumes from content/content.json, so they always match the site:
// public/resume.md, resume.txt, resume.json (JSON Resume schema), llms.txt, and cli (the curl easter egg).
// Run: node scripts/build-resume-files.mjs   (runs automatically before `npm run dev` and `npm run build`)
// Only approved site strings are used, picked by id; a missing id or an unconfirmed item fails the build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'content/content.json'), 'utf8'));
const out = path.join(root, 'public');

/* ---------- Lookup by copy id ---------- */

const byId = new Map();
(function walk(x) {
  if (Array.isArray(x)) return x.forEach(walk);
  if (x && typeof x === 'object') {
    if (typeof x.id === 'string' && 'text' in x) byId.set(x.id, x);
    for (const k in x) if (k !== 'src') walk(x[k]);
  }
})(content);

const item = (id) => {
  const it = byId.get(id);
  if (!it) throw new Error(`content.json has no copy item "${id}"`);
  if (it.confirm) throw new Error(`"${id}" is still waiting on Travis (${it.confirmText})`);
  return it;
};
const t = (id) => item(id).text;
const section = (id) => content.sections.find((s) => s.id === id);

/* ---------- Facts ---------- */

const SITE = t('meta.canonical');
const p = content.person;
const email = `${p.email.user}@${p.email.domain}`;
const book = section('contact').links.find((l) => l.id === 'contact.book').href;
const career = section('career');
const projects = section('independent').cards;

const contact = [
  ['Email', email, `mailto:${email}`],
  ['LinkedIn', p.linkedin.text, p.linkedin.href],
  ['GitHub', p.github.text, p.github.href],
  ['Book a call', book.replace(/^https?:\/\//, ''), book],
  ['Website', SITE.replace(/^https?:\/\//, ''), SITE],
];

const summary = [t('meta.description'), t('independent.intro'), t('platform.mentorship')];
const availability = t('sixty.availability');

const skills = section('sixty').stack.map((s) => ({ label: s.label, text: item(s.id).text }));

// Atlas UP pulls in the work the site tells across The Pipeline, Safety, MCP, and Platform sections.
const highlights = {
  'atlas-up': [
    ['career.atlasUp.h1'],
    ['sixty.achievement.2'],
    ['sixty.achievement.3'],
    ['pipeline.stage.review.aside'],
    ['pipeline.stage.regression.aside'],
    ['sixty.achievement.4', 'mcp.classifier'],
    ['platform.adoption'],
    ['sixty.achievement.5'],
    ['platform.shipping'],
    ['platform.retention'],
  ],
  'eos-worldwide': [['career.eos.h1'], ['platform.review'], ['career.eos.h2'], ['career.eos.h3'], ['career.eos.h4']],
};

const jobs = career.entries.map((e) => ({
  slug: e.slug,
  company: t(e.company.id),
  location: t(e.location.id),
  roles: e.roles.map((r) => ({ title: r.title, dates: r.dates })),
  context: e.context ? t(e.context.id) : e.progression ? t(e.progression.id) : null,
  highlights: (highlights[e.slug] ?? e.highlights.map((h) => [h.id])).map((ids) => ids.map(t).join(' ')),
}));

const sentence = (s) => (/[.!?]$/.test(s) ? s : `${s}.`);
const work = projects.map((c) => ({
  slug: c.slug,
  name: t(c.name.id),
  role: t((c.role ?? c.type).id),
  dates: t(c.dates.id),
  blurb: `${t(c.summary.id)} ${sentence(t(c.status.id))}`,
  points: c.points.map((x) => t(x.id)),
}));

const edu = career.education.entry;

/* ---------- Plain-text helpers ---------- */

const W = 78;
const wrap = (text, width = W, indent = '') => {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && (indent + line + ' ' + word).length > width) {
      lines.push(indent + line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(indent + line);
  return lines.join('\n');
};
const bullet = (text, mark = '-', width = W) => wrap(text, width, '  ').replace(/^ {2}/, `${mark} `);

/* ---------- resume.md ---------- */

const md = [
  `# ${t('person.name')}`,
  '',
  `**${t('person.title')}**`,
  '',
  `${t('person.location')}`,
  '',
  contact.map(([label, text, href]) => `[${label === 'Email' ? text : label}](${href})`).join(' · '),
  '',
  '## Summary',
  '',
  summary.join(' '),
  '',
  availability,
  '',
  '## Skills',
  '',
  ...skills.map((s) => `- **${s.label}:** ${s.text}`),
  '',
  '## Experience',
  '',
  ...jobs.flatMap((j) => [
    `### ${j.company} · ${j.location}`,
    '',
    ...j.roles.map((r) => `**${r.title}** · ${r.dates}  `),
    ...(j.context ? ['', `_${j.context}_`] : []),
    '',
    ...j.highlights.map((h) => `- ${h}`),
    '',
  ]),
  '## Independent projects',
  '',
  ...work.flatMap((w) => [
    `### ${w.name} · ${w.role} · ${w.dates}`,
    '',
    w.blurb,
    '',
    ...w.points.map((x) => `- ${x}`),
    '',
  ]),
  '## Education',
  '',
  edu.text,
  '',
  '---',
  '',
  `Also available as [plain text](${SITE}/resume.txt), [JSON Resume](${SITE}/resume.json), and [PDF](${SITE}/resume.pdf). In a terminal: \`${t('footer.curl.command')}\``,
  '',
].join('\n');

/* ---------- resume.txt ---------- */

const rule = (ch = '=') => ch.repeat(W);
const heading = (h) => [h.toUpperCase(), rule('-')];

const txt = [
  t('person.name').toUpperCase(),
  ...t('person.title').split(' | '),
  t('person.location'),
  ...contact.map(([label, text]) => `${(label + ':').padEnd(13)}${text}`),
  '',
  ...heading('Summary'),
  wrap(summary.join(' ')),
  '',
  wrap(availability),
  '',
  ...heading('Skills'),
  ...skills.map((s) => wrap(`${s.label}: ${s.text}`, W, '  ').replace(/^ {2}/, '')),
  '',
  ...heading('Experience'),
  ...jobs.flatMap((j) => [
    `${j.company} | ${j.location}`,
    ...j.roles.map((r) => `${r.title} | ${r.dates}`),
    ...(j.context ? [wrap(j.context)] : []),
    ...j.highlights.map((h) => bullet(h)),
    '',
  ]),
  ...heading('Independent projects'),
  ...work.flatMap((w) => [
    `${w.name} | ${w.role} | ${w.dates}`,
    wrap(w.blurb),
    ...w.points.map((x) => bullet(x)),
    '',
  ]),
  ...heading('Education'),
  `${edu.school} | ${edu.location}`,
  edu.degree,
  '',
  rule(),
  wrap(`Also at ${SITE}/resume.md, ${SITE}/resume.json, and ${SITE}/resume.pdf.`),
  '',
].join('\n');

/* ---------- resume.json (JSON Resume v1.0.0) ---------- */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const isoMonth = (s) => {
  const m = s.trim().match(/^(?:([A-Za-z]+)\s+)?(\d{4})$/);
  if (!m) return undefined; // "Present"
  if (!m[1]) return m[2];
  const i = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
  if (i < 0) throw new Error(`Unknown month in "${s}"`);
  return `${m[2]}-${String(i + 1).padStart(2, '0')}`;
};
const range = (dates) => {
  const [from, to] = dates.split(' to ');
  return { startDate: isoMonth(from), ...(to ? { endDate: isoMonth(to) } : {}) };
};
// "a, b (c, d), e" -> ["a", "b (c, d)", "e"]
const keywords = (s) => s.split(/,\s*(?![^()]*\))/).map((k) => k.trim()).filter(Boolean);

const resumeJson = {
  $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
  basics: {
    name: t('person.name'),
    label: t('person.title'),
    email,
    url: SITE,
    summary: `${summary.join(' ')} ${availability}`,
    location: { city: 'Sterling Heights', region: 'MI', countryCode: 'US' },
    profiles: [
      { network: 'LinkedIn', username: p.linkedin.href.split('/').pop(), url: p.linkedin.href },
      { network: 'GitHub', username: p.github.href.split('/').pop(), url: p.github.href },
    ],
  },
  work: jobs.flatMap((j) =>
    j.roles.map((r, i) => ({
      name: j.company,
      location: j.location,
      position: r.title,
      ...range(r.dates),
      ...(i === 0 && j.context ? { summary: j.context } : {}),
      ...(i === 0 ? { highlights: j.highlights } : {}),
    })),
  ),
  education: [{ institution: edu.school, area: 'Computer Science', studyType: 'Associate of Applied Science', location: edu.location }],
  skills: skills.map((s) => ({ name: s.label, keywords: keywords(s.text) })),
  projects: work.map((w) => ({
    name: w.name,
    description: w.blurb,
    highlights: w.points,
    ...range(w.dates),
    roles: [w.role],
  })),
  meta: { canonical: `${SITE}/resume.json`, version: 'v1.0.0', lastModified: new Date().toISOString().slice(0, 10) },
};

/* ---------- llms.txt (llmstxt.org) ---------- */

const anchor = (id, label, text) => `- [${label}](${SITE}/#${id}): ${text}`;
const llms = [
  `# ${t('person.name')}`,
  '',
  `> ${t('person.title')}. ${t('meta.description')}`,
  '',
  `${t('hero.value')} ${availability}`,
  '',
  'Numbers marked "about", "roughly", or "an estimated" are approximate. Keep those words when you quote them.',
  '',
  '## Resume',
  '',
  `- [Resume (Markdown)](${SITE}/resume.md): the full resume, best for reading or summarizing`,
  `- [Resume (plain text)](${SITE}/resume.txt): the same resume as plain text`,
  `- [Resume (JSON Resume)](${SITE}/resume.json): structured data in the JSON Resume v1.0.0 schema`,
  `- [Resume (PDF)](${SITE}/resume.pdf): the downloadable, ATS-friendly resume`,
  '',
  '## Site sections',
  '',
  anchor('sixty', t('sixty.title'), 'summary, top five achievements, stack, and availability'),
  anchor('pipeline', t('pipeline.title'), t('pipeline.intro')),
  anchor('safety', t('safety.title'), t('safety.intro')),
  anchor('mcp', t('mcp.title'), t('mcp.intro')),
  anchor('career', t('career.title'), 'every role from 2006 to 2026, plus education'),
  anchor('platform', t('platform.title'), t('platform.vue')),
  anchor('independent', t('independent.title'), t('independent.intro')),
  anchor('contact', 'Contact', t('contact.intro')),
  '',
  '## Contact',
  '',
  ...contact.filter(([l]) => l !== 'Website').map(([label, text, href]) => `- [${label}](${href}): ${text}`),
  '',
  '## Optional',
  '',
  `- [Terminal resume](${SITE}/cli): run \`${t('footer.curl.command')}\``,
  '',
].join('\n');

/* ---------- cli (styled plain text for curl) ---------- */

const esc = (code) => (s) => `\x1b[${code}m${s}\x1b[0m`;
const bold = esc('1');
const dim = esc('2');
const blue = esc('1;38;2;42;82;255'); // --accent
const green = esc('38;2;18;201;122'); // --green
const IN = '  ';
const CW = W - IN.length;
const cwrap = (s, indent = IN) => wrap(s, W, indent);
const cbullet = (s) => wrap(s, W, IN + '  ').replace(/^ {4}/, IN + dim('•') + ' ');
const chead = (h) => ['', `${IN}${blue(h.toUpperCase())}`, `${IN}${dim('─'.repeat(CW))}`];

const box = [t('person.name').toUpperCase(), ...t('person.title').split(' | ')];
const boxW = Math.max(...box.map((l) => l.length)) + 4;
const cli = [
  '',
  `${IN}${dim('╭' + '─'.repeat(boxW) + '╮')}`,
  `${IN}${dim('│')}  ${bold(box[0].padEnd(boxW - 2))}${dim('│')}`,
  ...box.slice(1).map((l) => `${IN}${dim('│')}  ${l.padEnd(boxW - 2)}${dim('│')}`),
  `${IN}${dim('╰' + '─'.repeat(boxW) + '╯')}`,
  '',
  ...wrap(availability, W - IN.length - 2).split('\n').map((l, i) => `${IN}${i ? '  ' : green('●') + ' '}${bold(l)}`),
  ...contact.map(([label, text]) => `${IN}${dim(label.padEnd(12))} ${text}`),
  ...chead('Summary'),
  cwrap(summary.join(' ')),
  ...chead('Skills'),
  ...skills.flatMap((s) => [`${IN}${bold(s.label)}`, cwrap(s.text, IN + '  ')]),
  ...chead('Experience'),
  ...jobs.flatMap((j, i) => [
    ...(i ? [''] : []),
    `${IN}${bold(j.company)} ${dim('·')} ${j.location}`,
    ...j.roles.map((r) => `${IN}${r.title} ${dim('·')} ${dim(r.dates)}`),
    ...(j.context ? [dim(cwrap(j.context))] : []),
    ...j.highlights.map(cbullet),
  ]),
  ...chead('Independent projects'),
  ...work.flatMap((w, i) => [
    ...(i ? [''] : []),
    `${IN}${bold(w.name)} ${dim('·')} ${w.role} ${dim('·')} ${dim(w.dates)}`,
    cwrap(w.blurb),
    ...w.points.map(cbullet),
  ]),
  ...chead('Education'),
  `${IN}${edu.school} ${dim('·')} ${edu.location}`,
  `${IN}${edu.degree}`,
  '',
  `${IN}${dim('─'.repeat(CW))}`,
  `${IN}${green('●')} ${t('contact.mergedStatus')} ${t('contact.heading')}`,
  `${IN}${dim(`Also at ${SITE.replace(/^https:\/\//, '')}/resume.md, /resume.txt, /resume.json, /resume.pdf`)}`,
  '',
].join('\n');

/* ---------- Write ---------- */

const files = {
  'resume.md': md,
  'resume.txt': txt,
  'resume.json': JSON.stringify(resumeJson, null, 2) + '\n',
  'llms.txt': llms,
  cli,
};
for (const [name, body] of Object.entries(files)) {
  // brief:HARD_RULE_13 (no em or en dashes) and decisions:Phone (no phone number) hold for every file.
  if (/[–—]/.test(body)) throw new Error(`${name} contains an em or en dash`);
  if (/\d{3}[-. ]\d{3}[-. ]\d{4}/.test(body)) throw new Error(`${name} contains a phone number`);
  fs.writeFileSync(path.join(out, name), body);
}
console.log(`resume files: ${Object.keys(files).map((n) => `public/${n}`).join(', ')}`);
