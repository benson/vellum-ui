# Vellum UI

Shared CSS tokens, browser-native UI primitives, and app-agnostic ESM helpers for Benson Perry apps.

The npm package name is `@benson/vellum-ui`. The public design-system surface lives at:

https://bensonperry.com/vellum-ui/design-system/

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

## Release Model

Merging to `main` runs the release workflow. It opens consumer PRs for:

- `benson/benson.github.io`: publishes the Vellum UI design-system site.
- `benson/poolbuilder`: vendors Vellum UI into the static app.
- `benson/biblioplex`: updates the Cloudflare app package pin and build wiring.

Consumer PRs are merged by automation only after checks pass. Biblioplex production deploys through its existing Cloudflare deploy workflow.

The release workflow requires a fine-grained repository secret named `BENSON_RELEASE_TOKEN` with write access to those consumer repositories.
