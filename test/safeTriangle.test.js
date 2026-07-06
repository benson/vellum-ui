import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isMovingTowardSubmenu,
  pointInTriangle,
  submenuLeadingEdge,
  submenuSide,
} from '../src/js/safeTriangle.js';

test('pointInTriangle: inside, on-edge, and outside', () => {
  const a = { x: 0, y: 0 };
  const b = { x: 10, y: 0 };
  const c = { x: 0, y: 10 };
  assert.equal(pointInTriangle({ x: 2, y: 2 }, a, b, c), true); // inside
  assert.equal(pointInTriangle({ x: 5, y: 0 }, a, b, c), true); // on edge
  assert.equal(pointInTriangle({ x: 8, y: 8 }, a, b, c), false); // outside
});

test('pointInTriangle: guards null args', () => {
  assert.equal(pointInTriangle(null, {}, {}, {}), false);
});

test('submenuSide: right when submenu is to the right of the cursor, left otherwise', () => {
  const cursor = { x: 100, y: 100 };
  assert.equal(submenuSide(cursor, { left: 150, right: 250, top: 90, bottom: 200 }), 'right');
  assert.equal(submenuSide(cursor, { left: 0, right: 60, top: 90, bottom: 200 }), 'left');
});

test('submenuLeadingEdge: uses left edge for a right-opening submenu', () => {
  const rect = { left: 150, right: 250, top: 90, bottom: 200 };
  assert.deepEqual(submenuLeadingEdge(rect, 'right'), {
    top: { x: 150, y: 90 },
    bottom: { x: 150, y: 200 },
  });
  assert.deepEqual(submenuLeadingEdge(rect, 'left'), {
    top: { x: 250, y: 90 },
    bottom: { x: 250, y: 200 },
  });
});

// The core scenario: a submenu opens to the right of the trigger. The cursor
// leaves the trigger at its right edge and moves diagonally down toward the
// submenu. A point along that diagonal should be considered "moving toward" the
// submenu even though it's not over it yet.
test('isMovingTowardSubmenu: diagonal path into a right-opening submenu stays open', () => {
  const submenu = { left: 150, right: 260, top: 60, bottom: 220 };
  const anchor = { x: 148, y: 70 }; // where the pointer left the trigger (just left of submenu)
  // A point on the diagonal from the anchor toward the lower part of the submenu.
  const midDiagonal = { x: 149, y: 140 };
  assert.equal(isMovingTowardSubmenu(anchor, midDiagonal, submenu), true);
});

test('isMovingTowardSubmenu: pointer already over the submenu is trivially toward it', () => {
  const submenu = { left: 150, right: 260, top: 60, bottom: 220 };
  const anchor = { x: 148, y: 70 };
  assert.equal(isMovingTowardSubmenu(anchor, { x: 200, y: 120 }, submenu), true);
});

test('isMovingTowardSubmenu: pointer veering away (up and left) is NOT toward it', () => {
  const submenu = { left: 150, right: 260, top: 60, bottom: 220 };
  const anchor = { x: 148, y: 200 }; // left the trigger near the bottom
  // Pointer moves up-and-left, away from the submenu edge → outside the triangle.
  assert.equal(isMovingTowardSubmenu(anchor, { x: 120, y: 20 }, submenu), false);
});

test('isMovingTowardSubmenu: buffer widens the tolerance at the edges', () => {
  const submenu = { left: 150, right: 260, top: 100, bottom: 160 };
  // Anchor sits well to the left so the safe triangle has real width; the test
  // point is right at the submenu's leading edge but just below its bottom
  // corner — outside the tight triangle, inside once the buffer extends the
  // base downward.
  const anchor = { x: 100, y: 130 };
  const justBelowCorner = { x: 149, y: 165 };
  assert.equal(isMovingTowardSubmenu(anchor, justBelowCorner, submenu), false);
  assert.equal(isMovingTowardSubmenu(anchor, justBelowCorner, submenu, { buffer: 12 }), true);
});

test('isMovingTowardSubmenu: guards missing args', () => {
  assert.equal(isMovingTowardSubmenu(null, { x: 1, y: 1 }, {}), false);
  assert.equal(isMovingTowardSubmenu({ x: 1, y: 1 }, null, {}), false);
});
