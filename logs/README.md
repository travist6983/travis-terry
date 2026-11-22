# Build log

Each post is one Markdown file in this folder. The site builds them into
[travisjterry.dev/logs](https://travisjterry.dev/logs), one commit per post on the git graph, plus an
RSS feed at `/logs/feed.xml`.

## Files

- Name posts `YYYY-MM-DD-slug.md`, e.g. `2026-11-22-flaky-ci-retries.md`. The slug (lowercase,
  hyphens) becomes the URL: `/logs/flaky-ci-retries`. Slugs must be unique.
- Put images in `img/` and link them with a relative path and alt text:
  `![What the image shows](img/flaky-ci.png)`. Only images that a published post uses are copied
  into the site.
- This README is ignored by the build. Any other `.md` file here must follow the naming rule.

## Frontmatter

```yaml
---
title: "Flaky CI retries hid a real race"
date: 2026-11-22
summary: One or two sentences for the list page and the feed.
tags: [ci, agents]
draft: true
---
```

- All five fields are required, and no others are allowed.
- `date` must match the date in the filename.
- `tags` can also be a YAML list of `- ci` lines. Use `tags: []` for none.
- `draft` must be exactly `true` or `false`.
- Quotes around strings are optional. Comments (`#`) aren't supported.

**`draft: true` posts are never built, listed, put in the feed, or have their images copied.**
They do show up under `npm run dev`, so you can preview them locally. After `npm run build`,
`scripts/check-logs.mjs` fails the build if anything from a draft reached `dist/`.

## Body

Use these `##` headings, in this order. `###` subheadings inside them are fine.

1. `## The problem`
2. `## What the kit did`
3. `## What broke`
4. `## What I changed`

Don't add a `#` heading: the title comes from frontmatter. A short intro paragraph before the
first heading is fine. Fenced code blocks are styled but not syntax highlighted.

The build checks all of this and fails with the file name and the problem, so a broken post can't
ship. See `2026-11-22-example-post.md` for a complete example.
