# Kontrapuntal — Deployment & Data Recommendation

## Current recommendation

### Deployment

Use **Vercel** for Kontrapuntal.

Why:

1. `whisnuys.com` is already deployed/managed through Vercel.
2. `kontrapuntal.whisnuys.com` can be attached to the Kontrapuntal project as a separate subdomain.
3. Astro public routes remain statically generated, while the Vercel adapter serves the two Decap OAuth routes.
4. GitHub branches and pull requests get preview deployments for code and CMS editorial work.
5. There is no VPS, SSH, PM2, Docker, Nginx, or server patching to maintain.

### Runtime model

Readers do not depend on an application server. Only Decap’s GitHub OAuth handshake runs in Vercel
Functions:

```text
Astro source
→ build on Vercel
→ static public output + /api/cms/auth + /api/cms/callback
→ Vercel CDN
→ reader
```

The project keeps `output: 'static'`; the two OAuth routes explicitly set `prerender = false`.

### Plan

Use Vercel Hobby only while Kontrapuntal remains a personal, non-commercial project. Re-evaluate the plan before monetizing the publication or operating it as a business.

---

## V1 database recommendation

**Do not provision a database.**

Canonical editorial data lives in:

```text
src/content/notes/
src/content/authors/
src/content/library/
```

and is versioned by Git.

Benefits:

- zero database bill
- zero schema migration operations
- no connection management
- no runtime dependency for article rendering
- Git history provides content history/rollback
- local development works offline after dependencies are installed
- content stays portable to another host

---

## Future V2 database

Introduce a database only when mutable state exists.

Recommended default:

```text
Neon Postgres
+
Drizzle ORM
```

Good database candidates:

```text
comments
reactions
subscribers
accounts
bookmarks
editorial roles
```

Bad database candidates in the current architecture:

```text
published Markdown articles
static topic definitions
static source/library metadata
```

Decap is a Git editor, not a separate content store. Keep editorial Markdown in Git.

---

## Domain setup

Recommended project separation:

```text
Vercel Project: personal-site
  └── whisnuys.com

Vercel Project: kontrapuntal
  └── kontrapuntal.whisnuys.com
```

Add the subdomain from the Kontrapuntal project's **Settings → Domains** page and follow the DNS record Vercel supplies.

Do not point the entire apex domain to the new project.

---

## GitHub/Decap/Vercel flow

```text
Decap draft or feature/content branch
        ↓
GitHub Pull Request
        ↓
Vercel Preview Deployment
        ↓
review layout/content
        ↓
squash merge main
        ↓
Vercel Production Deployment
        ↓
kontrapuntal.whisnuys.com
```

---

## CI recommendation

Vercel builds are not a replacement for repository checks.

GitHub Actions should run:

```bash
npm ci
npm test
npm run verify:cms
npm run check
npm run build
npm run verify:build
```

before merge.

A starter workflow is included in the POC.

Protect `main` by requiring pull requests and the `CI / verify` check. Keep required approvals at
zero so each repository writer can self-publish after CI passes. See `docs/CMS.md` for the GitHub
OAuth app, Vercel environment variables, production smoke test, and writer onboarding.

---

## Rollback

For content/code regressions:

1. revert the Git commit or PR;
2. push/merge the revert;
3. Vercel deploys the corrected production build.

For urgent hosting-level rollback, use Vercel deployment history to promote/redeploy a known-good deployment, then reconcile Git immediately afterward.

Git remains the long-term source of truth.
