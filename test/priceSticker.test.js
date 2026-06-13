import test from 'node:test';
import assert from 'node:assert/strict';
import { formatStickerPrice, jitterVars, priceStickerHtml } from '../src/js/priceSticker.js';

test('formatStickerPrice keeps cents at or under $100', () => {
  assert.equal(formatStickerPrice(1), '$ 1.00');
  assert.equal(formatStickerPrice(4.2), '$ 4.20');
  assert.equal(formatStickerPrice(99.99), '$ 99.99');
  assert.equal(formatStickerPrice(100), '$ 100.00');
});

test('formatStickerPrice drops cents over $100 (whole dollars)', () => {
  assert.equal(formatStickerPrice(101), '$ 101');
  assert.equal(formatStickerPrice(150), '$ 150');
  assert.equal(formatStickerPrice(149.49), '$ 149');
});

test('formatStickerPrice returns empty string for non-numbers', () => {
  assert.equal(formatStickerPrice('abc'), '');
  assert.equal(formatStickerPrice(null), '');
  assert.equal(formatStickerPrice(undefined), '');
  assert.equal(formatStickerPrice(NaN), '');
});

test('priceStickerHtml builds the nested-span markup', () => {
  assert.equal(
    priceStickerHtml({ amount: 4.2 }),
    '<span class="card-sleeve-price"><span>$ 4.20</span></span>',
  );
});

test('priceStickerHtml passes a raw text override through and escapes it', () => {
  assert.equal(
    priceStickerHtml({ text: '<b>free</b>' }),
    '<span class="card-sleeve-price"><span>&lt;b&gt;free&lt;/b&gt;</span></span>',
  );
});

test('priceStickerHtml with no usable value renders nothing', () => {
  assert.equal(priceStickerHtml({ amount: 'nope' }), '');
});

test('seeded jitter is stable for a seed and differs across seeds', () => {
  const a = priceStickerHtml({ amount: 1, jitter: 'card-123' });
  const b = priceStickerHtml({ amount: 1, jitter: 'card-123' });
  const c = priceStickerHtml({ amount: 1, jitter: 'card-999' });
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /--price-jitter-x:-?\d/);
  assert.match(a, /--price-jitter-rot:-?\d/);
});

test('jitterVars stays within the default range (±5px / ±5deg, flat-centred)', () => {
  for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
    const v = jitterVars(seed);
    assert.ok(Math.abs(parseFloat(v['--price-jitter-x'])) <= 5);
    assert.ok(Math.abs(parseFloat(v['--price-jitter-y'])) <= 5);
    assert.ok(Math.abs(parseFloat(v['--price-jitter-rot'])) <= 5);
  }
  assert.equal(jitterVars(null), null);
});

test('jitterVars honours an explicit range override', () => {
  const v = jitterVars({ seed: 'x', rot: 2 });
  assert.ok(Math.abs(parseFloat(v['--price-jitter-rot'])) <= 2);
});
