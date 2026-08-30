# Kontrapuntal — Flow Diagrams

## 1. System architecture

```mermaid
flowchart LR
    A[Writer] --> B[Decap CMS /admin]
    C[Developer / Codex] --> D[Astro project]
    B -->|editorial PR| E[Private GitHub repository]
    D --> E
    E -->|pull request| F[CI + Vercel Preview]
    E -->|merge to main| G[Vercel Production Build]
    G --> H[Static public pages]
    G --> I[Two CMS OAuth functions]
    H --> J[Vercel CDN]
    J --> K[kontrapuntal.whisnuys.com]
    K --> L[Reader]
```

## 2. Content publishing flow

```mermaid
flowchart TD
    A[Capture idea] --> B[Create Decap Markdown draft]
    B --> C[Choose one to four ordered authors]
    C --> D[Write argument in own voice]
    D --> E[English clarity and grammar pass]
    E --> F[Fact/source check]
    F --> G[Save editorial draft]
    G --> H[cms branch + GitHub PR]
    H --> I[CI schema and privacy checks]
    I -->|invalid| B
    I -->|valid| J[Vercel Preview]
    J --> K{Looks correct?}
    K -->|No| B
    K -->|Yes| L[Publish / squash merge]
    L --> M[Vercel production build]
    M --> N[Published article]
```

## 3. Reader discovery flow

```mermaid
flowchart TD
    A[Reader entry] --> B{Entry source}
    B --> C[Homepage]
    B --> D[Search engine]
    B --> E[Shared article link]
    B --> F[RSS]
    C --> G[Lead story / latest / topic]
    D --> H[Article page]
    E --> H
    F --> H
    G --> H
    H --> I{Explore further?}
    I -->|Topic| J[Topic page]
    I -->|Notes index| K[Filtered notes]
    J --> L[Another article]
    K --> L
```

## 4. Build flow

```mermaid
flowchart TD
    A[Source files] --> B[Astro Content Collections]
    B --> C[Zod schema validation]
    C -->|fail| D[Build stops]
    C -->|pass| E[Generate routes]
    E --> F[Render static pages]
    F --> G[Generate RSS]
    F --> H[Generate sitemap]
    F --> I[Generate metadata/JSON-LD]
    G --> J[.vercel/output/static/]
    H --> J
    I --> J
    J --> K[Vercel CDN]
```

## 5. CMS authentication flow

```mermaid
flowchart LR
    A[Writer at /admin] --> B[/api/cms/auth]
    B --> C[GitHub OAuth]
    C --> D[/api/cms/callback]
    D -->|token to canonical opener only| A
    A --> E[Private GitHub repository]
```

OAuth is the only current server-rendered flow. It never renders public content.

## 6. Future dynamic-state flow — not current scope

```mermaid
flowchart LR
    A[Astro / Vercel runtime] --> B[Server-only route]
    B --> C[Drizzle ORM]
    C --> D[Neon Postgres]
```

This database flow remains intentionally excluded.
