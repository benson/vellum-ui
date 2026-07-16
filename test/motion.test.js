import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMotionMode,
  applyMotionState,
  motionMode,
  setPopoverTransformOrigin,
} from '../src/js/motion.js';

test('motionMode keeps pointer actions animated and keyboard actions instant', () => {
  assert.equal(motionMode({ reason: 'trigger', event: { type: 'click' } }), 'auto');
  assert.equal(motionMode({ reason: 'trigger', event: { type: 'click', detail: 0 } }), 'none');
  assert.equal(motionMode({ reason: 'trigger', event: { type: 'click', detail: 1 } }), 'auto');
  assert.equal(motionMode({ reason: 'escape', event: { type: 'keydown' } }), 'none');
  assert.equal(motionMode({ reason: 'hotkey' }), 'none');
  assert.equal(motionMode({ motion: false, reason: 'trigger' }), 'none');
  assert.equal(motionMode({ motion: true, reason: 'escape' }), 'auto');
});

test('motion helpers expose stable state attributes', () => {
  const attributes = new Map();
  const element = { setAttribute: (name, value) => attributes.set(name, String(value)) };

  assert.equal(applyMotionMode(element, { reason: 'keyboard' }), 'none');
  assert.equal(applyMotionState(element, true), 'open');
  assert.equal(attributes.get('data-vui-motion'), 'none');
  assert.equal(attributes.get('data-vui-state'), 'open');
});

test('popover origin points toward the trigger and stays inside the panel', () => {
  const properties = new Map();
  const trigger = {
    getBoundingClientRect: () => ({ left: 180, right: 220, top: 80, bottom: 120 }),
  };
  const panel = {
    getBoundingClientRect: () => ({ left: 100, right: 300, top: 124, bottom: 244, width: 200, height: 120 }),
    style: { setProperty: (name, value) => properties.set(name, value) },
  };

  assert.deepEqual(setPopoverTransformOrigin(trigger, panel), { x: 100, y: 0 });
  assert.equal(properties.get('--vui-popover-origin-x'), '100px');
  assert.equal(properties.get('--vui-popover-origin-y'), '0px');
});
