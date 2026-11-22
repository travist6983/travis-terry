// Build log: the fixes renderer and reading time. Run: npm test (node --test, no dependencies).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { imageSize, readingTime, render, renderFixes } from '../src/lib/logs-core.mjs';

test('readingTime: words / 230, rounded, at least 1', () => {
  assert.equal(readingTime(''), 1);
  assert.equal(readingTime('word '.repeat(100)), 1);
  assert.equal(readingTime('word '.repeat(345)), 2); // 1.5 rounds up
  assert.equal(readingTime('word '.repeat(2070)), 9);
});

test('readingTime: image and link targets are not words', () => {
  const links = Array.from({ length: 300 }, (_, i) => `[a](https://example.com/${i} "t")`).join(' ');
  const images = Array.from({ length: 300 }, () => '![alt text here](img/x.png)').join(' ');
  assert.equal(readingTime(links), 1); // 300 link texts, no URLs
  assert.equal(readingTime(images), 1);
  assert.equal(readingTime('- **Bold** — `code` ## '.repeat(10)), 1); // bare punctuation isn't a word
});

test('renderFixes: hunks, rows and counts', () => {
  const html = renderFixes('@@ fix step @@ [PR 1](https://github.com/o/r/pull/1)\n- **Broke.** One.\n\n+ **Fixed.** Two.\n- Another.');
  assert.match(html, /<b>git diff<\/b> failures\.\.fixes/);
  assert.match(html, /2 removed<\/span> · <span class="diff__add">1 added/);
  assert.match(html, /<div class="diff__hunk">@@ fix step @@ <a href="https:\/\/github.com\/o\/r\/pull\/1">PR 1<\/a><\/div>/);
  assert.equal((html.match(/diff__t diff--minus/g) ?? []).length, 2);
  assert.match(html, /<span class="sr-only">Fix: <\/span><strong>Fixed\.<\/strong> Two\./);
  // the − / + glyphs are decoration; screen readers get "Failure:" / "Fix:"
  assert.match(html, /<div class="diff__g diff--minus" aria-hidden="true">−<\/div>/);
});

test('renderFixes: raw HTML is escaped, inline Markdown still works', () => {
  const html = renderFixes('@@ <img src=x onerror=alert(1)> @@\n- <script>alert(1)</script> **bold** `code`');
  assert.doesNotMatch(html, /<script>|<img/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; <strong>bold<\/strong> <code>code<\/code>/);
  assert.match(html, /@@ &lt;img src=x onerror=alert\(1\)&gt; @@/);
});

test('renderFixes: rejects stray lines and empty blocks', () => {
  assert.throws(() => renderFixes('- ok\njust text'), /line 2 must start with/);
  assert.throws(() => renderFixes('@@ only a hunk @@'), /no - or \+ rows/);
});

test('render: fixes block, ## anchors, code card, figure caption, commit quote', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logs-'));
  fs.mkdirSync(path.join(dir, 'img'));
  fs.writeFileSync(path.join(dir, 'img/a.png'), '');
  const body = [
    '## The problem', 'x', '## What the kit did', '```text defect.recipe', 'a → b', '```',
    '![Alt words](img/a.png "Caption words")', '## What broke', 'y', '## What I changed',
    '```fixes', '- **A.** a', '+ **B.** b', '```', '> $ git commit -m', '> The loop **learns**.', '', '> plain quote',
  ].join('\n');
  const { html, headings } = render({ file: 'logs/t.md', draft: false, body }, dir);
  assert.deepEqual(headings.map((h) => [h.id, h.fixes]), [['the-problem', false], ['what-the-kit-did', false], ['what-broke', false], ['what-i-changed', true]]);
  assert.match(html, /<h2 id="the-problem"><a class="hash" href="#the-problem" aria-label="Link to The problem">##<\/a>The problem<\/h2>/);
  assert.match(html, /<span>defect\.recipe<\/span>.*<code class="language-text">a → b<\/code>/s);
  assert.match(html, /<figure class="figure"><img src="img\/a.png" alt="Alt words" loading="lazy" decoding="async"><figcaption>Caption words<\/figcaption><\/figure>/);
  assert.match(html, /class="diff"/);
  assert.match(html, /<blockquote class="commitq">.*<p>The loop <strong>learns<\/strong>\.<\/p><\/blockquote>/s);
  assert.match(html, /<blockquote>\n<p>plain quote<\/p>/);
});

test('render: a bad fixes line fails the post with its file name', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logs-'));
  const body = '## The problem\n## What the kit did\n## What broke\n## What I changed\n```fixes\nnope\n```';
  assert.throws(() => render({ file: 'logs/t.md', draft: false, body }, dir), /logs\/t\.md:[\s\S]*fixes block line 1/);
});

test('imageSize: reads PNG, WebP (VP8X), JPEG and SVG headers', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'img-'));
  const png = Buffer.alloc(32);
  png.write('\x89PNG\r\n\x1a\n', 0, 'latin1');
  png.writeUInt32BE(1600, 16);
  png.writeUInt32BE(900, 20);
  const webp = Buffer.alloc(40);
  webp.write('RIFF', 0, 'latin1');
  webp.write('WEBPVP8X', 8, 'latin1');
  webp.writeUIntLE(1199, 24, 3);
  webp.writeUIntLE(674, 27, 3);
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0xe0, 0x02, 0x80, 0x03, 0, 0, 0]);
  const cases = { 'a.png': [png, 1600, 900], 'a.webp': [webp, 1200, 675], 'a.jpg': [jpg, 640, 480], 'a.svg': [Buffer.from('<svg viewBox="0 0 640 200"></svg>'), 640, 200] };
  for (const [name, [buf, width, height]] of Object.entries(cases)) {
    fs.writeFileSync(path.join(dir, name), buf);
    assert.deepEqual(imageSize(path.join(dir, name)), { width, height }, name);
  }
});
