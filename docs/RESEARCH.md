# Research

Phase 1 recon for travisjterry.com, observed on 2026-10-27. This file covers:

1. Techniques from four inspiration sites (United Carriers, Cerebrium, Linear, Apple), with evidence for how each one is built.
2. Patterns from a scan of five personal sites: four senior or staff engineers and one interaction designer included for case study structure.
3. What each audience (recruiter, hiring manager, interviewing engineer) needs from this site.
4. The technique plan for "The Ticket", the scroll story this site is built around.

Everything here is a technique or a pattern. No copy, visuals, assets, fonts, colors, or UI designs from any of these sites are reused. Raw recon notes are kept in a private, gitignored folder, and the evidence lines below quote them. Screenshots were viewed during the recon sessions and not retained.

## How to read this

- **Confidence.** "Confirmed" means seen in the DOM, in computed styles, or in values sampled while scrolling. "From code" means read in a site's bundled script or CSS text, but not observed running. "Likely" means inferred from indirect evidence and not confirmed.
- **Scroll positions** are document y in CSS pixels at the viewport stated for each site.
- **Facts about Travis** are cited as `resume L<n>`: line n of the source resume text, which is private. The public trace of every site string is in [COPY_SOURCES.md](COPY_SOURCES.md). The resume (L62) spells the iOS app with a trailing "s". That is a known typo, and this file uses the correct name, Pocket Chronicle.
- **Method limits** applied to every site:
  - Window resizing did not change the viewport in this setup. Some desktop observations were made at the browser's real width. Others were made in a same-origin iframe at the target width, where media queries evaluate correctly.
  - Touch was never emulated, so touch-only code paths did not run.
  - `prefers-reduced-motion` could not be emulated. Every reduced-motion finding comes from reading CSS and code. None was tested live.
  - JS sizes are estimates unless stated. Where Resource Timing gave no size, scripts were gzipped in the browser to estimate weight.

## Summary

- **No site pins with ScrollTrigger.** Three of the four (United Carriers, Cerebrium, Apple) hold scenes with native `position: sticky` inside taller wrappers. United Carriers and Cerebrium both had 0 `.pin-spacer` elements, and Apple uses native sticky only. Linear holds no scenes and had no pinning at all.
- **The best "one object travels the page" effect is a trick of reference frame.** On United Carriers the truck stays still in the viewport and the road scrolls under it. Nothing tweens the vehicle down the document.
- **Only United Carriers drives its scroll story with GSAP ScrollTrigger in app code.** Cerebrium bundles GSAP but drives scroll from a smooth-scroll library's progress events. Linear likely uses Motion. Apple uses an in-house engine. Our planned stack (GSAP, ScrollTrigger, Lenis) matches the primary inspiration.
- **The weight is never the motion code.** It is 3D scenes, video, image sequences, Lottie files, and app-grade mock UI. The Ticket needs none of these.
- **The common gap is content that starts invisible.** Every inspiration site starts some text at opacity 0 until a scroll or load animation runs. Reduced-motion handling ranges from absent to partial. This site does the opposite on both counts.
- **The recruiter path is under-served on personal sites.** Among the five portfolios, four had no `mailto:` link on the pages checked. Only one linked a resume PDF, and none had a hiring call to action.

## 1. Inspiration sites

### 1.1 United Carriers (unitedcarriers.com, primary technique)

Home page only. Desktop was observed at 1869x929 (their desktop branch is `width > 991`, so a 1440px window takes the same path). The 390px check used an iframe. Document height at desktop: 32,012px.

| Stack item | Finding | Confidence |
|---|---|---|
| Markup and CMS | Webflow (`html.w-mod-js`, `window.Webflow`) with a custom Vite effects bundle and lazy chunks per page | Confirmed |
| GSAP and ScrollTrigger | Bundled, not exposed on `window`. The vendor chunk contains ScrollTrigger. Inline transforms switch from `translate3d` while tweening to 2D `translate` at rest, which matches GSAP's `force3D: "auto"` behavior. | Confirmed |
| MotionPathPlugin | Not used by app code (0 `motionPath` hits in app chunks, no `getPointAtLength`, no `offset-path`) | Confirmed absent from app code |
| Lenis | Yes. Smoothing on desktop only; at 767px and below Lenis runs on an inner scroller (`.body-inner`) with `lerp: 1, duration: 0` (no smoothing), registered with `ScrollTrigger.scrollerProxy` (`html.lenis`, a Lenis chunk creates the instance) | Confirmed |
| Pinning | Native sticky only, 0 `.pin-spacer` elements | Confirmed |
| Three.js | Ocean scene, desktop only (a WebGL canvas plus a vendor chunk); mobile gets an image and a looping video | Confirmed |
| Image sequences | 4 AVIF sequences drawn to 2D canvas, about 554 frame URLs referenced, 158 fetched in one desktop pass | Confirmed |
| Reduced motion | 0 site CSS rules; one JS check, which skips only an idle bob loop | Confirmed (from code) |

#### Technique 1: a viewport-held object over a document-flow track

- **What it does:** a top-down truck seems to drive down the middle of the page. It turns from heading right to heading down at a curved junction, with content on both sides. Range: about 12,000 to 16,400.
- **How it is built:**
  - The truck never travels through the document. It sits in a sticky holder (`top: 0`, 703x703) and stays near the viewport center. Its sampled center was x about 934 and y 499 to 680 between 13,750 and 16,400. The road scrolls under it at normal speed, and that creates the sense of travel.
  - The road is not one SVG path. Straight runs are divs with a black fill and a repeating dashed-lane SVG as `background-image`. Only the curved junction is an inline SVG.
  - The turn is a pivot rotation, not a motion path. The vehicle layers sit inside an 11x11px pivot div, and a timeline tweens the pivot's `rotation` from 0 to 90 with `power1.inOut`. The offset vehicle therefore sweeps a quarter circle matching the curve's radius. Sampled values: `rotate(3.24deg)` at 13,250, `rotate(73.73deg)` at 13,500, and `rotate(90deg)` from 13,750.
  - The cab and trailer each get a `rotation` yoyo of 12 and -12 degrees, with the trailer offset by 0.1, so it lags like an articulated vehicle.
- **Performance:** one element moves per frame, using transforms only. The track is static DOM, which the browser scrolls for free.
- **For The Ticket:** borrow. This is the core model (section 4.1).

#### Technique 2: sticky scenes in tall wrappers, driven by scrubbed timelines

- **What it does:** long scenes hold the screen while things change, with no layout jump on entry or exit.
- **How it is built:**
  - Each scene is a tall wrapper (12,805px and 7,212px seen) with an empty spacer block and a `position: sticky` stage. No ScrollTrigger `pin` is used.
  - Timelines use `scrollTrigger: { trigger, start, end, scrub: true }`, with start and end built from viewport units computed in JS (for example `bottom-=(180vh+1) bottom`).
  - Timelines tween CSS custom properties as well as transforms: `--road-height`, `--bright-fade`, and `--scale-factor` (used as `transform: scale(var(--scale-factor))`).
  - The ship scene uses `scrub: 1` above 991px and `scrub: true` below it.
  - A ResizeObserver on body height (debounced 200ms) calls `lenis.resize()` and refreshes the triggers. Each section class reverts, kills, and rebuilds its own timelines on resize.
- **Gaps observed:**
  - Many elements start at `autoAlpha: 0` and appear only when their range is reached.
  - Desktop and mobile copies of some sections are both in the DOM, so some headings appear twice in the outline.
- **For The Ticket:** borrow the sticky-wrapper structure. Do not borrow the hidden-until-scrolled content.

#### Technique 3: relay handoffs, with layer swaps at matching screen positions

- **What it does:** the container seems continuous from crane to truck to ship, even though the media changes from canvas frames to still images to WebGL.
- **How it is built:**
  - Zero-duration swaps sit inside scrubbed timelines: `to(canvasLayer, {autoAlpha: 0, duration: 0})`, then `to(staticLayer, {autoAlpha: 1, duration: 0}, "<=0")`. Because they live on a scrubbed timeline, they reverse automatically on scroll back.
  - Section-level swaps use paired `onEnter` and `onLeaveBack` callbacks.
  - Truck to ship is a positional match cut. A later sticky section with higher z-order scrolls up over the still-sticky truck, and the ship's center column of containers sits at the same x as the truck's container.
- **Performance:** opacity flips on pre-positioned layers, which cost almost nothing.
- **For The Ticket:** borrow. Ticket state changes are reversible layer swaps, and the signature moment in `#contact` is a match cut (section 4.5).

#### Technique 4: Lenis on the GSAP ticker, with no smoothing on mobile

- **How it is built:**
  - Lenis is driven by `gsap.ticker.add(t => lenis.raf(t * 1000))` with `gsap.ticker.lagSmoothing(0)` and `lenis.on("scroll", ScrollTrigger.update)`. ScrollTrigger's refresh calls `lenis.resize()`.
  - At 767px and below, they switch to an inner scroller with `lerp: 1, duration: 0` (no smoothing), register it with `ScrollTrigger.scrollerProxy`, and set `ScrollTrigger.config({ ignoreMobileResize: true })`.
  - Lenis is stopped while a modal is open (a MutationObserver on the body class).
  - One loop (the GSAP ticker) runs Lenis, ScrollTrigger, the image sequences, and a scroll-speed readout, so there are no competing animation loops.
- **Gap observed:** smoothing is never turned off for reduced motion.
- **For The Ticket:** borrow, plus a reduced-motion and kill-switch exit (section 4.3).

#### Technique 5: scroll-scrubbed image sequences in a 2D canvas

- **What it does:** a crane drives, lifts, rotates in 3D, and sets down a container. It reads as 3D, but it is pre-rendered frames.
- **How it is built:**
  - A GSAP tween scrubs a `frame` value. A lerp loop on the ticker eases the displayed frame toward it and draws with `ctx.drawImage` using a cover fit. The canvas is sized to CSS size times DPR.
  - A windowed loader fetches frames around the playhead, with a look-ahead that grows with scroll velocity, 6 concurrent requests, a timeout with one retry, and eviction of far frames.
- **For The Ticket:** skip. It is network-heavy and does not fit the JS and LCP budgets. The ticket is SVG and CSS.

Also seen, not borrowed: a Three.js ocean, a percent-counter preloader, a scroll-speed readout, a real-text color fill scrubbed through `--bg-progress` with `background-clip: text`, and a cursor ring.

### 1.2 Cerebrium (cerebrium.ai)

Home page only. Desktop was observed in a 1440x900 iframe (document height 10,870px). The 390px check also used an iframe.

| Stack item | Finding | Confidence |
|---|---|---|
| Framework | Astro static site with islands (`<meta name="generator" content="Astro v6.1.0">`, one island loader per component) | Confirmed |
| GSAP | Core plus CSSPlugin bundled, not on `window`. SplitText, ScrambleTextPlugin, and Flip appear in chunk text. | Confirmed (bundled); plugins from code |
| ScrollTrigger | Not used by app code. The string appears only inside the GSAP core chunk, with no `start`, `end`, or `scrub` configs in any app chunk, and 0 `.pin-spacer` elements. | Confirmed absent from app code |
| Motion paths and scroll-driven CSS | None: no MotionPathPlugin, `offset-path`, or `animation-timeline` in any chunk or stylesheet rule | Confirmed |
| Smooth scroll and in-view system | Likely Locomotive Scroll in its Lenis-based version. Evidence: `html.lenis`, the word "locomotive" in the scroll chunk, Lenis option defaults, and `data-scroll-*` attributes. No global is exposed. | Likely |
| WebGL | One fixed full-viewport canvas, Three.js r183 on WebGL2 (`canvas[data-engine="three.js r183"]`) | Confirmed |
| Other | Lottie on one card; 3 Draco-compressed GLB models | Confirmed |
| Reduced motion | No page-level handling found. One store exposes a reduced-motion flag, but no read of it was found. | From code, not tested |
| JS weight | About 624KB compressed first-party JS across 55 files, plus about 813KB of GLB and an 83KB decoder. The 3D models, the decoder, and the Lottie data also loaded at 390px. | Confirmed (Resource Timing) |

#### Technique 1: one fixed background scene driven by per-section progress events

- **What it does:** a single scene sits behind the whole page and shows through three dark zones. In each zone it takes a different arrangement and moves with that zone's scroll position, without any pinning.
- **How it is built:**
  - Each dark zone carries an attribute naming a progress event. The scroll library fires a `window` CustomEvent with `detail.progress` on every frame while the zone is in range.
  - Progress runs from 0 when the zone's top meets the viewport bottom to 1 when its bottom leaves the top. In ScrollTrigger terms that is `start: "top bottom", end: "bottom top"`. Logged values matched this within 0.01.
  - The scene stores progress as a target and eases toward it each frame (`current += (target - current) * 0.05`). That is why the motion trails scroll slightly and never jitters.
  - Crossing a zone edge calls `open()` or `close()`, which run time-based tweens. Motion inside a zone is scrubbed, while entering and leaving are triggered.
  - An IntersectionObserver tracks which zones are visible and pauses rendering when none are.
- **For The Ticket:** borrow the logic, rendered in SVG and CSS instead of WebGL (the section progress bus in section 4.1).

#### Technique 2: a sticky index with a scrollspy

- **What it does:** in the feature block, a list of four names stays put while cards scroll beside it. The name for the card in view darkens.
- **How it is built:**
  - Pure CSS `position: sticky`, with no JS pin.
  - An IntersectionObserver (`rootMargin: "0px 0px -30% 0px"`) toggles a class on the matching link, and a CSS color transition does the rest. The link class changed once per crossing (39 times in the session), not once per frame.
  - One header-height token drives the sticky `top`, each card's `scroll-margin-top`, and the scroll-to offset. The component measures the token by appending a probe element and reading its computed padding.
  - Below the medium breakpoint, the index is hidden and the cards stack.
- **Gap observed:** the active state is shown by color only.
- **For The Ticket:** borrow for the `#pipeline` stage index, and add a non-color marker for the active state.

#### Technique 3: abstract vignettes that play only while in view

- **What it does:** each feature card shows its idea as a small self-running diagram instead of a screenshot. There is a bar race, a terminal that types lines, and a line chart that draws itself.
- **How it is built:**
  - **Bar race:** each bar is a `span` with `--value: N%` that switches from `w-0` to `w-(--value)` under a CSS width transition. Each bar's duration is mapped between 250ms and 4s in proportion to its value, so the smallest value finishes first.
  - **Terminal:** hidden rows are revealed one per `setTimeout` on enter. The timer stops on exit.
  - **Line chart:** `strokeDasharray` and `strokeDashoffset` are set to `getTotalLength()`, then tweened to 0 with `power2.out`.
- **Gap observed:** a Lottie map on one card was still updating far below that card (1,820 transform changes, still changing at y 9,970), so it does not seem to pause off-screen. Chart labels are duplicated `h3` elements.
- **For The Ticket:** borrow the CSS and dash-offset mechanics for the pipeline vignettes. Make them play once and stop.

#### Technique 4: a split-word title reveal with a settle flicker

- **How it is built:** SplitText splits each title into words. A triggered (not scrubbed) timeline staggers the words in from opacity 0, then dips random words to 0.12 and brings them back. The heading gets an `aria-label` with the full sentence, and each word `div` is `aria-hidden`.
- **Gaps observed:**
  - The label is built from text content, so a title with a line break exposes two words fused together.
  - The text starts at opacity 0.
  - Only the hero title is a real heading. The other large titles are `<p>` elements.
- **For The Ticket:** at most, borrow the settle half, starting from visible text, and never on the H1. Linear's restraint finding (section 1.3) argues against animating headings at all, so this is optional.

#### Technique 5: light sheets over a live dark backdrop, with mono UI chrome

- **How it is built:**
  - The page background is dark. Dark zones are transparent, so the fixed canvas at `z-index: -2` shows through.
  - Light zones are wrappers with a 32px radius and negative top and bottom margins, so they overlap the zone edges and read as sheets sliding over a live background.
  - Body text always sits on a solid sheet. All UI chrome (buttons, chips, tabs) is small uppercase monospace.
- **Gap observed:** display text in the dark zones sits over a scene whose brightness changes, so contrast there varies with scroll.
- **For The Ticket:** borrow the structure. Content sits on solid sheets over the chaos-to-calm backdrop, which keeps text contrast fixed during the shift.

### 1.3 Linear (linear.app)

Home page only. Desktop was observed at 1400x759 with real wheel input (document height 9,960px). The 390px check used an iframe.

| Stack item | Finding | Confidence |
|---|---|---|
| Framework | A Next.js-compatible React app, likely built with vinext (a Vite-based reimplementation of the Next.js API). Evidence: `window.next`, chunks under `/_next/static/chunks/` with Vite-style hashes, and inline scripts referencing a vinext navigation runtime. | Likely |
| Animation | Likely Motion (the framer-motion API) for JS-driven entries and scroll-linked values, plus CSS keyframes for loops. Evidence: `whileInView` and a scroll-progress hook with `offset: ["start start", "end start"]` in chunk text, and Motion's settled inline-style format. | Likely (from code patterns, no global) |
| Not present | No GSAP, ScrollTrigger, Lenis, Locomotive, Three.js, or Lottie (no globals, no chunk matches). 0 canvas, 0 video, 231 inline SVGs. | Confirmed absent within these checks |
| Motion paths and scroll-driven CSS | None used for effects: no MotionPathPlugin and no `offset-path`. One chunk feature-detects `window.ScrollTimeline` and creates one, and one dot rule resets `animation-timeline`. | From code |
| Smooth scroll | None. 5 wheel ticks moved exactly 500px. `scroll-behavior: smooth` applies only to anchors, inside `prefers-reduced-motion: no-preference`. | Confirmed |
| Pinning | None | Confirmed |
| JS weight | About 199 chunk files on first load, roughly 789KB gzipped by in-browser estimate | Estimate |

**Restraint finding.** A MutationObserver logged no class or style change on any heading or paragraph between y 0 and 9,201. Only six things move: the hero entry, the edge lights, the fixed backdrop offsets, one-shot vignettes, replaying agent chats, and a few infinite micro-loops.

#### Technique 1: a load sequence ordered text, then frame, then light

- **What it does:** the H1 resolves from a soft blur, the product frame fades up, then a short highlight glints across one corner and fades. Nothing bounces or slides in from off screen.
- **How it is built:**
  - JS writes inline styles to the H1 words, taking them from `opacity: 0; filter: blur(10px)` to crisp over about 0.9 to 1.0s, starting about 0.9s after navigation.
  - The light sweep animates `--mask-x` and `--mask-y` through three keyframes inside a wrapper whose opacity goes 0, 1, 0 over 1.5s. A second layer repeats the sweep 0.25s later to give an inner rim.
  - Durations and eases are named tokens: `--speed-quickTransition: .1s`, `--speed-regularTransition: .25s`, and a set of cubic-bezier eases. Menus use 0.18s.
- **Gaps observed:**
  - The visible headline depends on JS (opacity 0 until hydration).
  - `h1.textContent` contains the sentence three times (an animated copy, a screen-reader copy, and the source).
  - The reported LCP was a text-free `DIV`, not the H1.
- **For The Ticket:** borrow the ordering for decorative layers only. The hero text is fully visible at first paint, and the ticket arrives after.

#### Technique 2: a scroll-linked edge light on framed panels

- **What it does:** a thin highlight slides along a panel's border as you scroll past, like light catching a bevel.
- **How it is built:**
  - Two absolutely positioned layers per panel are masked by `radial-gradient(200px 200px at var(--mask-x) var(--mask-y), ...)`, so only the part of the border inside the spot shows.
  - `--mask-y` comes from scroll progress over `["start start", "end start"]`, mapped from `[0, .8]` to `[0, 100]`, which is linear and clamped. Sampled: 3.5% at y 300, 21.9% at 450, 40.2% at 600, 64.6% at 800, 89% at 1,000, and 100% from about 1,150.
- **Performance:** one CSS variable write per frame per visible panel, which repaints the masked layers. That is paint work, not composite-only work, but it is bounded. Panels far from the viewport kept stale values, so updates appear gated by visibility.
- **For The Ticket:** adapt it as the ticket's status light (section 4.2, `#pipeline` and `#contact`). It carries one meaning (state), not decoration.

#### Technique 3: a fixed backdrop seen through moving panels

- **How it is built:** a panel's `--bg-offset-y` is set to the negative of its viewport top on every scroll frame, so the panel's background cancels the panel's movement and appears fixed. This avoids `background-attachment: fixed`, which is unreliable on iOS Safari and inside transformed ancestors.
- **For The Ticket:** skip. Our backdrop is a real `position: fixed` layer behind solid sheets.

#### Technique 4: product UI abstracted as dissolving, low-contrast stages, with one-shot vignettes

- **How it is built:**
  - Every stage edge dissolves into the page through stacked linear-gradient masks with `mask-composite: intersect`. A stage reads as a glimpse, not a screenshot.
  - Stage contrast sits one or two steps off the background, so the section headline always wins.
  - One-shot entries: an IntersectionObserver adds an `inView` class, and 438 dots each play a 420ms scale-and-fade keyframe once. Chat messages spring in from `opacity: 0; filter: blur(2px)` and a small `translateY`.
- **Gap observed:** infinite micro-loops ran off-screen (one animation targeting y 6,883 was still running with the viewport at y 1,450), and 83 animations were active at load. No universal reduced-motion rule was found.
- **For The Ticket:** borrow the dissolving masks and one-shot entries for the pipeline vignettes. No loops. Vignettes stay abstract diagrams and never resemble product screens.

#### Technique 5: precision type, grid, and theme tokens

- **How it is built:**
  - A max content width. The benefits row is a 12-column, zero-gap grid. Section headers are a separate two-column split, with the H2 on the left half and the lede on the right half.
  - Display type is tightly tracked (about -0.022em). H2s use `text-wrap: balance`. Body text is 15px on a 24px line. Mono labels are 12px uppercase.
  - A four-step text color ramp. 1px translucent hairlines separate regions instead of boxes or shadows.
  - Themes are attribute-scoped token sets (`data-theme`). The page forces dark and does not read `prefers-color-scheme`.
- **Gap observed:** by calculation, the lowest text step is about 3.4:1 against its background where it is used for a 12px caption. That is below the 4.5:1 AA minimum.
- **For The Ticket:** adopt the discipline (grid, hairlines, balanced headings, a mono reserved for pipeline UI, every text step passing AA) with our own fonts and colors, chosen in BRAND.md.

### 1.4 Apple (apple.com home page, plus the MacBook Pro product page)

The product page was picked from the global nav because the home page hero promoted it as the newest model that day. Both pages were observed in 1440x900 iframes using stepped `scrollTo`, not wheel input. Product page document height: 34,779px.

| Stack item | Finding | Confidence |
|---|---|---|
| Framework | None of the common ones. Server-rendered HTML with page-specific bundles and shared components. | Confirmed (no React, Next, or jQuery globals) |
| Animation engine | An in-house declarative scroll engine named AnimSystem in script text, driven by data attributes (`data-anim-scroll-group`, `data-anim-keyframe`, and others). Ranges are strings such as `{start: "t - 90vh", end: "t - 80vh", opacity: [0, 1]}`. | From code (name); attributes confirmed in DOM |
| Not present | No GSAP, ScrollTrigger, Lenis, Locomotive, Motion, Three.js, or Lottie. 0 canvas. | Confirmed absent within these checks |
| Motion paths and scroll-driven CSS | None: no MotionPathPlugin or `offset-path`; `animation-timeline` appears only in 3 video caption-menu rules | Confirmed |
| Smooth scroll | No smooth-scroll library found. Native wheel easing was not tested. | Partly confirmed |
| Pinning | Native `position: sticky` only (for example an 848px frame at `top: 52px` inside a 3,600px parent) | Confirmed |
| Video | 10 `<video>` elements on the product page, plus a streaming video library for one film player | Confirmed |
| Feature classes | A head script sets classes on `<html>` before render, including `enhanced` or `no-enhanced`, `reduced-motion` or `no-reduced-motion`, and one class per heavy scene | Confirmed |
| JS weight (product page) | About 798KB gzipped across 16 scripts by in-browser estimate, plus about 1.6MB of CSS text in one stylesheet | Estimate |

**Key finding.** Neither page scrubs video or image sequences today. Every clip plays on its own clock once its range is entered, and pauses (often resetting) when the range is left. Sampled every 200px of scroll, `currentTime` never changed on a paused video. The home page has no scroll-linked motion at all. All scroll-linked work on the product page is transforms, opacity, and class swaps.

#### Technique 1: a native sticky stage with scroll-mapped state crossfades

- **What it does:** a frame holds still while three versions of the same layout (media, label, short paragraph) replace one another. A small indicator row lights the active state. Range: 7,809 to 10,509, a 2,700px container for a 900px frame.
- **How it is built:** plain `position: sticky; top: 0`, applied only under a per-scene `<html>` class. The three states share one box, and scrubbed inline `opacity` is written per state. Inactive states get a `no-pointer-events` class, so hidden links cannot be clicked.
- **Gap observed:** all three states stay in the accessibility tree, and two of the three paragraphs are at opacity 0 at any moment, so Find in page can land on invisible text.
- **For The Ticket:** borrow the hold-and-swap shape for decorative SVG only. Text never crossfades.

#### Technique 2: a zoom-out reveal with real-text overlays

- **What it does:** a full-bleed image under a 50% scrim shows six spec lines one by one. Then the scrim and copy fade, and the image zooms out into a frame.
- **How it is built:**
  - One wrapper gets a scrubbed `transform: matrix(s, 0, 0, s, 0, y)`, with s going from about 0.938 to 0.506 between y 18,640 and 19,600. The image inside is never resized.
  - Each spec line is a `span` with its own `{start: "t - 90vh", end: "t - 80vh", opacity: [0, 1]}`. The lines are about 90px apart, so one rule staggers them for free.
  - A `will-change` class is added to the zoom wrapper about 900px before the scene (y 15,980) and removed after it (y 20,500).
- **For The Ticket:** borrow the `will-change` window everywhere. The zoom is optional for `#platform`.

#### Technique 3: a knockout type zoom

- **How it is built:** a black layer with `mix-blend-mode: multiply` sits over a playing video. JS scrubs the text's `transform: scale()` from 400 down to 1, with `transform-origin` set inside one glyph, so the video is first seen through one letter. The knockout text is `aria-hidden`, and the real heading exists separately in the DOM. The scene is enabled only when a viewport-size media query matches.
- **For The Ticket:** skip. It needs video and a blend layer, and it would be motion for its own sake.

#### Technique 4: play-once media with start, end, and fallback frames

- **How it is built:**
  - A scroll keyframe (`start: "t - (100vh - prop(offsetHeight) * 0.3)", end: "b"`) plays a clip on enter. If the clip has already played through, it restores the end frame instead of replaying. On exit it pauses, and a user pause is respected.
  - Each clip has sibling still images for its start frame, end frame, and fallback, stacked with the video. There is always a correct still before load, after the end, and when video is off.
  - Product page clips have a labeled play/pause `<button>`.
- **For The Ticket:** borrow the start-frame and end-frame model for every vignette. The HTML is the end state.

#### Technique 5: progressive enhancement gates, one DOM and two layouts

- **How it is built:**
  - Each heavy scene's eligibility is a media query stored as a string in a CSS custom property, redefined per breakpoint. One example is `--chip-hero-enhanced-media-query: "(min-height: 635px) and (max-height: 1500px)"`. JS reads it with `getComputedStyle` and `matchMedia`.
  - All sticky rules and scrubbed keyframes are scoped under the scene class, so removing the class is the whole fallback. Removal is one-way on resize.
  - Unenhanced, the page renders a calm stacked layout. At 390px the Performance section shrank from 7,435px to 3,538px, and no videos were requested.
- **Gap observed (from code, not tested live):** under reduced motion, video is swapped for stills, but nothing was found that removes the scene classes. The scrubbed transforms appear to keep running. Fade-ups also start text at opacity 0 whenever JS runs.
- **For The Ticket:** borrow as architecture. The kill switch and reduced motion turn off the scrubbed scenes too, not just media (section 4.3).

## 2. Portfolio scan

Five personal sites were scanned on 2026-10-27: brittanychiang.com, leerob.com, simonwillison.net, rauno.me, and joshwcomeau.com. Two are recruiter-shaped, one shows depth through volume of writing, and two are craft-first. Desktop was observed at 1280x679 with real wheel input. Mobile was checked on one site only. Performance figures are unthrottled indicators, not Lighthouse scores. Only patterns are recorded here, aggregated across sites.

### What proves seniority fast

1. Name, role, and a one-line value statement as real, visible text in the first viewport. Only one of the five does all three. The others rely on reputation or move it to an About page.
2. A tenure number in the first two sentences ("building since year X", "N years"). Three of five do this.
3. Named employers in the first paragraph, as plain text.
4. A promotion stack, with earlier titles shown dimmer under the current title at the same company. It shows growth in one glance.
5. One number per project, with its unit, and ideally its source named in the sentence. One number is easy to scan and easy to believe.
6. A short third-person bio that other people can lift as is.
7. Dated work. Dates make recency and sustained output visible without any claims.
8. The site's own craft. It persuades engineers on the loop, but a 10-second reader cannot see it unless the text proof is also there.

### How case studies are structured (what works)

1. A header with title, month and year, a status or evidence label (production, prototype, essay), and a way back.
2. Context in one to four short paragraphs: when, what, who for, and the constraint.
3. The scope decision, stated plainly: what shipped first and what came later.
4. One subsection per decision, each with one visual and one to three paragraphs, plus a sticky table of contents so an engineer can jump to the decision they care about.
5. Numbers as context up front, not as a trophy wall at the end.
6. Credits at the end.
7. Breadth moved to a separate archive table (year, project, where, built with, link), so the main page stays short.
8. **Gap in all five:** none has an explicit results section or a "what I would do differently" section.

### What wastes time

1. Entry animations on hero text. On one site, text was still near-unreadable about 2 seconds after load and fully visible by about 4. That is a large share of a 10-second scan.
2. Art or a visually hidden H1 before identity. If the first visible text is not who you are and what you do, the recruiter has to hunt.
3. No email. Four of five pages checked had no `mailto:` link at all. The fifth put it inside an unrelated sentence. Contact meant a social DM or a contact form.
4. The resume missing or buried. One of five offers a PDF, and it sits after the experience list, not in the header.
5. Scroll hijacking that converts vertical scroll into horizontal travel. It looks good, but it cannot be scanned.
6. Chip overload. Up to ten technology chips per role means nothing stands out.
7. Personal trivia at the same weight as proof, placed before the proof.
8. Sound on by default, even with a toggle.
9. A blog or content hub as the front page. None of the five has a hiring call to action. The primary call to action is a newsletter or nothing.

### Nav, CTA, and resume patterns

- Nav ranged from none at all (which works only on a short page) to a sticky identity column with three anchors and a scrollspy. During one synthetic-scroll test, a scrollspy's active marker failed to update near the bottom of the page. It may be an artifact of the input method, but any scrollspy here gets tested with wheel, keyboard, and anchor jumps.
- A minimap of tick marks showing position along a long page is a strong pattern for a long journey and could double as nav.
- No site offers a plain-text or JSON resume, a resume link in the header, or a visible print stylesheet.

### Accessibility and performance baseline

- A skip link was confirmed on two of five sites. Reduced-motion CSS was found on three (behavior not tested).
- Heading outline issues appeared on two sites: a title line set as an H2 under the H1, a page with no H1 to H3 at all, and a page that jumps from H1 to H3.
- Decorative canvases were not marked `aria-hidden` where seen.
- Script resources ranged from 3 to 26 per page, and measured transfer from about 51KB (cache likely helped) to about 1.37MB. The lightest site was server-rendered HTML with three small scripts. None of the recruiter-path patterns above depend on a framework.

### Implications for this site

- `#hero`: name, the title line exactly as on the resume (resume L2), a one-sentence value line, three proof numbers with their hedges intact, and the four CTAs (Download Resume (PDF), Email, LinkedIn, and Book a Call), all at full opacity on first paint.
- Tenure and employers early: "15+ years" (resume L6), with Atlas UP and EOS Worldwide named as plain text (resume L18, L32).
- `#career` as a commit log with a date gutter and a promotion stack:
  - EOS Worldwide shows two titles (resume L33).
  - Qualfon shows the progression to Senior Developer (resume L42).
  - Atlas UP shows continuous ownership of the product since February 2023 (resume L20).
- Three to five chips per role at most, drawn only from resume L9 to L14.
- One number per item, hedges intact. FoundrKids: 140+ endpoints and about 2,500 tests (resume L58). Pocket Chronicle: about 2,700 tests and 200+ merged PRs (resume L65).
- `#independent` case study pages follow the structure above and add the two sections nobody has: results, and what I'd do differently.
- A real, clickable email link (obfuscated from scrapers) in `#hero` and `#contact`, plus `/resume.txt` and `/resume.json`. Nobody in the scan offers those, so they are a cheap differentiator.
- Leave out sound, visitor personalization, trivia ahead of proof, a blog front page, and a newsletter CTA. The primary CTA is contact.

## 3. Audience summary

The site serves three readers, in priority order: recruiters, then hiring managers, then engineers on the interview loop. When their needs conflict, the faster reader wins, and motion never gates text for any of them.

**Pending:** the job-description audience scan (AUDIENCE_MAP) is waiting for Travis's shortlist file. It will map recurring requirements to proof on the site and flag any requirement with no proof, without inventing proof to fill gaps. AUDIENCE_MAP stays private. Until it exists, the needs below come from the project brief and the portfolio scan, not from job descriptions.

### Recruiter (about 10 seconds, scanning)

- **Needs:** who this is, the role, whether the numbers are real and big enough, remote or not, and how to make contact or forward the profile.
- **Must be in the first viewport as real HTML text:**
  - name and title line (resume L1, L2);
  - location and remote (resume L3);
  - a one-sentence value line;
  - three proof numbers from the brief's HEADLINE_PROOF list, for example 100+ bugs and about 25 features cleared in about six weeks (HEADLINE_PROOF; resume L23), roughly 95% of tickets accepted without being bounced back (resume L23), and a full regression cycle cut from about a week to 8 to 10 hours (resume L26);
  - Download Resume (PDF), Email, LinkedIn, and Book a Call (the brief's exact first-viewport labels).
- **From the scan:** this is exactly where four of five portfolios lose time, through fading hero text, no email, and a buried or missing resume. A visible "60-second version" link and, on mobile, a sticky bottom bar (Email, LinkedIn, Resume PDF) keep the contact path one tap away.
- **Test (Phase 5):** with motion on, can a first-time viewer find the title, three proof numbers, and a way to make contact within 10 seconds?

### Hiring manager (about 60 seconds, looking for proof)

- **Needs:** the top achievements with scope and numbers, what was built and how it was kept safe, whether this person leads, and a clean career arc.
- **Proof available (resume):**
  - sole author of a 30+ skill Claude Code system that took a ticket from reproduction to an opened pull request (L21);
  - the backlog result (L23);
  - the safety model: a separate verifier with fresh context, risk-tiered retries, billing and auth that always stopped for a human, and a global kill switch (L24);
  - the MCP server with classifier routing and deletes kept out of LLM reach (L22);
  - the regression lane (L26);
  - the Vue platform for about 10,000 monthly active users (L28);
  - team AI adoption (L27);
  - leading three direct reports as Staff Engineer (L36) and five as NetSuite team lead (L45);
  - 15+ years (L6).
- **From the scan:** a tenure number early, employers as plain text, a promotion stack, one number per item, and dated entries.
- **Where it lives:** `#sixty` is a static, scannable summary (title, focus, top five achievements, stack, availability: remote only), fully readable with zero motion. The pipeline story and `#career` back it up for anyone who keeps scrolling.
- **Test (Phase 5):** within 60 seconds, can the viewer name his top three achievements?

### Interviewing engineer (5+ minutes, looking for depth)

- **Needs:** how things actually work, the tradeoffs, the failure handling, and evidence of craft. They read the stage-by-stage pipeline (`#pipeline`), the safety design (`#safety`), the MCP routing (`#mcp`), and the case studies for FoundrKids and Pocket Chronicle (resume L56 to L65).
- **Case study shape:** problem, constraints, an original architecture diagram, safety design, results, and what I'd do differently. Any architecture detail beyond the resume stays marked [CONFIRM] until Travis approves it.
- **The site is itself evidence:**
  - fast and accessible;
  - a kill switch that really stops everything;
  - machine-readable versions: `/resume.txt`, `/resume.json`, `/llms.txt`, and a `curl`-friendly `/cli`;
  - a "How this site was built" page that logs the site's own build loop (spec, implement, independent verification, review, PR), a loop of the same shape as the one on the resume (brief Phase 6). The resume's own Atlas UP loop is reproduction, fix, independent verification, regression, review, and an opened PR (resume L21).
- **From the scan:** a sticky table of contents, status labels on visuals, and the sections nobody else has (results, and what I'd do differently). Pipeline visuals carry a visible "illustrative recreation" label, the same way the craft-first site labels prototype versus production.
- **Ask My Resume (`#ask`):** a deterministic question classifier that shows the source section for each answer. It mirrors the classifier routing on resume L22, and engineers can probe it.

## 4. Technique plan for The Ticket

The story, from the brief: one generic ticket card is born at the top as a red bug report in a cluttered backlog column. As the visitor scrolls, it travels one continuous pipeline track down the page and changes state at each stage. The page shifts from backlog chaos to calm order. At the bottom, the PR merges, its status light turns green, and that light lands on the contact CTA: "Ready for review."

Build stack: Next.js (App Router) with React and TypeScript, statically exported; GSAP with ScrollTrigger; Lenis; and SVG and CSS for the ticket, track, stations, and glow. The budget is about 180KB of gzipped JS in total.

### 4.1 Architecture: one engine, borrowed piece by piece

| Concern | Decision | Borrowed from |
|---|---|---|
| How the ticket moves | The ticket is one `position: fixed`, `aria-hidden` element held in the viewport. The track is one SVG in normal document flow. Scrolling moves the track under the ticket. On build, the path is sampled with `getPointAtLength` into a lookup table sorted by y. Each frame reads x at a focus line about 45% down the viewport and writes it with `gsap.quickSetter(ticket, "x", "px")`. | United Carriers technique 1 |
| Curves | No `autoRotate`. The card tilts toward the path's slope, clamped to a few degrees and smoothed, so it stays readable. MotionPathPlugin is added only if a stage needs true along-path tweening; the lookup table covers the rest and saves its bytes. | United Carriers technique 1 (pivot and wobble) |
| Track geometry | The path `d` is built in JS from measured station anchors (`data-station` elements), so it fits real content height and survives copy edits. It has straight runs, plus cubic curves where it branches (`#mcp`, `#independent`) and rejoins. | United Carriers technique 1 (one curve SVG plus straight runs) |
| Holding a scene | Native `position: sticky` inside taller wrappers. No ScrollTrigger `pin`, so no pin spacers fight the layout. | United Carriers, Cerebrium, Apple (Linear holds no scenes) |
| Ticket state changes | All state layers are stacked inside the ticket, and one ScrollTrigger per station sets `ticket.dataset.state` on `onEnter` and `onEnterBack`. CSS crossfades layers in about 200ms. Changes are toggled, never scrubbed, so a fast fling cannot leave the card half in two states, and every swap reverses. | United Carriers technique 3; Apple technique 1 |
| Per-section motion | A section progress bus. One ScrollTrigger per stage section (`start: "top bottom", end: "bottom top"`) writes only a target value. One `gsap.ticker` callback eases each value (`current += (target - current) * k`, with k corrected for refresh rate) and writes to that section's decorative layer. The callback is removed when no section is active. | Cerebrium technique 1 |
| Scene eligibility | `html[data-motion="on"]` plus `html.stage-on`. The viewport-fit rule is stored once as a string in a CSS custom property and read by JS into `gsap.matchMedia()`, so CSS and JS share one source of truth. Unlike Apple's one-way removal, `matchMedia` reverts and rebuilds both ways. | Apple technique 5 |
| Vignettes | Each station vignette is authored in its end state in the HTML. With motion on, the engine resets it only if it is below the fold at init, plays it once on first activation, then holds the end frame. No loops, and no replay on scroll back. | Apple technique 4; Cerebrium technique 3; Linear technique 4 |
| Restraint | Headings, paragraphs, proof numbers, and CTAs never animate on scroll. Only the track, the ticket, the station vignettes, and the backdrop move. | Linear (restraint finding) |
| Smooth scroll | Lenis only with `(pointer: fine)` and widths above 767px, on the GSAP ticker. No smoothing on touch. | United Carriers technique 4 |

Lenis wiring, as observed on United Carriers:

```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

The engine is one framework-free TypeScript module. React renders the static HTML and mounts the engine with a single effect after first paint, using a dynamic import. React components only emit markup and `data-*` attributes.

### 4.2 Stage map: DRAFT STATE MAP to techniques

Facts shown in each stage come from the cited resume lines. The hero backlog and all pipeline, safety, MCP, and platform visuals are abstract, use synthetic generic data, and carry a visible "illustrative recreation" label as real text.

| Section | Ticket and track (draft map) | Techniques and implementation | Motion off (kill switch or reduced motion) | Mobile (390px) |
|---|---|---|---|---|
| `#header` | Not on the track. Holds the wordmark, nav anchors, Resume PDF, and the "Pause motion" control. | An inline head script sets `html[data-motion]` before first paint (Apple technique 5). One `--header-h` token drives sticky `top`, `scroll-margin-top`, and scroll-to offsets (Cerebrium technique 2). No `backdrop-filter` over the moving backdrop (see 4.5). | Same markup. The control reads "Pause motion" with `aria-pressed="true"`. | Compact header. Email, LinkedIn, and Resume PDF move to the sticky bottom bar. |
| `#hero` | A cluttered backlog column of abstract cards. Our ticket is red, flagged "bug". As scrolling begins, it lifts out of the column onto the track. | Text first, ticket after (Linear technique 1): the H1, value line, proof numbers, and CTAs are full opacity at first paint and are the LCP. The ticket's "born" entry is a CSS keyframe (opacity and transform, about 0.6s) gated by `data-motion="on"` and `prefers-reduced-motion: no-preference`. The lift is a scrubbed transform over about the first viewport of scroll, handing off to the fixed ticket (United Carriers technique 3). Backlog cards are a small, fixed number of `aria-hidden` elements, and the column carries the visible "Illustrative recreation with synthetic data" label as real text. | The ticket sits still in the column, red, with no entry. | The ticket is a small chip on a left rail. The backlog is a short stack of chips. |
| `#sixty` | The track pauses. The ticket sits beside the summary like a ticket detail panel. | A straight track run and no scene. Nothing in the section animates (Linear restraint). The section is fully readable with zero motion. | Identical text. A static ticket graphic sits beside it. | Single column. The chip rides the rail. |
| `#pipeline` | One station per step: Reproduce, Fix, Verify, Regression, Review, Opened PR (resume L21). | Per-station sticky vignettes beside scrolling copy (Apple technique 1). A sticky stage index (`<ol>` of real anchors) whose `aria-current="step"` flips on the same focus line as the ticket (Cerebrium technique 2), with a marker as well as color. Dissolving masks plus one-shot entries (Linear technique 4). The status light runs along the ticket rim within each stage (Linear technique 2). Per station:<br>**Reproduce:** a short opacity sequence on a small abstract screen, once, under about 1.5s.<br>**Fix:** a status chip layer swap.<br>**Verify:** a differently colored verifier marker with a "fresh context" badge slides in by transform, and its check mark draws by `stroke-dashoffset` (resume L24; Cerebrium technique 3).<br>**Regression:** generic test pips check off by transform and opacity. The release-level figure (about a week to 8 to 10 hours, resume L26) sits in a "Related: release regression" aside as real text, with two bars that use duration-mapped CSS width transitions and no axis or scale. It is not drawn as the loop's own result.<br>**Review:** generic high / medium / low rows appear one at a time, once, as illustration only. The PR review agent (resume L25) sits in a "Related: PR review agent" aside, not on the station.<br>The L25 and L26 facts stay in Related asides.<br>**Opened PR:** the ticket swaps to a PR card layer with abstract before and after shapes (resume L21). | Stations stack in one column. Each shows its end-frame vignette inline above its text. All rows are listed, the check is drawn, and both bars are at full width. The index is still sticky (state, not motion). | Below the stage gate: no sticky frames, the index is hidden, and each station's `h3` names the stage. The chip on the rail shows state by color and icon. |
| `#safety` | The track passes a gate. A "billing / auth" lane stops at a human-approval checkpoint. Retry counters cap by tier (drawn as one retry meter; see the next column). The kill switch is drawn here and is also the real, working control (resume L24). | A threshold on the eased section progress closes the gate (Cerebrium technique 1 `open()` and `close()`). Four real-text lines, one per safety rule, toggle `.is-checked` at `top 80%`: an icon fills and the text steps to full contrast. Lines change state, never visibility (an adaptation of Apple technique 2's spec lines). A retry meter fills to a cap line (no discrete pips, no numbers, no tier names, one meter only), so no cap or tier count can be read from it. The drawn kill switch is a real `<button>` bound to the same state as the header control. | All four lines are checked. The gate is drawn closed on the billing and auth lane. The switch shows its current state. | Lanes become short stubs off the rail. The lines stack. |
| `#mcp` | The track branches into tool lanes. A classifier node routes a question to one lane. A "delete" lane is visibly fenced off (resume L22). | Branches are cubic curves in the anchor-built path (United Carriers technique 1). The ticket stays on the main track. A small question token travels one short lane by `stroke-dashoffset` on that lane's own path segment, once. The fenced lane is static and drawn with a fence pattern; no motion is needed to say "excluded". | A static diagram with the routed lane highlighted. | Lanes become stubs. The token is omitted. |
| `#platform` | The track runs through a calm, organized grid of abstract component tiles (the 150+ component library, resume L28). Small markers join the track behind the ticket to show team adoption (resume L27). | Linear technique 5 grid discipline. Optional zoom-out into the grid: one wrapper scrubbed from a large `scale` down to 1, with `will-change` set only in a window around the scene (Apple technique 2). Kept only if STORYBOARD.md gives it a slot. Markers appear once, by transform and opacity. | The grid at scale 1, with all markers shown. | No zoom. A static grid. |
| `#independent` | Two side tracks branch off to the FoundrKids and Pocket Chronicle case study panels and rejoin (resume L56, L62). | Branch and rejoin curves come from anchors (United Carriers technique 1). Each side track is its own short path, revealed by `stroke-dashoffset` on that segment only. Panels are solid sheets (Cerebrium technique 5) linking to the case study pages. | Both side tracks are fully drawn. | Side tracks become stubs, and the panels stack. |
| `#career` | The track becomes a vertical commit log. Each role is a commit with a date range and title. Older commits are dimmer (resume L18 to L53). | A straight vertical run, with commit dots on the track. Promotions appear as commits on the same branch (portfolio scan promotion stack). "Dimmer" means lower-step color tokens, every one passing AA. No opacity on text. No scroll animation on text. | Identical. | The rail is the commit line. |
| `#ask` | A terminal-styled panel beside the track. | Cerebrium technique 3's terminal mechanics, driven by the visitor's question instead of a loop. Answers go into an `aria-live` region. The section progress bus is idle here, so the ticker callback is removed. | Answers render at once, with no line reveal. | Full width. |
| `#recommendations` | Signed-commit style quotes beside the track, as real HTML text. | Static. Behind a flag and off by default. It shows only real, attributed quotes used with permission, and is omitted entirely otherwise. | Identical. | Stacked. |
| `#contact` | The PR's checks all pass, it merges, and its status light turns green. The glow lands on the contact CTAs: "Ready for review." The signature moment. | A relay handoff (United Carriers technique 3): a real in-flow PR card sits beside the CTAs. As the focus line reaches it, the fixed ticket's PR layer aligns to that card's pre-measured rect, then an opacity swap hands off to the in-flow card. The merge plays on the in-flow card: checks pass, the status dot crossfades to green, and the glow fades and scales in (see 4.5). The CTAs are real text and visible from the start. | The in-flow PR card shows its final merged, green state beside the CTAs, with a static glow. | The same handoff to the in-flow card, with the glow kept clear of the sticky bottom bar. |
| `#footer` | Static. | No motion. A one-line `curl` easter egg mention, a colophon linking "How this site was built", and a disclosure line saying names appear as plain text and imply no endorsement (content.json `footer.disclosure`). | Identical. | Identical. |

### 4.3 Kill switch, reduced motion, and the static layout

- **One switch.** `html[data-motion="on" | "off"]` is set by an inline script in `<head>` before first paint, so there is no flash.

```html
<script>
  (function () {
    var saved = null;
    try { saved = localStorage.getItem("motion"); } catch (e) {}
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var valid = saved === "on" || saved === "off";
    document.documentElement.dataset.motion = valid ? saved : (reduce ? "off" : "on");
  })();
</script>
```

  Proposal for STORYBOARD.md: a saved choice wins, and with no saved choice, `reduce` means off. The engine also listens for changes to the reduced-motion media query.
- **The control.** A persistent `<button>` labeled "Pause motion" with `aria-pressed`, styled as the global kill switch from the safety model (resume L24). The label never changes; `aria-pressed` carries the state, and content.json has no separate "Resume motion" label. Turning motion off mid-scroll:
  1. Record which element sits at the focus line.
  2. Call `mm.revert()` on the `gsap.matchMedia` context, which reverts every trigger and tween and restores inline styles.
  3. Destroy Lenis, remove ticker callbacks, and hide the fixed ticket.
  4. Set `data-motion="off"` and save the choice with try/catch-guarded `localStorage`.
  5. Scroll the recorded element back to the focus line, because removing sticky frames changes the page height.
- **Turning motion back on** rebuilds the context, calls `ScrollTrigger.refresh()`, and sets the ticket state from the current scroll position without replaying finished vignettes.
- **The static layout** is the base CSS, not separate markup:
  - simple, fully drawn track segments between sections;
  - end-frame vignettes inline;
  - safety lines checked;
  - the merged PR beside `#contact`.
- **No content is ever gated by motion.** Every word is in the DOM in reading order at full opacity. Motion-on CSS resets only decorative, `aria-hidden` elements. Print uses the static layout.
- **QA cases this creates:** toggling mid-scroll at every stage, reduced motion emulated, keyboard-only navigation, anchor jumps with Lenis on and off, and a scrollspy test under wheel, keyboard, and anchor input (one portfolio site's scrollspy failed under synthetic scroll).

### 4.4 Mobile vertical track

- Below the stage gate, the track is a left rail just inside the 16px gutter, with content to its right. The path is a nearly straight vertical line with small jogs at stations. Branches in `#mcp` and `#independent` become short stubs.
- The ticket shrinks to a chip (about 56px wide) on the rail, showing only its status color and an icon per state. All stage text stays in the section content.
- No smoothing on touch. Unlike United Carriers, which keeps Lenis on an inner scroller with `lerp: 1` at 767px and below, this site uses native document scroll.
- The focus line uses `svh` units, and `ScrollTrigger.config({ ignoreMobileResize: true })` stops the address bar from triggering refreshes.
- No sticky vignette frames and no `#platform` zoom, as Apple serves a stacked layout on small screens.
- The chip and every other fixed or sticky element stay clear of the sticky bottom bar (Email, LinkedIn, Resume PDF). Two sticky things at the bottom would collide.
- Fewer composited layers: the backdrop steps its color at section boundaries with a class change (one repaint per boundary) instead of crossfading two full-viewport layers (see 4.5).

### 4.5 Frame-rate risks and how to avoid them

The goal is steady 60fps desktop scroll. That gives about 16.7ms per frame for everything, so script work per frame should stay at a few milliseconds, measured in the Performance panel.

**General rules**

1. **Transform and opacity only** for anything that changes every frame. These can skip layout and paint. Everything else (color, size, gradients, masks, shadows, filters) costs paint or layout.
2. **No layout thrash.** Never read layout (`getBoundingClientRect`, `offsetTop`, `getPointAtLength`) inside scroll callbacks. Measure once at build and on a debounced ResizeObserver (about 200ms, as United Carriers does), store the results in lookup tables, then only write during scroll. ScrollTrigger callbacks write targets, and one ticker callback writes the DOM (Cerebrium's pattern).
3. **One loop.** Lenis, ScrollTrigger, and the engine all run on `gsap.ticker`, with `lagSmoothing(0)`.
4. **`will-change` discipline.** It is permanent only on the fixed ticket and the cool backdrop layer, which change during the whole scroll. Scene layers get a `will-change` class about one viewport before their scene and lose it after, as Apple does around its zoom scene. Never put it on text, on many elements at once, or on the page-tall track SVG, where it would ask for one huge layer texture.
5. **No infinite loops, and an idle ticker.** Every animation is scrubbed, or plays once and stops. The engine's ticker callback is removed when no section is active. This avoids Linear's off-screen loops and Cerebrium's off-screen Lottie.
6. **CSS custom property costs.**
   - Setting a custom property invalidates style on its element. An unregistered property inherits, so its descendants are invalidated too. Writing `--calm` on `:root` every frame means a whole-document style recalculation every frame.
   - Register per-frame properties with `@property` and `inherits: false`, and set them on the one small element that uses them.
   - A custom property that feeds a gradient, mask, color, or shadow forces a repaint of that element each frame, while a direct `transform` or `opacity` change can go straight to compositing. Prefer tweening `transform` and `opacity` directly, and keep custom properties for small elements or for stepped (toggled) changes.
7. **Avoid paint-heavy properties on large or moving elements.** Do not animate `box-shadow`, `filter: blur()`, `backdrop-filter`, SVG filters, `mix-blend-mode`, or masks on big areas. Linear's blurred H1 entry runs once and is short. Apple gates its blend-over-video scene to viewports that can take it.
8. **The page-tall SVG.** Scrubbing `stroke-dashoffset` on one path that spans the whole page may invalidate a large paint area every frame. This is not measured yet. Plan for it by splitting the traveled overlay into per-section path segments: only the active segment updates, and the others sit fully drawn or hidden. Verify with paint flashing in DevTools.

**Risk A: the chaos-to-calm shift**

- **The risk:** interpolating colors across the page (gradient stops, many fills, or tokens on `:root`) every frame. That costs a large style recalculation and a full-viewport repaint per frame.
- **The plan:**
  - The backdrop is two fixed, `aria-hidden`, full-viewport layers with static gradients: warm (backlog) and cool (shipped). Only the cool layer's `opacity` is scrubbed from 0 to 1 across `<main>`. That is a compositor-friendly change on one promoted layer, with no gradient repaint.

```css
.backdrop { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
.backdrop-warm { background: var(--backdrop-warm); }
.backdrop-cool { background: var(--backdrop-cool); opacity: 0; will-change: opacity; }
html[data-motion="off"] .backdrop-cool { opacity: 0.5; will-change: auto; }
```

```js
gsap.to(".backdrop-cool", {
  opacity: 1,
  ease: "none",
  scrollTrigger: { trigger: "main", start: "top top", end: "bottom bottom", scrub: true },
});
```

  - The backlog clutter is a small, fixed number of decorative shapes that settle by `transform` and `opacity`.
  - Track and ticket colors step at station boundaries (a `data-state` toggle with a 200ms transition on small elements), never per-frame interpolation.
  - Text never reads `--calm`. Body text sits on solid sheets (Cerebrium technique 5), so AA holds at every point in the shift. The few display headings that sit on the backdrop get a contrast check at both ends.
  - The header gets no `backdrop-filter`, because a blur over a changing backdrop re-blurs every frame. If BRAND.md wants a frosted header, measure it first.
  - On mobile, a single backdrop layer steps by class at section boundaries.

**Risk B: the merge glow (signature moment)**

- **The risk:** animating `box-shadow` spread and blur, `filter: drop-shadow()` or `blur()`, an SVG `feGaussianBlur`, or a radial gradient's color and size every frame. On top of that, it happens during a layer handoff while Lenis is still easing.
- **The plan:**
  1. **Measure ahead.** The in-flow PR card's rect is measured at build and on resize, never at the moment of handoff.
  2. **Hand off first, then merge.** The fixed ticket's PR layer aligns to the card by transform, then an opacity swap leaves exactly one PR card visible (United Carriers technique 3).
  3. **Status light without color interpolation.** Two stacked dots (pending and green) crossfade by `opacity`.
  4. **Glow as a pre-painted element.** One element behind the CTA group has a static radial-gradient background, painted once. Only its `opacity` and `transform: scale()` animate.

```css
.merge-glow {
  position: absolute; inset: -40%; pointer-events: none;
  background: radial-gradient(closest-side, var(--merged-glow), transparent);
  opacity: 0; transform: scale(0.85);
}
.is-merged .merge-glow,
html[data-motion="off"] .merge-glow { opacity: 1; transform: none; }
```

  5. **Moving the light.** The rim-light travel to the status dot (Linear technique 2, adapted) uses a small dot element moved by `transform`, not a radial-gradient mask position. That avoids a repaint per frame at the most watched moment. The mask version stays on the ticket rim during `#pipeline`, where it is small and registered with `@property` and `inherits: false`.
  6. **Checks passing** is a few rows toggled once by `transform` and `opacity`.
  7. **Triggered, not scrubbed.** A time-based sequence of about one second runs once when the focus line crosses the card, and `onLeaveBack` returns it to the pre-merge state. A fling cannot stall it halfway.
  8. **`will-change` window.** The glow, the dot, and the card get it about one viewport before `#contact`, and lose it when the merge completes.
  9. **The end state is plain CSS** on the in-flow card, so the kill switch, reduced motion, print, and no-JS all show the merged, green result.
- **QA:** record the Performance panel through `#hero` to `#pipeline` (the start of the shift) and through `#contact` (the merge) at 1440px and 1024px, with Lenis on and off. Fix any long frame before adding polish.

### 4.6 JS budget

All figures are estimates to confirm against the real build output and Lighthouse.

| Item | Estimate (gzipped) | Notes |
|---|---|---|
| Next.js App Router runtime with React | roughly 85 to 95KB | The largest unknown. Measure first with an empty page. |
| GSAP core | roughly 25 to 28KB | Loaded by dynamic import after first paint |
| ScrollTrigger | roughly 12 to 14KB | Same |
| Lenis | roughly 4 to 5KB | Desktop with a fine pointer only |
| Engine (track, ticket, bus, gate, vignettes, kill switch) | under about 10KB | Framework-free module |
| Ask My Resume classifier and answers | fits the remaining headroom | Loaded as `#ask` approaches |
| **Target total** | **about 140 to 155KB** | Ceiling about 180KB |

- Not used: MotionPathPlugin (unless a stage proves it needs it), SplitText, Flip, Three.js, Lottie, video, and image sequences.
- The LCP is the hero text. It never waits on GSAP or Lenis.
- For scale: Cerebrium ships about 624KB of compressed first-party JS (measured with Resource Timing). Linear ships roughly 789KB gzipped and the Apple product page about 798KB gzipped (both estimated in the browser). Their weight is 3D, video, and app-grade mock UI, not motion code.

### 4.7 Hosting

- `output: 'export'` produces plain HTML, CSS, and JS files. GitHub Pages (the chosen host, deployed by GitHub Actions) and Cloudflare Pages both serve them unchanged, with no server. Nothing in this research makes React harder to host statically.
- Two safeguards for the export:
  - If `next/image` is used, set `images: { unoptimized: true }`, because there is no image server.
  - Add an empty `public/.nojekyll` in case Pages is ever switched from Actions to branch deploys, where Jekyll would skip the `_next/` folder.
- **Plain HTML stays an accepted fallback.** If the React layer ever made GitHub or Cloudflare hosting harder, the engine module, CSS, and SVG would move into a plain HTML page unchanged. That is why the engine is framework-free and React only emits markup and attributes. Cerebrium (a static, island-based build) and Apple (server-rendered HTML with no common framework) both show that every technique in this plan works without a client framework.

### 4.8 Where this site deliberately differs from the inspiration sites

- No text starts at opacity 0, and there is no preloader. All four inspiration sites start some text hidden.
- Reduced motion and the kill switch turn off scrubbed scenes and smooth scroll, not just media.
- No infinite loops, on or off screen.
- One copy of every heading. No duplicated desktop and mobile headings, and no triple `textContent`.
- Decorative SVG and canvas are `aria-hidden`. Active states use more than color.
- Every text color step passes WCAG AA, including during the chaos-to-calm shift.
- No logos, no vendor UI lookalikes, and no third-party trackers or cookies.

### 4.9 Open questions for STORYBOARD.md

1. `#pipeline` layout: per-station sticky vignettes (planned), or Apple's single shared frame. The single frame looks calmer but moves vignettes away from their own text in the static layout.
2. `#platform`: keep or cut the optional zoom-out. If it competes with the ticket for attention, cut it, because one hero object wins.
3. A saved motion choice overriding `prefers-reduced-motion` (proposed in 4.3) needs a yes or no.
4. Lenis stays in the stack. If it costs frames or fights sticky frames in QA, Apple and Linear show that native scrolling is enough for this kind of page (Linear confirmed with wheel input; Apple not tested with wheel input).
5. Measure the Next.js runtime on an empty page before committing to the budget split above.
