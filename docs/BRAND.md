# Brand directions

**Status:** Phase 2 draft for Travis to review. Nothing here is approved until Travis picks a direction.
**Date:** 2026-10-27
**Recommended:** Direction A, Workbench.

Files that go with this document:

| What | Where |
|---|---|
| Hero mocks, one per direction | `private/previews/hero-a.html`, `hero-b.html`, `hero-c.html` (append `#dark` to preview dark) |
| All three side by side | `private/previews/index.html` |
| Renders at 1440 x 900 and 390 x 844, light and dark | `private/previews/hero-{a,b,c}-{1440,390}.png`, `hero-{a,b,c}-dark-{1440,390}.png` |
| Tokens for the recommended direction | `docs/design-tokens.json`, `docs/tokens.css` |
| Contrast script | `scripts/check-contrast.py` (reads `docs/design-tokens.json` for A) |
| Mock and render scripts | `private/previews/build_previews.py`, `build_index.py`, `shoot.sh` |

The mocks use the real hero copy from `content/content.json`: name, the title line exactly as on the resume, the value line, the three proof numbers with their hedge words, the four CTAs, and the 60-second version link. Missing inputs show as the real placeholder style, a striped yellow "NEEDED FROM TRAVIS" callout, on Book a Call and the headshot slot.

## What every direction shares

These are fixed by the brief and the story, so they do not change between directions.

- **The ticket is a ticket stub, not a board card.** It has two semicircle notches on its short sides, like a paper ticket. Its only text is "bug" and the "Illustration" tag. No key, ID, title, avatar, assignee, priority icon, or type icon. That is the single biggest guard against looking like Jira or any board tool.
- **Red means the bug state. Green means merged.** The status light is a round lamp, never a pill with an icon and a word, which is how GitHub and similar tools show PR state.
- **The verifier marker has its own hue** (blue in A and B, ochre in C) that never appears elsewhere, so "a second, different agent" reads at a glance.
- **Chaos to calm.** Two fixed backdrop layers, warm and cool. Only the cool layer's opacity is scrubbed (docs/RESEARCH.md 4.5, Risk A). Body text sits on solid sheets, so its contrast never moves. Headings and labels that sit directly on the backdrop are checked at every 10% step of the shift (see Contrast).
- **The placeholder callout** is the same in every direction and both modes: `#FFD60A` yellow and `#111111` stripes, with the text on a solid yellow label (13.38:1). It is deliberately louder than anything in any palette.
- **Fonts are self-hosted.** Every family below is SIL Open Font License. The build copies woff2 files (from the Fontsource packages, version 5.3.0) into `/fonts` and serves them from the site. No runtime Google Fonts request, ever. The mocks already load fonts from `private/previews/fonts/`.
- **Dark mode follows the visitor's system preference** (DECISIONS Q12). No forced theme.
- **No logos.** Each wordmark below is original and uses only Travis's name.

## Direction A: Workbench (recommended)

**Idea:** an engineer's bench. Warm paper, black ink, an editorial serif. The backlog is a messy stack of paper tickets; as the ticket moves down the pipeline, the paper cools to a calm slate. It looks written, not generated.

**Type**

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display (H1, H2, proof numbers, value line) | Fraunces | 600, 400 italic | Soft, high-contrast serif with real character. The value line is set in italic so it reads as his voice. |
| Body and UI | Public Sans | 400, 600, 700 | Neutral, very legible, wide language support. |
| Pipeline UI (chips, stage index, Ask terminal, labels) | JetBrains Mono | 400, 600 | Clear zero and one, good at small sizes. |

Seven woff2 files, about 124KB in total (Latin subset). Preload only Fraunces 600 and Public Sans 400; the rest load with `font-display: swap`.

**Palette** (full list in `docs/design-tokens.json`)

| Token | Light | Dark | Use |
|---|---|---|---|
| bg-warm | `#F3EADB` | `#1B1712` | Backdrop, backlog end |
| bg-cool | `#E3EAED` | `#11171A` | Backdrop, shipped end |
| surface | `#FFFCF6` | `#231E19` | Content sheets |
| surface-2 | `#F8F1E5` | `#2B251F` | Panels, ticket detail, Ask terminal |
| ink | `#1C1814` | `#F2EBDF` | Primary text |
| ink-2 | `#4A4238` | `#D3C8B7` | Secondary text |
| ink-3 | `#675D51` | `#ADA190` | Muted text, oldest commits |
| link / focus | `#94330F` | `#F2A578` | Links (underlined), focus ring |
| accent / on-accent | `#1C1814` / `#FFFCF6` | `#F2EBDF` / `#1B1712` | Primary CTA |
| bug / on-bug | `#B3261E` / `#FFFFFF` | `#CC3B2F` / `#FFFFFF` | The red ticket |
| merged | `#1C7A4B` | `#45C485` | Status light, passed checks |
| verifier | `#3A57A0` | `#93AEF3` | Second agent marker |
| track | `#3A332B` | `#C9BEAD` | Track line and station outlines |

**Wordmark**

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 196 36" width="294" height="54" role="img" aria-label="Travis Terry"><path fill="#1C1814" d="M4 4h36a4 4 0 0 1 4 4v6a4 4 0 0 0 0 8v6a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4v-6a4 4 0 0 0 0-8V8a4 4 0 0 1 4-4z"/><text x="22" y="24.5" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-style="italic" font-weight="600" font-size="16" fill="#FFFCF6">TT</text><circle cx="38" cy="9" r="2" fill="#2FBF71"/><text x="56" y="25" font-family="Fraunces,Georgia,serif" font-weight="600" font-size="21" fill="#1C1814">Travis Terry</text></svg>

A small ink ticket stub with "TT" in Fraunces italic, a single green dot in its corner (the merged light, in miniature), then the name in Fraunces 600. In production the text is converted to outlines at build so the mark never depends on a font load.

**Mock:** `private/previews/hero-a.html`. Text column on the left, backlog column on the right, the red ticket tilted out of the stack, and a dotted track leaving it toward the next section.

**Strengths**
- Looks like nobody else in this space. Almost every AI engineer portfolio is dark, mono, and neon. Warm paper and a real serif say "senior, writes well, cares about craft" before a word is read.
- The chaos to calm shift is native to the palette: warm paper to cool slate. It needs no extra color.
- Lowest risk of vendor likeness. No dark gradient (Linear), no blue (Jira, Azure DevOps), no gray product chrome (GitHub).
- Ink-on-paper illustration (style 1 in STORY_VALIDATION.md) is cheap to draw and cheap to animate.

**Risks**
- A serif can read as "writer" rather than "engineer" if the mono pipeline UI is too timid. Fix: the pipeline sections lean on JetBrains Mono and the drawn track, so the engineering voice is carried by the parts that are about engineering.
- Fraunces has strong personality at large sizes. Keep it to display sizes and the value line.

## Direction B: Signal

**Idea:** rail and road signage. A dark band header, a huge condensed name, heavy rules, and a two-lamp signal as the wordmark. The track is literally a line, and the status light is a signal lamp that turns green.

**Type**

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display and nav | Barlow Condensed | 600, 700 | Inspired by road signage. Uppercase for H1 and nav. |
| Body | Barlow | 400, 500, 600 | Same family, regular width. |
| Pipeline UI | IBM Plex Mono | 400, 500 | Sturdy, technical. |

Seven woff2 files, about 138KB.

**Palette**

| Token | Light | Dark |
|---|---|---|
| bg-warm / bg-cool | `#E9E4DA` / `#DDE4E7` | `#17140F` / `#0E1416` |
| surface / surface-2 | `#FFFFFF` / `#F3F1EC` | `#1B1D20` / `#24272B` |
| ink / ink-2 / ink-3 | `#121417` / `#383D44` / `#545A63` | `#F1F0EC` / `#C9CCD1` / `#A0A6AE` |
| band / on-band (header) | `#121417` / `#FFFFFF` | `#08090A` / `#F1F0EC` |
| accent / on-accent | `#0F4C4E` / `#FFFFFF` | `#6FD0CB` / `#0A1516` |
| link / focus | `#0F5557` / `#0F4C4E` | `#6FD0CB` / `#6FD0CB` |
| bug / on-bug | `#C42B1C` / `#FFFFFF` | `#CC3324` / `#FFFFFF` |
| merged | `#0E7A43` | `#34D27F` |
| verifier | `#1F5FAD` | `#86B4FF` |
| track | `#2B2F35` | `#C9CCD1` |

**Wordmark**

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 196 36" width="294" height="54" role="img" aria-label="Travis Terry"><rect x="1" y="1" width="18" height="34" rx="9" fill="#121417"/><circle cx="10" cy="10" r="5" fill="#C42B1C" opacity=".45"/><circle cx="10" cy="26" r="5" fill="#22C06E"/><text x="30" y="27" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="25" letter-spacing="1.6" fill="#121417">TRAVIS TERRY</text></svg>

A two-lamp signal, red dimmed and green lit, then the name in Barlow Condensed 700 caps.

**Mock:** `private/previews/hero-b.html`. The name runs the full width as a sign over a heavy rule; proof numbers sit on three boards whose top bars are red, ink, and green (bug, work, shipped).

**Strengths**
- The most literal fit for the story: track, signal, green light.
- Very fast to scan. The proof boards are the strongest 10-second read of the three.

**Risks**
- **It leans toward the primary inspiration site.** United Carriers is a logistics company. A rail and signage look borrows its world as well as its technique, and the brief says to borrow techniques, never visuals.
- Uppercase condensed type is loud. Long headings get tiring, and it can feel like a transit or industrial brand rather than a person.
- The amber family is unavailable (it would collide with the yellow placeholder), which narrows the warm end of the shift.

## Direction C: Drafting

**Idea:** a technical drawing. Grid paper, hairlines, registration marks in the corners, dashed construction lines. The backlog is a horizontal tray at the bottom of the sheet, and the ticket drops out of it onto a construction line that becomes the track. Proof numbers sit in a drawing's title block.

**Type**

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display | Schibsted Grotesk | 500, 700 | Tight, confident grotesk. |
| Body | Atkinson Hyperlegible Next | 400, 600 | Designed for low-vision legibility. A quiet accessibility signal. |
| Pipeline UI | Atkinson Hyperlegible Mono | 400, 500 | Matches the body family. |

Six woff2 files, about 93KB (the lightest).

**Palette**

| Token | Light | Dark |
|---|---|---|
| bg-warm / bg-cool | `#F6ECE0` / `#EEF4F8` | `#1A1612` / `#0D141B` |
| surface / surface-2 | `#FFFFFF` / `#F6F8FA` | `#161D25` / `#1D2631` |
| ink / ink-2 / ink-3 | `#0D1B2A` / `#33465C` / `#4F6276` | `#EAF0F6` / `#BFCBD8` / `#97A7B8` |
| accent / on-accent | `#17587A` / `#FFFFFF` | `#86CBEA` / `#0D1B2A` |
| link / focus | `#17587A` | `#86CBEA` |
| bug / on-bug | `#BF3A2B` / `#FFFFFF` | `#BF3A2B` / `#FFFFFF` |
| merged | `#12805C` | `#3CCB95` |
| verifier | `#9A5208` | `#E9A75C` |
| track | `#33465C` | `#97A7B8` |

**Wordmark**

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 36" width="300" height="54" role="img" aria-label="Travis Terry"><circle cx="11" cy="15" r="7" fill="none" stroke="#0D1B2A" stroke-width="1.5"/><path d="M11 4v22M0 15h22" stroke="#0D1B2A" stroke-width="1"/><path d="M11 31H192" stroke="#33465C" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="192" cy="31" r="3" fill="#12805C"/><text x="30" y="22" font-family="Schibsted Grotesk,system-ui,sans-serif" font-weight="700" font-size="20" letter-spacing="-.3" fill="#0D1B2A">Travis Terry</text></svg>

A registration crosshair, the name, and a dashed construction line underneath that ends in a green node: the whole journey in one line.

**Mock:** `private/previews/hero-c.html`.

**Strengths**
- Reads as precise and systems-minded. The title-block proof table is the most "engineer" of the three.
- Lightest fonts. Atkinson Hyperlegible is a real accessibility choice that matches the site's accessibility claims.

**Risks**
- Hairline drawings and a grid get busy fast, and the grid works against the "calm" end of the story unless it fades out.
- Cool blue-gray ink plus a teal-blue accent edges toward generic SaaS. Keep the accent off large areas.
- The horizontal tray is harder on mobile: it becomes the same vertical rail as the other directions, so the hero composition changes between breakpoints.

## Recommendation: A, Workbench

1. **It is the most distinct.** The audience sees dark, mono, neon AI portfolios all day. Warm paper and a serif are memorable in the first second, which the 10-second recruiter path depends on.
2. **The story's color shift is built in.** Warm paper to cool slate is the palette itself, not an extra effect, so the chaos to calm shift costs nothing to render and stays within AA at every step.
3. **Lowest vendor-likeness risk.** See the table below.
4. **It keeps the ticket the hero.** The red stub is the only saturated object in the first viewport. B's red, ink, and green boards compete with it; C's grid competes with it.
5. **It suits the motion budget.** Ink-line illustration is strokes and flat fills, the cheapest thing to scrub and paint.

Borrow from the others: B's colored top bar on each proof number (red, ink, green) is a good 10-second device and could be added to A as a thin rule. C's title-block idea suits A's 60-Second Version panel.

## Vendor likeness check

| Product | What makes its UI recognizable | A | B | C |
|---|---|---|---|---|
| Jira | Blue primary, issue key plus number, type icons, avatars, priority arrows, column board | No blue; no keys, icons, or avatars; the ticket is a notched stub | Same | Same; accent is teal-blue, kept off cards |
| GitHub | Green "Open" pill and purple "Merged" pill with octicons, diffstat squares, gray Primer chrome, commit hashes | Round lamp, no pills, no purple, no diffstat, no hashes | Same | Same |
| Linear | Near-black canvas, purple and gray gradients, glow edges, Inter Display | Light-first, no purple, no gradient glows on panels | Dark band header only | Grid paper, no gradients |
| Azure DevOps | Blue, gray, left nav rail | No blue | Teal, not blue | Teal-blue accent; watch it |
| TestRail | Green and gray test grids | Test pips are dots on the track, not a grid | Same | Same |
| Claude Code terminal | Dark terminal, orange accent, block cursor | Ask terminal uses surface-2 and site tokens, no orange | Same | Same |

## Contrast

**Method.** `scripts/check-contrast.py` computes WCAG 2.x contrast ratios. Direction A's values are read from `docs/design-tokens.json`, so the shipped tokens and this report cannot drift. Run `python3 scripts/check-contrast.py --strict` in CI to fail the build on any regression.

- **Text on sheets** (ink, ink-2, ink-3, link, bug-text, merged-text on surface and surface-2; on-accent on accent; on-bug on bug): needs 4.5:1.
- **Non-text** (bug, merged, verifier, focus, accent, track): needs 3:1 (WCAG 1.4.11).
- **The chaos to calm shift:** the cool layer sits over the warm one at opacity t, which the browser blends in sRGB. Every text token that can sit on the backdrop is checked at t = 0.0, 0.1, through 1.0, and the worst step is reported. Body text never sits on the backdrop, but headings and labels can.

**Result: 0 failures across 159 checks (3 directions, light and dark, plus the shared callout).**

Worst case per direction during the shift (lowest text step, ink-3, and the status light):

| Direction | Mode | ink-3 worst | merged light worst | bug ticket worst |
|---|---|---|---|---|
| A | light | 5.29 (at the cool end) | 4.39 | 5.37 |
| A | dark | 7.03 (at the warm end) | 8.05 | 3.59 |
| B | light | 5.41 | 4.20 | 4.40 |
| B | dark | 7.49 | 9.33 | 3.56 |
| C | light | 5.39 | 4.22 | 4.67 |
| C | dark | 7.31 | 8.71 | 3.30 |

Key pairs for A: on-accent on accent 17.23 (light) and 15.05 (dark); white on the red ticket 6.54 (light) and 4.96 (dark); ink-3 on surface 6.29 (light) and 6.51 (dark).

Decorative tokens (rule, pending, chaos tints, card, calm-tile, merged-glow) carry no information and are exempt. Rules are never the only boundary of a control, and the pending light always sits beside a text status.

The full table (every pair, both modes, all directions) is reproduced by running the script. A copy as of this draft is below.

<details>
<summary>Full contrast output</summary>

Output of `python3 scripts/check-contrast.py` on 2026-10-27.

### A. Workbench (recommended)

| Mode | Foreground | Background | FG | BG | Ratio | Needs | Pass |
|---|---|---|---|---|---|---|---|
| light | ink | surface | `#1C1814` | `#FFFCF6` | 17.23 | 4.5 | yes |
| light | ink-2 | surface | `#4A4238` | `#FFFCF6` | 9.64 | 4.5 | yes |
| light | ink-3 | surface | `#675D51` | `#FFFCF6` | 6.29 | 4.5 | yes |
| light | ink | surface-2 | `#1C1814` | `#F8F1E5` | 15.72 | 4.5 | yes |
| light | ink-2 | surface-2 | `#4A4238` | `#F8F1E5` | 8.79 | 4.5 | yes |
| light | ink-3 | surface-2 | `#675D51` | `#F8F1E5` | 5.74 | 4.5 | yes |
| light | link | surface | `#94330F` | `#FFFCF6` | 7.49 | 4.5 | yes |
| light | bug-text | surface | `#A2241C` | `#FFFCF6` | 7.31 | 4.5 | yes |
| light | merged-text | surface | `#17683F` | `#FFFCF6` | 6.64 | 4.5 | yes |
| light | on-accent | accent | `#FFFCF6` | `#1C1814` | 17.23 | 4.5 | yes |
| light | on-bug | bug | `#FFFFFF` | `#B3261E` | 6.54 | 4.5 | yes |
| light | bug | surface | `#B3261E` | `#FFFCF6` | 6.38 | 3.0 | yes |
| light | merged | surface | `#1C7A4B` | `#FFFCF6` | 5.21 | 3.0 | yes |
| light | verifier | surface | `#3A57A0` | `#FFFCF6` | 6.72 | 3.0 | yes |
| light | focus | surface | `#94330F` | `#FFFCF6` | 7.49 | 3.0 | yes |
| light | accent | surface | `#1C1814` | `#FFFCF6` | 17.23 | 3.0 | yes |
| light | ink | backdrop shift (worst at t=1.0) | `#1C1814` | `#E3EAED` | 14.50 | 4.5 | yes |
| light | ink-2 | backdrop shift (worst at t=1.0) | `#4A4238` | `#E3EAED` | 8.11 | 4.5 | yes |
| light | ink-3 | backdrop shift (worst at t=1.0) | `#675D51` | `#E3EAED` | 5.29 | 4.5 | yes |
| light | link | backdrop shift (worst at t=1.0) | `#94330F` | `#E3EAED` | 6.30 | 4.5 | yes |
| light | bug-text | backdrop shift (worst at t=1.0) | `#A2241C` | `#E3EAED` | 6.15 | 4.5 | yes |
| light | bug | backdrop shift (worst at t=1.0) | `#B3261E` | `#E3EAED` | 5.37 | 3.0 | yes |
| light | merged | backdrop shift (worst at t=1.0) | `#1C7A4B` | `#E3EAED` | 4.39 | 3.0 | yes |
| light | focus | backdrop shift (worst at t=1.0) | `#94330F` | `#E3EAED` | 6.30 | 3.0 | yes |
| light | accent | backdrop shift (worst at t=1.0) | `#1C1814` | `#E3EAED` | 14.50 | 3.0 | yes |
| light | track | backdrop shift (worst at t=1.0) | `#3A332B` | `#E3EAED` | 10.22 | 3.0 | yes |
| dark | ink | surface | `#F2EBDF` | `#231E19` | 13.94 | 4.5 | yes |
| dark | ink-2 | surface | `#D3C8B7` | `#231E19` | 10.00 | 4.5 | yes |
| dark | ink-3 | surface | `#ADA190` | `#231E19` | 6.51 | 4.5 | yes |
| dark | ink | surface-2 | `#F2EBDF` | `#2B251F` | 12.78 | 4.5 | yes |
| dark | ink-2 | surface-2 | `#D3C8B7` | `#2B251F` | 9.17 | 4.5 | yes |
| dark | ink-3 | surface-2 | `#ADA190` | `#2B251F` | 5.97 | 4.5 | yes |
| dark | link | surface | `#F2A578` | `#231E19` | 8.20 | 4.5 | yes |
| dark | bug-text | surface | `#FF8B7B` | `#231E19` | 7.26 | 4.5 | yes |
| dark | merged-text | surface | `#6FD8A0` | `#231E19` | 9.44 | 4.5 | yes |
| dark | on-accent | accent | `#1B1712` | `#F2EBDF` | 15.05 | 4.5 | yes |
| dark | on-bug | bug | `#FFFFFF` | `#CC3B2F` | 4.96 | 4.5 | yes |
| dark | bug | surface | `#CC3B2F` | `#231E19` | 3.33 | 3.0 | yes |
| dark | merged | surface | `#45C485` | `#231E19` | 7.46 | 3.0 | yes |
| dark | verifier | surface | `#93AEF3` | `#231E19` | 7.54 | 3.0 | yes |
| dark | focus | surface | `#F2A578` | `#231E19` | 8.20 | 3.0 | yes |
| dark | accent | surface | `#F2EBDF` | `#231E19` | 13.94 | 3.0 | yes |
| dark | ink | backdrop shift (worst at t=0.0) | `#F2EBDF` | `#1B1712` | 15.05 | 4.5 | yes |
| dark | ink-2 | backdrop shift (worst at t=0.0) | `#D3C8B7` | `#1B1712` | 10.79 | 4.5 | yes |
| dark | ink-3 | backdrop shift (worst at t=0.0) | `#ADA190` | `#1B1712` | 7.03 | 4.5 | yes |
| dark | link | backdrop shift (worst at t=0.0) | `#F2A578` | `#1B1712` | 8.85 | 4.5 | yes |
| dark | bug-text | backdrop shift (worst at t=0.0) | `#FF8B7B` | `#1B1712` | 7.84 | 4.5 | yes |
| dark | bug | backdrop shift (worst at t=0.0) | `#CC3B2F` | `#1B1712` | 3.59 | 3.0 | yes |
| dark | merged | backdrop shift (worst at t=0.0) | `#45C485` | `#1B1712` | 8.05 | 3.0 | yes |
| dark | focus | backdrop shift (worst at t=0.0) | `#F2A578` | `#1B1712` | 8.85 | 3.0 | yes |
| dark | accent | backdrop shift (worst at t=0.0) | `#F2EBDF` | `#1B1712` | 15.05 | 3.0 | yes |
| dark | track | backdrop shift (worst at t=0.0) | `#C9BEAD` | `#1B1712` | 9.72 | 3.0 | yes |

### B. Signal

| Mode | Foreground | Background | FG | BG | Ratio | Needs | Pass |
|---|---|---|---|---|---|---|---|
| light | ink | surface | `#121417` | `#FFFFFF` | 18.45 | 4.5 | yes |
| light | ink-2 | surface | `#383D44` | `#FFFFFF` | 10.94 | 4.5 | yes |
| light | ink-3 | surface | `#545A63` | `#FFFFFF` | 6.95 | 4.5 | yes |
| light | ink | surface-2 | `#121417` | `#F3F1EC` | 16.35 | 4.5 | yes |
| light | ink-2 | surface-2 | `#383D44` | `#F3F1EC` | 9.69 | 4.5 | yes |
| light | ink-3 | surface-2 | `#545A63` | `#F3F1EC` | 6.16 | 4.5 | yes |
| light | link | surface | `#0F5557` | `#FFFFFF` | 8.55 | 4.5 | yes |
| light | bug-text | surface | `#AE2618` | `#FFFFFF` | 6.80 | 4.5 | yes |
| light | merged-text | surface | `#0B6A3A` | `#FFFFFF` | 6.69 | 4.5 | yes |
| light | on-accent | accent | `#FFFFFF` | `#0F4C4E` | 9.70 | 4.5 | yes |
| light | on-bug | bug | `#FFFFFF` | `#C42B1C` | 5.66 | 4.5 | yes |
| light | bug | surface | `#C42B1C` | `#FFFFFF` | 5.66 | 3.0 | yes |
| light | merged | surface | `#0E7A43` | `#FFFFFF` | 5.41 | 3.0 | yes |
| light | verifier | surface | `#1F5FAD` | `#FFFFFF` | 6.37 | 3.0 | yes |
| light | focus | surface | `#0F4C4E` | `#FFFFFF` | 9.70 | 3.0 | yes |
| light | accent | surface | `#0F4C4E` | `#FFFFFF` | 9.70 | 3.0 | yes |
| light | on-band | band | `#FFFFFF` | `#121417` | 18.45 | 4.5 | yes |
| light | ink | backdrop shift (worst at t=1.0) | `#121417` | `#DDE4E7` | 14.34 | 4.5 | yes |
| light | ink-2 | backdrop shift (worst at t=1.0) | `#383D44` | `#DDE4E7` | 8.51 | 4.5 | yes |
| light | ink-3 | backdrop shift (worst at t=1.0) | `#545A63` | `#DDE4E7` | 5.41 | 4.5 | yes |
| light | link | backdrop shift (worst at t=1.0) | `#0F5557` | `#DDE4E7` | 6.64 | 4.5 | yes |
| light | bug-text | backdrop shift (worst at t=1.0) | `#AE2618` | `#DDE4E7` | 5.28 | 4.5 | yes |
| light | bug | backdrop shift (worst at t=1.0) | `#C42B1C` | `#DDE4E7` | 4.40 | 3.0 | yes |
| light | merged | backdrop shift (worst at t=1.0) | `#0E7A43` | `#DDE4E7` | 4.20 | 3.0 | yes |
| light | focus | backdrop shift (worst at t=1.0) | `#0F4C4E` | `#DDE4E7` | 7.54 | 3.0 | yes |
| light | accent | backdrop shift (worst at t=1.0) | `#0F4C4E` | `#DDE4E7` | 7.54 | 3.0 | yes |
| light | track | backdrop shift (worst at t=1.0) | `#2B2F35` | `#DDE4E7` | 10.46 | 3.0 | yes |
| dark | ink | surface | `#F1F0EC` | `#1B1D20` | 14.81 | 4.5 | yes |
| dark | ink-2 | surface | `#C9CCD1` | `#1B1D20` | 10.49 | 4.5 | yes |
| dark | ink-3 | surface | `#A0A6AE` | `#1B1D20` | 6.89 | 4.5 | yes |
| dark | ink | surface-2 | `#F1F0EC` | `#24272B` | 13.15 | 4.5 | yes |
| dark | ink-2 | surface-2 | `#C9CCD1` | `#24272B` | 9.31 | 4.5 | yes |
| dark | ink-3 | surface-2 | `#A0A6AE` | `#24272B` | 6.11 | 4.5 | yes |
| dark | link | surface | `#6FD0CB` | `#1B1D20` | 9.30 | 4.5 | yes |
| dark | bug-text | surface | `#FF8073` | `#1B1D20` | 6.91 | 4.5 | yes |
| dark | merged-text | surface | `#5BE39A` | `#1B1D20` | 10.38 | 4.5 | yes |
| dark | on-accent | accent | `#0A1516` | `#6FD0CB` | 10.21 | 4.5 | yes |
| dark | on-bug | bug | `#FFFFFF` | `#CC3324` | 5.16 | 4.5 | yes |
| dark | bug | surface | `#CC3324` | `#1B1D20` | 3.27 | 3.0 | yes |
| dark | merged | surface | `#34D27F` | `#1B1D20` | 8.58 | 3.0 | yes |
| dark | verifier | surface | `#86B4FF` | `#1B1D20` | 8.03 | 3.0 | yes |
| dark | focus | surface | `#6FD0CB` | `#1B1D20` | 9.30 | 3.0 | yes |
| dark | accent | surface | `#6FD0CB` | `#1B1D20` | 9.30 | 3.0 | yes |
| dark | on-band | band | `#F1F0EC` | `#08090A` | 17.48 | 4.5 | yes |
| dark | ink | backdrop shift (worst at t=0.0) | `#F1F0EC` | `#17140F` | 16.11 | 4.5 | yes |
| dark | ink-2 | backdrop shift (worst at t=0.0) | `#C9CCD1` | `#17140F` | 11.41 | 4.5 | yes |
| dark | ink-3 | backdrop shift (worst at t=0.0) | `#A0A6AE` | `#17140F` | 7.49 | 4.5 | yes |
| dark | link | backdrop shift (worst at t=0.0) | `#6FD0CB` | `#17140F` | 10.11 | 4.5 | yes |
| dark | bug-text | backdrop shift (worst at t=0.0) | `#FF8073` | `#17140F` | 7.51 | 4.5 | yes |
| dark | bug | backdrop shift (worst at t=0.0) | `#CC3324` | `#17140F` | 3.56 | 3.0 | yes |
| dark | merged | backdrop shift (worst at t=0.0) | `#34D27F` | `#17140F` | 9.33 | 3.0 | yes |
| dark | focus | backdrop shift (worst at t=0.0) | `#6FD0CB` | `#17140F` | 10.11 | 3.0 | yes |
| dark | accent | backdrop shift (worst at t=0.0) | `#6FD0CB` | `#17140F` | 10.11 | 3.0 | yes |
| dark | track | backdrop shift (worst at t=0.0) | `#C9CCD1` | `#17140F` | 11.41 | 3.0 | yes |

### C. Drafting

| Mode | Foreground | Background | FG | BG | Ratio | Needs | Pass |
|---|---|---|---|---|---|---|---|
| light | ink | surface | `#0D1B2A` | `#FFFFFF` | 17.39 | 4.5 | yes |
| light | ink-2 | surface | `#33465C` | `#FFFFFF` | 9.67 | 4.5 | yes |
| light | ink-3 | surface | `#4F6276` | `#FFFFFF` | 6.29 | 4.5 | yes |
| light | ink | surface-2 | `#0D1B2A` | `#F6F8FA` | 16.34 | 4.5 | yes |
| light | ink-2 | surface-2 | `#33465C` | `#F6F8FA` | 9.08 | 4.5 | yes |
| light | ink-3 | surface-2 | `#4F6276` | `#F6F8FA` | 5.90 | 4.5 | yes |
| light | link | surface | `#17587A` | `#FFFFFF` | 7.74 | 4.5 | yes |
| light | bug-text | surface | `#AD3324` | `#FFFFFF` | 6.41 | 4.5 | yes |
| light | merged-text | surface | `#0E6E4F` | `#FFFFFF` | 6.25 | 4.5 | yes |
| light | on-accent | accent | `#FFFFFF` | `#17587A` | 7.74 | 4.5 | yes |
| light | on-bug | bug | `#FFFFFF` | `#BF3A2B` | 5.45 | 4.5 | yes |
| light | bug | surface | `#BF3A2B` | `#FFFFFF` | 5.45 | 3.0 | yes |
| light | merged | surface | `#12805C` | `#FFFFFF` | 4.92 | 3.0 | yes |
| light | verifier | surface | `#9A5208` | `#FFFFFF` | 5.86 | 3.0 | yes |
| light | focus | surface | `#17587A` | `#FFFFFF` | 7.74 | 3.0 | yes |
| light | accent | surface | `#17587A` | `#FFFFFF` | 7.74 | 3.0 | yes |
| light | ink | backdrop shift (worst at t=0.0) | `#0D1B2A` | `#F6ECE0` | 14.90 | 4.5 | yes |
| light | ink-2 | backdrop shift (worst at t=0.0) | `#33465C` | `#F6ECE0` | 8.29 | 4.5 | yes |
| light | ink-3 | backdrop shift (worst at t=0.0) | `#4F6276` | `#F6ECE0` | 5.39 | 4.5 | yes |
| light | link | backdrop shift (worst at t=0.0) | `#17587A` | `#F6ECE0` | 6.63 | 4.5 | yes |
| light | bug-text | backdrop shift (worst at t=0.0) | `#AD3324` | `#F6ECE0` | 5.49 | 4.5 | yes |
| light | bug | backdrop shift (worst at t=0.0) | `#BF3A2B` | `#F6ECE0` | 4.67 | 3.0 | yes |
| light | merged | backdrop shift (worst at t=0.0) | `#12805C` | `#F6ECE0` | 4.22 | 3.0 | yes |
| light | focus | backdrop shift (worst at t=0.0) | `#17587A` | `#F6ECE0` | 6.63 | 3.0 | yes |
| light | accent | backdrop shift (worst at t=0.0) | `#17587A` | `#F6ECE0` | 6.63 | 3.0 | yes |
| light | track | backdrop shift (worst at t=0.0) | `#33465C` | `#F6ECE0` | 8.29 | 3.0 | yes |
| dark | ink | surface | `#EAF0F6` | `#161D25` | 14.79 | 4.5 | yes |
| dark | ink-2 | surface | `#BFCBD8` | `#161D25` | 10.31 | 4.5 | yes |
| dark | ink-3 | surface | `#97A7B8` | `#161D25` | 6.90 | 4.5 | yes |
| dark | ink | surface-2 | `#EAF0F6` | `#1D2631` | 13.32 | 4.5 | yes |
| dark | ink-2 | surface-2 | `#BFCBD8` | `#1D2631` | 9.28 | 4.5 | yes |
| dark | ink-3 | surface-2 | `#97A7B8` | `#1D2631` | 6.21 | 4.5 | yes |
| dark | link | surface | `#86CBEA` | `#161D25` | 9.50 | 4.5 | yes |
| dark | bug-text | surface | `#FF8A7A` | `#161D25` | 7.41 | 4.5 | yes |
| dark | merged-text | surface | `#63DCAD` | `#161D25` | 10.00 | 4.5 | yes |
| dark | on-accent | accent | `#0D1B2A` | `#86CBEA` | 9.73 | 4.5 | yes |
| dark | on-bug | bug | `#FFFFFF` | `#BF3A2B` | 5.45 | 4.5 | yes |
| dark | bug | surface | `#BF3A2B` | `#161D25` | 3.12 | 3.0 | yes |
| dark | merged | surface | `#3CCB95` | `#161D25` | 8.22 | 3.0 | yes |
| dark | verifier | surface | `#E9A75C` | `#161D25` | 8.21 | 3.0 | yes |
| dark | focus | surface | `#86CBEA` | `#161D25` | 9.50 | 3.0 | yes |
| dark | accent | surface | `#86CBEA` | `#161D25` | 9.50 | 3.0 | yes |
| dark | ink | backdrop shift (worst at t=0.0) | `#EAF0F6` | `#1A1612` | 15.67 | 4.5 | yes |
| dark | ink-2 | backdrop shift (worst at t=0.0) | `#BFCBD8` | `#1A1612` | 10.92 | 4.5 | yes |
| dark | ink-3 | backdrop shift (worst at t=0.0) | `#97A7B8` | `#1A1612` | 7.31 | 4.5 | yes |
| dark | link | backdrop shift (worst at t=0.0) | `#86CBEA` | `#1A1612` | 10.06 | 4.5 | yes |
| dark | bug-text | backdrop shift (worst at t=0.0) | `#FF8A7A` | `#1A1612` | 7.85 | 4.5 | yes |
| dark | bug | backdrop shift (worst at t=0.0) | `#BF3A2B` | `#1A1612` | 3.30 | 3.0 | yes |
| dark | merged | backdrop shift (worst at t=0.0) | `#3CCB95` | `#1A1612` | 8.71 | 3.0 | yes |
| dark | focus | backdrop shift (worst at t=0.0) | `#86CBEA` | `#1A1612` | 10.06 | 3.0 | yes |
| dark | accent | backdrop shift (worst at t=0.0) | `#86CBEA` | `#1A1612` | 10.06 | 3.0 | yes |
| dark | track | backdrop shift (worst at t=0.0) | `#97A7B8` | `#1A1612` | 7.31 | 3.0 | yes |

### Shared placeholder callout

| Mode | Foreground | Background | FG | BG | Ratio | Needs | Pass |
|---|---|---|---|---|---|---|---|
| both | needed-ink | needed-bg | `#111111` | `#FFD60A` | 13.38 | 4.5 | yes |

Failures: 0

</details>

## Decisions needed from Travis

1. Pick a direction (recommended: A, Workbench). A mix is fine, for example A with B's colored proof rules.
2. Confirm a serif display face is OK for how you want to come across. If you want something more neutral, C's type with A's palette is the fallback.
3. Confirm light-first. Every direction respects the visitor's preference; this only decides which mode the design is tuned for first.
