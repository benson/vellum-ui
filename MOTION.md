# Vellum motion contract

Motion in Vellum explains cause, attachment, and change. It should feel like ink,
paper, and mechanical contact: quick, direct, and a little tactile. It should not
turn the interface into a game.

## Tiers

| Tier | Timing | Use |
| --- | --- | --- |
| Snap | `--vui-motion-snap` (70ms) | Press and direct manipulation feedback |
| Transient | 180ms enter / 120ms exit | Popovers, menus, and toasts |
| Overlay | `--vui-motion-overlay` (180ms) | Modal context changes |

Entrances may take slightly longer than exits. Spatial movement stays short:
surface scale settles from `0.97`, while reduced-motion keeps only a quiet fade.

## Interaction policy

- Pointer-triggered surfaces animate.
- Keyboard-triggered surfaces and Escape dismissal are immediate.
- Motion is interruptible; controllers expose state instead of waiting for an
  animation to finish.
- Popovers scale from the point nearest their trigger.
- Layout should not animate when opacity, scale, or translate can communicate the
  same change.
- Repeated interactions should use less motion than occasional context changes.

Controllers expose `data-vui-state="open|closed"` and
`data-vui-motion="auto|none"`. Callers can override the default with a `motion`
option, but `auto` should be the normal path.

## Review loop

Use the catalog's Motion workbench at 1x to judge feel, 3x to inspect easing and
origin, and instant to verify that interaction logic does not depend on animation.
Review pointer, keyboard, touch-sized layout, and `prefers-reduced-motion` before a
surface ships.

## Next primitive

The next addition should be a drawer/sheet controller. Biblioplex's add-card panel
is the first consumer candidate: it needs an attached edge transition, focus and
Escape behavior, and the same pointer/keyboard/reduced-motion policy as the current
surface primitives.
