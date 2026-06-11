import test from 'node:test';
import assert from 'node:assert/strict';
import { paginationRange } from '../src/js/pagination.js';

test('small page counts list every page', () => {
  assert.deepEqual(paginationRange({ page: 1, pageCount: 1 }), [1]);
  assert.deepEqual(paginationRange({ page: 3, pageCount: 7 }), [1, 2, 3, 4, 5, 6, 7]);
});

test('middle pages gap on both sides', () => {
  assert.deepEqual(paginationRange({ page: 10, pageCount: 20 }), [1, 'gap', 9, 10, 11, 'gap', 20]);
});

test('edges fill instead of gapping a single page', () => {
  assert.deepEqual(paginationRange({ page: 1, pageCount: 20 }), [1, 2, 3, 4, 5, 'gap', 20]);
  assert.deepEqual(paginationRange({ page: 20, pageCount: 20 }), [1, 'gap', 16, 17, 18, 19, 20]);
});

test('window width follows siblings', () => {
  assert.deepEqual(paginationRange({ page: 10, pageCount: 30, siblings: 2 }), [1, 'gap', 8, 9, 10, 11, 12, 'gap', 30]);
});

test('out-of-range input clamps instead of throwing', () => {
  assert.deepEqual(paginationRange({ page: 99, pageCount: 5 }), [1, 2, 3, 4, 5]);
  assert.deepEqual(paginationRange({ page: 0, pageCount: 0 }), [1]);
});

test('never emits a gap that hides fewer than two pages', () => {
  for (let pageCount = 1; pageCount <= 25; pageCount += 1) {
    for (let page = 1; page <= pageCount; page += 1) {
      const range = paginationRange({ page, pageCount });
      const numbers = range.filter((value) => value !== 'gap');
      assert.deepEqual([...numbers].sort((a, b) => a - b), numbers, `sorted for ${page}/${pageCount}`);
      range.forEach((value, index) => {
        if (value !== 'gap') return;
        const before = range[index - 1];
        const after = range[index + 1];
        assert.ok(after - before > 2, `gap at ${page}/${pageCount} hides >= 2 pages`);
      });
      assert.equal(numbers[0], 1);
      assert.equal(numbers[numbers.length - 1], pageCount);
      assert.ok(numbers.includes(page), `current page present for ${page}/${pageCount}`);
    }
  }
});
