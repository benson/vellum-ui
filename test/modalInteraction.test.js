import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateModalResizeLayout,
  clampModalInteractionLayout,
} from '../src/js/modal.js';

test('left resize keeps the right edge anchored in centered modal coordinates', () => {
  const start = { x: 0, y: 0, width: 400, height: 260 };
  const viewport = { width: 1000, height: 800 };
  const next = calculateModalResizeLayout({
    edge: 'left',
    layout: start,
    delta: { x: -100, y: 0 },
    viewport,
    constraints: { minWidth: 220, minHeight: 140, margin: 12 },
  });

  assert.equal(next.width, 500);
  assert.equal(next.x, -50);

  const center = viewport.width / 2;
  const oldRight = center + start.x + start.width / 2;
  const newRight = center + next.x + next.width / 2;
  assert.equal(newRight, oldRight);
});

test('bottom resize keeps the top edge anchored in centered modal coordinates', () => {
  const start = { x: 0, y: 0, width: 400, height: 260 };
  const viewport = { width: 1000, height: 800 };
  const next = calculateModalResizeLayout({
    edge: 'bottom',
    layout: start,
    delta: { x: 0, y: 80 },
    viewport,
    constraints: { minWidth: 220, minHeight: 140, margin: 12 },
  });

  assert.equal(next.height, 340);
  assert.equal(next.y, 40);

  const center = viewport.height / 2;
  const oldTop = center + start.y - start.height / 2;
  const newTop = center + next.y - next.height / 2;
  assert.equal(newTop, oldTop);
});

test('bottom-left resize adjusts width, height, x, and y together', () => {
  const next = calculateModalResizeLayout({
    edge: 'bottom-left',
    layout: { x: 10, y: -20, width: 420, height: 240 },
    delta: { x: 60, y: 90 },
    viewport: { width: 1000, height: 800 },
    constraints: { minWidth: 220, minHeight: 140, margin: 12 },
  });

  assert.deepEqual(next, { x: 40, y: 25, width: 360, height: 330 });
});

test('left resize in anchored layouts keeps the right edge in place', () => {
  const start = { x: 0, y: 0, width: 400, height: 260 };
  const next = calculateModalResizeLayout({
    edge: 'left',
    layout: start,
    delta: { x: -80, y: 0 },
    viewport: { width: 1000, height: 800 },
    constraints: { minWidth: 220, minHeight: 140, margin: 12, centeredX: false },
  });

  assert.equal(next.width, 480);
  assert.equal(next.x, -80);
});

test('bottom resize in anchored layouts leaves the top edge in place', () => {
  const next = calculateModalResizeLayout({
    edge: 'bottom',
    layout: { x: 0, y: 0, width: 400, height: 260 },
    delta: { x: 0, y: 80 },
    viewport: { width: 1000, height: 800 },
    constraints: { minWidth: 220, minHeight: 140, margin: 12, centeredY: false },
  });

  assert.deepEqual(next, { x: 0, y: 0, width: 400, height: 340 });
});

test('anchored clamp uses the card origin instead of centered bounds', () => {
  const next = calculateModalResizeLayout({
    edge: 'left',
    layout: { x: 0, y: 0, originLeft: 16, originTop: 100, width: 526, height: 220 },
    delta: { x: 48, y: 0 },
    viewport: { width: 573, height: 900 },
    constraints: { minWidth: 220, minHeight: 140, margin: 24, centeredX: false },
  });

  assert.equal(next.width, 478);
  assert.equal(next.x, 48);
});

test('clampModalInteractionLayout keeps a moved modal inside the viewport margin', () => {
  const next = clampModalInteractionLayout(
    { x: 900, y: -900, width: 300, height: 200 },
    { width: 800, height: 600 },
    { minWidth: 220, minHeight: 140, margin: 12 },
  );

  assert.equal(next.x, 238);
  assert.equal(next.y, -188);
});
