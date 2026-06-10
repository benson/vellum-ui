import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyTheme,
  currentTheme,
  initTheme,
  readStoredTheme,
  setTheme,
  themeToggle,
} from '../src/js/themeToggle.js';

function fakeDocument({ prefersDark = false } = {}) {
  const attrs = new Map();
  return {
    attrs,
    documentElement: {
      setAttribute: (key, value) => attrs.set(key, value),
      removeAttribute: (key) => attrs.delete(key),
      getAttribute: (key) => (attrs.has(key) ? attrs.get(key) : null),
    },
    defaultView: {
      matchMedia: (query) => ({ matches: prefersDark && query.includes('dark') }),
    },
  };
}

function fakeStorage(entries = []) {
  const values = new Map(entries);
  return {
    values,
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, value),
  };
}

test('applyTheme sets and clears data-theme on the document element', () => {
  const documentObj = fakeDocument();
  applyTheme('dark', documentObj);
  assert.equal(documentObj.attrs.get('data-theme'), 'dark');
  assert.equal(currentTheme(documentObj), 'dark');
  applyTheme('light', documentObj);
  assert.equal(documentObj.attrs.has('data-theme'), false);
  assert.equal(currentTheme(documentObj), 'light');
});

test('initTheme applies the stored preference and reports it', () => {
  const documentObj = fakeDocument();
  const storageObj = fakeStorage([['vui_theme_v1', 'dark']]);
  assert.equal(initTheme({ documentObj, storageObj }), 'dark');
  assert.equal(documentObj.attrs.get('data-theme'), 'dark');
});

test('initTheme falls back to prefers-color-scheme unless disabled', () => {
  const dark = fakeDocument({ prefersDark: true });
  assert.equal(initTheme({ documentObj: dark, storageObj: fakeStorage() }), 'dark');

  const noFallback = fakeDocument({ prefersDark: true });
  assert.equal(
    initTheme({ documentObj: noFallback, storageObj: fakeStorage(), fallbackToSystem: false }),
    'light',
  );
});

test('readStoredTheme ignores junk values', () => {
  assert.equal(readStoredTheme('k', fakeStorage([['k', 'purple']])), '');
  assert.equal(readStoredTheme('k', fakeStorage([['k', 'light']])), 'light');
});

test('setTheme persists under the given key', () => {
  const documentObj = fakeDocument();
  const storageObj = fakeStorage();
  setTheme('dark', { storageKey: 'app_theme', documentObj, storageObj });
  assert.equal(storageObj.values.get('app_theme'), 'dark');
  assert.equal(documentObj.attrs.get('data-theme'), 'dark');
});

function fakeControl(type = '') {
  const listeners = new Map();
  return {
    type,
    checked: false,
    addEventListener: (event, handler) => listeners.set(event, handler),
    removeEventListener: (event) => listeners.delete(event),
    fire: (event) => listeners.get(event)?.(),
  };
}

test('themeToggle binds a checkbox to reflect and set the theme', () => {
  const documentObj = fakeDocument();
  const storageObj = fakeStorage();
  applyTheme('dark', documentObj);
  const control = fakeControl('checkbox');
  const changes = [];
  themeToggle(control, { documentObj, storageObj, onChange: (mode) => changes.push(mode) });
  assert.equal(control.checked, true);
  control.checked = false;
  control.fire('change');
  assert.equal(currentTheme(documentObj), 'light');
  assert.equal(storageObj.values.get('vui_theme_v1'), 'light');
  assert.deepEqual(changes, ['light']);
});

test('themeToggle flips the theme on click for non-checkbox controls', () => {
  const documentObj = fakeDocument();
  const storageObj = fakeStorage();
  const control = fakeControl('');
  themeToggle(control, { documentObj, storageObj });
  control.fire('click');
  assert.equal(currentTheme(documentObj), 'dark');
  control.fire('click');
  assert.equal(currentTheme(documentObj), 'light');
});
