# Build log redesign: handoff for Claude Code

Put this folder at `docs/design/build-log/` in the repo (`travist6983/travis-terry`), then paste
the prompt at the bottom into Claude Code from the repo root.

The four `.html` files are the approved designs. They are design-canvas source (Design Component
format), so they won't run on their own: read them for markup, spacing, colors, copy and states.
Every color, radius and font in them comes from `src/app/globals.css`. Use the existing variables,
never the hex values.

| File | What it is |
|---|---|
| `list-desktop.html` | `/logs` at desktop width, with the phone chrome below 760px |
| `list-phone.html` | `/logs` at 390px |
| `detail-desktop.html` | `/logs/[slug]` at desktop width, with the phone chrome below 760px |
| `detail-phone.html` | `/logs/[slug]` at 390px |

The post titles other than "The model never changes. The loop around it does." and the
`series/defect-loop` branch are sample content. Don't add them to `/logs`.

## Scope, in build order

### 1. Phone chrome (≤760px), on the build log pages
In `src/components/LogsChrome.tsx`:
- Hide the current `.nav` header at ≤760px. Desktop stays exactly as it is.
- **Top bar** (sticky): the wordmark on the left. On the right, a dark pill shaped like a terminal
  prompt: `> ~/logs git:(main)` on the list, `> ~/logs/<short-slug> git:(<commit id>)` on a post.
  If the post has no commit yet, use `uncommitted`.
- **Bottom dock** (fixed, 16px inset, about 74px tall, frosted glass): a horizontal rail with five
  commit-dot links: `60s · pipeline · career · contact · log`. They go to the same places as the
  header's nav items in `content.json`. The current page gets a green glowing dot (same style as
  `.head__dot`) and a small dark `HEAD` tag above it, plus `aria-current="page"`. Every target is
  at least 44px wide.
- The Pause motion toggle and the Resume button don't appear at ≤760px. Animation still has to
  follow `prefers-reduced-motion`.
- Give the page bottom padding so the dock never covers the footer.

### 2. List page (`src/app/logs/page.tsx`)
- Header: keep the badge, title and lede. Move the RSS link into the sidebar.
- **Search bar** (frosted glass, client component): `$ git log --grep=` followed by a search
  input that filters by title, summary and tags as you type. Next to it, a segmented toggle:
  `--graph` / `--oneline`.
- **Tag chips** under the search bar: `all` plus each tag, with post counts. Picking one filters
  the list. Use real `<button aria-pressed>`.
- **Graph view:** keep the `CommitJourney` rail and HEAD animation if the cards line up with it.
  Otherwise build a static per-row rail like the design. Each card shows the commit link and date,
  ref pills (`HEAD → main` on the newest post, `INITIAL COMMIT` on the oldest), the title, the
  summary, tag pills, `N min read` with a 5-block bar (words ÷ 230, rounded), and `git show →`.
- **Oneline view:** one dense monospace row per post: graph character, commit id, refs, title,
  date. Text graph characters only.
- Under the list: `(END) · showing X of Y commits`. With no matches, show an empty state.
- **Sidebar:** a "Branches" card (main with its post count; series once step 5 exists) and a
  "git pull" card with the `curl -sL travisjterry.dev/logs/feed.xml` line, a Copy button, and the
  RSS link.
- Filtering runs in the browser on the static export. The full list must still render without
  JavaScript.

### 3. Detail page (`src/app/logs/[slug]/page.tsx`)
- Breadcrumb: `← git log / logs / <slug>`.
- **Commit header card** (monospace): `commit <full sha>` with the `HEAD → main` pill on the newest
  post, then Author, Date and Parent. Parent is the next-older post's commit and title. Add Copy SHA
  and View on GitHub buttons. Then the title, the lede, tags, and `N min read · N sections`.
- **"Files changed" sidebar** (desktop): the post filename, then one entry per H2. Mark the active
  section with IntersectionObserver, and add a read-percentage bar. On phones it collapses into a
  `<details>` above the article, and the percent shows next to the back link.
- **Prose:** each H2 gets a `##` anchor link. Code blocks get a dark card with a filename bar and
  a Copy button. Images get a monospace caption.
- **Failure/fix diff block:** add a fenced block type to the Marked renderer in
  `src/lib/logs-core.mjs`:

  ````md
  ```fixes
  @@ fix step @@ [PR 1](https://github.com/travist6983/agent-kit/pull/1)
  - **A fix could hide the bug and still pass.** Guarding the crash site buried the real bug.
  + **Root cause, proven.** The fix goes where the bad state was produced.
  ```
  ````

  Render it like the design: a header with `git diff failures..fixes` and the removed/added counts,
  purple `@@` hunk rows with their links, orange-tinted `−` rows, green-tinted `+` rows. Inline
  Markdown (bold, links) should work inside a row. Escape everything else.
  **Keep the validator's four required H2s exactly as they are.** The diff block goes under
  "What I changed". "What broke" stays prose.
- **Closing quote:** a blockquote whose first line is `$ git commit -m` renders as the dark quote
  card. Other blockquotes stay normal.
- Footer of the article: `Signed-off-by: Travis Terry`, then Edit on GitHub, Copy link and RSS.
- **Pager:** `← PREVIOUS · <commit id>` with the older post's title, plus a series pill if it has
  one. On the newest post, show a `HEAD · LATEST` card with the RSS link instead of a next link.

### 4. Content
Rewrite `logs/2026-11-21-the-loop-around-it.md` so "What I changed" uses the `fixes` block. Keep
the post's wording. Don't publish it (leave `draft: true`).

### 5. Later, separate PR: series as branches
An optional `series:` frontmatter field (for example, `series: defect-loop`) that draws posts on a
purple branch lane and adds a merge row when the series ends. The validator and `logs/README.md`
both need updating. Skip this until there are at least four published posts.

## Rules
- Use the existing CSS variables and the `.glass`, `.kick`, `.tag` and `.prose` classes. New styles
  go in the build log block at the end of `globals.css`.
- Accessibility as drawn: real links and buttons, `aria-label` on icon-only controls, 4.5:1 text
  contrast, visible focus states.
- No names of employers, clients or their projects anywhere in build log content or chrome.
- `npm run build` and `scripts/check-logs.mjs` must pass. Add tests for the `fixes` renderer and
  the reading-time function.
- Check it at 390px and 1280px before opening the PR.

---

## Prompt to paste into Claude Code

```
Read docs/design/build-log/HANDOFF.md and the four design files next to it. Then implement
steps 1 to 4 of the build log redesign in this repo, on a new branch called feat/build-log-redesign.
Follow the Rules section. Start by reading src/app/logs/, src/components/LogsChrome.tsx,
src/components/Journeys.tsx, src/lib/logs-core.mjs and the build log block in src/app/globals.css,
and tell me your plan in a few lines before you write code. When it builds cleanly and works at
390px and 1280px, open a PR. Leave step 5 out.
```
