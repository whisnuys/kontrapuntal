# Kontrapuntal

Kontrapuntal is an independent editorial publication for essays, reflections, and quick notes.

Built with Astro and deployed on Vercel. Public pages are static; Decap CMS writes Markdown and
author JSON to the private GitHub repository through pull requests.

## Development

```bash
npm install
npm run dev
```

The local site runs at `http://localhost:4321` by default.

To use the local CMS, keep the Astro development server running and start the local content proxy
in a second terminal:

```bash
npm run cms:local
```

Then open `http://localhost:4321/admin/`.

## Verification

```bash
npm test
npm run verify:cms
npm run check
npm run build
npm run verify:build
```

## Production

https://kontrapuntal.whisnuys.com
