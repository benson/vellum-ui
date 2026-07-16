import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveToastLeaveFallbackMs } from '../src/js/toast.js';

test('toast fallback outlives slowed transition playback', () => {
  assert.equal(
    resolveToastLeaveFallbackMs({
      transitionDuration: '540ms, 360ms',
      transitionDelay: '0s, 50ms',
    }),
    590,
  );
});

test('toast fallback preserves a minimum cleanup window without computed styles', () => {
  assert.equal(resolveToastLeaveFallbackMs(), 260);
});
