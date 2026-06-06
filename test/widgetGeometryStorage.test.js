import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readStoredPosition,
  readStoredSize,
  writeStoredPosition,
  writeStoredSize,
} from '../src/js/index.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test('stores and reads rounded widget position', () => {
  const storage = memoryStorage();
  writeStoredPosition('chat', { left: 10.4, top: 20.8 }, { storage });
  assert.deepEqual(readStoredPosition('chat', { storage }), { left: 10, top: 21 });
});

test('rejects invalid widget size values', () => {
  const storage = memoryStorage();
  writeStoredSize('chat', { width: Number.NaN, height: 10 }, { storage });
  assert.equal(readStoredSize('chat', { storage }), null);
});

test('stores and reads rounded widget size', () => {
  const storage = memoryStorage();
  writeStoredSize('chat', { width: 412.7, height: 300.2 }, { storage });
  assert.deepEqual(readStoredSize('chat', { storage }), { width: 413, height: 300 });
});
