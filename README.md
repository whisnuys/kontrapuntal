# Kontrapuntal

Kontrapuntal is an independent editorial publication for thoughts, essays, reviews, and issue notes.

Built with Astro and deployed on Vercel. Public pages are static; Decap CMS writes Markdown and
author JSON directly to the private GitHub repository's `main` branch.

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

Then open `http://localhost:4321/nulis/`.

The CMS **Topics** collection contains the selectable topics for Notes. Add a topic there to make it
available in the Notes editor. You can edit a topic's display name without changing the lowercase
value already saved in notes; its filename is the stable value. Existing topic entries cannot be
deleted through the CMS.

The CMS **Formats** collection works the same way: add a format there to make it selectable for
Notes. The initial formats are Thought, Essay, Review, and Issue. Each note has one format and one
or more topics; Notes no longer use a separate Content type.

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
