# Package Script Naming Guidelines

This guide defines a practical script naming pattern for single-package and monorepo projects.
It follows the conventions commonly used across modern repos (pnpm, npm CLI, Bun, Turbo-based workspaces), with predictable root names like `dev`, `build`, `format`, and `typecheck`.

References:

- https://raw.githubusercontent.com/pnpm/pnpm/refs/heads/main/package.json
- https://raw.githubusercontent.com/npm/cli/refs/heads/latest/package.json
- https://raw.githubusercontent.com/oven-sh/bun/refs/heads/main/package.json
- https://raw.githubusercontent.com/nuxt/nuxt/refs/heads/main/package.json
- https://raw.githubusercontent.com/vitest-dev/vitest/refs/heads/main/package.json
- https://raw.githubusercontent.com/vercel/turborepo/refs/heads/main/package.json
- https://raw.githubusercontent.com/vercel/ai/refs/heads/main/package.json
- https://eslint.org/docs/latest/contribute/package-json-conventions

## Core Naming Pattern

Use lowercase script names with optional colon-separated parts:

```txt
<action>[:<target-or-mode>]*
```

Allowed separators:

- `:` for targets or modes (for example `dev:docs`, `test:watch`).
- `-` for multi-word parts (for example `build:edge-runtime`).

## Preferred Root Actions

Use these root names as defaults:

- `build`: create production artifacts.
- `dev`: local development mode.
- `lint`: static analysis.
- `format`: apply formatting changes.
- `test`: run test suite.
- `typecheck`: run TypeScript type checks only.
- `typegen`: generate type artifacts.
- `preview`: run built output locally.
- `release`: deploy or publish with external side effects.
- `clean`: remove generated files (optional).

Common optional roots in larger repos:

- `ci`: CI-focused orchestrations.
- `docs`: docs app/dev/build flows.
- `ui`: UI-specific package/app flows.
- `play`: playground flows.
- `debug`: debug-specific workflows.

Specialized roots seen in large repos:

- `changeset`: release/versioning workflow automation.
- `publint`: package publishability checks.
- `prepare`: install-time setup.
- `turbo`: direct workspace runner commands.
- `rustdoc`: language-specific docs generation.

## Suffix Conventions

- `:check`: validation-only, no file modifications (for example `format:check`).
- `:fix`: apply automated fixes (for example `lint:fix`).
- `:watch`: watch mode (for example `test:watch`).
- `:all`: run across all packages/targets in monorepos (for example `build:all`).
- `:<target>`: package, app, or scope target (for example `dev:docs`, `build:react`).
- `:beta`: toolchain preview checks (for example `typecheck:beta`).

## Behavioral Rules

- Keep `lint` and `typecheck` separate to make failures obvious.
- Keep `format` and `format:check` separate.
- `release` must be side-effectful; avoid hidden deploy behavior in `build`.
- Root scripts (`build`, `dev`, `lint`, `test`) should be the default entry points used by contributors and CI.
- In monorepos, use `:<target>` consistently instead of one-off aliases.

## Monorepo Pattern (Recommended)

Typical target variants:

- `build:all`, `build:web`, `build:react`
- `dev:all`, `dev:docs`, `dev:pg`
- `test:all`, `test:watch`
- `lint`, `format`, `format:check`, `typecheck`

This keeps commands discoverable while still supporting package-specific workflows.

## Ecosystem Variants And Normalization

Real-world repos use both canonical names and tool-specific variants. Use this normalization strategy:

- Prefer `format` and `format:check` over `prettier-fix` and `prettier-check`.
- Prefer `typecheck` over `type-check` for consistency.
- Prefer `build:<target>` over one-off names like `build-packages`.
- Prefer `test:<target>` over one-off names where possible.
- Keep specialized scripts only when they express a non-generic domain (`publint`, `changeset`, `check:toml`, `fix:toml`, `update-references`).

Examples from references:

- `docs:dev`, `docs:build`, `docs:serve`
- `ci:release`, `ci:version`, `ci:docs`
- `test:integration`, `test:update`, `test:browser:playwright`
- `build:examples`, `build:packages`, `build:turbo`

## Avoid vs Use Instead

| Avoid           | Use Instead    |
| --------------- | -------------- |
| `fmt`           | `format`       |
| `fmt:check`     | `format:check` |
| `start`         | `dev`          |
| `start:preview` | `preview`      |
| `lint:types`    | `typecheck`    |
| `build:types`   | `typegen`      |

## Reuse Checklist

1. Define root actions first (`dev`, `build`, `lint`, `format`, `test`, `typecheck`).
2. Add `:check`, `:fix`, `:watch`, and `:<target>` variants only when needed.
3. Keep script keys alphabetically sorted.
4. Ensure `:check` commands are non-mutating.
5. Use the same target name everywhere (`docs`, `react`, `all`, and so on).

## Canonical Script Set For This Repository

```json
{
  "build": "pnpm run typegen && react-router build",
  "cf-typegen": "wrangler types",
  "dev": "react-router dev",
  "format": "prettier . --write",
  "format:check": "prettier . --check",
  "lint": "eslint . --max-warnings=0",
  "lint:fix": "eslint . --fix",
  "preview": "pnpm run build && vite preview",
  "release": "pnpm run build && wrangler deploy",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "npm run cf-typegen && react-router typegen && tsc -b",
  "typecheck:beta": "pnpm --package=typescript@beta dlx tsc -b",
  "typegen": "pnpm run typegen:cf && pnpm run typegen:router",
  "typegen:cf": "wrangler types",
  "typegen:router": "react-router typegen"
}
```
