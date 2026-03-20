<p align="center">
  <img src="./public/icons/hero-logo-light-1024.png" alt="InlinePDF Logo" width="132" />
</p>
<h1 align="center">InlinePDF</h1>

InlinePDF is a local-first PDF workspace for fast document operations without mandatory cloud upload.

Many PDF tools require server upload before merge, crop, extract, or conversion workflows can start. InlinePDF addresses that privacy and latency problem by running core file processing in the browser on local files. The result is a direct workflow for everyday PDF work, including retailer label preparation.

![InlinePDF Preview](./assets/readme/inlinepdf-preview.png)

## What InlinePDF Does

### Core Tools

**Merge PDF** combines multiple PDFs in a selected order.  
**Extract Pages** creates a new PDF from selected pages.  
**Crop PDF** applies precise page-level cropping controls.  
**Image to PDF** combines JPG and PNG files into one PDF.  
**PDF to Images** exports pages as images in a ZIP archive.  
**PDF Info** inspects metadata, producer details, and font data locally.

### Retailer Label Workflows

InlinePDF includes dedicated shipping-label preparation for **Meesho Labels**, **Amazon Labels**, and **Flipkart Labels** from marketplace PDFs.

## What Is Unique

Document operations run in-browser instead of remote processing. The same product includes general-purpose PDF tools and retailer label workflows, so multiple document tasks stay in one local-first workspace. The architecture is modular, which keeps feature delivery focused and predictable.

## Build, Test, and Deploy

### Local Development

```bash
pnpm install
pnpm run dev
```

### Quality Gates

```bash
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run test
```

### Local Release Readiness

```bash
pnpm run verify
```

This command runs linting, type checks, tests, and build in sequence.

### Cloudflare Deploy

```bash
pnpm run deploy
```

`pnpm run build` generates Worker and static asset output under `build/`. `wrangler deploy` publishes the production Worker build. For staging, run `wrangler deploy --env staging` after build.

## License

InlinePDF is released under the MIT License.

### Acknowledgments

- **PDF.js:** PDF rendering and parsing are powered by Mozilla's `pdfjs-dist`. ([License](https://github.com/mozilla/pdf.js/blob/master/LICENSE))

- **pdf-lib:** PDF creation and document manipulation are powered by `pdf-lib`. ([License](https://github.com/Hopding/pdf-lib/blob/master/LICENSE.md))

- **React + React Router + Vite:** Application runtime and UI delivery are built with React, React Router, and Vite. ([License](https://github.com/facebook/react/blob/main/LICENSE), [License](https://github.com/remix-run/react-router/blob/main/LICENSE.md), [License](https://github.com/vitejs/vite/blob/main/LICENSE))

- **Tailwind CSS + shadcn/ui + Base UI:** Design system and component primitives are built with Tailwind CSS, shadcn, and Base UI. ([License](https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE), [License](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md), [License](https://github.com/mui/base-ui/blob/master/LICENSE))

- **dnd-kit:** Drag-and-drop interactions for file and page workflows are powered by `@dnd-kit`. ([License](https://github.com/clauderic/dnd-kit/blob/master/LICENSE))

- **JSZip:** ZIP export workflows are powered by `jszip`. ([License](https://github.com/Stuk/jszip/blob/main/LICENSE.markdown))

- **Hugeicons:** Product iconography uses `@hugeicons/core-free-icons` and `@hugeicons/react`. ([License](https://github.com/hugeicons/hugeicons-react/blob/main/LICENSE))

- **Cloudflare Workers:** Deployment and edge delivery are hosted on Cloudflare Workers.
