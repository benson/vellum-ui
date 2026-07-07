import test from 'node:test';
import assert from 'node:assert/strict';
import { makeDraggable } from '../src/js/makeDraggable.js';

// Minimal fake EventTarget — this repo has no DOM/JSDOM dependency, and
// makeDraggable only touches addEventListener/removeEventListener,
// classList, and (set|release)PointerCapture, so a small hand-rolled fake
// is cheaper than pulling in a browser environment.
class FakeElement {
  constructor() {
    this.listeners = new Map();
    this.classes = new Set();
    this.capturedPointerId = null;
    this.classList = {
      add: (name) => this.classes.add(name),
      remove: (name) => this.classes.delete(name),
      contains: (name) => this.classes.has(name),
    };
  }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }
  removeEventListener(type, handler) {
    this.listeners.get(type)?.delete(handler);
  }
  dispatchEvent(type, event) {
    for (const handler of this.listeners.get(type) || []) handler(event);
  }
  // Real Chromium throws NotFoundError here for synthetic PointerEvents with
  // no active pointer on the element — tests stub these as no-ops, same as
  // production code guards with `?.`.
  setPointerCapture() {}
  releasePointerCapture() {}
}

function pointerEvent({ x = 0, y = 0, pointerId = 1, target = null, button = 0 } = {}) {
  return {
    pointerId,
    clientX: x,
    clientY: y,
    button,
    pointerType: 'mouse',
    target,
    preventDefault() {},
  };
}

test('makeDraggable runs onStart/onMove/onEnd with cumulative deltas', () => {
  const handle = new FakeElement();
  const calls = { start: 0, moves: [], end: null };
  makeDraggable(handle, {
    documentObj: handle,
    onStart: () => {
      calls.start += 1;
      return { left: 100, top: 50 };
    },
    onMove: ({ dx, dy, start }) => calls.moves.push({ dx, dy, start }),
    onEnd: ({ dx, dy }) => (calls.end = { dx, dy }),
  });

  handle.dispatchEvent('pointerdown', pointerEvent({ x: 10, y: 10 }));
  assert.equal(calls.start, 1);
  assert.equal(handle.classList.contains('is-dragging'), true);

  handle.dispatchEvent('pointermove', pointerEvent({ x: 30, y: 15 }));
  assert.deepEqual(calls.moves[0], { dx: 20, dy: 5, start: { pointerId: 1, x: 10, y: 10, left: 100, top: 50 } });

  handle.dispatchEvent('pointerup', pointerEvent({ x: 40, y: 5 }));
  assert.deepEqual(calls.end, { dx: 30, dy: -5 });
  assert.equal(handle.classList.contains('is-dragging'), false);
});

test('onStart returning false cancels the drag', () => {
  const handle = new FakeElement();
  let moveCalls = 0;
  makeDraggable(handle, {
    documentObj: handle,
    onStart: () => false,
    onMove: () => (moveCalls += 1),
  });

  handle.dispatchEvent('pointerdown', pointerEvent());
  handle.dispatchEvent('pointermove', pointerEvent({ x: 20, y: 20 }));
  assert.equal(moveCalls, 0);
  assert.equal(handle.classList.contains('is-dragging'), false);
});

test('ignoreSelector skips pointerdown on interactive descendants', () => {
  const handle = new FakeElement();
  let startCalls = 0;
  makeDraggable(handle, {
    documentObj: handle,
    onStart: () => (startCalls += 1),
  });

  const button = { closest: (selector) => (selector.includes('button') ? button : null) };
  handle.dispatchEvent('pointerdown', pointerEvent({ target: button }));
  assert.equal(startCalls, 0);
});

test('a second pointerId is ignored until the first pointer ends', () => {
  const handle = new FakeElement();
  const moves = [];
  makeDraggable(handle, {
    documentObj: handle,
    onStart: () => ({}),
    onMove: ({ dx }) => moves.push(dx),
  });

  handle.dispatchEvent('pointerdown', pointerEvent({ pointerId: 1, x: 0, y: 0 }));
  handle.dispatchEvent('pointermove', pointerEvent({ pointerId: 2, x: 50, y: 0 }));
  assert.equal(moves.length, 0);
  handle.dispatchEvent('pointermove', pointerEvent({ pointerId: 1, x: 5, y: 0 }));
  assert.deepEqual(moves, [5]);
});

test('touch pointerType is ignored so native scrolling wins', () => {
  const handle = new FakeElement();
  let startCalls = 0;
  makeDraggable(handle, {
    documentObj: handle,
    onStart: () => (startCalls += 1),
  });

  handle.dispatchEvent('pointerdown', { ...pointerEvent(), pointerType: 'touch' });
  assert.equal(startCalls, 0);
});

test('pointercancel ends the drag like pointerup', () => {
  const handle = new FakeElement();
  let ended = false;
  makeDraggable(handle, {
    documentObj: handle,
    onStart: () => ({}),
    onEnd: () => (ended = true),
  });

  handle.dispatchEvent('pointerdown', pointerEvent());
  handle.dispatchEvent('pointercancel', pointerEvent());
  assert.equal(ended, true);
});

test('destroy removes all listeners so further events are no-ops', () => {
  const handle = new FakeElement();
  let starts = 0;
  const drag = makeDraggable(handle, {
    documentObj: handle,
    onStart: () => (starts += 1),
  });

  drag.destroy();
  handle.dispatchEvent('pointerdown', pointerEvent());
  assert.equal(starts, 0);
});

test('missing handleEl or documentObj returns a no-op handle', () => {
  const drag = makeDraggable(null);
  assert.doesNotThrow(() => drag.destroy());
});

test('custom activeClass and targetEl are honored', () => {
  const handle = new FakeElement();
  const target = new FakeElement();
  makeDraggable(handle, {
    documentObj: handle,
    targetEl: target,
    activeClass: 'dragging-widget',
    onStart: () => ({}),
  });

  handle.dispatchEvent('pointerdown', pointerEvent());
  assert.equal(target.classList.contains('dragging-widget'), true);
  assert.equal(handle.classList.contains('dragging-widget'), false);
});
