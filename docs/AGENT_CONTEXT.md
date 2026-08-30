# Kontrapuntal — Current Agent Handoff

This is the compact implementation context for future agents. `AGENTS.md` contains operating rules and `docs/SOT.md` remains the canonical product/architecture decision record. If this handoff conflicts with either, follow the higher-priority document and update this file.

## Current product shape

Kontrapuntal is a static-first Astro editorial publication for four writers. Published writing lives in the `notes` Content Collection; drafts and archived notes are filtered by `src/lib/content-policy.ts`. Authors live in a small JSON Content Collection and notes reference one to four ordered authors. The homepage is the only page with the large `Kontrapuntal` wordmark and the topic strip.

Homepage order is:

1. featured lead story
2. Popular
3. newsletter coming-soon announcement
4. Latest
5. topic/category sections
6. footer

The newsletter is a static announcement only. Do not add an email field, subscriber storage, provider, or database without an explicit product decision.

## Header and navigation contract

`src/components/SiteHeader.astro` owns the global shell:

- Homepage: `Popular` plus up to four build-time-selected topics in the top topic bar, then the large wordmark.
- Every page: a sticky utility row containing `KTP`, an icon-only Notes search action, `RSS`, and a hamburger menu.
- The KTP home mark uses `/images/logo-kp.svg` and swaps to `/images/logo-kp-hover.svg` on hover or keyboard focus; the homepage masthead uses `/images/wordmark.svg` and swaps to `/images/wordmark-hover.svg`; the site favicon is `/favicon_kp/favicon.svg`.
- The search icon opens one native global filter dialog on every route. Applying its phrase, subject, topic, and format fields navigates to the filtered `/notes` index.
- The filter dialog keeps three select columns on tablet/desktop and a compact two-column select layout on short mobile viewports so the action row stays visible above the keyboard.
- Non-home pages: do not render the homepage topic bar or large wordmark.
- The hamburger opens a native right-side `<dialog>` drawer with primary routes, all discoverable topics, and RSS.
- The menu button morphs into a close icon; drawer open/close motion and the sticky-row entrance respect `prefers-reduced-motion`.
- A small floating scroll-to-top button appears after roughly 75% of one viewport has been scrolled. It is intentionally compact on mobile.

Topic navigation is deterministic and build-time only. `src/lib/navigation.ts` counts unique topics on discoverable notes, ranks featured topics by count then name, caps the top strip at four, and lists all topics alphabetically in the drawer.

The sticky row must remain a direct shell element. Do not put it inside a page section with constrained overflow. `html` and `body` use `overflow-x: clip`; changing them back to `hidden` can create a scrolling container and break sticky positioning.

## Featured card contract

The featured footer keeps topic tags on the left and `Read note ↗` on the right, including narrow mobile widths. Preserve this one-row alignment unless a new design decision explicitly changes it.

## Interaction and dependency boundaries

Client JavaScript is limited to real interactions: header drawer control, Notes filter dialog and client filtering, focus return, sticky-state observation, and scroll-to-top behavior. Do not add a framework or hydration for presentational layout.

## CMS and runtime boundary

Decap CMS is available at `/admin/` and edits only Notes and Authors. It uses GitHub editorial workflow against the private repository, with deletion disabled and `status: archived` as the retirement path. The initial author is Whisnu Ys; three more author records may be added later through Decap.

The Astro project keeps `output: 'static'` with the Vercel adapter. Only `/api/cms/auth` and `/api/cms/callback` opt out of prerendering. They are production-only GitHub OAuth routes fixed to `https://kontrapuntal.whisnuys.com`; do not reuse them as a general API. Secrets are Vercel environment variables and must never enter Git or logs. Operational setup and onboarding are in `docs/CMS.md`.

## Verification checklist

Run all of these before claiming completion:

```bash
npm test
npm run verify:cms
npm run check
npm run build
npm run verify:build
git diff --check
```

For UI work, inspect approximately 360px mobile, 768px tablet, and 1440px desktop widths. Keep changes focused and preserve unrelated user work in the working tree.
