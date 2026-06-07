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
- Legacy app tokens such as `--color-*` remain as compatibility aliases.
- Temporary Benson UI aliases such as `--bui-*` remain for one migration window.

## Compatibility Debt

The `--bui-*`, `/benson-ui/`, and `@benson/ui` migration paths are temporary. Keep them until the Vellum homepage, PoolBuilder vendor bundle, and Biblioplex package migration have each shipped from reviewed consumer PRs. After one release with no live consumer references to the old names, remove the alias tokens and the old-name rewrite/redirect branches from `scripts/release-consumers.mjs`.

## Release Model

Merging to `main` runs the release workflow. It opens consumer PRs for:

- `benson/benson.github.io`: publishes the Vellum UI design-system site.
- `benson/poolbuilder`: vendors Vellum UI into the static app.
- `benson/biblioplex`: updates the Cloudflare app package pin and build wiring.

By default the release workflow opens consumer PRs and leaves them for review. Set `VELLUM_RELEASE_MERGE=1` only for an intentional auto-merge run; Biblioplex production deploys through its existing Cloudflare deploy workflow after that merge.

The release workflow requires a fine-grained repository secret named `BENSON_RELEASE_TOKEN` with write access to those consumer repositories.
