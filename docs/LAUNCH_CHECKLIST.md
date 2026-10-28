# Launch checklist: travisjterry.dev

Everything needed to go live, apart from pointing the domain at GitHub Pages. Domain changed to travisjterry.dev; site copy, the curl command, the Worker, and the generated resume files are updated. **Me** = Claude can do it. **You** = needs Travis's login or decision.

## Deploy
- [x] **Me:** GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the static site and deploys to GitHub Pages on every push to `main`.
- [x] **You:** Repo Settings > Pages > Source: "GitHub Actions". Already set, with custom domain `travisjterry.dev`.
- [x] **Me:** Add a `CNAME` file with `travisjterry.dev` (`public/CNAME`).
- [x] **You:** After DNS resolves, tick "Enforce HTTPS" in Pages settings. `.dev` domains only load over HTTPS, so the site won't open in browsers until GitHub has issued the certificate.
- [x] **Me:** Add the public build values (Ask API URL, Turnstile site key) as repo variables so the live build includes the AI box.
- [x] **Me:** Send production builds to a separate folder so a build can't break the dev server again. `npm run build` now exports to `dist/`; dev keeps `.next/`.

## Launch blockers on the page
- [ ] **You:** Headshot photo (square, 800px or larger). The yellow NEEDED box shows until it's added.
- [x] **You:** Updated resume PDF, or Claude generates a corrected one from the site. The current `resume.pdf` still has:
  - [x] "Pocket Chronicles" with an s
  - [x] FoundrKids dated "2025" (should be February 2026)
  - [x] "two shipped AI products" (one shipped, one in pre-launch)
  - [x] The roughly 95% not marked as bug tickets only
  - [x] "a week" instead of "about a week"
- [x] **Me:** Open Graph share image (`/og.png`, 1200x630) for LinkedIn and Slack link previews.
- [x] **Me:** Favicon, 404 page, `robots.txt`, `sitemap.xml`.
- [x] **Me:** Link check. All links on the page resolve. The case study and "How this site was built" links are not rendered on the page, so nothing points to a missing page.

## AI box (Cloudflare Worker)
- [x] **You:** In the Turnstile widget, add hostnames `travisjterry.dev` and `www.travisjterry.dev` (the widget was set up for `.com`). Without this the AI box can't verify visitors on the live site.
- [x] **Me:** Worker `ALLOWED_ORIGINS` updated to `travisjterry.dev` and `www.travisjterry.dev`, and redeployed.
- [ ] **You:** Set a monthly spend limit at https://console.anthropic.com/settings/limits as a backstop to the $2 daily cap.
- [ ] **You:** Run the interview (`private/interview/INTERVIEW_PROMPT.md`) and save transcripts to `private/interview/`.
- [ ] **Me:** Load interview answers into the knowledge base (`cd worker && node scripts/ingest.mjs`). Optional for launch.

## Privacy and analytics
- [ ] **You:** Create a Cloudflare Web Analytics site and share the token.
- [x] **Me:** Analytics beacon is wired to the `NEXT_PUBLIC_CF_BEACON_TOKEN` repo variable. Until it's set, no beacon loads and the footer leaves out the "Visits are counted" sentence. Once you have the token: `gh variable set NEXT_PUBLIC_CF_BEACON_TOKEN` and push (or rerun the deploy).

## Your public footprint
- [x] **You:** Make `Rascal-Marketing` private. Done differently: the work email was rewritten out of every branch (Oct 28). Old PR pages keep it until GitHub Support purges them.
- [ ] **You:** Move the `journeymanwebco` lead files to a private repo.
- [ ] **You:** Check LinkedIn titles match the site (EOS Worldwide: Staff Frontend Software Engineer, Lead).
- [ ] **You:** Add the site URL to your LinkedIn profile.

## Final QA (Claude)
- [x] **Me:** Lighthouse on mobile and desktop. Mobile 98 / 100 / 100 / 100, desktop 100 / 100 / 100 / 100 (performance, accessibility, best practices, SEO). Fixed button contrast and the motion toggle's accessible name along the way.
- [x] **Me:** Check desktop (1440px) and phone (390px) layouts, with Pause motion on, with reduced motion, and in print. Fixed doubled hero numbers in print.
- [x] **Me:** Confirm `curl -sL travisjterry.dev/cli`, `resume.txt`, `resume.json`, and `llms.txt` serve correctly on the live domain.
- [ ] **Me:** Test `?ref=` tags in email links and the AI box on the live domain.
