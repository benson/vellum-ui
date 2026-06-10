import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultSnapClosedAt, resolveEdgeDrag } from '../src/js/edgeResize.js';

const bounds = { min: 200, max: 420, snapClosedAt: 140 };

test('clamps to min and max', () => {
  assert.deepEqual(resolveEdgeDrag({ startSize: 300, delta: -150, ...bounds }), {
    collapsed: false,
    size: 200,
  });
  assert.deepEqual(resolveEdgeDrag({ startSize: 300, delta: 500, ...bounds }), {
    collapsed: false,
    size: 420,
  });
});

test('rounds fractional sizes', () => {
  assert.equal(resolveEdgeDrag({ startSize: 300, delta: 10.6, ...bounds }).size, 311);
});

test('snaps closed below snapClosedAt', () => {
  assert.deepEqual(resolveEdgeDrag({ startSize: 300, delta: -161, ...bounds }), {
    collapsed: true,
    size: null,
  });
});

test('between snapClosedAt and min resolves open at min', () => {
  assert.deepEqual(resolveEdgeDrag({ startSize: 300, delta: -140, ...bounds }), {
    collapsed: false,
    size: 200,
  });
});

test('drag from collapsed (startSize 0) stays closed until the threshold, then opens at min', () => {
  assert.equal(resolveEdgeDrag({ startSize: 0, delta: 100, ...bounds }).collapsed, true);
  assert.deepEqual(resolveEdgeDrag({ startSize: 0, delta: 150, ...bounds }), {
    collapsed: false,
    size: 200,
  });
});

test('defaultSnapClosedAt sits below min with a floor', () => {
  assert.equal(defaultSnapClosedAt(200), 140);
  assert.equal(defaultSnapClosedAt(60), 40);
  // min 80 → floor kicks in: snap at 40, not 20
  assert.deepEqual(resolveEdgeDrag({ startSize: 100, delta: -59, min: 80, max: 420 }), {
    collapsed: false,
    size: 80,
  });
  assert.equal(resolveEdgeDrag({ startSize: 100, delta: -61, min: 80, max: 420 }).collapsed, true);
});
