# Product Requirements Document — Kontrapuntal V1

**Status:** Approved baseline for implementation  
**Product:** Kontrapuntal  
**Temporary domain:** `kontrapuntal.whisnuys.com`  
**Owner:** Four-writer independent publication  
**Primary language:** English  
**Secondary purpose:** Improve the writers' English writing through consistent publishing  

---

## 1. Product summary

Kontrapuntal is an independent editorial platform for publishing thoughts triggered by things its writers read, watch, play, build, and observe.

It is not a professional review site and not a newsroom. The product should feel like a small independent publication with enough structure to support several writers and kinds of writing without forcing every piece into the same format.

Core subjects include:

- books
- games
- videos and podcasts
- technology
- software engineering
- work and career
- culture
- public issues
- personal reflections

The editorial voice may be opinionated and left-leaning, but every post should clearly distinguish personal interpretation from factual claims and should link primary or credible supporting sources when discussing external events.

---

## 2. Product philosophy

The name **Kontrapuntal** comes from the idea of reading or experiencing multiple voices at once rather than accepting one dominant perspective as complete.

The product principle is:

> Consume widely. Think independently. Write from more than one angle.

Kontrapuntal is a record of thinking in progress, not a claim to final authority.

---

## 3. Goals

### 3.1 Primary goals

1. Make publishing a new thought frictionless.
2. Build a durable archive of the writers' intellectual development.
3. Improve English writing through repeated public practice.
4. Give readers clear ways to discover writing by topic, medium, and format.
5. Keep V1 infrastructure free or effectively free for a personal non-commercial site.
6. Keep the architecture portable and maintainable by one developer.
7. Let four writers draft and publish through a browser without introducing a database or VPS.

### 3.2 Secondary goals

- Build a recognizable personal editorial identity.
- Support RSS and search-engine discovery.
- Make articles attractive when shared socially.
- Allow a future migration to newsletters, subscriptions, or comments without rewriting the content layer.

### 3.3 Non-goals for V1

- user accounts
- public comments
- likes/reactions
- payments or subscriptions
- paywall
- recommendation algorithms
- personalized feeds
- database-backed article storage
- real-time features
- native mobile app

---

## 4. Target users

### Primary user

The four writers, who need a low-friction writing and publishing system with independent publishing.

### Reader segments

- software engineers and technology readers
- people interested in books, games, and culture
- readers interested in personal essays and commentary
- friends, peers, recruiters, and professional contacts discovering the writers' thinking
- readers arriving from search engines or shared links

---

## 5. Editorial model

### 5.1 Content types

Every post has one primary content type:

- `book`
- `game`
- `video`
- `podcast`
- `technology`
- `issue`
- `learning`
- `career`
- `thought`

These describe what triggered the post, not the final topic.

### 5.2 Formats

Every post also has one format:

- `quick-note` — roughly 150–500 words
- `reflection` — roughly 500–1,200 words
- `essay` — roughly 1,200–3,000+ words

### 5.3 Editorial states

- `draft`
- `published`
- `archived`

Drafts never appear in production collections, RSS, sitemap, search index, or topic pages.

### 5.4 Editorial principles

1. Personal voice over fake authority.
2. Original interpretation over summary.
3. Clear distinction between fact and opinion.
4. Primary sources preferred for factual claims about current issues.
5. Short quotations only when they add real value.
6. No fabricated citations, quotes, statistics, or experiences.
7. When uncertain, say so.
8. Updating an old view is a feature, not an embarrassment.

### 5.5 Authors and editorial workflow

- Every note references one to four ordered Authors collection entries.
- Public author credit appears in article metadata and JSON-LD only.
- Decap CMS edits Notes and Authors in the private GitHub repository.
- A Decap draft creates a `cms/*` branch and pull request; publishing squash-merges it after CI.
- Writers may publish their own work, so branch protection requires CI but no human approval.
- Deletion is disabled; published notes are retired with `status: archived`.
- Private authoring metadata is shared among repository writers and never rendered publicly.

---

## 6. Information architecture

### Primary navigation

The global navigation is presented through a sticky utility row and hamburger drawer:

- utility row: `KTP`, Notes search, RSS, menu button;
- drawer: Home, Notes, Topics, About, all discoverable topics, and RSS;
- homepage-only topic strip: Popular plus up to four deterministic topics.

### Routes

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

### Future routes, not required in V1

```text
/now
/archive
/series/[slug]
/search
/newsletter
```

---

## 7. Homepage requirements

The homepage should take inspiration from the **editorial density and hierarchy** of Pirate Wires, not its exact visual design.

Pirate Wires currently presents a strong lead story followed by frequent short-form entries and distinct vertical sections for technology, politics, and culture. Kontrapuntal should adapt that pattern for a small publication with less clutter and no newsroom framing.

### Homepage sections

1. **Masthead**
   - homepage-only topic strip
   - Kontrapuntal wordmark

2. **Lead story**
   - most important or newest featured essay
   - large headline
   - dek/summary
   - content type + date + reading time
   - optional editorial image

3. **Popular posts**
   - up to four recent published posts other than the lead

4. **Newsletter announcement**
   - static “coming soon” message with no collection form

5. **Latest notes**
   - up to six recent posts
   - dense text-forward cards
   - not every card requires an image

6. **Topic/category sections**
   - topic-driven grouping such as Technology, Culture, Games, Books, Work
   - show only topics with enough content

7. **Footer**
   - RSS
   - personal site link
   - GitHub or social links if desired
   - copyright

---

## 8. Notes index requirements

The Notes page lists all published content.

Required capabilities:

- filter by content type
- filter by topic
- filter by format
- sort newest first by default
- client-side search over title, summary, topic, and source metadata
- URL query parameters should preserve filters where practical
- no database or network request required for filtering/search in V1

---

## 9. Article detail requirements

Each post page must support:

- title
- subtitle/dek
- ordered author byline
- publication date
- updated date when applicable
- reading time
- content type
- topics
- optional hero image
- optional source card
- prose body
- inline images and captions
- blockquotes
- code blocks where relevant
- share/copy link
- canonical URL
- Open Graph metadata
- JSON-LD `Article`

### Article body width

Target 660–760px for long-form readability.

### Article typography

- editorial serif for headline/body or headline only
- restrained sans-serif for UI and metadata
- line-height roughly 1.6–1.75
- no excessive cards inside article body

---

## 10. Library requirements

The Library records source material independent of whether a full note exists.

Supported source types:

- book
- game
- video
- podcast
- article

Supported status values:

- current
- finished
- paused
- dropped
- want-to-consume

Library entries may contain:

- title
- creator/author/developer/channel
- type
- status
- started/finished date
- cover or artwork
- external URL
- related note slug
- short private/public annotation

For V1, Library data can be a second Astro Content Collection stored in JSON or Markdown.

---

## 11. English-learning workflow

English improvement is a product purpose but should remain visually secondary.

Each content entry may include private authoring metadata such as:

- `writingFocus`
- `newWords`
- `commonMistakes`
- `draftNotes`

These fields must not be rendered publicly unless explicitly moved to a public field.

Recommended writing workflow:

```text
capture raw thought
→ write first draft
→ revise argument
→ grammar/vocabulary pass
→ preserve personal voice
→ source check
→ preview
→ publish
```

---

## 12. Content schema

A V1 note should support at least:

```yaml
---
title: "AI Can Generate Code, but Understanding Still Matters"
description: "My current thoughts on speed, understanding, and engineering judgment in the AI era."
authors:
  - whisnu-ys
publishedAt: 2026-08-09
updatedAt: 2026-08-09
status: published
featured: true
contentType: technology
format: reflection
topics:
  - artificial-intelligence
  - software-engineering
source:
  type: personal-observation
  title: "Using AI in daily software work"
heroImage: "/images/uploads/ai-understanding.jpg"
heroAlt: "Abstract editorial illustration about software and AI"
writingFocus: "Clearer transitions"
newWords:
  - trade-off
  - superficial
---
```

Required fields:

- title
- description
- authors
- publishedAt
- status
- contentType
- format
- topics

Validation must fail the build on invalid enum values or missing required metadata.

---

## 13. Design system direction

### Design goal

A serious independent editorial publication: text-forward, high-contrast, human-designed, slightly radical, but not visually theatrical.

### Reference lessons from Pirate Wires

Use:

- strong editorial hierarchy
- headline-first cards
- dense homepage rhythm
- clear vertical/topic groupings
- mix of feature stories and shorter items
- confident typography

Do not copy:

- logo
- typography pairing exactly
- exact grids
- article card proportions
- subscription language
- slogans
- colors
- iconography
- political voice

### Kontrapuntal visual rules

Suggested palette:

```text
Paper       #ECE5D8
Ink         #151613
Surface     #20211D
Muted Ink   #AAA69B
Rule        #45463F
Oxblood     #9B3A34
Olive       #858A62
```

Rules:

- near-black rather than pure black as the default canvas
- warm paper rather than pure white for primary typography
- one restrained accent color
- thin rules and whitespace instead of card shadows
- squared or very small-radius surfaces
- no gradients in core editorial UI
- no glassmorphism
- no decorative blobs
- no giant 3D illustrations
- no dashboard aesthetic
- no excessive motion
- imagery must support editorial context, not decorate empty space

---

## 14. Technical requirements

### Required stack

- Astro 7.x (latest stable release)
- Node.js 24 LTS
- TypeScript strict mode
- Astro Content Collections
- Markdown by default
- MDX only when an article needs components/embeds
- CSS custom properties + vanilla CSS in V1
- Git + GitHub
- Vercel deployment
- Decap CMS for Git-backed Notes and Authors
- Vercel adapter for the two GitHub OAuth routes only

### V1 database decision

**No database.**

Git-backed content is the canonical data store for editorial content.

### Future database decision

If Kontrapuntal later requires comments, subscribers, reactions, user accounts, or other mutable data, use:

- Neon Postgres
- Drizzle ORM
- server-side Astro routes or Vercel Functions only where necessary

The database must never become the canonical source for published article Markdown unless there is an explicit migration project.

---

## 15. Deployment requirements

### Recommended V1 deployment

**Vercel Hobby** while the site remains personal and non-commercial.

Reasons:

- `whisnuys.com` already lives on Vercel
- public Astro pages remain statically generated on Vercel
- every Git branch/PR can get a preview deployment
- `kontrapuntal.whisnuys.com` can be attached as a subdomain to a separate Vercel project
- no VPS or server process to maintain

### Deployment pipeline

```text
Decap `cms/*` or local branch
→ GitHub push
→ GitHub PR
→ Vercel Preview
→ review
→ merge to main
→ Vercel Production
→ kontrapuntal.whisnuys.com
```

### Production branch

`main`

### Preview policy

Every PR that affects UI or content should be reviewed through its preview deployment before merge when practical.

---

## 16. SEO requirements

Required in V1:

- unique title and meta description per post
- canonical URL
- Open Graph metadata
- Twitter/social metadata
- XML sitemap
- RSS feed
- robots.txt
- `Article` JSON-LD with ordered `Person` authors
- semantic heading structure
- meaningful image alt text
- internal links
- stable slugs

Do not change a published slug casually. If a slug changes, add a permanent redirect.

---

## 17. Performance requirements

Targets:

- static HTML for core article pages
- no frontend framework runtime by default
- JavaScript only for search/filter/theme interactions that require it
- optimized responsive images
- no blocking third-party scripts unless justified
- Lighthouse Performance target >= 90 on representative mobile pages
- Lighthouse Accessibility target >= 95
- no CLS caused by article images

---

## 18. Accessibility requirements

- semantic HTML landmarks
- visible keyboard focus
- no color-only meaning
- WCAG AA contrast target
- alt text for meaningful images
- captions when context matters
- reduced-motion support
- keyboard-operable navigation/filtering
- skip-to-content link

---

## 19. Security and privacy

V1 has a small attack surface because it has no public forms, auth, or database.

Requirements:

- no secrets committed to Git
- dependencies reviewed before addition
- no arbitrary client-side HTML injection
- no untrusted remote MDX rendering
- external links use safe attributes where applicable
- security headers configured through Vercel where practical
- analytics should be privacy-conscious

---

## 20. Analytics

V1 analytics should answer only useful editorial questions:

- which notes are read
- where visitors come from
- which topics attract repeat reading
- whether readers open a second article

Avoid building custom analytics infrastructure.

Recommended initial approach: Vercel Web Analytics if available under the selected plan, or another privacy-friendly lightweight analytics service later.

---

## 21. Success metrics

Do not optimize V1 around raw traffic alone.

Primary metrics:

1. posts published per month
2. percentage of article readers who open another Kontrapuntal page
3. returning readers
4. organic impressions/clicks over time
5. publishing consistency

Personal success metric:

- visible improvement in clarity and confidence of English writing over multiple posts

---

## 22. V1 milestone plan

### Milestone 0 — foundation

- initialize Astro project
- configure TypeScript
- define design tokens
- configure content collections
- configure sitemap and RSS
- configure Vercel project/domain

### Milestone 1 — editorial core

- global layout
- homepage
- notes index
- note detail
- topic routes
- library
- about

### Milestone 2 — discovery

- client-side search
- filters
- RSS
- social metadata

### Milestone 3 — content and QA

Publish at least:

- 1 book reflection
- 1 game reflection
- 1 video/podcast note
- 1 technology essay
- 1 public-issue reflection
- 1 quick thought

Then complete:

- accessibility pass
- performance pass
- mobile QA
- metadata QA
- broken-link check

---

## 23. V1 acceptance criteria

V1 is shippable when:

- `kontrapuntal.whisnuys.com` resolves over HTTPS
- production deploys automatically from `main`
- PRs receive preview deployments
- invalid frontmatter fails the build
- drafts are not publicly routable
- homepage shows a lead article and latest notes
- notes can be filtered by type/topic
- every article has valid metadata and a canonical URL
- sitemap and RSS build successfully
- mobile layout works at 360px width
- keyboard navigation is usable
- no critical console errors
- no database is required for normal publishing
- a writer can draft and publish through Decap after CI passes
- a new post can still be published by adding one Markdown/MDX file and merging it to `main`

---

## 24. Deferred decisions

Do not implement until a real need appears:

- newsletter provider
- comments
- reactions
- membership/paywall
- database
- full-text hosted search
- object storage
- native apps
