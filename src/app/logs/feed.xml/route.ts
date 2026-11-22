import { content, t } from '@/lib/content';
import { posts } from '@/lib/logs';

// Written to dist/logs/feed.xml at build time. Published posts only (drafts are filtered in logs-core).
export const dynamic = 'force-static';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rfc822 = (d: string) => new Date(`${d}T12:00:00Z`).toUTCString();

export function GET() {
  const site = t(content.meta.canonical).replace(/\/$/, '');
  const list = posts();
  const items = list
    .map((p) => {
      const url = `${site}/logs/${p.slug}`;
      return [
        '    <item>',
        `      <title>${esc(p.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${rfc822(p.date)}</pubDate>`,
        `      <description>${esc(p.summary)}</description>`,
        ...p.tags.map((tag) => `      <category>${esc(tag)}</category>`),
        '    </item>',
      ].join('\n');
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Build log | Travis Terry</title>
    <link>${site}/logs</link>
    <atom:link href="${site}/logs/feed.xml" rel="self" type="application/rss+xml" />
    <description>Notes from building with an agent kit: the problem, what the kit did, what broke, and what I changed.</description>
    <language>en</language>${list[0] ? `\n    <lastBuildDate>${rfc822(list[0].date)}</lastBuildDate>` : ''}
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
