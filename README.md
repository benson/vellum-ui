# Vellum UI

Shared CSS tokens, browser-native UI primitives, and app-agnostic ESM helpers for Benson Perry apps.

The npm package name is `@benson/vellum-ui`. The public design-system surface lives at:

https://bensonperry.com/vellum-ui/design-system/

Experimental component workbenches live under:

https://bensonperry.com/vellum-ui/labs/

Current labs:

- Modal Lab: `/vellum-ui/labs/modal/`

## Development

```sh
npm run check
```

The package source lives in `src/`. Browser-consumable artifacts are generated into `dist/`.

Edit source files only. Do not hand-edit `dist/`.

## Token Names

- Canonical package tokens use `--vui-*`.
- Legacy app tokens such as `--color-*` remain as compatibility aliases while vellum's own component CSS still references them.

## Compatibility Debt

The `--bui-*` aliases and the `/benson-ui/` / `@benson/ui` rewrite branches were removed once consumers shipped with no live references to the old names. Remaining debt: migrate vellum's internal CSS off the unprefixed `--color-*` aliases, then drop that alias layer too.

## Release Model

Merging to `main` runs the release workflow. It opens consumer PRs for:

- `benson/benson.github.io`: publishes the Vellum UI design-system site.
- `benson/poolbuilder`: vendors Vellum UI into the static app.
- `benson/biblioplex`: updates the Cloudflare app package pin and build wiring.

By default the release workflow opens consumer PRs and auto-merges them once each consumer's own checks pass. Set `VELLUM_RELEASE_MERGE=0` for a review-only run that leaves the PRs open. Biblioplex production deploys through its existing Cloudflare deploy workflow after the merge. The safety gate is `npm run check`, which includes a headless-browser check of the design-system page (`npm run test:visual`).

The release workflow requires a fine-grained repository secret named `BENSON_RELEASE_TOKEN` with write access to those consumer repositories.
