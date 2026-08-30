# Kontrapuntal — Single Source of Truth (SOT)

This document contains the canonical decisions for V1. If another document conflicts with this file, **this file wins** unless the owner explicitly updates the decision here.

---

## 1. Identity

| Item | Decision |
|---|---|
| Product name | Kontrapuntal |
| Temporary production domain | `kontrapuntal.whisnuys.com` |
| Product type | Independent editorial publication |
| Editorial team | Four writers; authors may be added progressively |
| Primary language | English |
| Editorial posture | Personal, reflective, opinionated; may be left-leaning; clearly distinguish fact from interpretation |
| Reference product | Pirate Wires for editorial density/hierarchy only |

---

## 2. Technology

| Layer | V1 decision |
|---|---|
| Framework | Astro 7.x (latest stable release) |
| Node | 24 LTS |
| Language | TypeScript, strict mode |
| Rendering | Static-first |
| Content | Astro Content Collections |
| Default authoring | Markdown |
| Rich authoring | MDX only when necessary |
| Editorial CMS | Decap CMS backed by the private GitHub repository |
| Styling | CSS custom properties + vanilla CSS |
| Client JS | Minimize; use only for interaction |
| Version control | Git |
| Remote | GitHub |
| Production hosting | Vercel |
| Database | None |
| Search | Build-generated/client-side |
| Media | Repository-local images, including CMS uploads under `public/images/uploads` |
| Coding agent | Codex governed by `/AGENTS.md` |

---

## 3. Deployment decision

Kontrapuntal deploys as a **static-first Astro project on Vercel**. Public pages remain
build-time generated. The Vercel adapter exists only to serve the two server-rendered
GitHub OAuth endpoints required by Decap CMS:

```text
GET /api/cms/auth
GET /api/cms/callback
```

No public content route depends on a server runtime or database. The adapter may emit its own image,
server-island, 404, and fallback manifest entries; the two CMS OAuth endpoints are the only
application routes allowed to target the Vercel function.

The Vercel project for Kontrapuntal is separate from the existing personal-site project even though both use subdomains under `whisnuys.com`.

Production mapping:

```text
whisnuys.com                  → existing Vercel project
kontrapuntal.whisnuys.com     → Kontrapuntal Vercel project
```

Production branch: `main`.

Preview deployments are expected for GitHub pull requests.

---

## 4. Database decision

### V1

No database.

Reason: all required publication data is editorial and immutable enough to live in Git.

The canonical record for a published post is its source file in the repository.

### Trigger for V2 database

A database may be introduced only after at least one requirement needs mutable server-side state, for example:

- public comments
- reactions
- newsletter/subscriber records owned by Kontrapuntal
- user accounts
- bookmarks
- editorial workflow state that cannot reasonably live in Git

### Default V2 database

If needed, use **Neon Postgres + Drizzle ORM**.

Do not add the database speculatively.

---

## 5. Canonical content model

### Notes collection

Required fields:

```ts
title: string
description: string
authors: ReferenceDataEntry<'authors'>[] // ordered, 1–4 entries
publishedAt: Date
status: 'draft' | 'published' | 'archived'
contentType:
  | 'book'
  | 'game'
  | 'video'
  | 'podcast'
  | 'technology'
  | 'issue'
  | 'learning'
  | 'career'
  | 'thought'
format: 'quick-note' | 'reflection' | 'essay'
topics: string[]
```

Optional public fields:

```ts
updatedAt?: Date
featured?: boolean
heroImage?: ImageMetadata | string
heroAlt?: string
source?: {
  type: string
  title: string
  creator?: string
  url?: string
}
```

Optional private authoring fields:

```ts
writingFocus?: string
newWords?: string[]
commonMistakes?: string[]
draftNotes?: string
```

Private fields must never be rendered in production UI unless explicitly promoted to a public field.

### Authors collection

Authors are first-class Content Collection records stored as JSON. Their stable content entry IDs
are referenced by notes so names can be corrected without rewriting every article.

Required fields:

```ts
name: string
```

V1 intentionally has no author biography, avatar, social links, author index, author page, author
filter, or author search. Public author credit appears only in article metadata and article JSON-LD.
The author reference order is the public byline order.

### Library collection

Library sources live in a second static Content Collection so they can exist independently of published notes.

Required fields:

```ts
title: string
type: 'book' | 'game' | 'video' | 'podcast' | 'article'
status: 'current' | 'finished' | 'paused' | 'dropped' | 'want-to-consume'
```

Optional public fields:

```ts
creator?: string
startedAt?: Date
finishedAt?: Date
cover?: ImageMetadata | string
coverAlt?: string
externalUrl?: string
relatedNotes?: string[]
annotation?: string
```

Optional private fields:

```ts
privateNotes?: string
```

Private library notes must never be rendered.

### Archived notes

Archived notes keep their stable `/notes/[slug]` route and render a visible archived label plus `noindex,follow` metadata. They are excluded from the homepage, notes index, topic pages, client search, RSS, sitemap, and related-note targets.

---

## 6. Canonical routes

```text
/
/notes
/notes/[slug]
/topics
/topics/[topic]
/about
/feed.xml
/sitemap-index.xml
/robots.txt
/admin
/api/cms/auth
/api/cms/callback
```

`/admin` is the Decap authoring application. The two `/api/cms/*` routes are its OAuth boundary and
must not be used as a general site API. Do not add top-level routes casually. Navigation should
remain compact.

### Deferred library

The existing `/library` route and its static content collection are preserved in the repository for a later release batch, but Library is not linked from the current V1 navigation. It is intentionally omitted from the canonical public route list until that batch is approved.

---

## 7. Homepage hierarchy

Required order:

1. masthead
2. featured lead story
3. popular posts
4. newsletter coming-soon announcement
5. latest notes
6. topic/category sections
7. footer

The newsletter announcement is static in V1. It must not present a working email field or imply that an address has been collected until a real subscription provider is approved and connected.

Notes may reappear across popular, latest, and topic/category sections when the repetition provides useful editorial recirculation. A note must not repeat within the same section.

The homepage renders eight fixed topic bands—Attention, Craft, Learning, Media, Books, Games, Society, and Technology—with three notes per band. Each band uses its owner-approved topic color and an explicit contrasting foreground color.

About remains a first-class route but is not a homepage section in this composition. Library is deferred to a later release batch.

Homepage is editorial, not dashboard-like.

### Homepage-only shell

The homepage renders the large `Kontrapuntal` wordmark and a build-time topic strip containing `Popular` plus at most four discoverable topics. The topic strip is not rendered on article, index, topic, library, or about pages.

The homepage featured-card footer keeps topic tags left-aligned and the `Read note ↗` action right-aligned at desktop and narrow mobile widths.

### Global navigation shell

Every route renders a sticky utility row containing `KTP`, an icon-only Notes search action, `RSS`, and a hamburger menu. The search action opens one native global dialog containing phrase, subject, topic, and format filters. Applying filters navigates to the Notes index and encodes the selected filters in its URL query parameters.

The KTP mark uses the supplied default and hover logo assets, the homepage masthead swaps between `/images/wordmark.svg` and `/images/wordmark-hover.svg`, and the canonical V1 favicon is `/favicon_kp/favicon.svg`.

The filter dialog uses balanced three-column controls on tablet/desktop and a compact two-column select layout on mobile so users do not need to scroll the dialog above the on-screen keyboard.

The hamburger opens a native right-side dialog drawer containing the canonical primary routes, all discoverable topics, and RSS. Drawer and hamburger animations must respect `prefers-reduced-motion`.

The global shell also provides a compact floating scroll-to-top button after the reader has scrolled past approximately 75% of one viewport. Keep the mobile version small enough not to obscure content.

The utility row must remain outside constrained page sections. Horizontal clipping uses `overflow-x: clip`; do not replace it with `overflow-x: hidden`, which can create a scrolling container and break sticky positioning.

---

## 8. Design non-negotiables

- editorial, not SaaS/dashboard
- no glassmorphism
- no generic gradient hero
- no excessive rounded cards
- no decorative floating shapes
- no gratuitous animation
- typography and hierarchy carry the design
- images are editorial evidence/context, not filler
- dark ink canvas with warm paper typography
- one primary accent only
- no direct visual cloning of Pirate Wires

Canonical initial tokens:

```css
--paper: #ECE5D8;
--ink: #151613;
--surface: #20211D;
--muted-ink: #AAA69B;
--rule: #45463F;
--accent: #9B3A34;
--olive: #858A62;
```

---

## 9. Git workflow

Branches:

```text
main
feature/<short-name>
fix/<short-name>
content/<post-slug>
chore/<short-name>
```

Rules:

- do not commit directly to `main` for meaningful implementation changes
- keep commits focused
- content-only changes may use `content/*`
- PR title explains outcome, not implementation noise
- Vercel preview should be checked for UI changes
- merge only after `npm run check` and `npm run build` succeed

### Decap editorial workflow

- The private GitHub repository remains the canonical content store.
- Each writer must have GitHub write access before using Decap in production.
- Decap uses editorial workflow: saving a draft creates or updates a `cms/*` branch and pull request;
  publishing squash-merges that pull request into `main`.
- Repository settings must require a pull request and the `CI / verify` check for `main`, while
  requiring zero human approvals so a writer can publish their own work after CI passes.
- CMS deletion is disabled. Retire a note with `status: archived`; do not delete published files.
- Initial rollout starts with Whisnu Ys. The other three authors may be created later in Decap and
  then granted GitHub write access when they join.
- Production loads the pinned Decap CMS `3.15.1` browser bundle with Subresource Integrity. Local
  authoring uses pinned `decap-server` `3.10.0`.
- The production OAuth app uses private-repository `repo` scope and an exact canonical callback.
  OAuth state lives for ten minutes in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie. The callback
  validates origin, provider, state, and code before server-side token exchange, then posts the
  result only to the canonical opener origin. Secrets and tokens must never be logged.
- GitHub OAuth client ID and secret exist only as Vercel Production environment variables. Local
  authoring uses the filesystem proxy; preview domains do not run production OAuth.

---

## 10. Quality gates

Every implementation PR must pass:

```bash
npm test
npm run verify:cms
npm run check
npm run build
npm run verify:build
```

Content PRs must additionally confirm:

- factual external claims have sources where appropriate
- no accidental private author notes are exposed
- title/description are unique
- image alt text exists when an image conveys content
- links work

---

## 11. Definition of done

A feature is done only when:

- it works on mobile and desktop
- keyboard use is supported where interactive
- loading/layout behavior is stable
- no new unnecessary dependency was introduced
- no application server route exists outside the explicitly approved Decap OAuth routes
- docs are updated when a canonical decision changes
- build passes

---

## 12. Change control

When changing a canonical architectural decision:

1. update this SOT first
2. update PRD/AGENTS if affected
3. implement code
4. document migration impact

Codex must never silently override a SOT decision.
