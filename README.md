# InlinePDF

InlinePDF is a local-first PDF toolkit and iLovePDF alternative.

## Core Product Rules

- All PDF processing runs client-side in the browser.
- No file uploads.
- No server-side PDF processing.
- No authentication, database, or user accounts.
- Features are shipped only when they can run fully local-first.

## Current Pages

- `/` Home (Header + Hero + Footer)
- `/tools` Tool catalog
- `/merge` Merge PDF (functional MVP)
- `/info` PDF Info (metadata and font insights)
- `/tools/:slug` legacy redirect to `/:slug`

## Tech Stack

- React Router + Vite + TypeScript
- Tailwind CSS + shadcn component primitives
- PDF-Lib for merge processing
- PDF.js adapter scaffold for future local-first tooling
- Cloudflare Workers deployment target

## Folder Architecture

- `app/components/layout/*` shared shell (`SiteHeader`, `SiteFooter`, `SiteShell`)
- `app/components/ui/*` minimal shadcn component primitives used by pages
- `app/features/tools/*` tool metadata and local-only policy model
- `app/features/merge/*` merge feature components and service
- `app/features/pdf/core/*` PDF service interfaces
- `app/features/pdf/adapters/*` library adapters (`pdf-lib`, `pdfjs`)
- `app/routes/*` route modules
- `app/styles/*` design tokens and base styles

## Local Development

```bash
pnpm install
pnpm run dev
```

## Quality Gates

```bash
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run test
```

## Adding New Tools

1. Add a new tool entry in `app/features/tools/registry.ts`.
2. Create a feature folder under `app/features/<tool-name>/`.
3. Add a route under `app/routes/` and map it in `app/routes.ts` as `/<tool-name>`.
   Canonical tool paths use direct slugs like `/merge`, `/split`, `/compress`.
4. Reuse `SiteShell` and existing UI primitives.
5. Keep processing local-only. If not possible yet, mark as `coming_soon`.
