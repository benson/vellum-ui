# Vellum UI

Shared CSS tokens, browser-native UI primitives, and app-agnostic ESM helpers for Benson Perry apps.

The npm package name is `@benson/vellum-ui`. The public Storybook component workbench lives at:

https://bensonperry.com/vellum-ui/design-system/

Experimental component workbenches live under:

https://bensonperry.com/vellum-ui/labs/

Current labs:

- Modal Lab: `/vellum-ui/labs/modal/`

## Development

```sh
npm run storybook
```

Storybook renders the real Vellum CSS and ESM helpers with live controls,
named component states, interaction checks, and accessibility inspection.

Run the complete package, visual, Storybook build, and Storybook interaction
suite with:

```sh
npm run check
```

The package source lives in `src/`. Browser-consumable artifacts are generated into `dist/`.

Edit source files only. Do not hand-edit `dist/`.

## Modal resizing

`makeModalInteractive(target, options)` and `modal(target, options)` accept
`resizeEdges`: an array containing any of `left`, `right`, `top`, `bottom`,
`bottom-left`, `bottom-right`, `top-left`, and `top-right`.
The default is `['right', 'bottom', 'bottom-right']`. To retain the previous
left-side handles, pass `resizeEdges: ['bottom', 'left', 'bottom-left']`.

```js
makeModalInteractive(card, {
  resizeEdges: ['right', 'bottom', 'bottom-right'],
  minWidth: 220,
  minHeight: 140,
  margin: 24,
});
```

Right resizing keeps the left edge fixed; top resizing keeps the bottom edge
fixed. Both support centered and anchored cards, minimum sizes, and viewport
margins. The existing left, bottom, and bottom-left resize behavior is unchanged.

Every handle retains `data-vui-modal-resize-handle="<edge>"` and also exposes
`data-vui-modal-resize-edge="<edge>"`. Consumers can draw a corner grip with a
selector such as `[data-vui-modal-resize-edge="bottom-right"]::after`.
Handles use directional resize cursors, and corner handles sit above edge handles.

## Token Names

- Canonical package tokens use `--vui-*`. Vellum's own CSS and JS reference only these, and tokens.css exports nothing else.
- Consumers either use `--vui-*` directly or maintain their own alias layer (tomebound's styles.css defines `--color-*: var(--vui-color-*, fallback)` on its :root as its retuning point).

## Compatibility Debt

The `--bui-*` aliases and the `/benson-ui/` / `@benson/ui` rewrite branches were removed once consumers shipped with no live references to the old names. Vellum's internal CSS migrated off the unprefixed aliases in 2026-06, and the unprefixed compatibility alias block was dropped from tokens.css shortly after.

2026-06 token dedup (consumers migrated in the same pass): the `--vui-color-<tone>-bg/-border/-text` status family collapsed into `--vui-status-*` (now the only spelling), `--vui-shadow-hard-small` collapsed into `--vui-shadow-hard-sm`, and the `--vui-font-size-xs-plus`/`-sm-plus` half-steps were removed from the ramp (biblioplex keeps them as local tokens). None outstanding.

## Release Model

Merging to `main` runs the release workflow. It opens consumer PRs for:

- `benson/benson.github.io`: publishes the static Storybook build at the existing Vellum UI design-system URL.
- `benson/poolbuilder`: vendors Vellum UI into the static app.
- `benson/tomebound`: updates the Cloudflare app package pin and build wiring.

By default the release workflow opens consumer PRs and auto-merges them once each consumer's own checks pass. Set `VELLUM_RELEASE_MERGE=0` for a review-only run that leaves the PRs open. Biblioplex production deploys through its existing Cloudflare deploy workflow after the merge. The safety gate is `npm run check`, which includes a headless-browser check of the design-system page (`npm run test:visual`).

The release workflow requires a fine-grained repository secret named `BENSON_RELEASE_TOKEN` with write access to those consumer repositories.
