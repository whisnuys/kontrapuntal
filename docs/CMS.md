# Kontrapuntal CMS operations

Kontrapuntal uses Decap CMS as a browser editor over the private GitHub repository. Git remains the
canonical record. Public pages are still generated at build time; only the GitHub OAuth handshake
uses a server runtime.

## First production setup

### 1. Create the GitHub OAuth app

Create one OAuth app in the GitHub account or organization that owns `whisnuys/kontrapuntal`:

```text
Application name: Kontrapuntal CMS
Homepage URL: https://kontrapuntal.whisnuys.com
Authorization callback URL: https://kontrapuntal.whisnuys.com/api/cms/callback?provider=github
```

Copy the client ID and generate a client secret. Never add either value to Git. If a secret is
exposed, rotate it in GitHub and Vercel immediately.

### 2. Configure Vercel production secrets

Add these environment variables to the Kontrapuntal Vercel project, scoped to **Production**:

```text
GITHUB_OAUTH_CLIENT_ID
GITHUB_OAUTH_CLIENT_SECRET
```

Redeploy production after setting them. OAuth deliberately accepts only
`https://kontrapuntal.whisnuys.com`; it does not run on localhost or preview domains. Local Decap
uses its filesystem proxy and does not need GitHub OAuth credentials.

### 3. Protect `main`

Create a branch protection rule or ruleset for `main` with:

- pull requests required before merging;
- the `CI / verify` status check required;
- zero required human approvals;
- branch deletion disabled if available;
- administrators included unless an emergency bypass policy is intentionally documented.

Zero required approvals is intentional: each writer may publish their own work after CI passes.
Decap squash-merges the editorial pull request when the writer selects Publish.

### 4. Smoke-test as the owner

After production deploys:

1. Open `https://kontrapuntal.whisnuys.com/admin/` in a new private browser window.
2. Sign in with GitHub and confirm the consent screen requests private repository access.
3. Create a draft note with Whisnu Ys as its author and save it.
4. Confirm GitHub created a `cms/*` branch and pull request.
5. Confirm Vercel attaches a preview deployment and `CI / verify` succeeds.
6. Open the preview and verify the note body, hero image, byline, and private-field non-disclosure.
7. Publish in Decap and confirm the pull request is squash-merged into `main`.
8. Confirm production deploys and the article contains its byline and JSON-LD author.
9. Archive the smoke-test note or remove it through a normal Git pull request if it was never
   intended as publication content. CMS deletion remains disabled.

These production steps require the repository owner’s GitHub and Vercel access and cannot be
completed by the local build alone.

## Add the other writers later

The initial Authors collection contains only Whisnu Ys. The other three author records do not need
to be filled in now. Add each writer when they join:

1. In Decap, open **Authors → New Author** and enter the public display name.
2. Publish the author record.
3. In GitHub, invite that writer to the private repository with **Write** access.
4. After they accept, ask them to sign in at `/admin/` and complete the owner smoke test with a
   draft of their own.

An author record controls the public byline. GitHub access controls who can edit and publish. Both
are required for a writer, but they can be configured at different times.

## Writing and publishing

- **Save** keeps work in Decap’s editorial workflow on a `cms/*` branch and pull request.
- **Set status to Published** controls whether Astro includes the note in discovery surfaces after
  merge; it is distinct from Decap’s Publish button.
- **Publish** in Decap merges the content pull request after required checks permit it.
- Use one to four authors. Their order in the Authors field is the byline order.
- Use `status: archived` to retire a published note while preserving its stable URL.
- `writingFocus`, `newWords`, `commonMistakes`, and `draftNotes` are shared among all repository
  writers but never rendered publicly.
- Rich Text is the default body editor and stores ordinary Markdown. Existing or developer-authored
  MDX can remain in Git, but Decap creates `.md` files.
- Uploaded files are limited to 5 MiB and committed under `public/images/uploads`.

## Local authoring

Install dependencies once, then run two terminals:

```bash
npm run dev
```

```bash
npm run cms:local
```

Open `http://localhost:4321/admin/index.html`. The local filesystem proxy listens on port 8081. Local CMS
writes modify repository files directly, so review `git diff` before committing.

Before pushing content, run:

```bash
npm test
npm run verify:cms
npm run check
npm run build
npm run verify:build
```

## Security boundaries

- OAuth state is a cryptographically random, ten-minute, `HttpOnly`, `Secure`, `SameSite=Lax`
  cookie and is checked before token exchange.
- The callback posts the token only to the canonical origin, never to `*`.
- GitHub client secrets and access tokens are not logged or returned in error messages.
- OAuth responses are `no-store`; the callback has a restrictive Content Security Policy.
- `/admin/` and `/api/cms/` are excluded in `robots.txt`, and the editor document is `noindex`.
- OAuth has `repo` scope because the canonical repository is private. Reassess that scope if the
  repository ever becomes public.

If login fails, check the exact OAuth callback URL, production environment-variable scope, custom
domain assignment, repository collaborator access, and the browser’s popup protection before
changing application code.
