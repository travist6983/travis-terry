# Story validation

**Status:** Phase 2 draft for Travis to review. Phase 3 (STORYBOARD.md) waits for approval.
**Date:** 2026-10-27
**Recommended story:** The Ticket.
**Inputs:** private/BUILD_PROMPT.md (DRAFT STATE MAP, HARD RULES), private/DECISIONS.md (Q4 to Q8, Q12 to Q17 override the brief), docs/RESEARCH.md section 4, content/content.json, private/CONFIDENTIALITY_AUDIT.md, docs/BRAND.md.

Companion previews: `private/previews/index.html` (hero mocks), `private/previews/illustration-styles.html` (the sketches in section 3).

## 1. Story options

### 1.1 The Ticket (recommended, fully developed)

**Premise.** One generic ticket is born at the top of the page as a red bug in a cluttered backlog column. As the visitor scrolls, it travels one continuous track down the page and passes a station for each step of the loop Travis built: reproduce, fix, verify, regression, review, opened PR. The page cools from busy and warm to calm and cool. At the bottom the PR merges, its status light turns green, and the glow lands on the contact buttons under the heading "Ready for review." Career history lives along the track as a commit log.

**Why it works for each reader**

| Reader | What they need (docs/RESEARCH.md section 3) | How The Ticket serves it |
|---|---|---|
| Recruiter, about 10 seconds | Name, title, three numbers, a way to contact | All of it is real HTML text in the first viewport, before any motion. The ticket is beside the text, never in front of it. The mobile sticky bar keeps Email, LinkedIn, and Resume PDF one tap away. |
| Hiring manager, about 60 seconds | Proof of results and judgment | The "60-second version" link is in the hero. The ticket parks beside that section as a small panel and waits, so the summary reads with zero motion. |
| Interviewing engineer, 5+ minutes | Depth: how the system worked, safety, tradeoffs | Each station is a section with real text at resume level. The motion is a diagram of the same loop, so reading and watching say the same thing. |

**Why it is the right metaphor.** The resume's strongest line is a loop that "take[s] a Jira ticket through reproduction, fix, independent verification, regression, review, and an opened pull request" (resume L21). The ticket is that sentence, drawn. Nothing about the story has to be invented to make the motion work.

**What the motion is not allowed to do.** Gate content, start text hidden, loop forever, or carry a fact that is not also in the text (HARD RULES 5 and 6).

**Engine summary** (detail in docs/RESEARCH.md 4.1 and 4.5)
- The ticket is one fixed, `aria-hidden` element held in the viewport. The track is one SVG in document flow, so scrolling moves the track under the ticket (United Carriers technique 1).
- **No MotionPathPlugin** (DECISIONS Q13). The track path is sampled once with native `getTotalLength()` and `getPointAtLength()` into a `Float32Array` lookup table sorted by y, on load and on a debounced resize. Each frame does a binary search on the table for the x at the focus line (about 45% down the viewport) and writes `transform` through `gsap.quickSetter`. No layout reads during scroll. The card never rotates to the path; it tilts a few degrees toward the slope, clamped and smoothed, so it stays readable.
- State changes happen at station boundaries as `data-state` toggles on the ticket (small element, 200ms), never per-frame color interpolation.

### 1.2 The Commit Graph (alternative)

**Premise.** Career as branching git history. Each employer is a branch; promotions are commits; independent projects branch off and merge back; everything merges into "now" at the contact section.

- **For:** engineers recognize it instantly; it handles overlapping timelines and the promotion stack well.
- **Against:**
  - It is the visual language of GitHub's network graph, which HARD RULE 4 asks us to avoid, and it invites commit hashes, which the confidentiality treatments forbid (T2).
  - Drawing independent projects as branches off the Atlas UP period puts a spotlight on work done during that employment, which is still a held item (CONFIDENTIALITY_AUDIT F14).
  - A "merge" between EOS Worldwide and Atlas UP would draw the acquisition as an event, which goes beyond resume L20.
  - No single hero object. The brief's signature (one object, one track) is lost; there are many lines and no protagonist.
  - Weak for recruiters: a graph needs decoding, and the strongest proof (the pipeline results) has no natural place on it.

### 1.3 The Control Room (alternative)

**Premise.** A dashboard that comes online section by section: panels power up, gauges settle, and the last panel turns green beside the contact CTA.

- **For:** dramatic; each section has an obvious "panel" frame; easy to make feel technical.
- **Against:**
  - The brief bans showing "metrics dashboards" from Atlas UP. A dashboard metaphor invites exactly that look, and gauges invite numbers. Every gauge would either be decorative (and read as fake data) or carry a number that is not in HEADLINE_PROOF.
  - It overlaps the dark, glowing aesthetic of Linear and Cerebrium and a long list of observability vendors.
  - It has no journey. Panels light up in place, so the United Carriers technique (one object traveling the page) does not apply.
  - "Control room" suggests operations and monitoring, not building, which is not what the target roles are about.

### 1.4 Recommendation

**The Ticket.** It is the only option that draws the resume's main claim directly, has one hero object, keeps every number inside HEADLINE_PROOF, and stays clear of vendor UI. The two alternatives each fail a hard rule in their natural form (Commit Graph: GitHub likeness and hashes; Control Room: dashboards and invented gauges).

## 2. The ticket's states, top to bottom

Updated from the DRAFT STATE MAP with DECISIONS Q4 to Q8 and Q13 to Q16. Status words on the ticket are generic interface labels, not claims. Every row works with motion off: the static layout shows each state's end frame next to its section.

| # | Section | Ticket state and status word | Track | What the text carries | Static and kill switch fallback |
|---|---|---|---|---|---|
| 1 | Hero | Red stub, chip "bug", hollow status light. Sits tilted out of a cluttered backlog column of abstract cards. Lifts onto the track over about the first viewport of scroll. | Starts at the ticket and leaves the column, dotted (not yet traveled) | Name, title line, value line, three proof numbers, CTAs, 60-second version link | Ticket sits still in the column, red, no entry animation |
| 2 | 60-Second Version | **Parks as a small detail panel beside the section** (DECISIONS Q14). Panel shows the status word "triaged", the Illustration tag, and six empty step pips that preview the pipeline. It sits in the side gutter and never covers the summary. | Track pauses: a short straight run beside the section | The full static summary. Fully readable with zero motion. | Same panel, static |
| 3 | The Pipeline | Travels the six stations. A **sticky six-stage index** (DECISIONS Q15) sits beside the stage panels: an `<ol>` of real anchor links (Reproduce, Fix, Verify, Regression, Review, Opened PR), with `aria-current="step"` and a filled marker as well as color on the active stage. | One station per step; the traveled segment turns solid | Station text, see 2.1 | Stations stacked, each with its end-frame vignette; the index is still sticky (state, not motion) |
| 4 | The Safety Model | Status "PR open" with a pending light. Passes through a gate. | **Every lane passes the same gate** (DECISIONS Q7): the ticket loop, the PR review lane, and the release regression lane all run through it. A "billing / auth" lane stops at a human-approval checkpoint. A single retry meter fills to a cap line with no numbers or tier count. The kill switch is drawn here and is the real control. | Approval gates, risk-tiered retries, verifier agent, global kill switch | Gate drawn in its end state |
| 5 | MCP Server | Not on this track. The ticket waits at a siding while a separate **question** token goes through a classifier node and is routed to one tool lane. A "delete: in the app only" lane is fenced off. | Branches into tool lanes and rejoins | Core contributor on the team that built it; the classifier is something Travis "helped build" (DECISIONS Q8) | Routing drawn in its end state |
| 6 | Platform and Leadership | Ticket continues through a calm grid of abstract component tiles. Small unlabeled markers join the track behind it for team adoption. Marker count never equals 3, 5, 9, or 35. | Straight, calm | Vue platform, monorepo, component library, design tokens, mentoring, AI adoption | Grid and markers static |
| 7 | Independent Work | Ticket stays on the main line. Two side tracks branch to FoundrKids (status "pre-launch") and Pocket Chronicle (status "shipped, then retired") and rejoin. | Two short branches | Case study cards | Branches static |
| 8 | Career Log | Ticket rides a straight vertical commit line. Each role is a commit dot with date range and title. Older commits use ink-2 and ink-3, never opacity on text. No hashes. | Becomes the commit line | Roles, dates, highlights | Identical |
| 9 | Ask My Resume | Ticket holds beside a terminal-styled panel (site tokens, not any vendor's terminal look). | Pauses | Classifier Q&A, "No live AI model runs here." | Identical |
| 10 | Recommendations | Off by default (flag). If on, signed-commit style quotes as real HTML text. | Pauses | Quotes | Identical |
| 11 | Contact | **Signature moment.** The ticket hands off to a real in-flow PR card beside the CTAs. Checks pass, the status light turns green, the card reads "Merged. All checks passed.", and the glow lands on the CTAs under "Ready for review." See section 5. | Ends at the card | Contact links, booking placeholder until Cal.com exists | Merged, green card and static glow beside the CTAs |
| 12 | Footer | None | None | curl easter egg, how this site was built, privacy, accessibility | Identical |

### 2.1 The six pipeline stations

| Station | Ticket state | Vignette (plays once, then holds its end frame) | Text (resume level) |
|---|---|---|---|
| Reproduce | "reproduced" | A small abstract screen flickers through three generic frames. No app UI, no EOS One likeness. | The loop started by reproducing the ticket (L21). |
| Fix | "fix ready" | The status chip swaps layer. | Next, the loop made the fix (L21). |
| Verify | "verified" | A second marker in the verifier hue slides in with a "fresh context" badge; a check draws by `stroke-dashoffset`. | A separate agent, not the one that wrote the fix, verified every fix with fresh context (L24). |
| Regression | "regression passed" | A fan of small unlabeled test pips checks off. **No number on this station.** | The change then ran through regression (L21). |
| *Release lane callout* | (not the ticket) | **A distinct lane beside the track**, drawn in a different line style and labeled "Release regression lane". Two bars labeled "about a week" and "8 to 10 hours", no axis or scale (DECISIONS Q16), marked illustrative. The ticket does not enter it. | At the release level, I built an AI regression lane... cut a full regression cycle from about a week to 8 to 10 hours (L26). Per DECISIONS Q5 this number belongs to the release lane, not the per-ticket station. |
| Review | "reviewed" | Generic "high", "medium", "low" rows appear one at a time, severity-ranked. | **The review step was the PR review agent** (DECISIONS Q4): it posted severity-ranked findings and encoded team standards (L25). |
| Opened PR | "PR open" | The ticket transforms into a PR card with abstract before and after thumbnails (shapes, never video or app images). | The loop ended with an opened pull request that included before and after videos (L21). |

Mobile (HARD RULE 8): a vertical rail at the left edge carries the ticket as a small chip that shows state by color and an icon. Below the sticky-scene breakpoint, the six-stage index becomes a compact sticky strip of six pips and the current stage name under the header (a decision for Travis, see section 7).

## 3. Illustration styles

The same moment in three styles: the ticket on the track, arriving at Verify, with the verifier marker and its "fresh context" badge. Colors are Direction A's light values so the comparison is about line and form, not palette. The same sketches are in `private/previews/illustration-styles.html` and as files in `private/previews/svg/`.

**Style 1, Ink line** (pairs with Direction A). Monoline 2px strokes, round caps, flat fills only where state lives. Traveled track solid, track ahead dotted.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 220" width="520" height="220" role="img" aria-label="Style 1, ink line: a red ticket stub on a monoline track approaching the Verify station, where a blue verifier marker with a fresh context badge waits."><rect width="520" height="220" fill="#F3EADB"/><path d="M20 170 C 140 170, 180 120, 300 120 S 460 170, 510 170" fill="none" stroke="#3A332B" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 7"/><path d="M20 170 C 120 170, 160 140, 200 128" fill="none" stroke="#3A332B" stroke-width="2.5" stroke-linecap="round"/><path d="M46 52H184A6 6 0 0 1 190 58V82.0A7 7 0 0 0 190 96.0V120A6 6 0 0 1 184 126H46A6 6 0 0 1 40 120V96.0A7 7 0 0 0 40 82.0V58A6 6 0 0 1 46 52Z" fill="#B3261E" stroke="#3A332B" stroke-width="2" stroke-linejoin="round"/><rect x="56" y="64" width="34" height="18" rx="9" fill="none" stroke="#FFFFFF" stroke-width="1.5"/><text x="73" y="77" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11" fill="#FFFFFF">bug</text><path d="M58 96H170M58 108H130" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/><circle cx="176" cy="73" r="5" fill="none" stroke="#FFFFFF" stroke-width="2"/><circle cx="330" cy="121" r="26" fill="#FFFCF6" stroke="#3A332B" stroke-width="2"/><path d="M318 121l8 8 16-16" fill="none" stroke="#3A332B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><text x="330" y="172" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="12" fill="#4A4238">Verify</text><circle cx="392" cy="78" r="13" fill="#3A57A0"/><circle cx="392" cy="78" r="5" fill="none" stroke="#FFFFFF" stroke-width="2"/><path d="M381 89 L352 108" stroke="#3A57A0" stroke-width="2" stroke-linecap="round"/><rect x="410" y="66" width="96" height="24" rx="12" fill="#FFFCF6" stroke="#3A57A0" stroke-width="1.5"/><text x="458" y="82" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11" fill="#3A57A0">fresh context</text><circle cx="480" cy="170" r="7" fill="#8A7E6E"/><text x="20" y="206" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11" fill="#4A4238">Illustration</text></svg>

**Style 2, Enamel signage** (pairs with Direction B). Solid blocks, 4px outlines, square ends. The track is a double rail with ties; the traveled part takes the ticket's color. Stations are sign plates.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 220" width="520" height="220" role="img" aria-label="Style 2, enamel signage: a solid red ticket on a double rail with ties, a square Verify sign plate, and a blue verifier block with a fresh context tag."><rect width="520" height="220" fill="#E9E4DA"/><path d="M28 158V184" stroke="#3A332B" stroke-width="5"/><path d="M50 158V184" stroke="#3A332B" stroke-width="5"/><path d="M72 158V184" stroke="#3A332B" stroke-width="5"/><path d="M94 158V184" stroke="#3A332B" stroke-width="5"/><path d="M116 158V184" stroke="#3A332B" stroke-width="5"/><path d="M138 158V184" stroke="#3A332B" stroke-width="5"/><path d="M160 158V184" stroke="#3A332B" stroke-width="5"/><path d="M182 158V184" stroke="#3A332B" stroke-width="5"/><path d="M204 158V184" stroke="#3A332B" stroke-width="5"/><path d="M226 158V184" stroke="#3A332B" stroke-width="5"/><path d="M248 158V184" stroke="#3A332B" stroke-width="5"/><path d="M270 158V184" stroke="#3A332B" stroke-width="5"/><path d="M292 158V184" stroke="#3A332B" stroke-width="5"/><path d="M314 158V184" stroke="#3A332B" stroke-width="5"/><path d="M336 158V184" stroke="#3A332B" stroke-width="5"/><path d="M358 158V184" stroke="#3A332B" stroke-width="5"/><path d="M380 158V184" stroke="#3A332B" stroke-width="5"/><path d="M402 158V184" stroke="#3A332B" stroke-width="5"/><path d="M424 158V184" stroke="#3A332B" stroke-width="5"/><path d="M446 158V184" stroke="#3A332B" stroke-width="5"/><path d="M468 158V184" stroke="#3A332B" stroke-width="5"/><path d="M490 158V184" stroke="#3A332B" stroke-width="5"/><path d="M10 162H515M10 180H515" stroke="#3A332B" stroke-width="4"/><path d="M10 162H210M10 180H210" stroke="#B3261E" stroke-width="4"/><path d="M43 48H193A3 3 0 0 1 196 51V80.0A8 8 0 0 0 196 96.0V125A3 3 0 0 1 193 128H43A3 3 0 0 1 40 125V96.0A8 8 0 0 0 40 80.0V51A3 3 0 0 1 43 48Z" fill="#B3261E" stroke="#121417" stroke-width="4" stroke-linejoin="round"/><rect x="58" y="62" width="40" height="20" fill="#FFFFFF"/><text x="78" y="77" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="12" font-weight="700" fill="#B3261E">bug</text><rect x="58" y="94" width="112" height="7" fill="#FFFFFF" fill-opacity=".7"/><rect x="58" y="108" width="74" height="7" fill="#FFFFFF" fill-opacity=".7"/><rect x="296" y="40" width="80" height="80" fill="#FFFFFF" stroke="#121417" stroke-width="4"/><rect x="296" y="40" width="80" height="18" fill="#121417"/><text x="336" y="54" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11" font-weight="700" fill="#FFFFFF">VERIFY</text><path d="M318 90l10 10 22-22" fill="none" stroke="#121417" stroke-width="6" stroke-linecap="square"/><path d="M336 120V162" stroke="#121417" stroke-width="4"/><rect x="396" y="56" width="30" height="30" fill="#3A57A0" stroke="#121417" stroke-width="3"/><rect x="430" y="60" width="86" height="22" fill="#FFFFFF" stroke="#3A57A0" stroke-width="3"/><text x="473" y="75" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="8.5" font-weight="700" fill="#3A57A0">FRESH CONTEXT</text><rect x="470" y="110" width="18" height="34" rx="9" fill="#121417"/><circle cx="479" cy="119" r="5" fill="#B3261E" opacity=".45"/><circle cx="479" cy="135" r="5" fill="#5f6670"/><text x="10" y="210" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11" fill="#4A4238">Illustration</text></svg>

**Style 3, Drafting hairline** (pairs with Direction C). 1px hairlines on a grid, dashed construction lines, dimension ticks, leader-line callouts. Color is hatched until a state lands.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 220" width="520" height="220" role="img" aria-label="Style 3, drafting hairline: a hatched red ticket on a grid with a dashed construction track, a crosshair Verify station with a leader line, and an ochre verifier marker."><defs><pattern id="grid3" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#33465C" stroke-opacity=".12" stroke-width="1"/></pattern><pattern id="hatch3" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V6" stroke="#BF3A2B" stroke-width="2.2"/></pattern></defs><rect width="520" height="220" fill="#F6ECE0"/><rect width="520" height="220" fill="url(#grid3)"/><path d="M20 160 H200 C 260 160, 260 120, 320 120 H510" fill="none" stroke="#33465C" stroke-width="1" stroke-dasharray="6 4"/><path d="M20 160 H200" fill="none" stroke="#33465C" stroke-width="1.5"/><path d="M40 56H190A0 0 0 0 1 190 56V85.0A7 7 0 0 0 190 99.0V128A0 0 0 0 1 190 128H40A0 0 0 0 1 40 128V99.0A7 7 0 0 0 40 85.0V56A0 0 0 0 1 40 56Z" fill="#FFFFFF" stroke="#BF3A2B" stroke-width="1.5"/><path d="M40 56H190A0 0 0 0 1 190 56V85.0A7 7 0 0 0 190 99.0V128A0 0 0 0 1 190 128H40A0 0 0 0 1 40 128V99.0A7 7 0 0 0 40 85.0V56A0 0 0 0 1 40 56Z" fill="url(#hatch3)" opacity=".9"/><rect x="54" y="66" width="38" height="18" fill="#FFFFFF" stroke="#BF3A2B"/><text x="73" y="79" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11" fill="#AD3324">bug</text><path d="M40 140V148M190 140V148M40 144H190" stroke="#33465C" stroke-width="1"/><text x="115" y="140" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="9" fill="#33465C">not to scale</text><circle cx="340" cy="120" r="18" fill="#FFFFFF" stroke="#0D1B2A" stroke-width="1"/><path d="M340 96V144M316 120H364" stroke="#0D1B2A" stroke-width="1"/><circle cx="340" cy="120" r="5" fill="#12805C"/><path d="M352 106 L392 70 H470" fill="none" stroke="#0D1B2A" stroke-width="1"/><text x="396" y="64" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="12" fill="#0D1B2A">Verify</text><rect x="392" y="80" width="12" height="12" fill="#9A5208" transform="rotate(45 398 86)"/><text x="414" y="91" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11" fill="#9A5208">fresh context</text><text x="20" y="206" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11" fill="#33465C">Illustration</text></svg>

**Recommendation: Style 1, Ink line**, with Direction A. It is the calmest of the three, so the red ticket stays the loudest thing on screen. It is strokes and flat fills, which are cheap to draw, cheap to scrub, and crisp at any size. The dotted-to-solid track makes progress readable without any number. Style 2's rail ties fight the "calm" end of the shift, and style 3's grid and hatching are busy and costly to paint in large areas.

## 4. Conflicts with facts or confidentiality, and the fix

Codes T1 to T9 are the standard treatments in private/CONFIDENTIALITY_AUDIT.md (T1 is the visible label "Illustrative recreation with synthetic data").

| # | Conflict | Source | Fix |
|---|---|---|---|
| C1 | The story ends with the PR **merging**; the resume's loop ends at an **opened** PR. | resume L21; DECISIONS Q6 | Approved as the site's metaphor (Q6). The merged card says only "Merged. All checks passed." plus the Illustration tag. No copy says the Atlas UP loop merged anything or who merged. |
| C2 | The draft map put "about a week to 8 to 10 hours" on the per-ticket Regression station. | DECISIONS Q5; resume L26 | The station shows unlabeled test pips and no number. The figure moves to a separate **release regression lane callout**: its own lane, its own line style, its own label, two bars with no axis. The ticket never enters that lane. The hero proof number stays, because the hero states it as a release-level fact ("for a full regression cycle"), and no visual links that number to the ticket. |
| C3 | The Review station is the PR review agent, but resume L25 says that agent reviewed **open** PRs, while L21 lists review **before** the opened PR. | DECISIONS Q4; resume L21, L25 | Keep the L21 order on the track. Station copy says the review step was done by the PR review agent and that it posted severity-ranked findings. It does not say when the PR was opened relative to the review. **Travis to confirm** the wording (section 7). |
| C4 | content.json still frames the PR review agent as a "Related" aside to the Review station. | content.json `pipeline.stage.review` and its aside; DECISIONS Q4 | Phase 3 content change: fold the aside into the station text and drop the "Related" label. The regression aside becomes the release-lane callout and keeps its own label. |
| C5 | The "roughly 95%" covers bug tickets only. The hero proof label in content.json reads "of tickets accepted". Resume L23 also says "of tickets". | DECISIONS Q35; content.json `hero.proof.2.label` | The mocks use "of bug tickets accepted without being bounced back". Phase 3 content change: update `hero.proof.2.label`. The generated resume.pdf should match (decision for Travis, section 7). |
| C6 | The safety model covered **all** automated actions, not only the ticket loop. A gate drawn only on the ticket's track would understate it. | DECISIONS Q7; resume L6 | Every lane (ticket loop, PR review, release regression) passes through the same gate in the Safety section. The text already says "every automated action ran inside it". |
| C7 | The brief says the Ask classifier "mirrors his MCP classifier design". Travis "helped build" the classifier; the resume says core contributor. | DECISIONS Q8; resume L22 | Site copy uses "the question classifier in the EOS One MCP server I helped build" (already in content.json `ask.classifierLine`). The MCP visual has no "my design" label. |
| C8 | Any picture of the pipeline could be read as a picture of the real Atlas UP system. | HARD RULE 2; T1, T2, T9 | Every pipeline, safety, MCP, and hero backlog visual carries the real-text label "Illustrative recreation with synthetic data" in motion, static, mobile, and print layouts. The ticket and PR card carry the "Illustration" tag at every stage. No IDs, titles, names, avatars, hashes, PR numbers, code, or screenshots. The Reproduce screen and the before and after thumbnails are abstract shapes. |
| C9 | Atlas UP work must stay at resume level. Station vignettes could add mechanism detail (retry counts, tier names, skill names, prompts). | HARD RULE 2; T4, T6, T8 | Station text paraphrases only L21, L22, L24, L25, L26. The retry meter is one continuous bar with a cap line and no numbers or tier count. Adoption markers never number 3, 5, 9, or 35. No skill or tool names beyond the resume's. |
| C10 | Counted moments could use numbers outside HEADLINE_PROOF or drop hedge words mid-animation. | HARD RULE 1; brief Phase 3 | Count-ups only for HEADLINE_PROOF numbers. Hedge words ("about", "roughly") are static text beside the counter and visible at every frame. Ranges ("8 to 10 hours") are not counted. Drawn counts (cards, pips, tiles, markers) are decorative and unlabeled. |
| C11 | The ticket and PR card could resemble Jira or GitHub. | HARD RULE 4; T5 | The ticket is a notched paper stub, not a board card; the status is a round lamp, not a pill; no purple, no diffstat, no type icons (docs/BRAND.md vendor table). "Jira" appears as plain text only, where the resume uses it. |
| C12 | The Ask panel is "terminal-styled" and could resemble the Claude Code terminal. | T5 | Built from site tokens (surface-2, JetBrains Mono, A's ink), no orange accent, no vendor prompt glyph or block cursor. |
| C13 | The Commit Log could imply real commits or draw the acquisition as a merge. | T2; resume L20 | No hashes, only date ranges and titles. The EOS Worldwide to Atlas UP move is shown as the resume states it (L20), not as a merge event. Promotions are commits on the same line. |
| C14 | Independent Work side tracks branch off near the Atlas UP part of the page, which could draw attention to work done during that employment. | CONFIDENTIALITY_AUDIT F14 (held) | The side tracks branch from the main line in the Independent Work section, with no dates on the branch itself, and no case-study text about either product's agent tooling until F14 clears. |
| C15 | Pocket Chronicle is retired and its App Store URL is dead. FoundrKids is pre-launch and has no public link. | DECISIONS Pocket Chronicle row, Q31, Q34, Q59 | Side-track statuses read "shipped, then retired" and "pre-launch". No App Store badge (logo). The old store URL is plain text or omitted. No FoundrKids link at launch. |
| C16 | **content.json now renders the GitHub link** (`person.github` and `contact.github` have text and href, no `confirm`), but CONFIDENTIALITY_AUDIT still lists it as held (F8, F13, F21, F28) pending the Rascal-Marketing cleanup. | CONFIDENTIALITY_AUDIT A43; DECISIONS Extras, Q18 | Not changed in Phase 2. **Travis to confirm** the profile cleanup is done (Q18, Q20) or the link goes back behind a placeholder before any build (section 7). |
| C17 | The site's "Pause motion" control is styled as the kill switch from his safety model. It must not imply it is that system. | HARD RULE 7 | Copy already says "This site has one too." The drawn switch in the Safety section is the site's control, labeled as such. |
| C18 | The resume summary says "six weeks" and "a week" without hedges. | resume L6; DECISIONS Q36 | Site uses the hedged bullet wording everywhere: "about six weeks", "about a week". |

## 5. The signature moment, and how its frame rate is protected

**What happens.** As the focus line reaches the Contact section, the traveling PR card lines up with a real PR card that sits in the page beside the contact buttons, and an opacity swap hands off to it, so only one card is ever visible. Then, once, in about one second:

1. Three check rows tick to passed (one per pipeline concern: verify, regression, review), each by `transform` and `opacity`.
2. The status light turns green: two stacked dots, pending and green, crossfade by `opacity`. No color interpolation.
3. The card's status text reads "Merged. All checks passed."
4. The glow lands on the CTA group under the heading "Ready for review.": a pre-painted radial gradient behind the buttons fades and scales in.

The CTAs and heading are real text and visible from the start. The glow only decorates them.

**Frame-rate protection** (docs/RESEARCH.md 4.5, Risk B)

| Risk | Protection |
|---|---|
| Animating `box-shadow`, `filter`, blur, or a gradient's size every frame | The glow is one element with a static `radial-gradient` painted once. Only its `opacity` and `transform: scale()` animate, which the compositor handles. |
| Measuring layout during the handoff | The in-flow card's rect is measured on load and on a debounced resize, never at the handoff. |
| Two cards visible, double paint | Align by transform first, then a single opacity swap. |
| A fast scroll stalling the sequence halfway | Triggered, not scrubbed: a fixed ~1s timeline runs once when the focus line crosses the card; `onLeaveBack` resets it. |
| Smooth scroll fighting the sequence | Lenis, ScrollTrigger, and the engine share `gsap.ticker` with `lagSmoothing(0)`. One loop. |
| Too many promoted layers | `will-change` is added to the card, dot, and glow about one viewport before Contact and removed when the merge completes. |
| The traveling light | A small dot moved by `transform`, not a mask position. |
| Mobile | Same handoff; the glow is clipped to stay clear of the sticky bottom bar. |
| Reduced motion, kill switch, print, no JS | The merged, green card and the static glow are plain CSS end states. |

**How it will be checked (Phase 5).** Performance panel recordings through Contact at 1440px and 1024px, with Lenis on and off, plus 4x CPU throttle. Target: no frame over 16.7ms during the one-second sequence, and paint flashing shows only the card and the glow layer.

## 6. Optional: a live-LLM Ask My Resume

HARD RULE 11 keeps v1 deterministic. This is the written safety design the brief requires before a live version could even be proposed. **Recommendation: do not build it for launch.**

### 6.1 Safety design (if Travis ever approves it)

- **Shape.** The deterministic classifier always runs first. If it matches an approved answer, that answer is returned and no model is called. The model only sees questions the classifier could not match.
- **Hosting.** GitHub Pages cannot hold a secret, so the model call needs one small serverless endpoint (for example a Cloudflare Worker) that holds the API key. That is a hosting change and needs its own approval.
- **Grounding.** A closed corpus: the approved Ask answers, resume.txt, and approved content.json strings. No web, no tools, no memory between questions. The endpoint sends the model the top few matching approved passages and nothing else.
- **Output contract.** The model must return JSON with an answer of at most about 80 words and the ids of the passages it used. The endpoint rejects the answer, and shows the standard fallback, if: any cited id is unknown; any number in the answer does not appear in a cited passage with its hedge word; any name appears that is not on an allowlist; any term on the private deny-list appears; or the JSON does not parse.
- **Voice.** Third person, labeled: "Summary of Travis's approved answers. May be wrong. Sources shown." It never speaks as Travis.
- **Refusals.** Fixed fallback ("I don't have that here. Email me.") for: Atlas UP or EOS One internals beyond the resume, reasons for leaving, managers or coworkers, compensation, personal life, anything outside the corpus, and any question that tries to change the instructions. Visitor text is passed as data, never as instructions.
- **Rate limits.** At the endpoint: a per-visitor token bucket keyed on a salted, daily-rotated hash of the IP (never stored past 24 hours), for example 5 questions a minute and 20 a day; a global daily ceiling; questions capped at 300 characters.
- **Spend cap.** A hard monthly limit set at the model provider, plus a daily counter at the endpoint that switches the site back to deterministic-only when the day's budget is spent. Short max output tokens and a small, fast model.
- **Kill switch.** One environment flag turns the model path off instantly, consistent with the site's own story.
- **Privacy.** No question text stored by default, no cookies, provider data retention set to the minimum available [CONFIRM: provider retention terms at proposal time]. The privacy note says a third party processes the question.
- **Evaluation before any launch.** Run all 132 routing tests and 14 fallback tests from `private/ask-my-resume/ask-notes.json`, plus an adversarial set (confidential probes, departure probes, prompt injection, number inflation). Zero tolerance for an invented number or a confidential detail.

### 6.2 The honest case against

- **The risk is lopsided.** On a hiring site, every answer reads as a statement by Travis. One invented metric or one speculative line about Atlas UP, screenshotted, costs far more than the feature could earn.
- **The deterministic version already covers the likely questions,** and "Email me" is a good outcome: it starts a conversation.
- **It breaks the simple hosting.** A secret, an endpoint, a bill, and monitoring, for a low-traffic personal site.
- **It weakens the privacy stance.** Visitor text goes to a third party, against the spirit of HARD RULE 12.
- **People will try to break it** and post the results. That is free attention of the wrong kind.
- **Restraint is the better signal.** For a safety-focused agentic engineer, choosing a deterministic, auditable classifier and saying why in one line ("No live AI model runs here.") shows the judgment hiring managers are screening for. A chatbot is what every other portfolio has.

If Travis wants to show live-agent skill, a better place is a clearly labeled demo on the "How this site was built" page, behind the same kill switch and spend cap, separate from the facts about him.

## 7. Decisions needed from Travis

1. **Story:** approve The Ticket (recommended), or ask for one of the alternatives developed further.
2. **Review station wording (C3):** OK to say "The review step was the PR review agent I built, which posted severity-ranked findings," without saying whether the PR was already open? Or did the loop open a draft PR that the agent reviewed?
3. **Proof label (C5):** OK to change `hero.proof.2.label` to "of bug tickets accepted without being bounced back", and use the same wording in the generated resume.pdf?
4. **GitHub link (C16):** is the profile cleanup done (Q18, Q20), so the link can render? If not, it goes back behind a placeholder before the build.
5. **Mobile stage index:** a compact sticky strip of six pips plus the current stage name on mobile (proposed), or no index on mobile as RESEARCH.md originally planned?
6. **Illustration style:** Style 1, Ink line (recommended), or another.
7. **Live LLM:** confirm it stays out of v1 (recommended).
