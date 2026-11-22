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

## Commit id

Each post shows a short commit id linked to GitHub. It's the real commit that **published** the
post: the first commit where the file has `draft: false`. Later edits don't change it, and
renaming the file (say, to fix the date when you publish) keeps it. Until that commit exists,
`npm run dev` shows "uncommitted". The deploy build fails if a published post isn't committed.

## Body

Start with these four `##` headings, in this order. `###` subheadings inside them are fine, and
more `##` sections can follow the four (a closing "Try it", say).

1. `## The problem`
2. `## What the kit did`
3. `## What broke`
4. `## What I changed`

Don't add a `#` heading: the title comes from frontmatter. A short intro paragraph before the
first heading is fine.

### Blocks the build log draws specially

- **Code:** a fence's info string is `language filename`, e.g. ` ```text defect-loop.recipe `.
  The filename goes in the card's top bar, with a Copy button. No syntax highlighting.
- **Images:** an image on its own line becomes a figure. The caption is the image title if you
  give one, else the alt text: `![What it shows](img/x.png "Caption")`.
- **Failures and fixes:** a ` ```fixes ` block renders as a diff. Put it under "What I changed".
  One row per line: `@@ label @@` plus an optional link starts a hunk, `- ` is a failure,
  `+ ` is its fix. Bold, links and code work in a row; raw HTML shows as text. Any other line
  fails the build.

  ````md
  ```fixes
  @@ fix step @@ [PR 1](https://github.com/you/repo/pull/1)
  - **A fix could hide the bug and still pass.** One sentence on what broke.
  + **Root cause, proven.** What you changed.
  ```
  ````

- **Closing line:** a blockquote whose first line is `$ git commit -m` becomes the dark quote
  card. Other blockquotes stay plain.

  ```md
  > $ git commit -m
  > The model doesn't learn anything between runs. The loop around it does.
  ```

The build checks all of this and fails with the file name and the problem, so a broken post can't
ship. Drafts aren't checked as strictly, but every build prints what would stop each draft from
publishing. See `2026-11-22-example-post.md` for a complete example.
