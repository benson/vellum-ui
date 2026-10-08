# vellum-ui workstream — handoff plan

State as of 2026-06-10 (early am): EVERYTHING below is done. Item 2b shipped
(vellum e8189bd dropped the alias block — biblioplex turned out to already be
self-sufficient via its own `--color-*: var(--vui-*, fallback)` layer, so the
only consumer fix was poolbuilder's 3 unprefixed diff-color uses, 17dee32).
Packcracker migrated to the vellum combobox + owner-gated feedback mount
(packcracker 713ae0b3) and joined the release train as a 4th consumer
(vellum a0ca5f7); createSetAutocomplete deleted from shared/mtg.js
(homepage 0f1f0f3). Biblioplex dark pre-paint flash fixed (3dd0c5a: inline
head script + dark boot-curtain colors; no CSP on Pages so inline is fine).
All deployed + verified live. Still Benson-taste, untouched: dark-mode
loc/board/tag pill palettes + decorative gradients.

## context in one paragraph

Vellum (`~/Projects/vellum-ui`) is the canonical UI workbench. Loop: edit src/ →
`npm run check` (build + lint + unit + Playwright visual gate) → push main →
CI auto-releases and **auto-merges** pin-bump PRs into benson.github.io,
poolbuilder, and biblioplex (~3 min end to end; `VELLUM_RELEASE_MERGE=0` opts
out). Components live in vellum; biblioplex re-exports them
(`apps/web/app/ui/{chip,popover,floatingMenu,outsideClick}.js` are one-liners);
poolbuilder vendors dist via `sync:ui` and consumes tokens through `--vui-*`
aliases. Dark theme is a `[data-theme="dark"]` `--vui-*` layer — attribute goes
on `<html>` or the unprefixed aliases won't follow. Live workbench:
bensonperry.com/vellum-ui/design-system/ (the .html path 404s; use the
directory route).

## remainder, in order

### 1. ~~shrink biblioplex's design-system page to app-specific compositions~~ DONE 2026-06-09
Shipped as biblioplex 875a54b, deployed + verified live. Cut token playground,
token swatches, generic buttons/segmented/fields, and banner; kept domain
chips, collection table, chat panel, deck tile, containers, history, inline
status, feedback capture, FABs, adherence backlog. Header links to the vellum
catalog. Note for local dev: the npm-installed @benson/vellum-ui dist in
biblioplex's node_modules was stale (built from pre-ui-chip source despite the
correct 8a67c40 pin — poisoned npm git-dep cache artifact). Fixed locally by
copying ~/Projects/vellum-ui/dist over node_modules/@benson/vellum-ui/dist; CI
installs fresh so prod was never affected. Next pin bump (new hash) clears it
for real.

### 2. migrate vellum's internal CSS off the unprefixed aliases
**(a) DONE 2026-06-09** — vellum 3982245: all 407 unprefixed `var()` uses in
`src/css/*.css` rewritten to `--vui-*` (banner CSS included, closing that item
6 bullet), plus modal.js's `--modal-resize-corner-size` computed-style read
(verified no consumer overrides the unprefixed name). Full check + visual gate
green; released, pin bumps auto-merged (biblioplex #41, poolbuilder #10,
benson.github.io #15).
**(b) remaining** — delete the alias block from tokens.css. Blocked until
biblioplex's styles.css migrates off the unprefixed names (it uses them
heavily; natural fit alongside item 4's hardcoded-color sweep). Poolbuilder
consumes tokens through its own `--vui-*` aliases already.

### 3. ~~poolbuilder autocomplete → vellum combobox~~ DONE 2026-06-09
Shipped as poolbuilder 1c9dd94. The autocomplete was actually
`createSetAutocomplete` in shared/mtg.js (not hand-rolled in poolbuilder) —
packcracker still consumes it there, so the shared helper stays; poolbuilder
now uses its vendored vellum combobox. Vellum grew a `toDataset` option hook
(77b439a) so options keep `data-code`. Hidden #set-select, focus-clear /
blur-restore, and lowercase "name (year)" display preserved in app.js glue.
Verified in-browser locally (focus list, filter, keyboard nav, select,
restore) + live asset check. Note: scripts/test-production.js no longer
exists — CLAUDE.md's poolbuilder notes are stale on that. Possible follow-up:
migrate packcracker to the vellum combobox too, then delete
createSetAutocomplete from shared/mtg.js.

### 4. ~~biblioplex dark mode~~ FIRST PASS DONE 2026-06-09
Shipped as biblioplex 30b568d, deployed + verified live both themes. Settings
popover has a theme group (light/dark, persisted `biblioplex_theme_v1`);
`applyTheme` puts `data-theme="dark"` on `<html>`; a `[data-theme='dark']`
block in styles.css flips the biblioplex-local warm/parchment token families
(~60 overrides: surfaces, lines, warm text, veils, chat/mcp tints, feedback
tints, dark-on-dark links). Tests added to app-controls.test.js.
**Deliberate first-pass scope cuts, revisit if wanted:** loc/board/tag pill
palettes keep their light "sticker" look on dark; decorative gradients
(card foil/etched, history-empty sleeve) untouched; theme applies at module
boot like the other appearance settings, so a brief light flash on dark
reload (pre-paint inline script would need CSP review).

### 5. ~~release workflow: auto-bump poolbuilder cache-bust params~~ DONE 2026-06-09
Shipped as vellum b12c136. `updatePoolBuilder` now stamps the release sha into
`vendor/vellum-ui/vellum-ui.css?v=` in poolbuilder's index.html (sha-stamp
instead of integer bump — idempotent, no parsing). Verified live on the
b12c136 release's own pin PR.

### 6. ~~small catalog polish~~ DONE 2026-06-09
- ~~Popover/floating-menu live demo~~ shipped in vellum b12c136: trigger opens
  a real `floatingMenu()` (`.ui-popover.floating-menu` composition), keyboard
  nav + toast-on-pick verified in-browser.
- ~~Banner CSS unprefixed tokens~~ folded into item 2a, done 2026-06-09.
- README has no component list (the DS page is the catalog) — instead updated
  its stale Token Names / Compatibility Debt sections for the 2a migration.

## loose ends (housekeeping, 2 min each)
- ~~`~/Projects/biblioplex-wt-vellum-chips/` dead directory~~ deleted 2026-06-09.
- ~~Biblioplex main checkout on dead codex branch~~ switched to master and
  fast-forwarded 2026-06-09; dead branch deleted, scratch dirs intact.
- This PLAN.md is local-only (uncommitted) — delete it when the list is done,
  or commit it if you want it on other machines.

## cross-site feedback system (added 2026-06-09, evening)
Biblioplex's feedback flow is now a shared system:
- **Widget**: vellum `feedbackCapture` (src/js/feedbackCapture.js + overlays.css)
  — note, annotated screenshot, drag/resize, paste-image. `mountFeedbackCapture()`
  builds the whole widget for static sites; `bindFeedbackCapture()` binds
  app-owned markup. Biblioplex's feedbackCapture.js is a thin adapter (−1.1k
  lines) wiring its sync user / diagnostics / changelog / Clerk auth in.
- **Routing**: biblioplex worker `/feedback` accepts kind `vellum.feedback`,
  routes by a committed `FEEDBACK_PROJECTS` slug→Linear-project map
  (biblioplex / vellum-ui / poolbuilder / homepage / packcracker); unknown
  slugs rejected; operator wake stays biblioplex-only.
- **Gating**: non-biblioplex projects require the `X-Feedback-Owner-Key`
  header matching the `FEEDBACK_OWNER_KEY` worker secret (fails closed).
  Client side, the widget only mounts when the key is in localStorage —
  adopt once per machine via `?feedback-key=<key>` on any wired page.
- **Live on**: biblioplex app (own flow, unchanged UX), poolbuilder,
  bensonperry.com/vellum-ui/design-system/. Verified end-to-end in prod
  (BEN-542 routed to the poolbuilder project, then canceled).
- **Future surfaces**: import `mountFeedbackCapture` from vendored vellum,
  pass the project slug + `apiUrl: 'https://biblioplex-api.bensonperry.com'`,
  and add the slug to the worker map if it's a new project.

## compliance-audit queue — DRAINED 2026-06-10
All seven issues below were worked to Done in one session (vellum 69499cb /
80d9174 / fac3cdc, biblioplex 178a037, poolbuilder 390831e, benson.github.io
4f1d2da — all deployed + verified live, proof comments on each issue). The
FAB design pass (BEN-544) shipped a restrained first cut (press language +
soft shadow + chip radius + dark flip) — iterate on the workbench's Floating
actions entry if the direction is wrong. Original filing notes kept below for
reference.

## compliance-audit queue (filed to Linear 2026-06-09, evening)
A cross-site design-system compliance audit found the DS pages' own chrome and
several consumer controls hand-rolling what the catalog already provides.
Filed as scoped issues in each project's Linear queue rather than fixed inline:
- vellum-ui: BEN-543 (upstream FAB family → canonical feedback launcher),
  BEN-544 (FAB design pass — Needs Benson), BEN-545 (DS page chrome → btn /
  compact segmented), BEN-546 (themeToggle helper)
- Biblioplex: BEN-547 (DS page chrome + FAB CSS dedupe; blocked on 543/545)
- poolbuilder: BEN-548 (theme toggle, icon-btn, btn-link, diff-color tokens;
  blocked on 546)
- homepage: BEN-549 (tokens foundation, wip chip, tooltips, link styles —
  keep the minimal aesthetic, tokenize don't re-skin)
Suggested order: 543 → 545 → 546 in one vellum batch, then 547/548 in
parallel, 549 whenever, 544 when Benson wants to play.

## done (for reference)
All 10 original improvements: workbench page + token playground + states +
dark toggle; copy-as-diff export; auto-merge releases + Playwright visual gate;
ui-chip unification (vellum owns it, biblioplex re-exports, −568 lines);
popover/floatingMenu/outsideClick de-fork (biblioplex's production versions
upstreamed; `moveFloatingMenuFocus(menuEl, current, delta)`); toast; tooltip
(`.tooltip-host[data-tooltip]` + `.tooltip-term`); switch/checkbox/radio/range
+ combobox; `.vui-table` + skeleton + empty-state; dark theme layer (poolbuilder
migrated onto it — its local dark block is down to `--bg-mine`/`--footer-bg`).
`--bui-*` aliases deleted. Everything deployed and verified live 2026-06-09.
